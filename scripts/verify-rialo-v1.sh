#!/usr/bin/env bash
set -Eeuo pipefail

readonly TARGET="riscv64emac-solana-solana"
readonly ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly EVIDENCE_DIR="${RIALO_EVIDENCE_DIR:-$ROOT/.rialo-evidence/v1}"
readonly LEGACY_CARGO_HOME="${RIALO_V1_CARGO_HOME:-/home/achinnys/.cargo}"

mkdir -p "$EVIDENCE_DIR"
exec > >(tee "$EVIDENCE_DIR/verify.log") 2>&1
export PATH="$HOME/.cargo/bin:${XDG_DATA_HOME:-$HOME/.local/share}/rialo/bin:$PATH"

printf 'commit=%s\n' "$(git -C "$ROOT" rev-parse HEAD)"
printf 'os=%s\n' "$(. /etc/os-release && echo "$PRETTY_NAME")"
printf 'arch=%s\n' "$(uname -m)"
node --version || true
npm --version || true
rustc --version --verbose
cargo --version --verbose
rialoman --version
rialoman current
cargo +rialo --version
rustc +rialo --version --verbose
rustc +rialo --print target-list | grep -Fx "$TARGET"

printf '\n==> Prepare the original V1 Cargo source path\n'
printf 'cargo_home=%s\n' "$LEGACY_CARGO_HOME"
sudo mkdir -p "$LEGACY_CARGO_HOME"
sudo chown -R "$(id -u):$(id -g)" "$(dirname "$LEGACY_CARGO_HOME")"

for program in scheduled-transfer recurring-allowance; do
  program_dir="$ROOT/programs/$program"
  generated_dir="$EVIDENCE_DIR/generated/$program"
  printf '\n==> Building %s\n' "$program"
  CARGO_HOME="$LEGACY_CARGO_HOME" rialo-build \
    --program-path "$program_dir" \
    --output-dir "$generated_dir"
done

scheduled_checked="$ROOT/programs/scheduled-transfer/artifacts/scheduled-transfer-riscv/scheduled_transfer.polkavm"
scheduled_generated="$EVIDENCE_DIR/generated/scheduled-transfer/scheduled-transfer-riscv/scheduled_transfer.polkavm"
recurring_checked="$ROOT/programs/recurring-allowance/artifacts/recurring-allowance-riscv/recurring_allowance.polkavm"
recurring_generated="$EVIDENCE_DIR/generated/recurring-allowance/recurring-allowance-riscv/recurring_allowance.polkavm"

printf '\n==> Generated and checked-in artifact hashes\n'
sha256sum \
  "$scheduled_checked" "$scheduled_generated" \
  "$recurring_checked" "$recurring_generated" \
  "$ROOT/programs/scheduled-transfer/wit/scheduled-transfer.wit" \
  "$ROOT/programs/scheduled-transfer/wit/scheduled-transfer-manifest.json" \
  "$ROOT/programs/recurring-allowance/wit/recurring-allowance.wit" \
  "$ROOT/programs/recurring-allowance/wit/recurring-allowance-manifest.json" \
  | tee "$EVIDENCE_DIR/sha256.txt"

cmp "$scheduled_checked" "$scheduled_generated"
cmp "$recurring_checked" "$recurring_generated"
git -C "$ROOT" diff --exit-code -- \
  programs/scheduled-transfer/wit \
  programs/recurring-allowance/wit

printf '\nBuild verification completed. Evidence: %s\n' "$EVIDENCE_DIR"
