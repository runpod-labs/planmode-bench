import json
import os
import uuid
from typing import List, Optional

from .models import Bookmark

DEFAULT_DB_PATH = os.path.expanduser("~/.bookmarks.json")


def load_bookmarks(db_path: str = DEFAULT_DB_PATH) -> List[Bookmark]:
    """Load all bookmarks from the JSON file."""
    if not os.path.exists(db_path):
        return []
    with open(db_path, "r") as f:
        data = json.load(f)
    return [Bookmark.from_dict(item) for item in data]


def save_bookmarks(bookmarks: List[Bookmark], db_path: str = DEFAULT_DB_PATH) -> None:
    """Save all bookmarks to the JSON file."""
    data = [b.to_dict() for b in bookmarks]
    with open(db_path, "w") as f:
        json.dump(data, f, indent=2)


def add_bookmark(
    url: str,
    title: str,
    tags: Optional[List[str]] = None,
    notes: str = "",
    db_path: str = DEFAULT_DB_PATH,
) -> Bookmark:
    """Create and persist a new bookmark. Returns the created bookmark."""
    bookmarks = load_bookmarks(db_path)
    bookmark = Bookmark(
        id=str(uuid.uuid4()),
        url=url,
        title=title,
        tags=tags or [],
        notes=notes,
    )
    bookmarks.append(bookmark)
    save_bookmarks(bookmarks, db_path)
    return bookmark


def delete_bookmark(bookmark_id: str, db_path: str = DEFAULT_DB_PATH) -> bool:
    """Delete a bookmark by its id. Returns True if found and deleted."""
    bookmarks = load_bookmarks(db_path)
    original_len = len(bookmarks)
    bookmarks = [b for b in bookmarks if b.id != bookmark_id]
    if len(bookmarks) == original_len:
        return False
    save_bookmarks(bookmarks, db_path)
    return True


def get_bookmark(bookmark_id: str, db_path: str = DEFAULT_DB_PATH) -> Optional[Bookmark]:
    """Retrieve a single bookmark by its id."""
    bookmarks = load_bookmarks(db_path)
    for b in bookmarks:
        if b.id == bookmark_id:
            return b
    return None
