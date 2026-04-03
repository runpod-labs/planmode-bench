from dataclasses import dataclass, field
from datetime import datetime
from typing import List


@dataclass
class Bookmark:
    id: str
    url: str
    title: str
    tags: List[str] = field(default_factory=list)
    notes: str = ""
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "url": self.url,
            "title": self.title,
            "tags": self.tags,
            "notes": self.notes,
            "created_at": self.created_at,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Bookmark":
        return cls(
            id=data["id"],
            url=data["url"],
            title=data["title"],
            tags=data.get("tags", []),
            notes=data.get("notes", ""),
            created_at=data.get("created_at", datetime.now().isoformat()),
        )
