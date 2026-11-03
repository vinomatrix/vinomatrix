"""Shared state handed to every step."""

import os
import urllib.request
from collections.abc import Callable, Mapping
from dataclasses import dataclass, field
from pathlib import Path

PIPELINE_DIR = Path(__file__).resolve().parents[2]
REPO_ROOT = PIPELINE_DIR.parents[1]
CACHE_DIR = PIPELINE_DIR / ".cache"

HttpGet = Callable[[str, Mapping[str, str]], bytes]


def urllib_get(url: str, headers: Mapping[str, str]) -> bytes:
    request = urllib.request.Request(url, headers=dict(headers))
    with urllib.request.urlopen(request, timeout=120) as response:
        return response.read()


@dataclass(frozen=True)
class Context:
    cache_dir: Path = CACHE_DIR
    env: Mapping[str, str] = field(default_factory=lambda: dict(os.environ))
    http_get: HttpGet = urllib_get
    refresh: bool = False
