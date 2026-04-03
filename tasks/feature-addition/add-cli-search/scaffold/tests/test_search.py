"""Tests for search functionality.

These tests define the expected behaviour of the search module that needs
to be implemented in src/search.py and wired into the CLI.
"""

import json
import subprocess
import sys
import tempfile

import pytest

from src.models import Bookmark
from src.search import search, search_by_domain, search_by_tag, search_by_title


@pytest.fixture
def bookmarks():
    return [
        Bookmark(
            id="aaa-111",
            url="https://docs.python.org/3/tutorial/index.html",
            title="Python Tutorial",
            tags=["python", "tutorial", "docs"],
            notes="Official Python tutorial",
            created_at="2026-01-01T00:00:00",
        ),
        Bookmark(
            id="bbb-222",
            url="https://github.com/runpod/runpod-python",
            title="RunPod Python SDK",
            tags=["python", "sdk", "runpod"],
            notes="RunPod serverless SDK",
            created_at="2026-01-02T00:00:00",
        ),
        Bookmark(
            id="ccc-333",
            url="https://developer.mozilla.org/en-US/docs/Web/JavaScript",
            title="MDN JavaScript Guide",
            tags=["javascript", "docs", "mdn"],
            notes="Comprehensive JS reference",
            created_at="2026-01-03T00:00:00",
        ),
        Bookmark(
            id="ddd-444",
            url="https://github.com/pallets/flask",
            title="Flask Web Framework",
            tags=["python", "flask", "web"],
            notes="Lightweight WSGI web framework",
            created_at="2026-01-04T00:00:00",
        ),
        Bookmark(
            id="eee-555",
            url="https://docs.python.org/3/library/argparse.html",
            title="argparse documentation",
            tags=["python", "cli", "docs"],
            notes="Argparse module reference",
            created_at="2026-01-05T00:00:00",
        ),
    ]


# ---------- search_by_title ----------


class TestSearchByTitle:
    def test_case_insensitive_match(self, bookmarks):
        result = search_by_title(bookmarks, "python")
        titles = [b.title for b in result]
        assert "Python Tutorial" in titles
        assert "RunPod Python SDK" in titles

    def test_substring_match(self, bookmarks):
        result = search_by_title(bookmarks, "argparse")
        assert len(result) == 1
        assert result[0].id == "eee-555"

    def test_no_match_returns_empty(self, bookmarks):
        result = search_by_title(bookmarks, "nonexistent")
        assert result == []


# ---------- search_by_tag ----------


class TestSearchByTag:
    def test_exact_tag_match(self, bookmarks):
        result = search_by_tag(bookmarks, "flask")
        assert len(result) == 1
        assert result[0].id == "ddd-444"

    def test_shared_tag(self, bookmarks):
        result = search_by_tag(bookmarks, "docs")
        assert len(result) == 3

    def test_no_match_returns_empty(self, bookmarks):
        result = search_by_tag(bookmarks, "rust")
        assert result == []


# ---------- search_by_domain ----------


class TestSearchByDomain:
    def test_matches_domain(self, bookmarks):
        result = search_by_domain(bookmarks, "github.com")
        assert len(result) == 2

    def test_matches_subdomain(self, bookmarks):
        result = search_by_domain(bookmarks, "docs.python.org")
        assert len(result) == 2

    def test_no_match_returns_empty(self, bookmarks):
        result = search_by_domain(bookmarks, "stackoverflow.com")
        assert result == []


# ---------- search (combined) ----------


class TestSearchCombined:
    def test_single_criterion_title(self, bookmarks):
        result = search(bookmarks, title="flask")
        assert len(result) == 1
        assert result[0].id == "ddd-444"

    def test_single_criterion_tag(self, bookmarks):
        result = search(bookmarks, tag="javascript")
        assert len(result) == 1
        assert result[0].id == "ccc-333"

    def test_single_criterion_domain(self, bookmarks):
        result = search(bookmarks, domain="developer.mozilla.org")
        assert len(result) == 1

    def test_and_logic_title_and_tag(self, bookmarks):
        # "python" in title AND tagged "sdk"
        result = search(bookmarks, title="python", tag="sdk")
        assert len(result) == 1
        assert result[0].id == "bbb-222"

    def test_and_logic_all_three(self, bookmarks):
        # title contains "python", tag "docs", domain "docs.python.org"
        result = search(bookmarks, title="python", tag="docs", domain="docs.python.org")
        assert len(result) == 1
        assert result[0].id == "aaa-111"

    def test_no_criteria_returns_all(self, bookmarks):
        result = search(bookmarks)
        assert len(result) == len(bookmarks)

    def test_conflicting_criteria_returns_empty(self, bookmarks):
        result = search(bookmarks, title="flask", tag="javascript")
        assert result == []


# ---------- CLI integration ----------


class TestSearchCLI:
    def test_search_command_exists(self):
        """The CLI parser should accept the 'search' command without error."""
        from src.cli import build_parser

        parser = build_parser()
        args = parser.parse_args(["search", "--title", "python"])
        assert args.command == "search"
        assert args.title == "python"

    def test_search_format_json_flag(self):
        """The CLI should accept --format json on the search command."""
        from src.cli import build_parser

        parser = build_parser()
        args = parser.parse_args(["search", "--tag", "docs", "--format", "json"])
        assert args.command == "search"
        assert args.tag == "docs"
        assert args.format == "json"
