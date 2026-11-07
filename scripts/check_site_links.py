#!/usr/bin/env python3
"""Check local website links and image references: python3 scripts/check_site_links.py."""

from html.parser import HTMLParser
from pathlib import Path
import os
import re
import sys
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
SITE_HOST = 'provocateur.us'
# These references also occur in inline scripts, CSS, structured data and JS.
IMAGE_REFERENCE = re.compile(r'''/pics/[^\s'"`<>\\)\?#]+''')


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.references = []
        self.anchors = set()

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        for key in ('id', 'name'):
            if attrs.get(key):
                self.anchors.add(attrs[key])
        for key in ('href', 'src'):
            if attrs.get(key):
                self.references.append((self.getpos()[0], attrs[key]))


def exact_file(path):
    """Match path components case-sensitively, even on a case-insensitive Mac."""
    try:
        parts = path.relative_to(ROOT).parts
    except ValueError:
        return None
    current = ROOT
    for part in parts:
        if not current.is_dir() or part not in {entry.name for entry in current.iterdir()}:
            return None
        current = current / part
    if current.is_dir():
        index = current / 'index.html'
        return index if index.is_file() else None
    return current if current.is_file() else None


def main():
    sources = []
    for directory, subdirs, files in os.walk(ROOT):
        subdirs[:] = [name for name in subdirs if not name.startswith('.') and name != 'node_modules']
        sources.extend(Path(directory) / name for name in files if Path(name).suffix in ('.html', '.js', '.css'))
    sources.sort()
    pages = [path for path in sources if path.suffix == '.html']
    parsed = {}
    for path in pages:
        page = Page()
        page.feed(path.read_text(encoding='utf-8'))
        parsed[path] = page

    errors = set()
    count = 0
    for path, page in parsed.items():
        for line, reference in page.references:
            url = urlsplit(reference)
            if url.scheme and (url.scheme not in ('http', 'https') or url.netloc != SITE_HOST):
                continue
            if url.netloc and url.netloc != SITE_HOST:
                continue
            # Resolve URLs relative to the current page, as the browser does.
            url_path = unquote(url.path)
            if not url_path:
                target = path
            elif url_path.startswith('/'):
                target = ROOT / url_path.lstrip('/')
            else:
                target = path.parent / url_path
            target = target.resolve()
            actual = exact_file(target)
            count += 1
            if actual is None:
                errors.add(f'{path.relative_to(ROOT)}:{line}: missing local target {reference}')
            elif url.fragment and actual in parsed:
                anchor = unquote(url.fragment)
                if anchor not in parsed[actual].anchors:
                    errors.add(f'{path.relative_to(ROOT)}:{line}: missing fragment {reference}')

    for path in sources:
        source = path.read_text(encoding='utf-8')
        for match in IMAGE_REFERENCE.finditer(source):
            reference = match.group()
            target = (ROOT / unquote(reference).lstrip('/')).resolve()
            count += 1
            if exact_file(target) is None:
                line = source.count('\n', 0, match.start()) + 1
                errors.add(f'{path.relative_to(ROOT)}:{line}: missing image {reference}')

    if errors:
        print('\n'.join(sorted(errors)), file=sys.stderr)
        print(f'{len(errors)} broken local reference(s) found.', file=sys.stderr)
        return 1
    print(f'Checked {count} local links and image references; all targets exist.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
