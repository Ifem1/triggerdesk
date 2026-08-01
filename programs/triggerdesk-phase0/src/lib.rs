use rialo_venus_proc_macro::rialo;

rialo! {
    workflow {
        state {
            delay_secs: u64,
            trigger_timestamp: u64,
            triggered: bool,
            trigger_count: u64,
        }

        program {
            use rialo_s_program::{
                entrypoint::ProgramResult,
                msg,
                pubkey::Pubkey,
            };

            fn now_unix_secs(&self) -> u64 {
                let ts = self.unix_timestamp() as u64;
                if ts > 100_000_000_000 { ts / 1000 } else { ts }
            }

            initiating fn start(&mut self, delay_secs: u64) -> ProgramResult {
                msg!("Phase0::Start delay_secs={}", delay_secs);
                self.delay_secs = delay_secs;
                self.triggered = false;
                self.trigger_count = 0;

                let now = self.now_unix_secs();
                self.trigger_timestamp = now + delay_secs;
                msg!("Phase0::Scheduled callback at {}", self.trigger_timestamp);

                AFTER self.trigger_timestamp CALL [on_trigger];

                Ok(())
            }

            handler fn on_trigger(&mut self) -> ProgramResult {
                msg!("Phase0::OnTrigger fired");
                self.triggered = true;
                self.trigger_count += 1;
                msg!("Phase0::trigger_count={}", self.trigger_count);
                Ok(())
            }

            control fn get_state(&mut self) -> ProgramResult {
                msg!("Phase0::State triggered={} count={} ts={}",
                    self.triggered, self.trigger_count, self.trigger_timestamp);
                Ok(())
            }

            terminating fn stop(&mut self) -> ProgramResult {
                msg!("Phase0::Stopped");
                Ok(())
            }
        }
    }
}
