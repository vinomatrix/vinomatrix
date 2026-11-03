import pytest

from pipeline.cli import main
from pipeline.steps import STEPS


def test_dry_run_lists_every_step_in_order(capsys: pytest.CaptureFixture[str]) -> None:
    assert main(["sync", "--dry-run"]) == 0
    lines = capsys.readouterr().out.splitlines()
    assert lines == [f"{i}. {s.name}: {s.description}" for i, s in enumerate(STEPS, start=1)]


def test_step_names_are_unique() -> None:
    names = [s.name for s in STEPS]
    assert len(names) == len(set(names))


def test_sync_requires_a_command() -> None:
    with pytest.raises(SystemExit):
        main([])
