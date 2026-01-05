// Dynamic import to handle the separate Prisma client for request inquiries
// This uses a custom output path to avoid conflicts with the main Prisma client
let RequestInquiryPrismaClient: any = null

try {
  // Try to import the request inquiry Prisma client from the custom output path
  // Path: node_modules/.prisma/request-inquiry-client
  RequestInquiryPrismaClient = require('../../node_modules/.prisma/request-inquiry-client').PrismaClient
} catch (error: any) {
  // Only warn in development, fail silently in production to avoid breaking the app
  if (process.env.NODE_ENV === 'development') {
    console.warn('Request Inquiry Prisma client not found. Run: npm run db:generate:request-inquiry')
    console.warn('Error:', error?.message || error)
  }
}

const globalForRequestInquiryPrisma = globalThis as unknown as {
  requestInquiryPrisma: RequestInquiryPrismaClient | undefined
}

function createRequestInquiryPrismaClient() {
  if (!RequestInquiryPrismaClient) {
    throw new Error('Request Inquiry Prisma client not available. Please run: npm run generate:request-inquiry-client')
  }
  try {
    return new RequestInquiryPrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  } catch (error) {
    console.error('Failed to create Request Inquiry Prisma client:', error)
    throw error
  }
}

const cached = globalForRequestInquiryPrisma.requestInquiryPrisma

export const requestInquiryPrisma = !cached ? createRequestInquiryPrismaClient() : cached

if (process.env.NODE_ENV === 'production') {
  globalForRequestInquiryPrisma.requestInquiryPrisma = requestInquiryPrisma
} else {
  globalForRequestInquiryPrisma.requestInquiryPrisma = requestInquiryPrisma
}

