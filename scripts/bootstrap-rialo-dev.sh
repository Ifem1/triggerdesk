#!/usr/bin/env bash
set -Eeuo pipefail

# Reproducible TriggerDesk build-host bootstrap for Ubuntu 22.04 (x86_64/aarch64).
# This host is build/test infrastructure only. It is never part of payment execution.

readonly RIALO_RELEASE="${RIALO_RELEASE:-0.12.2}"
readonly RIALOMAN_VERSION="${RIALOMAN_VERSION:-0.3.0}"
readonly RIALO_RUST_TOOLCHAIN_VERSION="${RIALO_RUST_TOOLCHAIN_VERSION:-0.0.3}"
readonly RIALOMAN_INSTALLER="https://rialo-artifacts.s3.us-east-2.amazonaws.com/rialoman/stable/install.sh"
readonly LEGACY_INSTALLER_HOST="rialoman.rialo.io"
readonly LOG_DIR="${RIALO_BOOTSTRAP_LOG_DIR:-$PWD/.rialo-bootstrap}"
readonly LOG_FILE="$LOG_DIR/bootstrap.log"

mkdir -p "$LOG_DIR"
exec > >(tee -a "$LOG_FILE") 2>&1

step() { printf '\n==> %s\n' "$*"; }
have() { command -v "$1" >/dev/null 2>&1; }

if [[ "$(uname -s)" != "Linux" ]]; then
  echo "ERROR: this bootstrap is supported only on Linux." >&2
  exit 2
fi

if ! grep -q '^ID=ubuntu' /etc/os-release; then
  echo "ERROR: Ubuntu is required; found:" >&2
  cat /etc/os-release >&2
  exit 2
fi

source /etc/os-release
if [[ "${VERSION_ID:-}" != "22.04" ]]; then
  echo "WARNING: Ubuntu 22.04 is the verified target; continuing on ${VERSION_ID:-unknown}."
fi

step "Record host and network evidence"
date --iso-8601=seconds
cat /etc/os-release
uname -a
uname -m
getent ahosts crates.io || true
getent ahosts github.com || true
getent ahosts rialo-artifacts.s3.us-east-2.amazonaws.com || true
getent ahosts "$LEGACY_INSTALLER_HOST" || true
curl --version | head -n 1
curl -sSIL --max-time 20 "$RIALOMAN_INSTALLER" || true
curl -sSIL --max-time 20 "https://$LEGACY_INSTALLER_HOST/install.sh" || true

step "Install Ubuntu build prerequisites"
sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
  build-essential ca-certificates clang cmake curl git libssl-dev \
  llvm ninja-build pkg-config protobuf-compiler python3 xz-utils

step "Install Rust through the official rustup installer"
if ! have rustup; then
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal
fi
export PATH="$HOME/.cargo/bin:${XDG_DATA_HOME:-$HOME/.local/share}/rialo/bin:$PATH"
rustup toolchain install stable --profile minimal
rustup default stable
rustc --version --verbose
cargo --version --verbose

step "Install rialoman ${RIALOMAN_VERSION}"
if ! have rialoman; then
  installer_tmp="$(mktemp)"
  if curl --proto '=https' --tlsv1.2 -fsSL "$RIALOMAN_INSTALLER" -o "$installer_tmp"; then
    bash "$installer_tmp"
  else
    echo "Hosted rialoman installer unavailable; installing the official crates.io release."
    cargo install --locked --version "$RIALOMAN_VERSION" rialoman
  fi
  rm -f "$installer_tmp"
fi
hash -r
rialoman --version

step "Install Rialo release ${RIALO_RELEASE}"
if ! rialoman install "stable@${RIALO_RELEASE}"; then
  echo "stable@${RIALO_RELEASE} failed; trying the legacy exact-version syntax."
  rialoman install "$RIALO_RELEASE"
fi
rialoman use "stable@${RIALO_RELEASE}" || rialoman use "$RIALO_RELEASE"
hash -r
rialoman current
rialoman list

step "Ensure Rialo Rust toolchain ${RIALO_RUST_TOOLCHAIN_VERSION}"
if ! rialoman toolchain install rialo-rust --version "$RIALO_RUST_TOOLCHAIN_VERSION"; then
  echo "Prebuilt toolchain unavailable; building with the repository's rialo-build-lib 0.12.2 helper."
  echo "Expected by rialo-build-lib 0.12.2: nightly-2025-05-10 / dcecb99176edf2eec51613730937d21cdd5c8f6e"
  cargo run --release \
    --manifest-path "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/rialo-toolchain-bootstrap/Cargo.toml" \
    -- "$RIALO_RUST_TOOLCHAIN_VERSION"
fi

step "Validate installed binaries and custom target"
for binary in rialoman rialo rialo-build cargo rustc; do
  if have "$binary"; then
    printf '%-16s %s\n' "$binary" "$(command -v "$binary")"
    "$binary" --version || true
  else
    printf '%-16s %s\n' "$binary" "NOT INSTALLED"
  fi
done
cargo +rialo --version
rustc +rialo --version --verbose
rustc +rialo --print target-list | grep -Fx 'riscv64emac-solana-solana'

step "Record Node/npm versions if present"
node --version || true
npm --version || true

cat <<EOF

Bootstrap completed.
Evidence log: $LOG_FILE
Rialo release: $RIALO_RELEASE
Rialo Rust toolchain: $RIALO_RUST_TOOLCHAIN_VERSION
EOF
