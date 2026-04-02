import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthenticationError } from '@/lib/auth'
import * as XLSX from 'xlsx'

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

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)

    const sampleRows = [
      [...TEMPLATE_HEADERS],
      [
        'Nimal Perera',
        '0771234567',
        'Yes',
        '0771234567',
        'nimal@example.com',
        'Colombo',
        21,
        '0710000000',
        'Morning',
        7,
        'No',
        '',
        '',
        'Interested in weekend batch',
        'Yes',
        'No',
        'No',
        'No',
      ],
    ]

    const dataSheet = XLSX.utils.aoa_to_sheet(sampleRows)
    const infoSheet = XLSX.utils.aoa_to_sheet([
      ['TEMPLATE_KEY', 'INQUIRY_IMPORT_TEMPLATE_V1'],
      ['Do not modify this sheet name or key.', ''],
    ])

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, dataSheet, 'Inquiries')
    XLSX.utils.book_append_sheet(workbook, infoSheet, 'TemplateInfo')
    workbook.Workbook = workbook.Workbook || { Sheets: [] }
    workbook.Workbook.Sheets = workbook.SheetNames.map((name) => ({
      name,
      Hidden: name === 'TemplateInfo' ? 1 : 0,
    }))

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="inquiry-import-template.xlsx"`,
      },
    })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to generate import template' },
      { status: 500 }
    )
  }
}
