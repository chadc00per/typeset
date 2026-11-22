#!/usr/bin/env python3
"""Reproduce data/emoji.json from an offline Unicode emoji-test.txt.

Source: https://www.unicode.org/Public/17.0.0/emoji/emoji-test.txt
Usage: python3 python/scripts/generate-emoji-data.py /path/to/emoji-test.txt
Unicode-3.0 license: data/UNICODE-LICENSE.txt.
To upgrade, change PINNED and regenerate.
"""
import hashlib
import json
import sys
from pathlib import Path

PINNED = '17.0'
SOURCE = f'https://www.unicode.org/Public/{PINNED}.0/emoji/emoji-test.txt'
OUTPUT = Path(__file__).resolve().parents[2] / 'data/emoji.json'

source_path = Path(sys.argv[1])
source = source_path.read_bytes()
text = source.decode('utf-8')
if f'# Version: {PINNED}' not in text:
    raise ValueError(f'Expected the pinned Unicode Emoji {PINNED} source')

# Each qualification of a sequence maps to its fully-qualified form, which
# emoji-test.txt lists first.
entries = []
canonical = None
for line in text.splitlines():
    if ';' not in line or line.startswith('#'):
        continue
    code, status = line.split('#', 1)[0].split(';')
    status = status.strip()
    value = ''.join(chr(int(c, 16)) for c in code.split())
    if status == 'fully-qualified':
        canonical = value
    if status in ['fully-qualified', 'minimally-qualified', 'unqualified']:
        assert canonical is not None
        entries.append([value, canonical])

data = {
    'version': PINNED,
    'source': SOURCE,
    'sha256': {source_path.name: hashlib.sha256(source).hexdigest()},
    'license': 'Unicode-3.0',
    'entries': entries,
}
OUTPUT.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8', newline='\n')
print(f'{OUTPUT}: {len(entries)} entries')
