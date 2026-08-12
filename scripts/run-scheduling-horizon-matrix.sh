#!/usr/bin/env bash
set -Eeuo pipefail

# Disposable DevNet evidence runner. It only creates native AFTER workflows and
# observes chain state; it does not execute, retry, or keep payments alive.
readonly ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly PROGRAM_ID="3BA494eLRy15oHN4ST2Fq8Bx231xdPDfJy1tpP7hyoD6"
readonly CREATOR="Csgoy8TnEp7kZk8STr9gK8bPyLkUG6sVJhWYni2Xmwom"
readonly RECIPIENT="3t9AHak5yop4MQPrpEWfaSmwVK1EMfEMzpfofAT1L7Kb"
readonly OUTPUT_DIR="${1:-$ROOT/.rialo-evidence/scheduling-horizon-$(date -u +%Y%m%dT%H%M%SZ)}"

export PATH="$HOME/.cargo/bin:${XDG_DATA_HOME:-$HOME/.local/share}/rialo/bin:$PATH"
mkdir -p "$OUTPUT_DIR"

# Three independent workflows at each candidate delay. The script only creates
# native subscriptions and observes chain state; it never executes payments.
declare -a CASES=("5:201" "5:202" "5:203" "10:204" "10:205" "10:206" "15:207" "15:208" "15:209" "20:210" "20:211" "20:212")

derive() {
  node "$ROOT/scripts/derive-funds-probe.mjs" "$CREATOR" "$PROGRAM_ID" "$2" triggerdesk-v2-vault > "$OUTPUT_DIR/$1-derived.json"
}

for item in "${CASES[@]}"; do
  IFS=: read -r seconds fill <<< "$item"
  label="${seconds}s-${fill}"
  derive "$label" "$fill"
  workflow="$(node -e "console.log(require('$OUTPUT_DIR/$label-derived.json').workflow)")"
  vault="$(node -e "console.log(require('$OUTPUT_DIR/$label-derived.json').vault)")"
  subscription="$(node -e "console.log(require('$OUTPUT_DIR/$label-derived.json').subscription)")"
  slug="$(node -e "console.log(require('$OUTPUT_DIR/$label-derived.json').slugHex)")"
  creation_block="$(rialo client get-block-height -n devnet | awk '{print $NF}')"
  requested_ms="$(( $(date +%s%3N) + seconds * 1000 ))"
  recipient_before="$(rialo client account -n devnet --json "$RECIPIENT" | jq -r .kelvin)"
  {
    echo "creation_block=$creation_block"
    echo "requested_execution_ms=$requested_ms"
    echo "workflow=$workflow"
    echo "vault=$vault"
    echo "subscription=$subscription"
    echo "recipient_before=$recipient_before"
    rialo -a default client program invoke -n devnet \
      --manifest "$ROOT/programs/scheduled-transfer-v2/wit/scheduled-transfer-v2-manifest.json" \
      --function create --arg "workflow_pda_slug=$slug" --arg "recipient=$RECIPIENT" \
      --arg "vault=$vault" --arg amount=1000000 --arg "execute_at_ms=$requested_ms" "$PROGRAM_ID"
  } | tee "$OUTPUT_DIR/$label-create.txt"
  sleep 1
done

echo "created_at_ms=$(date +%s%3N)" >> "$OUTPUT_DIR/summary.txt"
# Let every candidate become due before taking the one final observation pass.
sleep 45

for item in "${CASES[@]}"; do
  IFS=: read -r seconds fill <<< "$item"
  label="${seconds}s-${fill}"
  workflow="$(node -e "console.log(require('$OUTPUT_DIR/$label-derived.json').workflow)")"
  vault="$(node -e "console.log(require('$OUTPUT_DIR/$label-derived.json').vault)")"
  subscription="$(node -e "console.log(require('$OUTPUT_DIR/$label-derived.json').subscription)")"
  {
    echo "observed_at_ms=$(date +%s%3N)"
    echo "observed_block=$(rialo client get-block-height -n devnet | awk '{print $NF}')"
    echo "recipient=$(rialo client account -n devnet --json "$RECIPIENT" | jq -r .kelvin)"
    for name_address in "workflow:$workflow" "vault:$vault" "subscription:$subscription"; do
      name="${name_address%%:*}"; address="${name_address#*:}"
      echo "$name=$address"
      rialo client account -n devnet --json "$address" || true
    done
    node "$ROOT/scripts/query-rialo-signatures.mjs" "$workflow" 20 || true
  } | tee "$OUTPUT_DIR/$label-observed.txt"
done
