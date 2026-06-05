# Changelog

## 0.2.0 — 2026-06-05

### New Features

- **Text edit toggle**: merged the old "编辑文字" and "连续文字" buttons into a single "编辑文字 / Edit Text" toggle (`Alt+T`). When active, clicking any text element enters editing directly.
- **i18n (Chinese / English)**: auto-detects browser language. All UI labels, tooltips, toasts, and panel text switch between Chinese and English. Chinese strings serve as translation keys; a flat `EN` map provides English equivalents.
- **Link editing**: when the selected element is inside an `<a>` tag, the style panel shows a "链接 / Link" section where you can edit `href` and `target` attributes directly.
- **Caret placement**: entering text edit mode now places the cursor at the end of the element text, instead of selecting all content.
- **`data-ve-action` attributes**: all toolbar buttons now carry a `data-ve-action` attribute (e.g. `exit`, `copy-html`, `download-html`, `toggle-layout`, `edit-text`, `undo`, `redo`, `prev-page`, `next-page`, `reload`) for easier automated testing and external scripting.

### Bug Fixes

- **"编辑文字" button not working**: `startTextEdit` was passed directly as a click handler, so the `MouseEvent` object was used as the `target` parameter instead of `state.selected`. Wrapped the handler to call `startTextEdit()` without arguments.
- **Style changes interrupting text editing**: `exportHTML()` called `finishTextEdit()` on the live DOM, which meant every style change (via `applyStyle` → `pushHistory` → `exportHTML`) would prematurely end text editing. Moved `finishTextEdit()` to `copyHTML()` and `downloadHTML()` instead; `cleanEditorArtifacts` already handles the clone cleanup.
- **`renderPanel` flicker on rapid selection changes**: added `clearTimeout` debounce so that calling `renderPanel` multiple times within 80ms only renders once.
- **`isEditorScript` false positives on export**: the regex `/(^|\/)editor\.js/` could match user scripts unrelated to this editor. Removed the regex fallback; now only exact URL comparison is used. Scripts injected by the editor already have `data-ve` attributes and are cleaned separately.
- **`restoreContenteditable` parameter shadowing**: renamed the `el` parameter to `node` to avoid shadowing the outer `el()` DOM helper function.
- **`applyAttribute` treating falsy values as empty**: changed `if (value)` to `if (value !== '')` so that valid attribute values like `"0"` are not incorrectly removed.

### UI Changes

- Renamed toolbar button from "下载 HTML" to "保存到本地".
- Updated toast messages: "已下载" → "已保存到本地", "不支持直接下载" → "不支持直接保存".
- Updated reload confirmation: "未复制/下载的修改" → "未复制/保存的修改".
