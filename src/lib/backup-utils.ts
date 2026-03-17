/**
 * PostgreSQL backup utilities: ENUM extraction and idempotent DDL generation.
 * Ensures backup order: TYPES → TABLES → DATA for restorable SQL.
 *
 * Best practices used:
 * - ENUMs are extracted from pg_catalog.pg_type/pg_enum and emitted before any table.
 * - CREATE TYPE is wrapped in DO $$ ... EXCEPTION WHEN duplicate_object THEN NULL for idempotent restore.
 * - CREATE TABLE IF NOT EXISTS for idempotent table creation.
 * - Validation step (validateCustomTypes) before export to detect missing type definitions.
 * - Column types reference "public"."TypeName" for custom types so restore works with any search_path.
 */

import { prisma } from '@/lib/prisma'

export type ColumnRow = {
  column_name: string
  data_type: string
  udt_name: string
  is_nullable: string
  column_default: string | null
  character_maximum_length: number | null
}

export type EnumDefinition = {
  typname: string
  enum_labels: string[]
}

/** Fetch all custom ENUM types in the public schema from pg_catalog */
export async function getEnumTypes(): Promise<EnumDefinition[]> {
  const rows = await prisma.$queryRawUnsafe<
    { typname: string; enum_labels: string[] }[]
  >(`
    SELECT t.typname,
           array_agg(e.enumlabel ORDER BY e.enumsortorder) AS enum_labels
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_enum e ON t.oid = e.enumtypid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typtype = 'e'
    GROUP BY t.typname
    ORDER BY t.typname
  `)
  return rows
}

/** Built-in type names that are not custom ENUMs (for validation) */
const BUILTIN_TYPES = new Set([
  'int4', 'int8', 'int2', 'float4', 'float8', 'numeric', 'bool',
  'varchar', 'char', 'bpchar', 'text', 'json', 'jsonb',
  'date', 'timestamp', 'timestamptz', 'time', 'timetz', 'interval',
  'uuid', 'bytea', 'oid'
])

/**
 * Validate that all custom types referenced by table columns exist as ENUMs.
 * Returns { valid: true } or { valid: false, missingTypes: string[] }.
 */
export async function validateCustomTypes(): Promise<
  { valid: true } | { valid: false; missingTypes: string[] }
> {
  const enums = await getEnumTypes()
  const enumNames = new Set(enums.map(e => e.typname))

  const cols = await prisma.$queryRawUnsafe<
    { table_name: string; column_name: string; udt_name: string }[]
  >(`
    SELECT table_name, column_name, udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
  `)

  const missingTypeNames = new Set<string>()
  for (const c of cols) {
    if (BUILTIN_TYPES.has(c.udt_name)) continue
    if (!enumNames.has(c.udt_name)) {
      missingTypeNames.add(c.udt_name)
    }
  }
  if (missingTypeNames.size > 0) {
    return { valid: false, missingTypes: [...missingTypeNames].sort() }
  }
  return { valid: true }
}

/** Escape a single quote in SQL string literal (for enum labels) */
function escapeEnumLabel(label: string): string {
  return label.replace(/'/g, "''")
}

/**
 * Generate idempotent CREATE TYPE statements for all ENUMs.
 * Safe to run multiple times (skips if type already exists).
 */
export function generateIdempotentEnumSql(enums: EnumDefinition[]): string[] {
  const lines: string[] = [
    '-- Custom ENUM types (idempotent: safe to run multiple times)',
    ''
  ]
  for (const e of enums) {
    const values = e.enum_labels.map(l => `'${escapeEnumLabel(l)}'`).join(', ')
    lines.push(`DO $$ BEGIN`)
    lines.push(`  CREATE TYPE "public"."${e.typname}" AS ENUM (${values});`)
    lines.push(`EXCEPTION`)
    lines.push(`  WHEN duplicate_object THEN NULL;`)
    lines.push(`END $$;`)
    lines.push('')
  }
  return lines
}

/** Map udt_name / data_type to SQL type string for column definitions */
export function sqlType(
  dataType: string,
  udtName: string,
  charMaxLength: number | null
): string {
  const t = (udtName || dataType).toLowerCase()
  if (t === 'varchar' || t === 'char' || dataType === 'character varying') {
    return charMaxLength != null ? `character varying(${charMaxLength})` : 'character varying'
  }
  if (t === 'bpchar') return charMaxLength != null ? `char(${charMaxLength})` : 'char(1)'
  if (t === 'int4') return 'integer'
  if (t === 'int8') return 'bigint'
  if (t === 'int2') return 'smallint'
  if (t === 'float4') return 'real'
  if (t === 'float8') return 'double precision'
  if (t === 'bool') return 'boolean'
  if (t === 'timestamptz') return 'timestamp with time zone'
  if (t === 'timestamp') return 'timestamp without time zone'
  if (t === 'date') return 'date'
  if (t === 'jsonb') return 'jsonb'
  if (t === 'json') return 'json'
  if (t === 'text') return 'text'
  // Custom types (enums, etc.): use schema-qualified name for portability
  return `"public"."${udtName || dataType}"`
}

/** Escape string for SQL literal in INSERT values */
function escapeString(s: string): string {
  return s.replace(/'/g, "''")
}

export function escapeSqlLiteral(val: unknown): string {
  if (val === null || val === undefined) return 'NULL'
  if (typeof val === 'boolean') return val ? 'true' : 'false'
  if (typeof val === 'number' && !Number.isNaN(val)) return String(val)
  if (val instanceof Date) return `'${val.toISOString()}'`
  if (typeof val === 'object') return `'${escapeString(JSON.stringify(val))}'`
  return `'${escapeString(String(val))}'`
}
