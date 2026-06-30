/**
 * Public entry point for the Supabase data layer.
 *
 * Usage:
 *   import { repositories } from '@/lib/supabase'
 *   const product = await repositories.products.getProductBySlug(slug)
 *
 * In Phase 3, the existing `lib/products.ts` / `lib/categories.ts` read
 * functions delegate to these repositories (same return shapes) so the UI is
 * untouched.
 */
export * from './client'
export type { Database, Json, Tables, TablesInsert, TablesUpdate, Enums } from './database.types'
export * as repositories from './repositories'
