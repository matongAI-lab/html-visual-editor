# HTML Visual Editor

A small browser-based visual editor for static HTML files.

It lets you open an HTML page, click elements directly in the rendered page, adjust common styles, edit text, and export a cleaned HTML file. It is designed for people who receive or generate HTML but do not want to keep editing everything by hand in source code.

## What It Does

- Upload an `.html` or `.htm` file.
- Paste HTML code directly into the editor.
- Enter edit mode automatically after an uploaded or demo HTML file is loaded.
- Select elements visually from the page.
- Edit text on selected elements.
- Adjust typography, spacing, size, color, background, border radius, and shadow.
- Undo and restore recent changes.
- Download a clean HTML file with editor-specific code removed.
- Handle common slide-style or paginated HTML files when the page structure can be detected safely.

## What It Is Good For

This project is useful when you need to make quick visual changes to a static HTML page, such as:

- AI-generated HTML pages.
- Simple landing pages.
- Report pages.
- HTML slide decks.
- Static prototypes.
- Internal documents exported as HTML.

It is not a full website builder, CMS, or professional design tool. The goal is to provide a lightweight editing layer for existing HTML.

## Quick Start

Clone the repository:

```bash
git clone https://github.com/matongAI-lab/html-visual-editor.git
cd html-visual-editor
```

Install development dependencies:

```bash
npm install
```

Start the local server:

```bash
npm run serve
```

Open this URL in your browser:

```text
http://127.0.0.1:4173/index.html
```

## No Build Required

The editor itself is plain HTML, CSS, and JavaScript. There is no frontend build step required to use it.

The `npm install` step is only needed for the local server and automated browser tests.

## Using It In Another HTML File

You can also add the editor script to an existing HTML file:

```html
<script src="editor.js"></script>
```

Then open the HTML file in a browser and use the floating edit button.

## Export Behavior

When you download or copy the edited HTML, the editor removes its own runtime artifacts, temporary attributes, selection markers, and `contenteditable` state.

The exported file should be a normal static HTML file, not a file that depends on this editor.

## Page Navigation

The editor only shows its own page controls when it can detect a reliable multi-page structure.

Supported cases include:

- Explicit slide or page elements.
- Repeated page blocks.
- Scroll-based pages.
- Stacked slide decks using active/previous classes.
- Runtime-rendered pages with visible counters such as `1 / 12`.

If the editor cannot confidently detect pages, it hides its own page controls and lets the original page controls continue to work.

This conservative behavior is intentional. It avoids showing broken page buttons for HTML files whose pagination is controlled by custom scripts.

## Browser Support

The compatibility test suite covers:

- Desktop Chromium.
- Desktop WebKit / Safari profile.
- Mobile Chrome profile.
- Mobile Safari profile.

Firefox can also be tested separately, but local Firefox headless behavior may depend on the host machine and graphics environment.

## Testing

Run syntax and inline-script checks:

```bash
npm run check
```

Run the main compatibility suite:

```bash
npm run test:compat
```

Run Firefox separately:

```bash
npm run test:compat:firefox
```

## Project Structure

```text
index.html              Main editor entry page
editor.js               Editor runtime
demo.html               Demo HTML file
scripts/serve.js        Local static server
tests/compat.spec.js    Cross-browser compatibility tests
```

## Limitations

- The editor works best with static HTML.
- Complex pages with heavy custom JavaScript may not expose reliable page structure.
- It does not try to rewrite application logic.
- It does not replace a professional design system or layout engine.

## License

No license has been selected yet. Add a license before treating this project as reusable open-source software.
