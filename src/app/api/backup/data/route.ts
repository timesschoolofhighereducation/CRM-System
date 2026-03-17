import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isAdminRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logDataBackup } from '@/lib/activity-logger'

const TABLE_NAME_REGEX = /^[a-zA-Z0-9_]+$/

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

    const backup: Record<string, unknown[]> = {}
    const rowCounts: Record<string, number> = {}

    for (const tableName of tableNames) {
      try {
        const rows = await prisma.$queryRawUnsafe(`SELECT * FROM public."${tableName.replace(/"/g, '""')}"`)
        const arr = Array.isArray(rows) ? rows : []
        backup[tableName] = arr as unknown[]
        rowCounts[tableName] = arr.length
      } catch (e) {
        console.error(`Backup: failed to read table ${tableName}`, e)
        backup[tableName] = []
        rowCounts[tableName] = 0
      }
    }

    const payload = {
      exportedAt: new Date().toISOString(),
      tables: tableNames,
      tableRowCounts: rowCounts,
      data: backup
    }

    await logDataBackup(user.id, request, {
      tables: tableNames,
      format: 'json',
      rowCounts: rowCounts
    })

    const filename = `data-backup-${new Date().toISOString().slice(0, 10)}.json`
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Data backup error:', error)
    return NextResponse.json(
      { error: 'Failed to generate data backup.' },
      { status: 500 }
    )
  }
}
