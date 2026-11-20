// Read-only: pages through Marg's product master and prints EVERY field of the product(s) you ask for.
// Run from the project root:
//   node --env-file=.env.local scripts/marg-inspect.cjs 1008137
//   node --env-file=.env.local scripts/marg-inspect.cjs "6989A5 GLASS 7"   (matches code or name)
// With no argument it just prints the field names found on the first page.
const { createDecipheriv } = require('crypto')
const { inflateRawSync } = require('zlib')

const { MARG_COMPANY_CODE, MARG_ID, MARG_DECRYPTION_KEY } = process.env
const BASE = process.env.MARG_API_URL || 'https://corporate.margerp.com/api/eOnlineData'
const needle = (process.argv[2] || '').trim().toLowerCase()
if (!MARG_COMPANY_CODE || !MARG_ID || !MARG_DECRYPTION_KEY) {
  console.error('Set MARG_COMPANY_CODE, MARG_ID and MARG_DECRYPTION_KEY (run with: node --env-file=.env.local scripts/marg-inspect.cjs <code>)')
  process.exit(1)
}

function decrypt(cipherText) {
  try {
    return JSON.parse(inflateRawSync(Buffer.from(cipherText, 'base64')).toString('utf8').replace(/^﻿/, ''))
  } catch {}
  const key = Buffer.alloc(16)
  Buffer.from(MARG_DECRYPTION_KEY, 'utf8').copy(key, 0, 0, 16)
  const d = createDecipheriv('aes-128-cbc', key, key)
  const b64 = Buffer.concat([d.update(Buffer.from(cipherText, 'base64')), d.final()]).toString('utf8')
  return JSON.parse(inflateRawSync(Buffer.from(b64, 'base64')).toString('utf8').replace(/^﻿/, ''))
}

async function fetchPage(index) {
  const res = await fetch(`${BASE}/MargMST2017`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ CompanyCode: MARG_COMPANY_CODE, MargID: MARG_ID, Datetime: '', index: String(index) }),
  })
  const raw = (await res.text()).trim()
  let body = raw
  try { body = JSON.parse(raw) } catch {}
  const show = (why) => {
    console.error(`\nCould not decrypt the response (${why}).`)
    console.error(`HTTP ${res.status}, content-type: ${res.headers.get('content-type')}, length: ${raw.length}`)
    const safe = typeof body === 'object' && body ? Object.fromEntries(Object.entries(body).map(([k, v]) => [k, typeof v === 'string' && v.length > 120 ? `${v.slice(0, 60)}... (${v.length} chars)` : v])) : raw.slice(0, 300)
    console.error('Response:', typeof safe === 'string' ? safe : JSON.stringify(safe, null, 2))
  }
  try {
    if (typeof body === 'string') return decrypt(body)
    if (body && typeof body === 'object') {
      const hasLists = (o) => Object.keys(o).some((k) => /^pro_[nusr]$/i.test(k))
      if (hasLists(body) || Object.values(body).some((v) => v && typeof v === 'object' && !Array.isArray(v) && hasLists(v))) return body
      const cipher = Object.values(body).find((v) => typeof v === 'string' && v.length > 64)
      if (cipher) return decrypt(cipher)
    }
  } catch (e) {
    show(e.message)
    process.exit(1)
  }
  return body
}

const pick = (o, k) => o[Object.keys(o).find((x) => x.toLowerCase() === k)]
const isRow = (r) => r && typeof r === 'object'
const matches = (r) =>
  Object.values(r).some((v) => v != null && String(v).trim().toLowerCase() === needle) ||
  String(pick(r, 'name') ?? '').toLowerCase().includes(needle)

;(async () => {
  const fieldNames = {}
  const found = []
  let index = 0
  for (let page = 0; page < 50; page++) {
    const body = await fetchPage(index)
    const block = Object.values(body).find((v) => v && typeof v === 'object' && !Array.isArray(v)) || body
    const meta = (k) => pick(block, k) ?? pick(body, k)
    if (page === 0) {
      const info = Object.fromEntries(Object.entries(block).filter(([, v]) => !Array.isArray(v)))
      console.log('Marg says:', JSON.stringify(info))
      if (String(info.Status ?? info.status ?? '').toLowerCase() === 'failure') {
        console.log('\nMarg returned no products, so there is nothing to inspect. Try again later.')
        process.exit(0)
      }
    }
    for (const [list, rows] of Object.entries(block)) {
      if (!Array.isArray(rows)) continue
      for (const r of rows) {
        if (!isRow(r)) continue
        ;(fieldNames[list] ||= new Set())
        Object.keys(r).forEach((k) => fieldNames[list].add(k))
        if (needle && matches(r)) found.push({ page, list, row: r })
      }
    }
    const next = Number(meta('index'))
    const complete = String(meta('datastatus') ?? 'complete').toLowerCase().includes('complete')
    if (!needle || complete || !Number.isFinite(next) || next <= index) break
    index = next
  }

  console.log('Fields per list:')
  for (const [list, keys] of Object.entries(fieldNames)) console.log(`  ${list}: ${[...keys].join(', ')}`)
  if (needle) {
    console.log(`\nMatches for "${process.argv[2]}": ${found.length}`)
    for (const f of found) console.log(`\n-- list ${f.list} (page ${f.page}) --\n${JSON.stringify(f.row, null, 2)}`)
  }
})().catch((e) => { console.error('Failed:', e.message); process.exit(1) })
