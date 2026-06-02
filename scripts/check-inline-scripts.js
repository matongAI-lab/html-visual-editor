const fs = require('fs')

const html = fs.readFileSync('index.html', 'utf8')
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1])

scripts.forEach(script => {
  // Syntax-only validation for the inline bootstrap code.
  new Function(script)
})

console.log(`index inline scripts ok: ${scripts.length}`)
