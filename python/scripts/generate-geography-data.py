#!/usr/bin/env python3
"""Reproduce data/geography.json from offline CLDR validity tables.

Download common/validity/{language,region,subdivision,script,variant}.xml and
LICENSE from https://github.com/unicode-org/cldr/tree/release-48 into one directory.
Usage: python3 python/scripts/generate-geography-data.py /path/to/cldr-inputs
The validity files carry no release number, so the pin is their SHA-256.
To upgrade, change PINNED and PINNED_SHA256 and regenerate.
"""
import hashlib
import json
import shutil
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

PINNED = '48'
PINNED_SHA256 = {
    'language.xml': '3f2be6cb8f4a1b506a5bc8d79d3a91349f3061ade565f836c534c00c2efd2996',
    'region.xml': 'e751e0eedd46b52c38f3cdb72b0fab61ac8b48e052e8b28ba74b6ac26c4c8cb1',
    'subdivision.xml': '93b12c9d55938266c96d44a7ccbb66800afeef4f9dd48b0dc16edfab89833d95',
    'script.xml': '30f7f5f64be0df200bdfe42f7ce103a045ab661490885a7f060f31d4199be948',
    'variant.xml': '49019a8e903802a75197d47ef9854d24655bdac373b8667cf00a33fd9205676e',
}
SOURCE = f'https://github.com/unicode-org/cldr/tree/release-{PINNED}/common/validity'
OUTPUT = Path(__file__).resolve().parents[2] / 'data'

source_dir = Path(sys.argv[1])
tables = {}
hashes = {}
for name, pinned in PINNED_SHA256.items():
    contents = (source_dir / name).read_bytes()
    hashes[name] = hashlib.sha256(contents).hexdigest()
    if hashes[name] != pinned:
        raise ValueError(f'{name} is not the pinned CLDR {PINNED} file (sha256 {hashes[name]})')
    tables[name.removesuffix('.xml')] = {node.attrib['idStatus']: node.text.split() for node in ET.fromstring(contents).findall('./idValidity/id')}


def codes(kind, *statuses):
    return ' '.join(token for status in statuses for token in tables[kind][status])


data = {
    'version': f'CLDR {PINNED}',
    'source': SOURCE,
    'sha256': hashes,
    'license': 'Unicode-3.0',
    'language': codes('language', 'regular', 'special', 'unknown'),
    'country': codes('region', 'regular'),
    'localeRegion': codes('region', 'regular', 'macroregion'),
    'subdivision': codes('subdivision', 'regular'),
    'script': codes('script', 'regular', 'special', 'unknown'),
    'variant': codes('variant', 'regular'),
}
(OUTPUT / 'geography.json').write_text(json.dumps(data, separators=(',', ':')) + '\n', encoding='utf-8', newline='\n')
shutil.copyfile(source_dir / 'LICENSE', OUTPUT / 'UNICODE-LICENSE.txt')
print(f'{OUTPUT / "geography.json"}: {len(data["country"].split())} country tokens')
