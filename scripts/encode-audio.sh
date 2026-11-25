#!/usr/bin/env bash
# Encode a sound for public/audio/ so it matches the others in level and format:
# -16 LUFS integrated, true peak kept under -1.1 dBTP, AAC 256 kbps, +faststart.
#
#   scripts/encode-audio.sh path/to/bounce.wav public/audio/name.m4a
#
# Two loudnorm passes: the first measures the input, the second applies one
# linear gain from those numbers, so the mix's dynamics are left alone.
# Clips under about 5 seconds (a single guitar hit) can land a dB louder than
# the target, because integrated loudness needs more audio than that to settle.
# Needs ffmpeg on PATH.
set -euo pipefail

if [ $# -ne 2 ]; then
  echo "usage: $0 <input> <output.m4a>" >&2
  exit 1
fi
in=$1
out=$2

# TP is -1.5, not -1.1: AAC encoding can push peaks up a few tenths of a dB.
target="I=-16:TP=-1.5:LRA=11"

stats=$(ffmpeg -hide_banner -nostats -i "$in" \
  -af "loudnorm=$target:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
get() { printf '%s' "$stats" | sed -n "s/.*\"$1\" : \"\([^\"]*\)\".*/\1/p"; }

ffmpeg -hide_banner -loglevel error -y -i "$in" \
  -af "loudnorm=$target:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true" \
  -ar 48000 -c:a aac -b:a 256k -movflags +faststart "$out"

# Print the result so a bad encode is obvious before it is committed.
ffmpeg -hide_banner -nostats -i "$out" -af ebur128=peak=true -f null - 2>&1 \
  | sed -n '/Summary/,$p' | grep -E 'I:|Peak:' | tr -s ' '
