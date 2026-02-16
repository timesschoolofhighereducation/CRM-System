#!/bin/bash

# Vercel Push Notifications Diagnostic Script
# Run this to check if your Vercel deployment is configured correctly

echo "🔍 Vercel Push Notifications Diagnostic"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get Vercel domain
echo "📝 Enter your Vercel domain (e.g., myapp.vercel.app):"
read DOMAIN

if [ -z "$DOMAIN" ]; then
    echo "${RED}❌ Domain is required${NC}"
    exit 1
fi

# Remove https:// if provided
DOMAIN=$(echo $DOMAIN | sed 's|https://||' | sed 's|http://||')
BASE_URL="https://$DOMAIN"

echo ""
echo "Testing: $BASE_URL"
echo "========================================"
echo ""

# Test 1: Check VAPID Public Key Endpoint
echo "Test 1: VAPID Public Key Endpoint"
echo "-----------------------------------"
VAPID_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/push/vapid-public-key")
HTTP_CODE=$(echo "$VAPID_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$VAPID_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    PUBLIC_KEY=$(echo "$RESPONSE_BODY" | grep -o '"publicKey":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$PUBLIC_KEY" ]; then
        echo "${GREEN}✅ PASS${NC} - VAPID public key is configured"
        echo "   Public Key: ${PUBLIC_KEY:0:30}..."
    else
        echo "${RED}❌ FAIL${NC} - Response OK but no public key found"
        echo "   Response: $RESPONSE_BODY"
    fi
else
    echo "${RED}❌ FAIL${NC} - Environment variables NOT configured in Vercel"
    echo "   HTTP Code: $HTTP_CODE"
    echo "   Response: $RESPONSE_BODY"
    echo ""
    echo "${YELLOW}⚠️  ACTION REQUIRED:${NC}"
    echo "   1. Go to: https://vercel.com/dashboard"
    echo "   2. Select your project → Settings → Environment Variables"
    echo "   3. Add these 3 variables:"
    echo "      - NEXT_PUBLIC_VAPID_PUBLIC_KEY"
    echo "      - VAPID_PRIVATE_KEY"
    echo "      - VAPID_SUBJECT"
    echo "   4. Redeploy your application"
fi

echo ""

# Test 2: Check Service Worker
echo "Test 2: Service Worker File"
echo "-----------------------------------"
SW_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/sw.js")
SW_HTTP_CODE=$(echo "$SW_RESPONSE" | tail -n 1)

if [ "$SW_HTTP_CODE" = "200" ]; then
    echo "${GREEN}✅ PASS${NC} - Service worker is deployed"
else
    echo "${RED}❌ FAIL${NC} - Service worker NOT found (404)"
    echo "   HTTP Code: $SW_HTTP_CODE"
    echo ""
    echo "${YELLOW}⚠️  ACTION REQUIRED:${NC}"
    echo "   1. Verify public/sw.js exists in your repository"
    echo "   2. Commit and push the file"
    echo "   3. Vercel will auto-redeploy"
fi

echo ""

# Test 3: Check HTTPS
echo "Test 3: HTTPS Configuration"
echo "-----------------------------------"
if [[ $BASE_URL == https://* ]]; then
    echo "${GREEN}✅ PASS${NC} - Using HTTPS (required for service workers)"
else
    echo "${RED}❌ FAIL${NC} - Not using HTTPS"
    echo "   Service workers require HTTPS in production"
fi

echo ""

# Test 4: Check Headers
echo "Test 4: Security Headers"
echo "-----------------------------------"
HEADERS=$(curl -s -I "$BASE_URL" | grep -i "service-worker-allowed\|content-security-policy")
if [ -n "$HEADERS" ]; then
    echo "${GREEN}✅ PASS${NC} - Security headers configured"
else
    echo "${YELLOW}⚠️  INFO${NC} - Standard headers present"
fi

echo ""
echo "========================================"
echo "📊 Summary"
echo "========================================"
echo ""

# Count failures
FAIL_COUNT=0

if [ "$HTTP_CODE" != "200" ] || [ -z "$PUBLIC_KEY" ]; then
    echo "${RED}❌ Environment variables NOT configured${NC}"
    FAIL_COUNT=$((FAIL_COUNT + 1))
else
    echo "${GREEN}✅ Environment variables configured${NC}"
fi

if [ "$SW_HTTP_CODE" != "200" ]; then
    echo "${RED}❌ Service worker NOT deployed${NC}"
    FAIL_COUNT=$((FAIL_COUNT + 1))
else
    echo "${GREEN}✅ Service worker deployed${NC}"
fi

echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo "${GREEN}🎉 All checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Open $BASE_URL in your browser"
    echo "2. Try enabling push notifications"
    echo "3. Check browser console (F12) for any errors"
else
    echo "${RED}⚠️  $FAIL_COUNT issue(s) found${NC}"
    echo ""
    echo "See above for specific fixes needed."
    echo ""
    echo "📖 For detailed troubleshooting:"
    echo "   docs/VERCEL_PUSH_TROUBLESHOOTING.md"
fi

echo ""
