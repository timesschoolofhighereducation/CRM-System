// Dynamic import to handle the separate Prisma client for request inquiries
// This uses a custom output path to avoid conflicts with the main Prisma client

const globalForRequestInquiryPrisma = globalThis as unknown as {
  requestInquiryPrisma: any | undefined
}

// Lazy load the Prisma client to avoid build errors if not generated
function createRequestInquiryPrismaClient() {
  // Use dynamic import in a way that's compatible with both build and runtime
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const RequestInquiryClient = require('../../node_modules/.prisma/request-inquiry-client')
    const PrismaClient = RequestInquiryClient.PrismaClient
    
    if (!PrismaClient) {
      throw new Error('PrismaClient not found in request-inquiry-client module')
    }
    
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    if (process.env.NODE_ENV === 'development') {
      console.warn('Request Inquiry Prisma client not found. Run: npm run db:generate:request-inquiry')
      console.warn('Error:', errorMessage)
    }
    // Return a mock client that throws helpful errors
    return new Proxy({}, {
      get() {
        throw new Error('Request Inquiry Prisma client not available. Please run: npm run db:generate:request-inquiry')
      }
    })
  }
}

const cached = globalForRequestInquiryPrisma.requestInquiryPrisma

export const requestInquiryPrisma = !cached ? createRequestInquiryPrismaClient() : cached

if (process.env.NODE_ENV === 'production') {
  globalForRequestInquiryPrisma.requestInquiryPrisma = requestInquiryPrisma
} else {
  globalForRequestInquiryPrisma.requestInquiryPrisma = requestInquiryPrisma
}
