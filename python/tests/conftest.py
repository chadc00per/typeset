"""pytest setup: the tests import the package from the checkout."""
import sys
from pathlib import Path

# Run against the checkout without installing it.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
