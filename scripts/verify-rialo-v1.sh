#!/usr/bin/env bash
set -Eeuo pipefail

readonly TARGET="riscv64emac-solana-solana"
readonly ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly EVIDENCE_DIR="${RIALO_EVIDENCE_DIR:-$ROOT/.rialo-evidence/v1}"

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

for program in scheduled-transfer recurring-allowance; do
  program_dir="$ROOT/programs/$program"
  printf '\n==> Building %s\n' "$program"
  (
    cd "$program_dir"
    cargo +rialo build --locked --release --target "$TARGET"
  )
done

printf '\n==> Generated and checked-in artifact hashes\n'
find "$ROOT/programs" -type f \( -name '*.polkavm' -o -name '*.wit' -o -name '*-manifest.json' \) \
  -print0 | sort -z | xargs -0 sha256sum | tee "$EVIDENCE_DIR/sha256.txt"

printf '\nBuild verification completed. Evidence: %s\n' "$EVIDENCE_DIR"
