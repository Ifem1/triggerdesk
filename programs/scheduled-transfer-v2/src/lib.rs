use rialo_venus_proc_macro::rialo;

const SCHEMA_VERSION: u8 = 2;
const STATUS_SCHEDULED: u8 = 1;
const STATUS_EXECUTED: u8 = 2;
const STATUS_CANCELLED: u8 = 3;
const VAULT_SEED: &[u8] = b"triggerdesk-v2-vault";

rialo! {
    workflow {
        state {
            schema_version: u8,
            status: u8,
            creator: Pubkey,
            recipient: Pubkey,
            vault: Pubkey,
            subscription: Pubkey,
            vault_bump: u8,
            amount: u64,
            execute_at_ms: u64,
            funded_amount: u64,
            paid_amount: u64,
            refunded_amount: u64,
        }

        program {
            use rialo_s_program::{
                entrypoint::ProgramResult,
                msg,
                program_error::ProgramError,
                pubkey::Pubkey,
                system_program,
            };

            initiating fn create(
                &mut self,
                recipient: Pubkey,
                vault: Pubkey,
                amount: u64,
                execute_at_ms: u64,
            ) -> ProgramResult {
                let vault_account = WriteAccountInfo::from(vault);
                let creator_account = &self.accounts[0];

                let now = self.unix_timestamp();
                let now_ms = if now < 0 {
                    return Err(ProgramError::InvalidArgument);
                } else {
                    (now as u64)
                        .checked_mul(1_000)
                        .ok_or(ProgramError::ArithmeticOverflow)?
                };
                if amount == 0
                    || recipient == Pubkey::default()
                    || execute_at_ms <= now_ms
                {
                    return Err(ProgramError::InvalidArgument);
                }

                let (expected_vault, vault_bump) = Pubkey::find_program_address(
                    &[
                        crate::VAULT_SEED,
                        creator_account.key.as_ref(),
                        self.workflow_pda_slug.as_bytes(),
                    ],
                    self.program_id,
                );
                if *vault_account.key != expected_vault {
                    msg!("ScheduledTransferV2 rejected substituted vault={}", vault_account.key);
                    return Err(ProgramError::InvalidArgument);
                }
                if vault_account.kelvins() != 0 || vault_account.data_len() != 0 {
                    return Err(ProgramError::AccountAlreadyInitialized);
                }

                rialo_s_cpi::invoke_signed(
                    &rialo_s_system_interface::instruction::create_account(
                        creator_account.key,
                        vault_account.key,
                        amount,
                        0,
                        &system_program::ID,
                    ),
                    &[creator_account.clone(), vault_account.clone()],
                    &[&[
                        crate::VAULT_SEED,
                        creator_account.key.as_ref(),
                        self.workflow_pda_slug.as_bytes(),
                        &[vault_bump],
                    ]],
                )?;

                self.schema_version = crate::SCHEMA_VERSION;
                self.status = crate::STATUS_SCHEDULED;
                self.creator = *creator_account.key;
                self.recipient = recipient;
                self.vault = vault;
                // Venus 0.12.2 resolves the first native subscription at account
                // index 4: payer, workflow, system, subscriber program, subscription.
                self.subscription = *self.accounts[4].key;
                self.vault_bump = vault_bump;
                self.amount = amount;
                self.execute_at_ms = execute_at_ms;
                self.funded_amount = amount;
                self.paid_amount = 0;
                self.refunded_amount = 0;

                AFTER execute_at_ms CALL [
                    execute recipient: recipient vault: vault
                ];
                Ok(())
            }

            handler fn execute(
                &mut self,
                recipient: Pubkey,
                vault: Pubkey,
            ) -> ProgramResult {
                let recipient_account = WriteAccountInfo::from(recipient);
                let vault_account = WriteAccountInfo::from(vault);
                let creator_account = &self.accounts[0];

                self.validate_scheduled()?;
                if *creator_account.key != self.creator
                    || *recipient_account.key != self.recipient
                    || *vault_account.key != self.vault
                {
                    return Err(ProgramError::InvalidArgument);
                }
                self.validate_vault(vault_account)?;
                // The principal is immutable workflow state. Any amount above it is
                // unsolicited vault balance and is never part of the recipient's
                // payment. Snapshot it before the principal CPI so the two
                // transfers are explicit and transaction-atomic.
                let surplus = vault_account
                    .kelvins()
                    .checked_sub(self.amount)
                    .ok_or(ProgramError::InsufficientFunds)?;

                rialo_s_cpi::invoke_signed(
                    &rialo_s_system_interface::instruction::transfer(
                        vault_account.key,
                        recipient_account.key,
                        self.amount,
                    ),
                    &[vault_account.clone(), recipient_account.clone()],
                    &[&[
                        crate::VAULT_SEED,
                        self.creator.as_ref(),
                        self.workflow_pda_slug.as_bytes(),
                        &[self.vault_bump],
                    ]],
                )?;

                // Return unsolicited balance only to the immutable stored creator.
                // The callback's payer is the workflow creator; checking it above
                // prevents a caller-controlled residual destination.
                if surplus != 0 {
                    rialo_s_cpi::invoke_signed(
                        &rialo_s_system_interface::instruction::transfer(
                            vault_account.key,
                            creator_account.key,
                            surplus,
                        ),
                        &[vault_account.clone(), creator_account.clone()],
                        &[&[
                            crate::VAULT_SEED,
                            self.creator.as_ref(),
                            self.workflow_pda_slug.as_bytes(),
                            &[self.vault_bump],
                        ]],
                    )?;
                }

                self.paid_amount = self.amount;
                self.status = crate::STATUS_EXECUTED;
                msg!(
                    "ScheduledTransferV2 paid={} vault={} recipient={}",
                    self.amount,
                    vault_account.key,
                    recipient_account.key,
                );
                Ok(())
            }

            control fn cancel(
                &mut self,
                subscription: Pubkey,
                vault: Pubkey,
            ) -> ProgramResult {
                let subscription_account = WriteAccountInfo::from(subscription);
                let vault_account = WriteAccountInfo::from(vault);
                let creator_account = &self.accounts[0];

                if !creator_account.is_signer || *creator_account.key != self.creator {
                    return Err(ProgramError::MissingRequiredSignature);
                }
                if self.schema_version != crate::SCHEMA_VERSION {
                    return Err(ProgramError::InvalidAccountData);
                }
                if self.status == crate::STATUS_CANCELLED
                    && self.refunded_amount == self.amount
                    && self.paid_amount == 0
                {
                    return Ok(());
                }
                self.validate_scheduled()?;
                if subscription != self.subscription
                    || vault != self.vault
                    || *subscription_account.key != self.subscription
                    || *vault_account.key != self.vault
                {
                    msg!(
                        "ScheduledTransferV2 cancel vault mismatch supplied={} stored={}",
                        vault_account.key,
                        self.vault,
                    );
                    return Err(ProgramError::InvalidArgument);
                }
                self.validate_vault(vault_account)?;
                let surplus = vault_account
                    .kelvins()
                    .checked_sub(self.amount)
                    .ok_or(ProgramError::InsufficientFunds)?;

                // Cancel the native one-shot subscription before releasing escrow.
                // Any later failure rolls this CPI back atomically with the refund.
                let subscription_nonce = super::interface::multi_account_slug(
                    self.accounts[1].key,
                    0,
                    4,
                );
                rialo_s_program::program::invoke(
                    &rialo_s_program::instruction::Instruction::new_with_bincode(
                        rialo_subscriber_interface::ID,
                        &rialo_subscriber_interface::instruction::SubscriberInstruction::Destroy {
                            nonce: subscription_nonce,
                        },
                        vec![
                            rialo_s_program::instruction::AccountMeta::new(
                                *creator_account.key,
                                true,
                            ),
                            rialo_s_program::instruction::AccountMeta::new(
                                *subscription_account.key,
                                false,
                            ),
                        ],
                    ),
                    &[creator_account.clone(), subscription_account.clone()],
                )?;

                rialo_s_cpi::invoke_signed(
                    &rialo_s_system_interface::instruction::transfer(
                        vault_account.key,
                        creator_account.key,
                        self.amount,
                    ),
                    &[vault_account.clone(), creator_account.clone()],
                    &[&[
                        crate::VAULT_SEED,
                        self.creator.as_ref(),
                        self.workflow_pda_slug.as_bytes(),
                        &[self.vault_bump],
                    ]],
                )?;

                // The signer is the immutable creator, so cancellation returns
                // both the exact unused principal and any unsolicited surplus to
                // a deterministic, authorized destination.
                if surplus != 0 {
                    rialo_s_cpi::invoke_signed(
                        &rialo_s_system_interface::instruction::transfer(
                            vault_account.key,
                            creator_account.key,
                            surplus,
                        ),
                        &[vault_account.clone(), creator_account.clone()],
                        &[&[
                            crate::VAULT_SEED,
                            self.creator.as_ref(),
                            self.workflow_pda_slug.as_bytes(),
                            &[self.vault_bump],
                        ]],
                    )?;
                }

                self.refunded_amount = self.amount;
                self.status = crate::STATUS_CANCELLED;
                msg!(
                    "ScheduledTransferV2 refunded={} vault={} creator={}",
                    self.amount,
                    vault_account.key,
                    creator_account.key,
                );
                Ok(())
            }

            control fn get_state(&mut self) -> ProgramResult {
                msg!(
                    "ScheduledTransferV2 schema={} status={} creator={} recipient={} vault={} subscription={} amount={} paid={} refunded={}",
                    self.schema_version,
                    self.status,
                    self.creator,
                    self.recipient,
                    self.vault,
                    self.subscription,
                    self.amount,
                    self.paid_amount,
                    self.refunded_amount,
                );
                Ok(())
            }

            fn validate_scheduled(&self) -> ProgramResult {
                if self.schema_version != crate::SCHEMA_VERSION
                    || self.status != crate::STATUS_SCHEDULED
                    || self.funded_amount != self.amount
                    || self.paid_amount != 0
                    || self.refunded_amount != 0
                {
                    return Err(ProgramError::InvalidAccountData);
                }
                Ok(())
            }

            fn validate_vault(
                &self,
                vault_account: &rialo_s_program::account_info::AccountInfo<'_>,
            ) -> ProgramResult {
                let expected_vault = Pubkey::create_program_address(
                    &[
                        crate::VAULT_SEED,
                        self.creator.as_ref(),
                        self.workflow_pda_slug.as_bytes(),
                        &[self.vault_bump],
                    ],
                    self.program_id,
                )?;
                if *vault_account.key != expected_vault
                    || vault_account.owner != &system_program::ID
                    || vault_account.data_len() != 0
                    // A public system-owned PDA may receive unsolicited funds.
                    // Principal is safe whenever the vault can cover it; all
                    // excess is swept to the immutable creator on a terminal path.
                    || vault_account.kelvins() < self.amount
                {
                    return Err(ProgramError::InvalidAccountData);
                }
                Ok(())
            }
        }
    }
}
