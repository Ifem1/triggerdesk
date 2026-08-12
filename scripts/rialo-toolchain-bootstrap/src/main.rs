use anyhow::{Context, Result};
use rialo_build_lib::{RialoRustToolchain, SourceBuildable, Toolchain};

fn main() -> Result<()> {
    let version = std::env::args()
        .nth(1)
        .context("usage: triggerdesk-rialo-toolchain-bootstrap <toolchain-version>")?;
    let toolchain = RialoRustToolchain::with_version(&version)?;
    let config = toolchain.get_source_config()?;

    println!("Building Rialo Rust toolchain {version} from official pinned source metadata");
    toolchain.build_from_source(&config)?;
    toolchain.register_with_rustup()?;
    toolchain.validate()?;
    Ok(())
}
