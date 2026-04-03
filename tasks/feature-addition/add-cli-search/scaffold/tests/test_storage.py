import json
import os
import tempfile

import pytest

from src.models import Bookmark
from src.storage import (
    add_bookmark,
    delete_bookmark,
    get_bookmark,
    load_bookmarks,
    save_bookmarks,
)


@pytest.fixture
def db_path(tmp_path):
    return str(tmp_path / "test_bookmarks.json")


@pytest.fixture
def sample_bookmarks():
    return [
        Bookmark(
            id="aaa-111",
            url="https://example.com",
            title="Example Site",
            tags=["example", "test"],
            notes="A sample bookmark",
            created_at="2026-01-01T00:00:00",
        ),
        Bookmark(
            id="bbb-222",
            url="https://docs.python.org/3/",
            title="Python Docs",
            tags=["python", "docs"],
            notes="Official Python documentation",
            created_at="2026-01-02T00:00:00",
        ),
    ]


class TestLoadBookmarks:
    def test_returns_empty_list_when_file_missing(self, db_path):
        result = load_bookmarks(db_path)
        assert result == []

    def test_loads_bookmarks_from_file(self, db_path, sample_bookmarks):
        save_bookmarks(sample_bookmarks, db_path)
        result = load_bookmarks(db_path)
        assert len(result) == 2
        assert result[0].id == "aaa-111"
        assert result[1].title == "Python Docs"


class TestSaveBookmarks:
    def test_creates_file(self, db_path, sample_bookmarks):
        save_bookmarks(sample_bookmarks, db_path)
        assert os.path.exists(db_path)

    def test_file_contains_valid_json(self, db_path, sample_bookmarks):
        save_bookmarks(sample_bookmarks, db_path)
        with open(db_path) as f:
            data = json.load(f)
        assert len(data) == 2
        assert data[0]["url"] == "https://example.com"


class TestAddBookmark:
    def test_adds_bookmark_and_returns_it(self, db_path):
        result = add_bookmark(
            url="https://new.example.com",
            title="New Bookmark",
            tags=["new"],
            db_path=db_path,
        )
        assert result.url == "https://new.example.com"
        assert result.title == "New Bookmark"

    def test_persists_bookmark(self, db_path):
        add_bookmark(url="https://a.com", title="A", db_path=db_path)
        bookmarks = load_bookmarks(db_path)
        assert len(bookmarks) == 1

    def test_generates_unique_ids(self, db_path):
        b1 = add_bookmark(url="https://a.com", title="A", db_path=db_path)
        b2 = add_bookmark(url="https://b.com", title="B", db_path=db_path)
        assert b1.id != b2.id


class TestDeleteBookmark:
    def test_deletes_existing_bookmark(self, db_path, sample_bookmarks):
        save_bookmarks(sample_bookmarks, db_path)
        result = delete_bookmark("aaa-111", db_path)
        assert result is True
        remaining = load_bookmarks(db_path)
        assert len(remaining) == 1

    def test_returns_false_for_missing_id(self, db_path, sample_bookmarks):
        save_bookmarks(sample_bookmarks, db_path)
        result = delete_bookmark("nonexistent", db_path)
        assert result is False


class TestGetBookmark:
    def test_returns_bookmark_by_id(self, db_path, sample_bookmarks):
        save_bookmarks(sample_bookmarks, db_path)
        result = get_bookmark("bbb-222", db_path)
        assert result is not None
        assert result.title == "Python Docs"

    def test_returns_none_for_missing_id(self, db_path, sample_bookmarks):
        save_bookmarks(sample_bookmarks, db_path)
        result = get_bookmark("nonexistent", db_path)
        assert result is None
