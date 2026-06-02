# HTML Visual Editor

A lightweight visual editor for local static HTML files.

The editor runs fully in the browser. You can upload or paste an HTML file, select elements on the page, adjust styles, edit text, and export a cleaned HTML file without the editor runtime.

## Features

- Upload `.html` / `.htm` files or paste HTML code.
- Click elements directly on the rendered page.
- Edit text content for selected elements.
- Adjust common visual styles such as typography, spacing, size, color, background, radius, and shadow.
- Undo and restore recent edits.
- Export a clean HTML file with editor artifacts removed.
- Conservative page navigation support for common slide and paginated HTML structures.

## Quick Start

Install development dependencies:

```bash
npm install
```

Run the local static server:

```bash
npm run serve
```

Open:

```text
http://127.0.0.1:4173/index.html
```

## Direct Script Usage

You can also add the editor script to an existing HTML file:

```html
<script src="editor.js"></script>
```

Then open the HTML file in a browser and click the floating edit button.

## Testing

Syntax and inline script checks:

```bash
npm run check
```

Cross-browser compatibility tests:

```bash
npm run test:compat
```

The compatibility suite covers Chromium, WebKit, mobile Chrome, and mobile Safari profiles. Firefox can be run separately:

```bash
npm run test:compat:firefox
```

## Page Navigation Behavior

The editor only shows its own pager when it can identify a reliable multi-page structure.

Supported cases include:

- Explicit slide/page elements.
- Stacked slide decks using active/previous classes.
- Repeated page blocks.
- Scroll-based pages.
- Runtime-rendered pages with visible counters such as `1 / 12`.

If the editor cannot confidently identify pages, it hides its pager and lets the original page controls continue to work.

## Browser Support

The project is tested against:

- Desktop Chromium
- Desktop WebKit/Safari profile
- Mobile Chrome profile
- Mobile Safari profile

## License

Choose and add a license before publishing this repository as open source.
