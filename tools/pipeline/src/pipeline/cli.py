"""`pipeline` command line."""

import argparse
import io
import sys
from collections.abc import Sequence

from pipeline.steps import STEPS, Context


def main(argv: Sequence[str] | None = None) -> int:
    # Windows pipes default to cp1252; step descriptions and commune names need UTF-8.
    if isinstance(sys.stdout, io.TextIOWrapper):
        sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(prog="pipeline")
    commands = parser.add_subparsers(dest="command", required=True)
    sync = commands.add_parser("sync", help="run every step in order")
    sync.add_argument("--dry-run", action="store_true", help="list the steps without running them")
    args = parser.parse_args(argv)

    if args.dry_run:
        for index, step in enumerate(STEPS, start=1):
            print(f"{index}. {step.name}: {step.description}")
        return 0

    ctx = Context()
    for step in STEPS:
        print(f"→ {step.name}")
        step.run(ctx)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
