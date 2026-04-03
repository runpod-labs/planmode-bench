import argparse
import sys

from .storage import add_bookmark, delete_bookmark, get_bookmark, load_bookmarks
from .formatter import format_table, format_json


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="bookmark",
        description="Manage your local bookmark collection",
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # --- add ---
    add_parser = subparsers.add_parser("add", help="Add a new bookmark")
    add_parser.add_argument("url", help="URL to bookmark")
    add_parser.add_argument("title", help="Title for the bookmark")
    add_parser.add_argument(
        "--tags", nargs="*", default=[], help="Tags for the bookmark"
    )
    add_parser.add_argument("--notes", default="", help="Notes for the bookmark")

    # --- list ---
    list_parser = subparsers.add_parser("list", help="List all bookmarks")
    list_parser.add_argument(
        "--format",
        choices=["table", "json"],
        default="table",
        help="Output format (default: table)",
    )

    # --- delete ---
    delete_parser = subparsers.add_parser("delete", help="Delete a bookmark")
    delete_parser.add_argument("id", help="Bookmark ID to delete")

    # --- show ---
    show_parser = subparsers.add_parser("show", help="Show a single bookmark")
    show_parser.add_argument("id", help="Bookmark ID to show")

    return parser


def main(argv=None):
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.command is None:
        parser.print_help()
        sys.exit(1)

    if args.command == "add":
        bookmark = add_bookmark(
            url=args.url,
            title=args.title,
            tags=args.tags,
            notes=args.notes,
        )
        print(f"Bookmark added: {bookmark.id}")

    elif args.command == "list":
        bookmarks = load_bookmarks()
        if args.format == "json":
            print(format_json(bookmarks))
        else:
            print(format_table(bookmarks))

    elif args.command == "delete":
        success = delete_bookmark(args.id)
        if success:
            print(f"Bookmark {args.id} deleted.")
        else:
            print(f"Bookmark {args.id} not found.")
            sys.exit(1)

    elif args.command == "show":
        bookmark = get_bookmark(args.id)
        if bookmark is None:
            print(f"Bookmark {args.id} not found.")
            sys.exit(1)
        print(format_table([bookmark]))


if __name__ == "__main__":
    main()
