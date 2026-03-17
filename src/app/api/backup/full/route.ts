import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdminRole } from '@/lib/auth'
import { logBackupFull } from '@/lib/activity-logger'

type ColumnRow = {
  column_name: string
  data_type: string
  udt_name: string
  is_nullable: string
  column_default: string | null
  character_maximum_length: number | null
}

function sqlType(dataType: string, udtName: string, charMaxLength: number | null): string {
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
  return udtName || dataType
}

function escapeSqlLiteral(val: unknown): string {
  if (val === null || val === undefined) return 'NULL'
  if (typeof val === 'boolean') return val ? 'true' : 'false'
  if (typeof val === 'number' && !Number.isNaN(val)) return String(val)
  if (val instanceof Date) return `'${val.toISOString()}'`
  if (typeof val === 'object') return `'${escapeString(JSON.stringify(val))}'`
  return `'${escapeString(String(val))}'`
}

function escapeString(s: string): string {
  return s.replace(/'/g, "''")
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!isAdminRole(user.role)) {
      return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 })
    }

    const tables = (await prisma.$queryRawUnsafe<{ table_name: string }[]>(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE' 
       ORDER BY table_name`
    )).map(r => r.table_name)

    const lines: string[] = [
      '-- Full database backup (schema + data)',
      `-- Generated at ${new Date().toISOString()}`,
      '-- PostgreSQL',
      ''
    ]

    for (const table of tables) {
      const cols = await prisma.$queryRawUnsafe<ColumnRow[]>(
        `SELECT column_name, data_type, udt_name, is_nullable, column_default, character_maximum_length
         FROM information_schema.columns 
         WHERE table_schema = 'public' AND table_name = $1
         ORDER BY ordinal_position`,
        table
      )
      if (cols.length === 0) continue

      const colDefs = cols.map(c => {
        const type = sqlType(c.data_type, c.udt_name, c.character_maximum_length)
        const nullable = c.is_nullable === 'YES' ? '' : ' NOT NULL'
        const def = c.column_default ? ` DEFAULT ${c.column_default}` : ''
        return `  "${c.column_name}" ${type}${nullable}${def}`
      })

      const pks = await prisma.$queryRawUnsafe<{ constraint_name: string }[]>(
        `SELECT c.constraint_name FROM information_schema.table_constraints c
         WHERE c.table_schema = 'public' AND c.table_name = $1 AND c.constraint_type = 'PRIMARY KEY'`,
        table
      )
      const pkName = pks[0]?.constraint_name
      let pkCols: string[] = []
      if (pkName) {
        const pkColRows = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
          `SELECT column_name FROM information_schema.key_column_usage 
           WHERE constraint_name = $1 ORDER BY ordinal_position`,
          pkName
        )
        pkCols = pkColRows.map(r => `"${r.column_name}"`)
      }

      lines.push(`-- Table: ${table}`)
      lines.push(`CREATE TABLE IF NOT EXISTS "public"."${table}" (`)
      lines.push(colDefs.join(',\n'))
      if (pkCols.length) {
        lines.push(`, CONSTRAINT "${pkName}" PRIMARY KEY (${pkCols.join(', ')})`)
      }
      lines.push(');')
      lines.push('')

      const columnNames = cols.map(c => c.column_name)
      const quotedCols = columnNames.map(c => `"${c}"`).join(', ')
      const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT * FROM "public"."${table}"`
      )

      if (rows.length > 0) {
        lines.push(`-- Data: ${table} (${rows.length} rows)`)
        const batchSize = 50
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize)
          const values = batch.map(row => {
            const vals = columnNames.map(col => escapeSqlLiteral(row[col]))
            return `(${vals.join(', ')})`
          })
          lines.push(`INSERT INTO "public"."${table}" (${quotedCols}) VALUES`)
          lines.push(values.join(',\n'))
          lines.push(';')
          lines.push('')
        }
      }
    }

    const sql = lines.join('\n')
    const filename = `backup-full-${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}.sql`

    await logBackupFull(user.id, request, { tables, filename })

    return new NextResponse(sql, {
      status: 200,
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('Backup full error:', err)
    return NextResponse.json({ error: 'Failed to generate full backup' }, { status: 500 })
  }
}
