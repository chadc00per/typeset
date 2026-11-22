#!/usr/bin/env python3
"""Reproduce data/currency.json from an offline ISO 4217 list-one.xml.

Source: https://www.six-group.com/dam/download/financial-information/data-center/iso-currrency/lists/list-one.xml
(the ISO 4217 maintenance agency's current-currency list).
Usage: python3 python/scripts/generate-currency-data.py /path/to/list-one.xml
Each code maps to its minor-unit exponent; null = no minor unit (funds, metals, testing codes).
To upgrade, change PINNED and regenerate.
"""
import hashlib
import json
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

PINNED = '2026-09-17'
SOURCE = 'https://www.six-group.com/dam/download/financial-information/data-center/iso-currrency/lists/list-one.xml'
OUTPUT = Path(__file__).resolve().parents[2] / 'data/currency.json'

source_path = Path(sys.argv[1])
source = source_path.read_bytes()
root = ET.fromstring(source)
published = root.attrib['Pblshd']
if published != PINNED:
    raise ValueError(f'Expected the pinned {PINNED} ISO 4217 list, got {published}')

currencies = {}
for entry in root.findall('./CcyTbl/CcyNtry'):
    code = entry.findtext('Ccy')
    if not code:
        continue  # territories without a universal currency
    units = entry.findtext('CcyMnrUnts')
    digits = int(units) if units and units.isdigit() else None
    if currencies.get(code, digits) != digits:
        raise ValueError(f'{code} lists conflicting minor units')
    currencies[code] = digits

data = {
    'version': f'ISO 4217 list one, published {published}',
    'source': SOURCE,
    'sha256': {source_path.name: hashlib.sha256(source).hexdigest()},
    'currencies': dict(sorted(currencies.items())),
}
OUTPUT.write_text(json.dumps(data, separators=(',', ':')) + '\n', encoding='utf-8', newline='\n')
print(f'{OUTPUT}: {len(currencies)} currencies')
