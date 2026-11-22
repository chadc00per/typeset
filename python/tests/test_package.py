"""The two packages are released together: one version everywhere it is written."""
from __future__ import annotations

import json
import re
from pathlib import Path

import pytest

import chadc00per_typeset

ROOT = Path(__file__).resolve().parents[2]


def test_one_version_in_package_json_pyproject_and_the_module():
    if not (ROOT / 'package.json').is_file():
        pytest.skip('package.json is not in the sdist: this checks the repository')
    npm = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))['version']
    # tomllib is Python 3.11+; the [project] version line is enough here.
    pypi = re.search(r'^version = "([^"]+)"', (ROOT / 'pyproject.toml').read_text(encoding='utf-8'), re.M)[1]
    assert npm == pypi == chadc00per_typeset.__version__
