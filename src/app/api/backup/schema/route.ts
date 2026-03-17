import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isAdminRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logSchemaExport } from '@/lib/activity-logger'

const TABLE_NAME_REGEX = /^[a-zA-Z0-9_]+$/

interface ColumnRow {
  table_name: string
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
  character_maximum_length: number | null
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!isAdminRole(user.role)) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

    const tablesResult = await prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `
    const tableNames = tablesResult.map((r) => r.tablename).filter((name) => TABLE_NAME_REGEX.test(name))

    const columnsResult = await prisma.$queryRaw<ColumnRow[]>`
      SELECT table_name, column_name, data_type, is_nullable, column_default, character_maximum_length
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `

    const columnsByTable = columnsResult.reduce<Record<string, ColumnRow[]>>((acc, row) => {
      if (!acc[row.table_name]) acc[row.table_name] = []
      acc[row.table_name].push(row)
      return acc
    }, {})

    const pkResult = await prisma.$queryRaw<{ table_name: string; column_name: string }[]>`
      SELECT tc.table_name, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema = 'public' AND tc.constraint_type = 'PRIMARY KEY'
      ORDER BY tc.table_name, kcu.ordinal_position
    `
    const pkByTable = pkResult.reduce<Record<string, string[]>>((acc, row) => {
      if (!acc[row.table_name]) acc[row.table_name] = []
      acc[row.table_name].push(row.column_name)
      return acc
    }, {})

    const lines: string[] = [
      '-- PostgreSQL / SQL table structure export',
      `-- Generated at ${new Date().toISOString()}`,
      '-- Schema: public',
      ''
    ]

    for (const tableName of tableNames) {
      const cols = columnsByTable[tableName] || []
      const pks = pkByTable[tableName] || []
      if (cols.length === 0) continue

      lines.push(`-- Table: ${tableName}`)
      const colDefs = cols.map((c) => {
        let def = `  "${c.column_name}" ${c.data_type.toUpperCase()}`
        if (c.character_maximum_length != null) def += `(${c.character_maximum_length})`
        if (c.is_nullable === 'NO') def += ' NOT NULL'
        if (c.column_default) def += ` DEFAULT ${c.column_default}`
        return def
      })
      if (pks.length) {
        colDefs.push(`  PRIMARY KEY (${pks.map((p) => `"${p}"`).join(', ')})`)
      }
      lines.push(`CREATE TABLE IF NOT EXISTS "${tableName}" (`)
      lines.push(colDefs.join(',\n'))
      lines.push(');')
      lines.push('')
    }

    const sql = lines.join('\n')

    await logSchemaExport(user.id, request, {
      tables: tableNames,
      format: 'sql'
    })

    const filename = `schema-export-${new Date().toISOString().slice(0, 10)}.sql`
    return new NextResponse(sql, {
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Schema export error:', error)
    return NextResponse.json(
      { error: 'Failed to generate schema export.' },
      { status: 500 }
    )
  }
}
