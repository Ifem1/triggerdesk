use rialo_venus_proc_macro::rialo;

const SCHEMA_VERSION: u8 = 2;
const STATUS_ACTIVE: u8 = 1;
const STATUS_COMPLETE: u8 = 2;
const STATUS_CANCELLED: u8 = 3;
const PAYMENT_COUNT: u8 = 3;
const VAULT_SEED: &[u8] = b"triggerdesk-recurring-v2-vault";

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
            payment_count: u8,
            payments_made: u8,
            installment_amount: u64,
            interval_ms: u64,
            next_execution_at_ms: u64,
            total_funded: u64,
            total_distributed: u64,
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
                installment_amount: u64,
                interval_ms: u64,
                first_execution_at_ms: u64,
                payment_count: u8,
            ) -> ProgramResult {
                let vault_account = WriteAccountInfo::from(vault);
                let creator_account = &self.accounts[0];
                if recipient == Pubkey::default()
                    || installment_amount == 0
                    || interval_ms == 0
                    || first_execution_at_ms == 0
                    || payment_count != crate::PAYMENT_COUNT
                {
                    return Err(ProgramError::InvalidArgument);
                }
                let total_funded = installment_amount
                    .checked_mul(payment_count as u64)
                    .ok_or(ProgramError::ArithmeticOverflow)?;

                let (expected_vault, vault_bump) = Pubkey::find_program_address(
                    &[
                        crate::VAULT_SEED,
                        creator_account.key.as_ref(),
                        self.workflow_pda_slug.as_bytes(),
                    ],
                    self.program_id,
                );
                if *vault_account.key != expected_vault {
                    return Err(ProgramError::InvalidArgument);
                }
                if vault_account.kelvins() != 0 || vault_account.data_len() != 0 {
                    return Err(ProgramError::AccountAlreadyInitialized);
                }
                rialo_s_cpi::invoke_signed(
                    &rialo_s_system_interface::instruction::create_account(
                        creator_account.key,
                        vault_account.key,
                        total_funded,
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
                self.status = crate::STATUS_ACTIVE;
                self.creator = *creator_account.key;
                self.recipient = recipient;
                self.vault = vault;
                self.subscription = *self.accounts[4].key;
                self.vault_bump = vault_bump;
                self.payment_count = payment_count;
                self.payments_made = 0;
                self.installment_amount = installment_amount;
                self.interval_ms = interval_ms;
                self.next_execution_at_ms = first_execution_at_ms;
                self.total_funded = total_funded;
                self.total_distributed = 0;
                self.refunded_amount = 0;

                AFTER first_execution_at_ms CALL [pay recipient: recipient vault: vault];
                Ok(())
            }

            handler fn pay(&mut self, recipient: Pubkey, vault: Pubkey) -> ProgramResult {
                self.pay_installment(recipient, vault)?;
                if self.status == crate::STATUS_ACTIVE {
                    let next_time = self
                        .next_execution_at_ms
                        .checked_add(self.interval_ms)
                        .ok_or(ProgramError::ArithmeticOverflow)?;
                    self.next_execution_at_ms = next_time;
                    self.subscription = *self.accounts[4].key;
                    AFTER next_time CALL [pay recipient: recipient vault: vault];
                }
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
                if self.status == crate::STATUS_CANCELLED {
                    return Ok(());
                }
                if self.status != crate::STATUS_ACTIVE
                    || subscription != self.subscription
                    || vault != self.vault
                    || *subscription_account.key != self.subscription
                    || *vault_account.key != self.vault
                {
                    return Err(ProgramError::InvalidArgument);
                }

                self.destroy_subscription(4, subscription_account)?;
                let unpaid = self
                    .total_funded
                    .checked_sub(self.total_distributed)
                    .ok_or(ProgramError::ArithmeticOverflow)?;
                self.validate_vault(vault_account, unpaid)?;
                if unpaid > 0 {
                    self.transfer_from_vault(vault_account, creator_account, unpaid)?;
                }
                self.refunded_amount = unpaid;
                self.status = crate::STATUS_CANCELLED;
                msg!("RecurringAllowanceV2 refunded={} paid={}", unpaid, self.total_distributed);
                Ok(())
            }

            control fn get_state(&mut self) -> ProgramResult {
                msg!(
                    "RecurringAllowanceV2 schema={} status={} count={} payments_made={} funded={} paid={} refunded={}",
                    self.schema_version,
                    self.status,
                    self.payment_count,
                    self.payments_made,
                    self.total_funded,
                    self.total_distributed,
                    self.refunded_amount,
                );
                Ok(())
            }

            fn pay_installment(
                &mut self,
                recipient: Pubkey,
                vault: Pubkey,
            ) -> ProgramResult {
                let recipient_account = WriteAccountInfo::from(recipient);
                let vault_account = WriteAccountInfo::from(vault);
                if self.schema_version != crate::SCHEMA_VERSION
                    || self.status != crate::STATUS_ACTIVE
                    || self.payments_made >= self.payment_count
                    || recipient != self.recipient
                    || vault != self.vault
                    || *recipient_account.key != self.recipient
                    || *vault_account.key != self.vault
                {
                    return Err(ProgramError::InvalidAccountData);
                }
                let remaining = self
                    .total_funded
                    .checked_sub(self.total_distributed)
                    .ok_or(ProgramError::ArithmeticOverflow)?;
                self.validate_vault(vault_account, remaining)?;
                self.transfer_from_vault(vault_account, recipient_account, self.installment_amount)?;
                self.total_distributed = self
                    .total_distributed
                    .checked_add(self.installment_amount)
                    .ok_or(ProgramError::ArithmeticOverflow)?;
                let installment = self.payments_made;
                self.payments_made = self
                    .payments_made
                    .checked_add(1)
                    .ok_or(ProgramError::ArithmeticOverflow)?;
                if self.payments_made == self.payment_count {
                    self.status = crate::STATUS_COMPLETE;
                }
                msg!(
                    "RecurringAllowanceV2 installment={} amount={} total={}",
                    installment,
                    self.installment_amount,
                    self.total_distributed,
                );
                Ok(())
            }

            fn destroy_subscription(
                &self,
                account_index: usize,
                subscription_account: &rialo_s_program::account_info::AccountInfo<'account_info>,
            ) -> ProgramResult {
                let nonce = super::interface::multi_account_slug(
                    self.accounts[1].key,
                    0,
                    account_index,
                );
                rialo_s_program::program::invoke(
                    &rialo_s_program::instruction::Instruction::new_with_bincode(
                        rialo_subscriber_interface::ID,
                        &rialo_subscriber_interface::instruction::SubscriberInstruction::Destroy { nonce },
                        vec![
                            rialo_s_program::instruction::AccountMeta::new(self.creator, true),
                            rialo_s_program::instruction::AccountMeta::new(*subscription_account.key, false),
                        ],
                    ),
                    &[self.accounts[0].clone(), subscription_account.clone()],
                )
            }

            fn transfer_from_vault(
                &self,
                vault_account: &rialo_s_program::account_info::AccountInfo<'account_info>,
                destination: &rialo_s_program::account_info::AccountInfo<'account_info>,
                amount: u64,
            ) -> ProgramResult {
                rialo_s_cpi::invoke_signed(
                    &rialo_s_system_interface::instruction::transfer(
                        vault_account.key,
                        destination.key,
                        amount,
                    ),
                    &[vault_account.clone(), destination.clone()],
                    &[&[
                        crate::VAULT_SEED,
                        self.creator.as_ref(),
                        self.workflow_pda_slug.as_bytes(),
                        &[self.vault_bump],
                    ]],
                )
            }

            fn validate_vault(
                &self,
                vault_account: &rialo_s_program::account_info::AccountInfo<'_>,
                expected_balance: u64,
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
                    || vault_account.kelvins() != expected_balance
                {
                    return Err(ProgramError::InvalidAccountData);
                }
                Ok(())
            }
        }
    }
}
