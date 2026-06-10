const { test, expect } = require('@playwright/test')
const { createStaticServer } = require('../scripts/serve')
const fs = require('fs')

let server
let baseURL

test.beforeAll(async () => {
  server = createStaticServer()
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  baseURL = `http://127.0.0.1:${address.port}`
})

test.afterAll(async () => {
  if (!server) return
  await new Promise(resolve => server.close(resolve))
})

async function ensureEditMode(page) {
  try {
    await expect(page.locator('.__ve-toolbar.visible')).toBeVisible({ timeout: 10000 })
  } catch (e) {
    await page.locator('.__ve-toggle').click()
    await expect(page.locator('.__ve-toolbar.visible')).toBeVisible()
  }
}

test('loads demo and automatically enters visual editing mode', async ({ page }) => {
  await page.goto(`${baseURL}/index.html`)

  await expect(page.locator('h1')).toContainText('AI HTML 可视化修图工具')
  await expect(page.getByRole('tab', { name: '上传文件' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('#btn-start')).toBeDisabled()
  await expect(page.locator('#status')).toContainText('AI 生成的 HTML')

  await page.locator('#btn-demo').click()
  await expect(page.locator('.__ve-toolbar.visible')).toBeVisible({ timeout: 10000 })
  await expect(page.locator('.__ve-toggle')).toHaveClass(/active/)
  await expect(page.locator('h1')).toContainText('AI HTML 可视化修图工具')

  await expect(page.locator('.__ve-panel.visible')).toHaveCount(0)
  await expect(page.locator('[data-ve-action="toggle-layout"]')).toBeVisible()
  await expect(page.locator('[data-ve-action="copy-html"]')).toContainText(/复制 HTML|Copy HTML/)
  await expect(page.locator('[data-ve-action="download-html"]')).toContainText(/保存 HTML|Save HTML/)
  await expect(page.locator('[data-ve-action="export-png"]')).toHaveCount(0)
  await expect(page.locator('[data-ve-action="export-all-png"]')).toHaveCount(0)

  await page.mouse.click(80, 260)
  await expect(page.locator('.__ve-sel-ov')).toBeVisible()
  await page.locator('[data-ve-action="toggle-layout"]').click()
  await expect(page.locator('.__ve-panel.visible')).toBeVisible()
  await expect(page.locator('.__ve-panel')).toContainText(/文字|Text/)
})

test('next page scrolls vertical pages', async ({ page }) => {
  await page.goto(`${baseURL}/index.html`)
  await page.getByRole('tab', { name: '粘贴代码' }).click()
  await page.locator('#html-input').fill(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; font-family: sans-serif; }
    section { min-height: 100vh; padding: 80px; font-size: 40px; border-bottom: 1px solid #ddd; }
  </style>
</head>
<body>
  <section>第一页</section>
  <section>第二页</section>
  <section>第三页</section>
</body>
</html>`)

  await page.locator('#btn-start').click()
  await ensureEditMode(page)
  await expect(page.locator('.__ve-page-label')).toContainText('/')

  const before = await page.evaluate(() => window.pageYOffset)
  const box = await page.locator('[data-ve-action="next-page"]').boundingBox()
  expect(box).not.toBeNull()
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await page.waitForTimeout(700)
  const after = await page.evaluate(() => window.pageYOffset)

  expect(after).toBeGreaterThan(before)
})

test('hides pager when no reliable multi-page structure exists', async ({ page }) => {
  await page.goto(`${baseURL}/index.html`)
  await page.getByRole('tab', { name: '粘贴代码' }).click()
  await page.locator('#html-input').fill(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>body { margin: 0; font-family: sans-serif; padding: 80px; }</style>
</head>
<body>
  <h1>单页内容</h1>
  <p>没有明确的多页结构。</p>
</body>
</html>`)

  await page.locator('#btn-start').click()
  await expect(page.locator('.__ve-pager')).toHaveClass(/hidden/)
})

test('supports continuous text edits across different elements', async ({ page }) => {
  await page.goto(`${baseURL}/index.html`)
  await page.locator('[data-tab="paste"]').click()
  await page.locator('#html-input').fill(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>body { margin: 0; padding: 120px; font-family: sans-serif; font-size: 28px; }</style>
</head>
<body>
  <p id="first">First editable line</p>
  <p id="second">Second editable line</p>
</body>
</html>`)

  await page.locator('#btn-start').click()
  await expect(page.locator('.__ve-toolbar')).toHaveCount(1)
  await ensureEditMode(page)
  await expect(page.locator('.__ve-toggle')).toHaveClass(/active/)
  await page.locator('[data-ve-action="edit-text"]').evaluate(button => button.click())
  await expect(page.locator('[data-ve-action="edit-text"]')).toHaveClass(/active/)

  await page.locator('#first').click()
  await expect(page.locator('#first')).toHaveAttribute('contenteditable', 'true')
  await page.keyboard.press('Control+A')
  await page.keyboard.type('First changed')

  await page.locator('#second').click()
  await expect(page.locator('#second')).toHaveAttribute('contenteditable', 'true')
  await page.keyboard.press('Control+A')
  await page.keyboard.type('Second changed')

  await expect(page.locator('#first')).toContainText('First changed')
  await expect(page.locator('#second')).toContainText('Second changed')
})

test('double-clicking text opens layout and text editing together', async ({ page }) => {
  await page.goto(`${baseURL}/index.html`)
  await page.locator('[data-tab="paste"]').click()
  await page.locator('#html-input').fill(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>body { margin: 0; padding: 140px; font-family: sans-serif; } h1 { font-size: 56px; }</style>
</head>
<body>
  <h1>Double <span>click title</span></h1>
</body>
</html>`)

  await page.locator('#btn-start').click()
  await ensureEditMode(page)
  await expect(page.locator('[data-ve-action="toggle-layout"]')).not.toHaveClass(/active/)
  await expect(page.locator('[data-ve-action="edit-text"]')).not.toHaveClass(/active/)

  await page.locator('h1').dblclick({ position: { x: 20, y: 20 } })
  await expect(page.locator('.__ve-panel.visible')).toBeVisible()
  await expect(page.locator('[data-ve-action="toggle-layout"]')).toHaveClass(/active/)
  await expect(page.locator('[data-ve-action="edit-text"]')).toHaveClass(/active/)
  await expect(page.locator('h1')).toHaveAttribute('contenteditable', 'true')

  await page.keyboard.press('Control+A')
  await page.keyboard.type('Double click changed')
  await expect(page.locator('h1')).toContainText('Double click changed')
})

test('edits anchor href from the style panel', async ({ page }) => {
  await page.goto(`${baseURL}/index.html`)
  await page.locator('[data-tab="paste"]').click()
  await page.locator('#html-input').fill(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>body { margin: 0; padding: 120px; font-family: sans-serif; font-size: 28px; }</style>
</head>
<body>
  <a id="cta" href="#old">Open details</a>
</body>
</html>`)

  await page.locator('#btn-start').click()
  await ensureEditMode(page)
  await page.locator('#cta').click()
  await page.locator('[data-ve-action="toggle-layout"]').click({ force: true })
  await expect(page.locator('.__ve-panel.visible')).toBeVisible()
  await expect(page.locator('.__ve-panel')).toContainText(/链接|Link/)

  const hrefInput = page.locator('.__ve-panel input').first()
  await expect(hrefInput).toHaveValue('#old')
  await hrefInput.fill('https://example.com/new')
  await hrefInput.blur()

  await expect(page.locator('#cta')).toHaveAttribute('href', 'https://example.com/new')
})

test('downloads a clean html export', async ({ page }) => {
  await page.goto(`${baseURL}/index.html`)
  await page.getByRole('tab', { name: '粘贴代码' }).click()
  await page.locator('#html-input').fill(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>body { margin: 0; padding-top: 160px; font-family: sans-serif; } h1 { font-size: 42px; }</style>
</head>
<body>
  <main>
    <h1>Download regression</h1>
    <p contenteditable="">Native editable text</p>
  </main>
</body>
</html>`)

  await page.locator('#btn-start').click()
  await expect(page.locator('.__ve-toolbar')).toHaveCount(1)
  await ensureEditMode(page)
  await expect(page.locator('.__ve-toggle')).toHaveClass(/active/)
  await page.locator('h1').click({ position: { x: 8, y: 8 } })
  await page.locator('[data-ve-action="edit-text"]').evaluate(button => button.click())
  await page.locator('h1').click({ position: { x: 8, y: 8 } })

  const downloadPromise = page.waitForEvent('download')
  await page.locator('[data-ve-action="download-html"]').click()
  const download = await downloadPromise
  expect(await download.failure()).toBeNull()

  const downloadPath = await download.path()
  const html = fs.readFileSync(downloadPath, 'utf8')
  expect(html).toContain('Download regression')
  expect(html).not.toContain('__ve-root')
  expect(html).not.toContain('data-ve')
  expect(html).not.toContain('editor.js')
  expect(html).not.toContain('contenteditable="true"')

  const attrs = await page.evaluate(exported => {
    const doc = new DOMParser().parseFromString(exported, 'text/html')
    return {
      headingEditable: doc.querySelector('h1').hasAttribute('contenteditable'),
      nativeEditable: doc.querySelector('p').hasAttribute('contenteditable')
    }
  }, html)
  expect(attrs.headingEditable).toBe(false)
  expect(attrs.nativeEditable).toBe(true)
})

test('strips old editor artifacts before rendering pasted html', async ({ page }) => {
  await page.goto(`${baseURL}/index.html`)
  await page.getByRole('tab', { name: '粘贴代码' }).click()
  await page.locator('#html-input').fill(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style data-ve="1">body { display: none !important; }</style>
  <style>
    body { margin: 0; font-family: sans-serif; }
    .layout-probe { display: grid; grid-template-columns: 120px 1fr; gap: 24px; padding: 40px; }
  </style>
</head>
<body>
  <div id="__ve-root"></div>
  <main class="layout-probe">
    <h1 data-ve-editing="1" data-ve-prev-contenteditable="__ve_absent" contenteditable="true">Layout regression</h1>
    <p contenteditable="">Native editable text</p>
  </main>
  <script src="editor.js" data-ve="1"></script>
</body>
</html>`)

  await page.locator('#btn-start').click()
  await expect(page.locator('h1')).toContainText('Layout regression')

  const result = await page.evaluate(() => ({
    bodyDisplay: getComputedStyle(document.body).display,
    gridDisplay: getComputedStyle(document.querySelector('.layout-probe')).display,
    headingEditable: document.querySelector('h1').hasAttribute('contenteditable'),
    nativeEditable: document.querySelector('p').hasAttribute('contenteditable')
  }))
  expect(result.bodyDisplay).not.toBe('none')
  expect(result.gridDisplay).toBe('grid')
  expect(result.headingEditable).toBe(false)
  expect(result.nativeEditable).toBe(true)
})

test('edits common content attributes from the panel', async ({ page }) => {
  await page.goto(`${baseURL}/index.html`)
  await page.getByRole('tab', { name: '粘贴代码' }).click()
  await page.locator('#html-input').fill(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 160px 40px 40px; font-family: sans-serif; }
    a, button { display: inline-block; margin: 12px; padding: 12px 18px; font-size: 18px; }
    img { display: block; width: 120px; height: 80px; margin: 24px 12px; object-fit: cover; background: #ddd; }
  </style>
</head>
<body>
  <h1>Big <span>Title</span></h1>
  <a href="https://old.example">Old link</a>
  <button type="button">Old button</button>
  <p>Old paragraph</p>
  <img src="old.png" alt="Old alt">
</body>
</html>`)

  await page.locator('#btn-start').click()
  await ensureEditMode(page)
  await page.locator('a').click()
  await page.locator('[data-ve-action="toggle-layout"]').click()

  await page.locator('h1').click({ position: { x: 8, y: 8 } })
  const richTextBox = page.locator('.__ve-content-box').filter({ hasText: /直接编辑文字|Edit Text Directly/ })
  await expect(richTextBox).toBeVisible()
  await page.locator('h1').click({ position: { x: 16, y: 12 } })
  await expect(page.locator('h1')).toHaveAttribute('contenteditable', 'true')
  await expect(page.locator('.__ve-panel.visible')).toBeVisible()
  await page.keyboard.press('Escape')

  await page.locator('a').click()
  const linkPanel = page.locator('.__ve-panel').filter({ hasText: /链接|Link/ })
  await expect(linkPanel).toBeVisible()
  const linkGroup = page.locator('.__ve-group').filter({ hasText: /跳转地址|URL/ })
  const hrefInput = linkGroup.locator('input').first()
  await expect(hrefInput).toBeVisible()
  await hrefInput.fill('https://new.example')
  await hrefInput.blur()
  await linkGroup.locator('select').first().selectOption('_blank')
  await expect(page.locator('a')).toHaveAttribute('href', 'https://new.example')
  await expect(page.locator('a')).toHaveAttribute('target', '_blank')

  await page.getByRole('button', { name: 'Old button', exact: true }).click()
  const buttonBox = page.locator('.__ve-content-box').filter({ hasText: /button/ })
  await expect(buttonBox).toBeVisible()
  await buttonBox.locator('input').fill('New button')
  await buttonBox.locator('input').blur()
  await expect(page.getByRole('button', { name: 'New button', exact: true })).toBeVisible()

  await page.locator('p').click()
  const textBox = page.locator('.__ve-content-box').filter({ hasText: /文字内容|Text Content/ })
  await expect(textBox).toBeVisible()
  await textBox.locator('input').fill('New paragraph')
  await textBox.locator('input').blur()
  await expect(page.getByText('New paragraph')).toBeVisible()

  await page.locator('.__ve-tree-item').filter({ hasText: 'img' }).click()
  const imageBox = page.locator('.__ve-content-box').filter({ hasText: /img/ })
  await expect(imageBox).toBeVisible()
  await imageBox.locator('input').nth(0).fill('new.png')
  await imageBox.locator('input').nth(0).blur()
  await imageBox.locator('input').nth(1).fill('New alt')
  await imageBox.locator('input').nth(1).blur()
  await expect(page.locator('img')).toHaveAttribute('src', /new\.png$/)
  await expect(page.locator('img')).toHaveAttribute('alt', 'New alt')
})

test('selects nearby items from the compact structure bar', async ({ page }) => {
  await page.goto(`${baseURL}/index.html`)
  await page.getByRole('tab', { name: '粘贴代码' }).click()
  await page.locator('#html-input').fill(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 120px 40px 40px; font-family: sans-serif; }
    header, section, footer { padding: 24px; margin-bottom: 18px; border: 1px solid #ddd; }
    img { width: 120px; height: 80px; background: #ddd; display: block; }
  </style>
</head>
<body>
  <header><nav><a href="#intro">Intro link</a></nav><span class="eyebrow">Header note</span></header>
  <main>
    <section id="intro"><h1>Intro section</h1><p>Intro paragraph</p><ul><li>List detail</li></ul><div class="metric">42 projects</div><button type="button">Primary action</button><img src="hero.png" alt="Hero image"></section>
  </main>
  <footer>Footer text</footer>
</body>
</html>`)

  await page.locator('#btn-start').click()
  await ensureEditMode(page)
  await page.locator('[data-ve-action="toggle-layout"]').click()
  await expect(page.locator('.__ve-tree-box')).toContainText(/点击页面元素后显示结构位置|Click an element/)

  await page.locator('h1').click()
  await expect(page.locator('.__ve-tree-item')).toHaveCount(3)
  await expect(page.locator('.__ve-tree-box')).toContainText('section#intro')
  await expect(page.locator('.__ve-tree-box')).toContainText('h1')
  await expect(page.locator('.__ve-tree-box')).toContainText('Intro paragraph')
  await expect(page.locator('.__ve-tree-box')).not.toContainText('List detail')

  await page.locator('.__ve-tree-item').filter({ hasText: 'section#intro' }).click()
  await expect(page.locator('.__ve-panel-title .__ve-panel-subtitle')).toHaveText('section')
  await expect(page.locator('.__ve-sel-ov')).toBeVisible()
})

test('next page scrolls an inner page container', async ({ page }) => {
  await page.goto(`${baseURL}/index.html`)
  await page.getByRole('tab', { name: '粘贴代码' }).click()
  await page.locator('#html-input').fill(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    html, body { margin: 0; height: 100%; overflow: hidden; font-family: sans-serif; }
    .deck { height: 100vh; overflow: auto; background: #f7f4ee; }
    .page { min-height: 100vh; padding: 80px; font-size: 40px; border-bottom: 1px solid #ddd; }
  </style>
</head>
<body>
  <main class="deck">
    <section class="page">第一页</section>
    <section class="page">第二页</section>
    <section class="page">第三页</section>
  </main>
</body>
</html>`)

  await page.locator('#btn-start').click()
  await ensureEditMode(page)
  await expect(page.locator('.__ve-page-label')).toContainText('/')

  const before = await page.locator('.deck').evaluate(el => el.scrollTop)
  const box = await page.locator('[data-ve-action="next-page"]').boundingBox()
  expect(box).not.toBeNull()
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await page.waitForTimeout(700)
  const after = await page.locator('.deck').evaluate(el => el.scrollTop)

  expect(after).toBeGreaterThan(before)
})

test('uses explicit slide count instead of viewport-estimated pages', async ({ page }) => {
  await page.goto(`${baseURL}/index.html`)
  const slides = Array.from({ length: 16 }, (_, index) => `<section class="ppt-slide">第 ${index + 1} 页</section>`).join('')
  await page.getByRole('tab', { name: '粘贴代码' }).click()
  await page.locator('#html-input').fill(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    html, body { margin: 0; height: 100%; overflow: hidden; font-family: sans-serif; }
    .deck { height: 100vh; overflow: auto; background: #f7f4ee; }
    .ppt-slide { width: 960px; min-height: 540px; margin: 48px auto; padding: 60px; font-size: 40px; background: white; border: 1px solid #ddd; }
  </style>
</head>
<body>
  <main class="deck">${slides}</main>
</body>
</html>`)

  await page.locator('#btn-start').click()
  await expect(page.locator('.__ve-page-label')).toContainText('1/16')
})

test('uses runtime paging for horizontal active slide decks', async ({ page }) => {
  await page.goto(`${baseURL}/index.html`)
  await page.getByRole('tab', { name: '粘贴代码' }).click()
  await page.locator('#html-input').fill(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    html, body { margin: 0; height: 100%; overflow: hidden; font-family: sans-serif; }
    .deck { display: flex; height: 100vh; transition: transform .5s ease; }
    .slide { flex: 0 0 100vw; width: 100vw; height: 100vh; display: grid; place-items: center; }
    .slide > * { opacity: 0; transform: translateY(14px); transition: opacity .5s ease, transform .5s ease; }
    .slide.active > * { opacity: 1; transform: none; }
    #pageno { position: fixed; right: 24px; bottom: 24px; }
  </style>
</head>
<body>
  <main class="deck" id="deck">
    <section class="slide active"><h1>第一页</h1></section>
    <section class="slide"><h1>第二页</h1></section>
    <section class="slide"><h1>第三页</h1></section>
  </main>
  <span id="pageno">№ 01 / 03</span>
  <script>
    const deck = document.getElementById('deck')
    const slides = Array.from(document.querySelectorAll('.slide'))
    const pageno = document.getElementById('pageno')
    let idx = 0
    function pad(n) { return String(n).padStart(2, '0') }
    function go(n) {
      idx = Math.max(0, Math.min(slides.length - 1, n))
      deck.style.transform = 'translateX(-' + (idx * 100) + 'vw)'
      slides.forEach((slide, i) => slide.classList.toggle('active', i === idx))
      pageno.textContent = '№ ' + pad(idx + 1) + ' / ' + pad(slides.length)
    }
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(idx + 1) }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx - 1) }
    })
    go(0)
  </script>
</body>
</html>`)

  await page.locator('#btn-start').click()
  await ensureEditMode(page)
  await expect(page.locator('.__ve-page-label')).toContainText('1/3')

  const box = await page.locator('[data-ve-action="next-page"]').boundingBox()
  expect(box).not.toBeNull()
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await page.waitForTimeout(900)

  await expect(page.locator('.__ve-page-label')).toContainText('2/3')
  await expect(page.locator('#pageno')).toContainText('02 / 03')
  await expect(page.locator('.slide').nth(1)).toHaveClass(/active/)
  await expect(page.locator('.slide').nth(1).locator('h1')).toContainText('第二页')
})

test('uses runtime paging for active horizontal decks without counters', async ({ page }) => {
  await page.goto(`${baseURL}/index.html`)
  await page.getByRole('tab', { name: '粘贴代码' }).click()
  await page.locator('#html-input').fill(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    html, body { margin: 0; height: 100%; overflow: hidden; font-family: sans-serif; }
    .track { display: flex; width: 300vw; height: 100vh; transition: transform .4s ease; }
    .panel-slide { flex: 0 0 100vw; height: 100vh; display: grid; place-items: center; }
    .panel-slide h1 { opacity: 0; transition: opacity .25s ease; }
    .panel-slide.current h1 { opacity: 1; }
  </style>
</head>
<body>
  <main class="track" id="track">
    <section class="panel-slide current"><h1>第一页</h1></section>
    <section class="panel-slide"><h1>第二页</h1></section>
    <section class="panel-slide"><h1>第三页</h1></section>
  </main>
  <script>
    const track = document.getElementById('track')
    const slides = Array.from(document.querySelectorAll('.panel-slide'))
    let idx = 0
    function go(n) {
      idx = Math.max(0, Math.min(slides.length - 1, n))
      track.style.transform = 'translateX(-' + (idx * 100) + 'vw)'
      slides.forEach((slide, i) => slide.classList.toggle('current', i === idx))
    }
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(idx + 1) }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx - 1) }
    })
    go(0)
  </script>
</body>
</html>`)

  await page.locator('#btn-start').click()
  await ensureEditMode(page)
  await expect(page.locator('.__ve-page-label')).toContainText('1/3')

  const box = await page.locator('[data-ve-action="next-page"]').boundingBox()
  expect(box).not.toBeNull()
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await page.waitForTimeout(800)

  await expect(page.locator('.__ve-page-label')).toContainText('2/3')
  await expect(page.locator('.panel-slide').nth(1)).toHaveClass(/current/)
  await expect(page.locator('.panel-slide').nth(1).locator('h1')).toContainText('第二页')
})

test('infers anonymous repeated page blocks', async ({ page }) => {
  await page.goto(`${baseURL}/index.html`)
  const blocks = Array.from({ length: 16 }, (_, index) => `<div><h1>第 ${index + 1} 页</h1></div>`).join('')
  await page.getByRole('tab', { name: '粘贴代码' }).click()
  await page.locator('#html-input').fill(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    html, body { margin: 0; height: 100%; overflow: hidden; font-family: sans-serif; }
    main { height: 100vh; overflow: auto; background: #eeeae2; padding: 36px 0; }
    main > div { width: 720px; min-height: 405px; margin: 0 auto 28px; padding: 56px; background: white; border: 1px solid #ddd; box-shadow: 0 4px 18px rgba(0,0,0,.06); }
  </style>
</head>
<body>
  <main>${blocks}</main>
</body>
</html>`)

  await page.locator('#btn-start').click()
  await expect(page.locator('.__ve-page-label')).toContainText('1/16')
})

test('supports stacked slide decks with data indexes', async ({ page }) => {
  await page.goto(`${baseURL}/index.html`)
  const slides = Array.from({ length: 16 }, (_, index) => `<div class="slide${index === 0 ? ' active' : ''}" data-i="${index}"><h1>第 ${index + 1} 页</h1></div>`).join('')
  await page.getByRole('tab', { name: '粘贴代码' }).click()
  await page.locator('#html-input').fill(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    html, body { margin: 0; padding: 0; overflow: hidden; font-family: sans-serif; }
    .deck { position: fixed; inset: 0; }
    .slide { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0; transform: translateX(60px); pointer-events: none; }
    .slide.active { opacity: 1; transform: translateX(0); pointer-events: all; }
    .slide.prev { opacity: 0; transform: translateX(-60px); }
  </style>
</head>
<body>
  <main class="deck">${slides}</main>
  <script>
    const slides = document.querySelectorAll('.slide')
    let cur = 0
    function goTo(n) {
      if (n < 0 || n >= slides.length) return
      slides.forEach((slide, i) => {
        slide.className = 'slide' + (i === n ? ' active' : (i < n ? ' prev' : ''))
      })
      cur = n
    }
  </script>
</body>
</html>`)

  await page.locator('#btn-start').click()
  await expect(page.locator('.__ve-page-label')).toContainText('1/16')

  const box = await page.locator('[data-ve-action="next-page"]').boundingBox()
  expect(box).not.toBeNull()
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await page.waitForTimeout(300)

  await expect(page.locator('.__ve-page-label')).toContainText('2/16')
  await expect(page.locator('.slide.active h1')).toContainText('第 2 页')
})

test('reads runtime generated page counters', async ({ page }) => {
  await page.goto(`${baseURL}/index.html`)
  await page.getByRole('tab', { name: '粘贴代码' }).click()
  await page.locator('#html-input').fill(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    html, body { margin: 0; height: 100%; overflow: hidden; font-family: sans-serif; }
    .slide-viewport { width: 100vw; height: 100vh; display: grid; place-items: center; background: #111; color: white; }
    .slide-inner { font-size: 42px; }
    .counter { position: fixed; right: 24px; bottom: 24px; color: #999; }
  </style>
</head>
<body>
  <script>
    const S = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, html: '<h1>第 ' + (i + 1) + ' 页</h1>' }))
    let cur = 0
    const viewport = document.createElement('div')
    viewport.className = 'slide-viewport'
    const inner = document.createElement('div')
    inner.className = 'slide-inner'
    const pageNum = document.createElement('div')
    pageNum.className = 'counter'
    viewport.appendChild(inner)
    viewport.appendChild(pageNum)
    document.body.appendChild(viewport)
    function render() {
      inner.innerHTML = S[cur].html
      pageNum.textContent = S[cur].id + ' / ' + S.length
    }
    function go(dir) {
      cur = Math.max(0, Math.min(S.length - 1, cur + dir))
      setTimeout(render, 400)
    }
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    })
    render()
  </script>
</body>
</html>`)

  await page.locator('#btn-start').click()
  await ensureEditMode(page)
  await expect(page.locator('.__ve-page-label')).toContainText('1/12')
  await expect(page.locator('#__ve-root')).toHaveCount(1)

  const box = await page.locator('[data-ve-action="next-page"]').boundingBox()
  expect(box).not.toBeNull()
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await page.waitForTimeout(800)

  await expect(page.locator('.__ve-page-label')).toContainText('2/12')
  await expect(page.locator('.slide-inner h1')).toContainText('第 2 页')
})

test('image replace and crop controls appear and work', async ({ page }) => {
  await page.goto(`${baseURL}/index.html`)
  await page.getByRole('tab', { name: '粘贴代码' }).click()
  await page.locator('#html-input').fill(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 80px 40px; font-family: sans-serif; }
    img { display: block; width: 200px; height: 150px; background: #ddd; }
  </style>
</head>
<body>
  <h1>Image Test</h1>
  <img src="placeholder.png" alt="Test image">
</body>
</html>`)

  await page.locator('#btn-start').click()
  await ensureEditMode(page)

  // Select the image via structure tree or direct click
  await page.locator('img').click()
  await page.locator('[data-ve-action="toggle-layout"]').click()

  // Select the image element
  const imgEl = page.locator('img')
  await imgEl.click()
  const imageBox = page.locator('.__ve-content-box').filter({ hasText: /img/ })
  await expect(imageBox).toBeVisible()

  // Verify replace button is present
  const replaceBtn = imageBox.locator('button').filter({ hasText: /替换图片|Replace Image/ })
  await expect(replaceBtn).toBeVisible()

  // Verify object-fit selector is present and defaults to fill (CSS default for img)
  const fitSelect = imageBox.locator('select').first()
  await expect(fitSelect).toBeVisible()

  // Change object-fit to cover
  await fitSelect.selectOption('cover')
  await expect(imgEl).toHaveCSS('object-fit', 'cover')

  // Change object-fit to contain
  await fitSelect.selectOption('contain')
  await expect(imgEl).toHaveCSS('object-fit', 'contain')

  // Verify object-position grid is present (9 cells)
  const posGrid = imageBox.locator('.__ve-pos-grid')
  await expect(posGrid).toBeVisible()
  const cells = posGrid.locator('.__ve-pos-cell')
  await expect(cells).toHaveCount(9)

  // Click top-left position cell (first cell)
  await cells.nth(0).click()
  await expect(imgEl).toHaveCSS('object-position', '0% 0%')
  await expect(cells.nth(0)).toHaveClass(/active/)

  // Click bottom-right position cell (last cell)
  await cells.nth(8).click()
  await expect(imgEl).toHaveCSS('object-position', '100% 100%')
  await expect(cells.nth(8)).toHaveClass(/active/)
  // Previous cell should no longer be active
  await expect(cells.nth(0)).not.toHaveClass(/active/)

  // Click center cell (5th, index 4)
  await cells.nth(4).click()
  await expect(imgEl).toHaveCSS('object-position', '50% 50%')

  // Verify replace image via file input (simulate via page.evaluate)
  const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
  await page.evaluate((src) => {
    const img = document.querySelector('img')
    img.setAttribute('src', src)
  }, tinyPng)
  await expect(imgEl).toHaveAttribute('src', tinyPng)
})

test('drag-to-reorder moves an element to a new position', async ({ page }) => {
  await page.goto(`${baseURL}/index.html`)
  await page.getByRole('tab', { name: '粘贴代码' }).click()
  await page.locator('#html-input').fill(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 100px 40px; font-family: sans-serif; }
    .item { padding: 24px; margin: 12px 0; background: #f0f0f0; border-radius: 8px; font-size: 18px; }
    #a { background: #fee; }
    #b { background: #efe; }
    #c { background: #eef; }
  </style>
</head>
<body>
  <div class="container">
    <div class="item" id="a">Item A</div>
    <div class="item" id="b">Item B</div>
    <div class="item" id="c">Item C</div>
  </div>
</body>
</html>`)

  await page.locator('#btn-start').click()
  await ensureEditMode(page)

  // Enter drag mode (required to enable dragging)
  await page.locator('[data-ve-action="drag-move"]').click()
  await expect(page.locator('[data-ve-action="drag-move"]')).toHaveClass(/active/)

  // Verify initial order: A, B, C
  const initialOrder = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.item')).map(el => el.id).join(',')
  })
  expect(initialOrder).toBe('a,b,c')

  // Drag Item A down past Item B (to become A→B order swap: B, A, C)
  const itemA = await page.locator('#a').boundingBox()
  const itemB = await page.locator('#b').boundingBox()
  // Drag from middle of A to middle of B + a bit below midpoint => insert after B
  const startX = itemA.x + itemA.width / 2
  const startY = itemA.y + itemA.height / 2
  // Target: lower half of B so it inserts after B
  const endX = itemB.x + itemB.width / 2
  const endY = itemB.y + itemB.height * 0.75

  await page.mouse.move(startX, startY)
  await page.mouse.down()
  // Move past threshold to trigger drag mode
  await page.mouse.move(startX + 10, startY + 10, { steps: 3 })
  // Verify drop indicator becomes visible during drag
  await page.mouse.move(endX, endY, { steps: 5 })
  await expect(page.locator('.__ve-drop-ind')).toBeVisible()
  await page.mouse.up()

  // Verify new order: B, A, C
  const newOrder = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.item')).map(el => el.id).join(',')
  })
  expect(newOrder).toBe('b,a,c')

  // Verify drop indicator is hidden after drop
  await expect(page.locator('.__ve-drop-ind')).toBeHidden()

  // Verify undo restores original order
  await page.keyboard.press('Alt+z')
  const undoneOrder = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.item')).map(el => el.id).join(',')
  })
  expect(undoneOrder).toBe('a,b,c')
})

test('drag-to-reorder cancels with Escape and does not move', async ({ page }) => {
  await page.goto(`${baseURL}/index.html`)
  await page.getByRole('tab', { name: '粘贴代码' }).click()
  await page.locator('#html-input').fill(`<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; padding: 100px 40px; font-family: sans-serif; }
    .item { padding: 24px; margin: 12px 0; background: #f0f0f0; }
  </style>
</head>
<body>
  <div class="item" id="x">X</div>
  <div class="item" id="y">Y</div>
</body>
</html>`)

  await page.locator('#btn-start').click()
  await ensureEditMode(page)

  // Enter drag mode
  await page.locator('[data-ve-action="drag-move"]').click()

  const itemX = await page.locator('#x').boundingBox()
  const itemY = await page.locator('#y').boundingBox()

  await page.mouse.move(itemX.x + itemX.width / 2, itemX.y + itemX.height / 2)
  await page.mouse.down()
  await page.mouse.move(itemY.x + itemY.width / 2, itemY.y + itemY.height * 0.8, { steps: 5 })
  // Cancel with Esc
  await page.keyboard.press('Escape')
  await page.mouse.up()

  // Order should be unchanged
  const order = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.item')).map(el => el.id).join(',')
  })
  expect(order).toBe('x,y')
  await expect(page.locator('.__ve-drop-ind')).toBeHidden()
})

test('drag mode is mutually exclusive with text edit mode', async ({ page }) => {
  await page.goto(`${baseURL}/index.html`)
  await page.getByRole('tab', { name: '粘贴代码' }).click()
  await page.locator('#html-input').fill(`<!DOCTYPE html>
<html>
<head><style>body { padding: 100px; font-family: sans-serif; }</style></head>
<body><p>Hello</p></body>
</html>`)

  await page.locator('#btn-start').click()
  await ensureEditMode(page)

  const textBtn = page.locator('[data-ve-action="edit-text"]')
  const dragBtn = page.locator('[data-ve-action="drag-move"]')

  // Turn on text edit
  await textBtn.click()
  await expect(textBtn).toHaveClass(/active/)
  await expect(dragBtn).not.toHaveClass(/active/)

  // Turn on drag mode → should turn off text edit automatically
  await dragBtn.click()
  await expect(dragBtn).toHaveClass(/active/)
  await expect(textBtn).not.toHaveClass(/active/)

  // Turn on text edit again → should turn off drag mode
  await textBtn.click()
  await expect(textBtn).toHaveClass(/active/)
  await expect(dragBtn).not.toHaveClass(/active/)
})

test('elements do not drag when drag mode is off', async ({ page }) => {
  await page.goto(`${baseURL}/index.html`)
  await page.getByRole('tab', { name: '粘贴代码' }).click()
  await page.locator('#html-input').fill(`<!DOCTYPE html>
<html>
<head><style>
  body { margin: 0; padding: 100px 40px; font-family: sans-serif; }
  .item { padding: 24px; margin: 12px 0; background: #f0f0f0; }
</style></head>
<body>
  <div class="item" id="p">P</div>
  <div class="item" id="q">Q</div>
</body>
</html>`)

  await page.locator('#btn-start').click()
  await ensureEditMode(page)
  // Drag mode is OFF by default

  const itemP = await page.locator('#p').boundingBox()
  const itemQ = await page.locator('#q').boundingBox()

  // Try to drag P past Q
  await page.mouse.move(itemP.x + itemP.width / 2, itemP.y + itemP.height / 2)
  await page.mouse.down()
  await page.mouse.move(itemQ.x + itemQ.width / 2, itemQ.y + itemQ.height * 0.8, { steps: 5 })
  await page.mouse.up()

  // Order should NOT change because drag mode is off
  const order = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.item')).map(el => el.id).join(',')
  })
  expect(order).toBe('p,q')
})

test('toolbar is a floating pill that can be dragged and reset', async ({ page }) => {
  await page.goto(`${baseURL}/index.html`)
  await page.getByRole('tab', { name: '粘贴代码' }).click()
  await page.locator('#html-input').fill(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>body { margin: 0; padding: 120px 40px; font-family: sans-serif; }</style>
</head>
<body>
  <h1>Toolbar drag test</h1>
  <p>Content paragraph</p>
</body>
</html>`)

  await page.locator('#btn-start').click()
  await ensureEditMode(page)

  const toolbar = page.locator('.__ve-toolbar')
  const handle = page.locator('.__ve-tb-handle')
  await expect(handle).toBeVisible()
  const before = await toolbar.boundingBox()

  // Drag straight down by the grip handle
  const hb = await handle.boundingBox()
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2)
  await page.mouse.down()
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2 + 150, { steps: 6 })
  await page.mouse.up()

  const after = await toolbar.boundingBox()
  expect(after.y - before.y).toBeGreaterThan(100)

  // The dragged position is remembered for the session
  const saved = await page.evaluate(() => sessionStorage.getItem('__ve-toolbar-pos'))
  expect(saved).not.toBeNull()

  // Dragging the handle must not select page elements
  await expect(page.locator('.__ve-sel-ov')).toBeHidden()

  // Dragging towards the corner keeps the toolbar inside the viewport
  const vp = page.viewportSize()
  const hb2 = await handle.boundingBox()
  await page.mouse.move(hb2.x + hb2.width / 2, hb2.y + hb2.height / 2)
  await page.mouse.down()
  await page.mouse.move(vp.width - 1, vp.height - 1, { steps: 6 })
  await page.mouse.up()
  const clamped = await toolbar.boundingBox()
  expect(clamped.x + clamped.width).toBeLessThanOrEqual(vp.width)
  expect(clamped.y + clamped.height).toBeLessThanOrEqual(vp.height)

  // Double-clicking the handle resets to the default top slot
  await page.locator('.__ve-tb-handle').dblclick()
  const reset = await toolbar.boundingBox()
  expect(Math.round(reset.y)).toBe(12)
  expect(await page.evaluate(() => sessionStorage.getItem('__ve-toolbar-pos'))).toBeNull()
})

test('style panel docks left and right by dragging its header', async ({ page }) => {
  await page.goto(`${baseURL}/index.html`)
  await page.getByRole('tab', { name: '粘贴代码' }).click()
  await page.locator('#html-input').fill(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>body { margin: 0; padding: 120px 40px; font-family: sans-serif; }</style>
</head>
<body>
  <h1>Panel dock test</h1>
  <p>Content paragraph</p>
</body>
</html>`)

  await page.locator('#btn-start').click()
  await ensureEditMode(page)
  await page.locator('[data-ve-action="toggle-layout"]').click()
  await expect(page.locator('.__ve-panel.visible')).toBeVisible()

  const vp = page.viewportSize()
  const header = page.locator('.__ve-panel-title')
  const hb = await header.boundingBox()
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2)
  await page.mouse.down()
  await page.mouse.move(60, hb.y + hb.height / 2, { steps: 8 })
  await page.mouse.up()

  if (vp.width > 720) {
    // Desktop: dragging past the middle docks the panel to the left
    await expect(page.locator('.__ve-panel')).toHaveClass(/dock-left/)
    const docked = await page.locator('.__ve-panel').boundingBox()
    expect(docked.x).toBeLessThan(vp.width / 2)

    // Double-clicking the header resets to the right dock
    await page.locator('.__ve-panel-title').dblclick()
    await expect(page.locator('.__ve-panel')).not.toHaveClass(/dock-left/)
    const reset = await page.locator('.__ve-panel').boundingBox()
    expect(reset.x).toBeGreaterThan(vp.width / 2)
  } else {
    // Small screens keep the bottom-sheet layout; docking is disabled
    await expect(page.locator('.__ve-panel')).not.toHaveClass(/dock-left/)
  }
})

test('hidden editor chrome does not block page clicks outside edit mode', async ({ page }) => {
  await page.goto(`${baseURL}/index.html`)
  await page.getByRole('tab', { name: '粘贴代码' }).click()
  await page.locator('#html-input').fill(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; font-family: sans-serif; }
    #top-bar { position: fixed; top: 0; left: 0; right: 0; height: 60px; }
    #right-rail { position: fixed; top: 25%; right: 0; width: 200px; height: 120px; }
  </style>
</head>
<body>
  <button id="top-bar" onclick="window.__topClicks=(window.__topClicks||0)+1">Top bar</button>
  <button id="right-rail" onclick="window.__railClicks=(window.__railClicks||0)+1">Right rail</button>
  <p style="padding-top:100px">Body content</p>
</body>
</html>`)

  await page.locator('#btn-start').click()
  await ensureEditMode(page)

  // Leave edit mode: the editor chrome must fully release the page
  await page.locator('.__ve-tb-btn.exit').click()
  await expect(page.locator('.__ve-toolbar')).toBeHidden()
  await expect(page.locator('.__ve-panel')).toBeHidden()

  // Wait until hit testing actually falls through to the page buttons
  const vp = page.viewportSize()
  await page.waitForFunction(([x, y]) => {
    const el = document.elementFromPoint(x, y)
    return el && el.id === 'top-bar'
  }, [vp.width / 2, 30])

  // Click where the toolbar used to be, and where the style panel sits
  await page.mouse.click(vp.width / 2, 30)
  await page.mouse.click(vp.width - 60, Math.round(vp.height * 0.25) + 60)
  const clicks = await page.evaluate(() => ({ top: window.__topClicks || 0, rail: window.__railClicks || 0 }))
  expect(clicks.top).toBe(1)
  expect(clicks.rail).toBe(1)
})
