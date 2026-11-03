"""`pipeline` command line."""

import argparse
import io
import logging
import os
import sys
from collections.abc import Sequence
from pathlib import Path

from pipeline.context import REPO_ROOT, Context
from pipeline.steps import STEPS


def load_dotenv(path: Path) -> None:
    """Read KEY=VALUE lines from `path` into the environment; real variables win."""
    if not path.exists():
        return
    for raw in path.read_text("utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip())


def main(argv: Sequence[str] | None = None) -> int:
    # Windows pipes default to cp1252; step descriptions and commune names need UTF-8.
    if isinstance(sys.stdout, io.TextIOWrapper):
        sys.stdout.reconfigure(encoding="utf-8")
    logging.basicConfig(level=logging.INFO, format="  %(message)s", stream=sys.stdout)

    parser = argparse.ArgumentParser(prog="pipeline")
    commands = parser.add_subparsers(dest="command", required=True)
    sync = commands.add_parser("sync", help="run every step in order")
    sync.add_argument("--dry-run", action="store_true", help="list the steps without running them")
    sync.add_argument("--refresh", action="store_true", help="ignore cached downloads")
    args = parser.parse_args(argv)

    if args.dry_run:
        for index, step in enumerate(STEPS, start=1):
            print(f"{index}. {step.name}: {step.description}")
        return 0

    load_dotenv(REPO_ROOT / ".env")
    ctx = Context(refresh=args.refresh)
    for step in STEPS:
        print(f"→ {step.name}")
        step.run(ctx)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
