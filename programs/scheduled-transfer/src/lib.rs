use rialo_venus_proc_macro::rialo;

rialo! {
    workflow {
        state {
            recipient: Pubkey,
            amount_kelvin: u64,
            scheduled_at: u64,
            created_at: u64,
            status: u8,
            // status: 0=uninitialized, 1=pending, 2=claimable, 3=claimed, 4=cancelled
        }

        program {
            use rialo_s_program::{
                entrypoint::ProgramResult,
                msg,
                pubkey::Pubkey,
            };

            initiating fn schedule(
                &mut self,
                recipient: Pubkey,
                amount_kelvin: u64,
                execute_at: u64,
            ) -> ProgramResult {
                msg!("ScheduledTransfer::schedule recipient={} amount={} execute_at={}",
                    recipient, amount_kelvin, execute_at);

                self.recipient = recipient;
                self.amount_kelvin = amount_kelvin;
                self.scheduled_at = execute_at;
                self.created_at = self.unix_timestamp() as u64;
                self.status = 1; // pending

                AFTER execute_at CALL [on_timer];

                msg!("ScheduledTransfer::scheduled status=pending");
                Ok(())
            }

            handler fn on_timer(&mut self) -> ProgramResult {
                msg!("ScheduledTransfer::on_timer fired");
                if self.status == 1 {
                    self.status = 2; // claimable
                    msg!("ScheduledTransfer::status=claimable");
                }
                Ok(())
            }

            control fn get_state(&mut self) -> ProgramResult {
                msg!("ScheduledTransfer::state status={} recipient={} amount={} scheduled_at={}",
                    self.status, self.recipient, self.amount_kelvin, self.scheduled_at);
                Ok(())
            }

            terminating fn cancel(&mut self) -> ProgramResult {
                msg!("ScheduledTransfer::cancel");
                if self.status == 1 {
                    self.status = 4; // cancelled
                    msg!("ScheduledTransfer::status=cancelled");
                } else {
                    msg!("ScheduledTransfer::cannot cancel in status={}", self.status);
                }
                Ok(())
            }
        }
    }
}
