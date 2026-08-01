use rialo_venus_proc_macro::rialo;

rialo! {
    workflow {
        state {
            recipient: Pubkey,
            amount_kelvin: u64,
            interval_seconds: u64,
            total_distributed: u64,
            distribution_count: u64,
            created_at: u64,
            status: u8,
            // status: 0=uninitialized, 1=active, 2=complete, 3=cancelled
        }

        program {
            use rialo_s_program::{
                entrypoint::ProgramResult,
                msg,
                pubkey::Pubkey,
            };

            initiating fn setup(
                &mut self,
                recipient: Pubkey,
                amount_kelvin: u64,
                interval_seconds: u64,
            ) -> ProgramResult {
                msg!("RecurringAllowance::setup recipient={} amount={} interval={}s",
                    recipient, amount_kelvin, interval_seconds);

                self.recipient = recipient;
                self.amount_kelvin = amount_kelvin;
                self.interval_seconds = interval_seconds;
                self.total_distributed = 0;
                self.distribution_count = 0;
                self.created_at = self.unix_timestamp() as u64;
                self.status = 1;

                let now = self.unix_timestamp() as u64;
                let t1 = now + interval_seconds;
                let t2 = now + 2 * interval_seconds;
                let t3 = now + 3 * interval_seconds;
                AFTER t1 CALL [on_interval];
                AFTER t2 CALL [on_interval];
                AFTER t3 CALL [on_interval];

                msg!("RecurringAllowance::setup status=active distributions=3");
                Ok(())
            }

            handler fn on_interval(&mut self) -> ProgramResult {
                msg!("RecurringAllowance::on_interval fired count={}",
                    self.distribution_count);
                if self.status == 1 {
                    self.distribution_count += 1;
                    self.total_distributed += self.amount_kelvin;
                    msg!("RecurringAllowance::distributed total={} count={}",
                        self.total_distributed, self.distribution_count);
                    if self.distribution_count >= 3 {
                        self.status = 2;
                        msg!("RecurringAllowance::status=complete");
                    }
                }
                Ok(())
            }

            control fn get_state(&mut self) -> ProgramResult {
                msg!("RecurringAllowance::state status={} recipient={} amount={} interval={} total={} count={}",
                    self.status, self.recipient, self.amount_kelvin,
                    self.interval_seconds, self.total_distributed, self.distribution_count);
                Ok(())
            }

            terminating fn cancel(&mut self) -> ProgramResult {
                msg!("RecurringAllowance::cancel");
                if self.status == 1 {
                    self.status = 3;
                    msg!("RecurringAllowance::status=cancelled after {} distributions",
                        self.distribution_count);
                } else {
                    msg!("RecurringAllowance::cannot cancel in status={}", self.status);
                }
                Ok(())
            }
        }
    }
}
