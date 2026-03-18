from pathlib import Path

import pytest

FIXTURES_DIR = Path(__file__).parent / "fixtures"


@pytest.fixture
def fixture():
    """Return a function that loads a fixture file by name."""

    def _load(name: str) -> str:
        return (FIXTURES_DIR / name).read_text()

    return _load
