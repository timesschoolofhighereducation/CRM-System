import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, AuthenticationError } from '@/lib/auth'
import * as XLSX from 'xlsx'

const IMPORT_PASSWORD = 'Tshe@2026'
const TEMPLATE_HEADERS = [
  'Full Name',
  'Phone',
  'WhatsApp',
  'WhatsApp Number',
  'Email',
  'City',
  'Age',
  'Guardian Phone',
  'Preferred Contact Time',
  'Preferred Status',
  'Follow Up Again',
  'Follow Up Date',
  'Follow Up Time',
  'Description',
  'Consent',
  'Register Now',
  'Not Answering',
  'Email Not Answering',
] as const

function toBool(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  const str = String(value ?? '').trim().toLowerCase()
  if (['yes', 'true', '1', 'y'].includes(str)) return true
  if (['no', 'false', '0', 'n'].includes(str)) return false
  return fallback
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const n = Number(String(value ?? '').trim())
  return Number.isFinite(n) ? n : undefined
}

function isTemplateFile(workbook: XLSX.WorkBook, rows: any[]): boolean {
  const info = workbook.Sheets['TemplateInfo']
  const infoRows = info ? XLSX.utils.sheet_to_json<any[]>(info, { header: 1 }) : []
  const key = String(infoRows?.[0]?.[1] ?? '')
  if (key !== 'INQUIRY_IMPORT_TEMPLATE_V1') return false

  if (!rows.length) return false
  const headers = rows[0].map((h: unknown) => String(h ?? '').trim())
  if (headers.length !== TEMPLATE_HEADERS.length) return false
  return TEMPLATE_HEADERS.every((h, idx) => headers[idx] === h)
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const formData = await request.formData()

    const password = String(formData.get('password') || '')
    const campaignId = String(formData.get('campaignId') || '')
    const marketingSource = String(formData.get('marketingSource') || '').trim()
    const file = formData.get('file') as File | null

    if (password !== IMPORT_PASSWORD) {
      return NextResponse.json({ error: 'Invalid import password' }, { status: 403 })
    }
    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign is required' }, { status: 400 })
    }
    if (!marketingSource) {
      return NextResponse.json({ error: 'Marketing source is required' }, { status: 400 })
    }
    if (!file) {
      return NextResponse.json({ error: 'Excel file is required' }, { status: 400 })
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, status: true },
    })
    if (!campaign) {
      return NextResponse.json({ error: 'Selected campaign not found' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const firstSheetName = workbook.SheetNames[0]
    const firstSheet = firstSheetName ? workbook.Sheets[firstSheetName] : undefined
    if (!firstSheet) {
      return NextResponse.json({ error: 'Invalid Excel file' }, { status: 400 })
    }

    const rows = XLSX.utils.sheet_to_json<any[]>(firstSheet, { header: 1, defval: '' })
    if (!isTemplateFile(workbook, rows)) {
      return NextResponse.json(
        {
          error:
            'Invalid template. Please use the official Inquiry Import Template file only.',
        },
        { status: 400 }
      )
    }

    const dataRows = rows.slice(1)
    const imported: string[] = []
    const errors: string[] = []

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]
      const line = i + 2
      const fullName = String(row[0] ?? '').trim()
      const phone = String(row[1] ?? '').trim()
      if (!fullName && !phone) continue
      if (!phone) {
        errors.push(`Row ${line}: Phone is required`)
        continue
      }

      const age = toNumber(row[6])
      const preferredStatusNum = toNumber(row[9])
      const seekerData: Record<string, any> = {
        fullName: fullName || '',
        phone,
        whatsapp: toBool(row[2]),
        whatsappNumber: String(row[3] ?? '').trim() || null,
        email: String(row[4] ?? '').trim() || null,
        city: String(row[5] ?? '').trim() || null,
        ageBand: age ? String(age) : null,
        guardianPhone: String(row[7] ?? '').trim() || null,
        preferredContactTime: String(row[8] ?? '').trim() || null,
        preferredStatus: preferredStatusNum
          ? Math.max(1, Math.min(10, Math.floor(preferredStatusNum)))
          : null,
        followUpAgain: toBool(row[10]),
        followUpDate: String(row[11] ?? '').trim() || null,
        followUpTime: String(row[12] ?? '').trim() || null,
        description: String(row[13] ?? '').trim() || null,
        consent: toBool(row[14]),
        registerNow: toBool(row[15]),
        notAnswering: toBool(row[16]),
        emailNotAnswering: toBool(row[17]),
        marketingSource,
        campaignId,
        createdById: user.id,
      }

      try {
        const created = await prisma.seeker.create({ data: seekerData as any })
        imported.push(created.id)
      } catch (err) {
        errors.push(`Row ${line}: Failed to import`)
      }
    }

    return NextResponse.json({
      importedCount: imported.length,
      failedCount: errors.length,
      errors,
    })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to import inquiries' }, { status: 500 })
  }
}
