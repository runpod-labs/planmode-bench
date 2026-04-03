import json
from typing import List

from .models import Bookmark


def format_table(bookmarks: List[Bookmark]) -> str:
    """Format bookmarks as a plain-text table."""
    if not bookmarks:
        return "No bookmarks found."

    # Column widths
    id_w = 8
    title_w = 30
    url_w = 40
    tags_w = 20

    header = (
        f"{'ID':<{id_w}} "
        f"{'Title':<{title_w}} "
        f"{'URL':<{url_w}} "
        f"{'Tags':<{tags_w}}"
    )
    separator = "-" * len(header)
    lines = [header, separator]

    for b in bookmarks:
        short_id = b.id[:8]
        title = b.title[:title_w]
        url = b.url[:url_w]
        tags = ", ".join(b.tags)[:tags_w]
        lines.append(
            f"{short_id:<{id_w}} "
            f"{title:<{title_w}} "
            f"{url:<{url_w}} "
            f"{tags:<{tags_w}}"
        )

    return "\n".join(lines)


def format_json(bookmarks: List[Bookmark]) -> str:
    """Format bookmarks as a JSON string."""
    return json.dumps([b.to_dict() for b in bookmarks], indent=2)
