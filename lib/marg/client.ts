import { createDecipheriv } from 'crypto'
import { inflateRawSync } from 'zlib'

/**
 * Marg ERP "eOnline" master API client — SERVER ONLY (holds the decryption key).
 *
 * Read-only: only `MargMST2017` (product master sync) is called. Marg's order
 * posting APIs are intentionally not implemented.
 *
 * Response pipeline (mirrors Marg's C# `DecryptData` sample):
 *   base64 → AES-128-CBC (key = IV = decryption key, UTF-8, zero-padded to 16
 *   bytes, PKCS7) → base64 text → raw DEFLATE → JSON.
 *
 * Field names in Marg's PDF are inconsistently cased (`Pro_N` vs `pro_U`,
 * `Is_Deleted` vs `Is_deleted`), so every lookup here is case-insensitive.
 */

const DEFAULT_BASE_URL = 'https://corporate.margerp.com/api/eOnlineData'
/** Safety cap on pagination — Marg returns ~6k products in a handful of pages. */
const MAX_PAGES = 50

export interface MargConfig {
  baseUrl: string
  companyCode: string
  margId: string
  decryptionKey: string
}

/** One product as reported by Marg. `null` = field absent from this message. */
export interface MargItem {
  code: string
  name: string | null
  company: string | null
  mrp: number | null
  stock: number | null
  deleted: boolean
}

export interface MargFetchResult {
  items: MargItem[]
  /** Marg's own "DateTime" for this response — pass back as `since` next time. */
  margDatetime: string | null
}

const ENV_KEYS = ['MARG_COMPANY_CODE', 'MARG_ID', 'MARG_DECRYPTION_KEY'] as const

/** Env vars that still need setting (empty when Marg sync is configured). */
export function missingMargEnv(): string[] {
  return ENV_KEYS.filter((k) => !process.env[k])
}

export function getMargConfig(): MargConfig {
  const missing = missingMargEnv()
  if (missing.length) throw new Error(`Marg sync is not configured — set ${missing.join(', ')} in the environment.`)
  return {
    baseUrl: process.env.MARG_API_URL || DEFAULT_BASE_URL,
    companyCode: process.env.MARG_COMPANY_CODE!,
    margId: process.env.MARG_ID!,
    decryptionKey: process.env.MARG_DECRYPTION_KEY!,
  }
}

/* ------------------------------ Decoding -------------------------------- */

export function decryptMargPayload(cipherText: string, key: string): unknown {
  const keyBytes = Buffer.alloc(16)
  Buffer.from(key, 'utf8').copy(keyBytes, 0, 0, 16)
  const decipher = createDecipheriv('aes-128-cbc', keyBytes, keyBytes)
  const compressed = Buffer.concat([decipher.update(Buffer.from(cipherText, 'base64')), decipher.final()]).toString('utf8')
  // Marg's JSON starts with a UTF-8 byte-order mark, which JSON.parse rejects.
  return JSON.parse(inflateRawSync(Buffer.from(compressed, 'base64')).toString('utf8').replace(/^﻿/, ''))
}

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v)

function get(obj: Obj, key: string): unknown {
  const want = key.toLowerCase()
  for (const k of Object.keys(obj)) if (k.toLowerCase() === want) return obj[k]
  return undefined
}

function text(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s ? s : null
}

function num(v: unknown): number | null {
  const s = text(v)
  if (s == null) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

const PRODUCT_LISTS = ['pro_n', 'pro_u', 'pro_s', 'pro_r'] as const

/** The object holding the product lists — either the payload itself or one level down (e.g. `Details`). */
function findBlock(payload: unknown): Obj | null {
  if (!isObj(payload)) return null
  const hasLists = (o: Obj) => PRODUCT_LISTS.some((k) => get(o, k) !== undefined)
  if (hasLists(payload)) return payload
  for (const v of Object.values(payload)) if (isObj(v) && hasLists(v)) return v
  return null
}

/** Reads `key` from the block first, then the top-level payload. */
function meta(payload: Obj, block: Obj | null, key: string): unknown {
  return (block && get(block, key)) ?? get(payload, key)
}

function toItem(row: unknown): MargItem | null {
  if (!isObj(row)) return null
  const code = text(get(row, 'code'))
  if (!code) return null
  const deleted = text(get(row, 'is_deleted'))
  return {
    code,
    name: text(get(row, 'name')),
    company: text(get(row, 'company')),
    mrp: num(get(row, 'mrp')),
    stock: num(get(row, 'stock')),
    deleted: deleted === '1' || deleted?.toLowerCase() === 'true',
  }
}

/** "2017-01-14 13:53:2" → "2017-01-14 13:53:02" (the format Marg accepts as input). */
export function normalizeMargDatetime(v: unknown): string | null {
  const m = text(v)?.match(/(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{1,2}):(\d{1,2})/)
  if (!m) return null
  const p = (s: string) => s.padStart(2, '0')
  return `${m[1]}-${p(m[2])}-${p(m[3])} ${p(m[4])}:${p(m[5])}:${p(m[6])}`
}

interface ParsedPage {
  /** Lists in apply order: full records first, then stock-only, then rate-only. */
  lists: MargItem[][]
  index: number | null
  complete: boolean
  margDatetime: string | null
}

function parsePage(payload: unknown): ParsedPage {
  if (!isObj(payload)) throw new Error('Marg returned an unexpected response shape.')
  const block = findBlock(payload)

  const status = text(meta(payload, block, 'status'))?.toLowerCase()
  const message = text(meta(payload, block, 'message')) ?? text(meta(payload, block, 'messagecode'))
  if (status === 'failure') {
    // "No Record Found" is how Marg says "nothing changed since `Datetime`".
    if (message?.toLowerCase().includes('no record')) {
      return { lists: [], index: null, complete: true, margDatetime: normalizeMargDatetime(meta(payload, block, 'datetime')) }
    }
    throw new Error(`Marg rejected the request: ${message ?? 'Failure'}`)
  }
  if (!block) throw new Error(`Marg response has no product lists (keys: ${Object.keys(payload).join(', ') || 'none'}).`)

  const lists = PRODUCT_LISTS.map((k) => {
    const rows = get(block, k)
    return Array.isArray(rows) ? rows.map(toItem).filter((i): i is MargItem => i !== null) : []
  })

  return {
    lists,
    index: num(meta(payload, block, 'index')),
    complete: text(meta(payload, block, 'datastatus'))?.toLowerCase().includes('complete') ?? true,
    margDatetime: normalizeMargDatetime(meta(payload, block, 'datetime')),
  }
}

/* ------------------------------- Fetching ------------------------------- */

async function fetchPage(cfg: MargConfig, since: string, index: number): Promise<unknown> {
  const res = await fetch(`${cfg.baseUrl}/MargMST2017`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ CompanyCode: cfg.companyCode, MargID: cfg.margId, Datetime: since, index: String(index) }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Marg API returned HTTP ${res.status}`)

  const raw = (await res.text()).trim()
  let body: unknown = raw
  try {
    body = JSON.parse(raw)
  } catch {
    /* bare cipher text */
  }

  if (typeof body === 'string') {
    try {
      return decryptMargPayload(body, cfg.decryptionKey)
    } catch {
      throw new Error('Could not decrypt the Marg response — check MARG_DECRYPTION_KEY.')
    }
  }
  if (isObj(body)) {
    // Either plain JSON (e.g. a Failure status) or an envelope around the
    // cipher text — decrypt the first long string field if there is one.
    const cipher = Object.values(body).find((v): v is string => typeof v === 'string' && v.length > 64)
    if (cipher && !findBlock(body)) return decryptMargPayload(cipher, cfg.decryptionKey)
    return body
  }
  throw new Error('Marg returned an empty response.')
}

/**
 * Fetches the product master. `since` = null → every product; otherwise only
 * products changed since that Marg datetime ("YYYY-MM-DD HH:mm:ss").
 * Pages through `index` until Marg reports the data as complete. Partial
 * records (stock-only / rate-only lists) are merged onto full ones by code.
 */
export async function fetchMargProducts(since: string | null, cfg = getMargConfig()): Promise<MargFetchResult> {
  const byCode = new Map<string, MargItem>()
  let margDatetime: string | null = null
  let index = 0

  for (let page = 0; page < MAX_PAGES; page++) {
    const parsed = parsePage(await fetchPage(cfg, since ?? '', index))
    margDatetime ??= parsed.margDatetime

    for (const list of parsed.lists) {
      for (const item of list) {
        const prev = byCode.get(item.code)
        byCode.set(
          item.code,
          prev
            ? {
                code: item.code,
                name: item.name ?? prev.name,
                company: item.company ?? prev.company,
                mrp: item.mrp ?? prev.mrp,
                stock: item.stock ?? prev.stock,
                deleted: item.deleted || prev.deleted,
              }
            : item,
        )
      }
    }

    if (parsed.complete || parsed.index == null || parsed.index <= index) break
    index = parsed.index
  }

  return { items: Array.from(byCode.values()), margDatetime }
}
