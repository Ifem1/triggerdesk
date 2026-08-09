use rialo_venus_proc_macro::rialo;

const VAULT_SEED: &[u8] = b"triggerdesk-vault";

rialo! {
    workflow {
        state {
            creator: Pubkey,
            recipient: Pubkey,
            vault: Pubkey,
            vault_bump: u8,
            amount: u64,
            callback_seen: bool,
            transferred: bool,
            use_wrong_seed: bool,
        }

        program {
            use rialo_s_program::{
                entrypoint::ProgramResult,
                msg,
                program_error::ProgramError,
                pubkey::Pubkey,
                system_program,
            };

            initiating fn setup(
                &mut self,
                recipient: Pubkey,
                vault: Pubkey,
                amount: u64,
                execute_at: u64,
                use_wrong_seed: bool,
            ) -> ProgramResult {
                let vault_account = WriteAccountInfo::from(vault);
                let creator_account = &self.accounts[0];

                if amount == 0 || *recipient.as_ref() == [0u8; 32] {
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
                    msg!("FundsPathProbe rejected substituted vault={}", vault_account.key);
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

                self.creator = *creator_account.key;
                self.recipient = recipient;
                self.vault = vault;
                self.vault_bump = vault_bump;
                self.amount = amount;
                self.callback_seen = false;
                self.transferred = false;
                self.use_wrong_seed = use_wrong_seed;

                AFTER execute_at CALL [
                    transfer_from_vault recipient: recipient vault: vault
                ];
                Ok(())
            }

            handler fn transfer_from_vault(
                &mut self,
                recipient: Pubkey,
                vault: Pubkey,
            ) -> ProgramResult {
                let recipient_account = WriteAccountInfo::from(recipient);
                let vault_account = WriteAccountInfo::from(vault);

                self.callback_seen = true;
                if self.transferred {
                    return Err(ProgramError::InvalidAccountData);
                }
                if *recipient_account.key != self.recipient || *vault_account.key != self.vault {
                    return Err(ProgramError::InvalidArgument);
                }
                if vault_account.owner != &system_program::ID || vault_account.kelvins() != self.amount {
                    return Err(ProgramError::InvalidAccountData);
                }

                let bump = if self.use_wrong_seed {
                    self.vault_bump.wrapping_add(1)
                } else {
                    self.vault_bump
                };
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
                        &[bump],
                    ]],
                )?;

                self.transferred = true;
                msg!(
                    "FundsPathProbe transferred={} vault={} recipient={}",
                    self.amount,
                    vault_account.key,
                    recipient_account.key,
                );
                Ok(())
            }

            control fn get_state(&mut self) -> ProgramResult {
                msg!(
                    "FundsPathProbe creator={} recipient={} vault={} amount={} callback_seen={} transferred={} wrong_seed={}",
                    self.creator,
                    self.recipient,
                    self.vault,
                    self.amount,
                    self.callback_seen,
                    self.transferred,
                    self.use_wrong_seed,
                );
                Ok(())
            }
        }
    }
}
