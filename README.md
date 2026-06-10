# AI HTML Visual Editor

A small browser-based touch-up tool for AI-generated static HTML.

**Positioning:** Help non-programmers turn AI-generated HTML into something usable.

**产品定位：**帮助非程序员把 AI 生成的 HTML 改到能用。

---

## 🚀 最快上手 / Quickest Start

**适合不懂技术的用户。完全不需要装 Node.js、git 或命令行工具。**

1. 在 GitHub 页面点右上角绿色 **Code → Download ZIP**
2. 把下载的 zip **解压**（右键 → 解压到当前文件夹）
3. **双击 `index.html`**，浏览器自动打开
4. 在打开的页面里：
   - 「**上传文件**」选项卡 → 选你自己的 `.html` 文件，或
   - 「**粘贴代码**」选项卡 → 粘贴 HTML 源代码

**仅需**：现代浏览器（Chrome / Edge / Firefox / Safari 任一，包括 Win7 上的 Chrome 109）
**无需**：Node.js、git、命令行、网络（解压后离线也能用）

---

It lets you open an AI-generated HTML page, click elements directly in the rendered page, adjust common styles, edit text, and export a cleaned HTML file. It is not trying to replace Vue, React, Webflow, or a professional IDE. Its job is narrower: help you finish the last 10% of a static HTML page visually.

## What It Does

- Upload an `.html` or `.htm` file.
- Paste HTML code directly into the editor.
- Enter edit mode automatically after an uploaded or demo HTML file is loaded.
- Move the floating toolbar anywhere by dragging its grip handle, so it never blocks the area you are editing.
- Dock the style panel to the left or right edge by dragging its header.
- Select elements visually from the page.
- Use the compact structure position bar to jump to the previous, current, or next nearby editable structure item.
- Edit text on selected elements.
- Adjust typography, spacing, size, color, background, border radius, and shadow.
- Undo and restore recent changes.
- Copy or download a clean HTML file with editor-specific code removed.
- Handle common slide-style or paginated HTML files when the page structure can be detected safely.

## What It Is Good For

This project is useful when an AI has already generated a static page and you need to make quick visual changes before sharing or publishing it:

- Fix the title size, spacing, colors, and button copy in an AI-generated landing page.
- Touch up a report page before sending it to readers.
- Adjust an HTML slide deck after generation.
- Polish a static prototype without opening a frontend project.
- Clean up internal documents exported as HTML.

It is not a full website builder, CMS, frontend framework IDE, or code editor for component projects. The goal is to provide a lightweight visual editing layer for existing static HTML.

## Prompt Template

Use a prompt like this when asking an AI to generate HTML for this editor:

```text
请生成一个完整的单文件 HTML 页面，用内联 CSS 和少量原生 JavaScript 实现，不要使用 Vue、React、构建工具或外部依赖。页面结构请使用语义化标签，例如 header、nav、main、section、footer；每个主要区块保持清晰层级，按钮使用 button 或 a，图片使用 img 并提供 alt。样式尽量写在 style 标签中，避免过度压缩，方便后续用可视化编辑器做文字、颜色、间距、图片和链接的微调。
```

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

## Upload Behavior

Dropping or selecting an HTML file loads it and enters visual editing mode automatically. This is intentional: the tool is designed for quick touch-up work, so opening a file usually means the next action is editing the rendered page.

If you want to inspect or change the source before editing, use the paste tab instead. Pasted HTML waits for the "Start editing" button.

## Floating Toolbar

The editing toolbar is a floating pill, centered at the top of the viewport by default instead of stretching across the whole width.

- Drag the grip handle on its left edge to move it anywhere; it stays inside the viewport.
- The position is remembered for the current tab session.
- Double-click the grip handle to snap it back to the default top-center slot.

The style panel can be docked too: drag its header across the screen to dock it to the left or right edge, and double-click the header to send it back to the default right side. On small screens the panel stays a bottom sheet and docking is disabled.

When edit mode is off, the toolbar and the style panel are fully hidden and no longer intercept clicks meant for the page underneath.

## Structure Position Bar

The style panel does not show a full page outline. After you select an element, the page structure area shows only three nearby items:

- Previous structure item.
- Current selected structure item.
- Next structure item.

The nearby items follow document order and can be clicked to jump through headings, paragraphs, list items, links, buttons, images, and useful leaf text containers such as `div` and `span`. This keeps the panel compact while still making it easier to move around dense AI-generated pages.

## Page Navigation

The editor only shows its own page controls when it can detect a reliable multi-page structure.

Supported cases include:

- Runtime-controlled pages with visible counters such as `1 / 12`.
- Runtime-controlled horizontal decks that use `active`, `current`, or `is-active` page state.
- Explicit slide or page elements.
- Repeated page blocks.
- Scroll-based pages and inner scroll containers.
- Stacked slide decks using active/previous classes.

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

MIT. See [LICENSE](LICENSE).
