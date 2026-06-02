const http = require('http')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const types = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp'
}

function safePath(urlPath) {
  const pathname = decodeURIComponent(urlPath.split('?')[0])
  const filePath = pathname === '/' ? '/index.html' : pathname
  const resolved = path.resolve(root, '.' + filePath)
  return resolved.startsWith(root) ? resolved : null
}

function createStaticServer() {
  return http.createServer((req, res) => {
  const filePath = safePath(req.url || '/')
  if (!filePath) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
      res.end('Not found')
      return
    }

    res.writeHead(200, {
      'content-type': types[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-store'
    })
    res.end(content)
  })
})
}

if (require.main === module) {
  const port = Number(process.env.PORT || 4173)
  const host = process.env.HOST || '127.0.0.1'
  const server = createStaticServer()

  server.listen(port, host, () => {
    console.log(`Serving ${root} at http://${host}:${port}/`)
  })

  function shutdown() {
    server.close(() => process.exit(0))
    setTimeout(() => process.exit(0), 1000).unref()
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

module.exports = { createStaticServer }
