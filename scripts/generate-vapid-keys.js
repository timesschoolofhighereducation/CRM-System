#!/usr/bin/env node

/**
 * Generate VAPID keys for web push notifications
 * 
 * Usage: node scripts/generate-vapid-keys.js
 * 
 * This script generates a public and private VAPID key pair
 * that you need to add to your .env file:
 * 
 * NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public-key>
 * VAPID_PRIVATE_KEY=<private-key>
 * VAPID_SUBJECT=mailto:your-email@example.com
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports -- standalone Node script
const webpush = require('web-push')

try {
  const vapidKeys = webpush.generateVAPIDKeys()
  
  console.log('\n✅ VAPID Keys Generated Successfully!\n')
  console.log('Add these to your .env file:\n')
  console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`)
  console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`)
  console.log(`VAPID_SUBJECT=mailto:admin@example.com\n`)
  console.log('⚠️  Keep the private key SECRET! Never commit it to version control.\n')
  
} catch (error) {
  console.error('Error generating VAPID keys:', error)
  process.exit(1)
}

