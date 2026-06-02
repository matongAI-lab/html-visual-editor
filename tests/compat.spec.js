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

test('loads demo and enters visual editing mode', async ({ page }) => {
  await page.goto(`${baseURL}/index.html`)

  await expect(page.locator('h1')).toContainText('HTML 可视化编辑器')
  await expect(page.getByRole('tab', { name: '上传文件' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('#btn-start')).toBeDisabled()

  await page.locator('#btn-demo').click()
  await expect(page.locator('#btn-start')).toBeEnabled()

  await page.locator('#btn-start').scrollIntoViewIfNeeded()
  await page.locator('#btn-start').click()
  await expect(page.locator('.__ve-toggle')).toBeVisible({ timeout: 10000 })
  await expect(page.locator('h1')).toContainText('HTML 可视化编辑器')

  await page.locator('.__ve-toggle').click()
  await expect(page.locator('.__ve-toolbar.visible')).toBeVisible()
  await expect(page.locator('.__ve-panel.visible')).toHaveCount(0)
  await expect(page.locator('.__ve-toolbar')).toContainText('版式')
  await expect(page.locator('.__ve-toolbar')).toContainText('复制 HTML')
  await expect(page.locator('.__ve-tb-btn.primary')).toContainText('下载 HTML')

  await page.mouse.click(80, 260)
  await expect(page.locator('.__ve-sel-ov')).toBeVisible()
  await page.getByText('版式').click()
  await expect(page.locator('.__ve-panel.visible')).toBeVisible()
  await expect(page.locator('.__ve-panel')).toContainText('文字')
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
  await page.locator('.__ve-toggle').click()
  await expect(page.locator('.__ve-page-label')).toContainText('/')

  const before = await page.evaluate(() => window.pageYOffset)
  const box = await page.getByText('下一页').boundingBox()
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
  await page.locator('.__ve-toggle').click()
  await expect(page.locator('.__ve-pager')).toHaveClass(/hidden/)
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
  await page.locator('.__ve-toggle').click()
  await page.locator('h1').click({ position: { x: 8, y: 8 } })
  await page.getByText('编辑文字').click()

  const downloadPromise = page.waitForEvent('download')
  await page.getByText('下载 HTML').click()
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
  await page.locator('.__ve-toggle').click()
  await expect(page.locator('.__ve-page-label')).toContainText('/')

  const before = await page.locator('.deck').evaluate(el => el.scrollTop)
  const box = await page.getByText('下一页').boundingBox()
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
  await page.locator('.__ve-toggle').click()
  await expect(page.locator('.__ve-page-label')).toContainText('1/16')
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
  await page.locator('.__ve-toggle').click()
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
  await page.locator('.__ve-toggle').click()
  await expect(page.locator('.__ve-page-label')).toContainText('1/16')

  const box = await page.getByText('下一页').boundingBox()
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
    .page-num { position: fixed; right: 24px; bottom: 24px; color: #999; }
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
    pageNum.className = 'page-num'
    viewport.appendChild(inner)
    viewport.appendChild(pageNum)
    document.body.appendChild(viewport)
    function render() {
      inner.innerHTML = S[cur].html
      pageNum.textContent = S[cur].id + ' / ' + S.length
    }
    function go(dir) {
      cur = Math.max(0, Math.min(S.length - 1, cur + dir))
      render()
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
  await page.locator('.__ve-toggle').click()
  await expect(page.locator('.__ve-page-label')).toContainText('1/12')

  const box = await page.getByText('下一页').boundingBox()
  expect(box).not.toBeNull()
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await page.waitForTimeout(300)

  await expect(page.locator('.__ve-page-label')).toContainText('2/12')
  await expect(page.locator('.slide-inner h1')).toContainText('第 2 页')
})
