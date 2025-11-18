# Delivery Validation Troubleshooting Guide

## Issue: "Could not validate delivery address. Proceeding anyway..."

This message appears when the delivery validation fails. Here's how to diagnose and fix it.

---

## Step 1: Check Browser Console

Open your browser's Developer Tools (F12) and check the Console tab. Look for:

### ✅ **Good Signs:**
- `🚀 Starting delivery validation for: [address]`
- `✅ Validation successful: { isValid: true, ... }`

### ❌ **Error Signs:**
- `❌ Delivery validation error:`
- `❌ MAPBOX_PUBLIC_TOKEN not configured`
- `❌ Network error`
- `⏱️ Delivery validation timed out`

---

## Step 2: Check Supabase Edge Function Logs

1. Go to your Supabase Dashboard
2. Navigate to **Edge Functions** → **validate-delivery-address**
3. Check the **Logs** tab
4. Look for error messages

### Common Errors:

#### **Error: "MAPBOX_PUBLIC_TOKEN not configured"**
**Problem:** The Mapbox token is not set in Supabase Edge Functions environment variables.

**Fix:**
1. Go to Supabase Dashboard → **Project Settings** → **Edge Functions** → **Secrets**
2. Add a new secret:
   - **Name:** `MAPBOX_PUBLIC_TOKEN`
   - **Value:** Your Mapbox public token (starts with `pk.`)
3. Save and redeploy the edge function

#### **Error: "Mapbox geocoding error"**
**Problem:** The Mapbox API is returning an error.

**Possible Causes:**
- Invalid Mapbox token
- Token has expired
- Token doesn't have required permissions
- Rate limit exceeded

**Fix:**
1. Verify your Mapbox token is valid
2. Check Mapbox account for rate limits
3. Ensure token has geocoding and directions permissions

#### **Error: "Network error" or "fetch failed"**
**Problem:** The edge function cannot reach Mapbox API.

**Possible Causes:**
- Network connectivity issue
- Mapbox API is down
- Firewall blocking requests

**Fix:**
1. Check Mapbox status page
2. Verify network connectivity
3. Check Supabase edge function logs for more details

---

## Step 3: Verify Mapbox Token Configuration

### In Supabase Edge Functions:

1. **Check if token exists:**
   - Go to Supabase Dashboard
   - **Project Settings** → **Edge Functions** → **Secrets**
   - Look for `MAPBOX_PUBLIC_TOKEN`

2. **Verify token format:**
   - Should start with `pk.`
   - Should be your **public** token (not secret token)
   - Should be from your Mapbox account

3. **Check token permissions:**
   - Token should have:
     - Geocoding API access
     - Directions API access
     - Isochrone API access (if using)

---

## Step 4: Test the Edge Function Directly

You can test the edge function directly using curl or Postman:

```bash
curl -X POST https://[your-project].supabase.co/functions/v1/validate-delivery-address \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [your-anon-key]" \
  -d '{"address": "505 51st Street, Brooklyn, NY 11220"}'
```

**Expected Response (Success):**
```json
{
  "isValid": true,
  "estimatedMinutes": 5,
  "message": "Estimated delivery time: 5 minutes",
  "distanceMiles": 0.5
}
```

**Expected Response (Error):**
```json
{
  "isValid": false,
  "message": "Service temporarily unavailable. Please try pickup instead.",
  "suggestPickup": true
}
```

---

## Step 5: Check Network Tab

1. Open Developer Tools (F12)
2. Go to **Network** tab
3. Try to validate an address
4. Look for the request to `validate-delivery-address`
5. Check:
   - **Status Code:** Should be 200
   - **Response:** Should contain JSON with `isValid` field
   - **Request Headers:** Should include authorization

---

## Common Issues & Solutions

### Issue 1: Token Not Set
**Symptom:** Error message mentions "MAPBOX_PUBLIC_TOKEN not configured"

**Solution:**
1. Add `MAPBOX_PUBLIC_TOKEN` to Supabase Edge Functions secrets
2. Redeploy the edge function
3. Test again

### Issue 2: Invalid Token
**Symptom:** Mapbox API returns 401 Unauthorized

**Solution:**
1. Verify token is correct
2. Check token hasn't expired
3. Regenerate token if needed
4. Update in Supabase secrets

### Issue 3: Rate Limit Exceeded
**Symptom:** Mapbox API returns 429 Too Many Requests

**Solution:**
1. Check Mapbox account usage
2. Wait for rate limit to reset
3. Consider upgrading Mapbox plan
4. Implement caching for validated addresses

### Issue 4: Address Not Found
**Symptom:** Validation returns `isValid: false` with "couldn't find that address"

**Solution:**
1. Verify address format is correct
2. Include ZIP code in address
3. Try a more specific address
4. This is expected behavior for invalid addresses

### Issue 5: Timeout
**Symptom:** "Could not validate delivery address in time"

**Solution:**
1. Check network connection
2. Verify Mapbox API is responding
3. Check Supabase edge function logs
4. This is non-blocking - checkout will proceed

---

## Debugging Steps

1. **Enable Detailed Logging:**
   - Check browser console for detailed logs
   - Check Supabase edge function logs
   - Look for error messages with `❌` prefix

2. **Test with Known Good Address:**
   - Try: "505 51st Street, Brooklyn, NY 11220"
   - This should always work if token is configured

3. **Check Edge Function Response:**
   - Look at Network tab for actual response
   - Verify response format matches expected structure

4. **Verify Environment Variables:**
   - Check Supabase dashboard for `MAPBOX_PUBLIC_TOKEN`
   - Ensure it's set correctly
   - No typos in variable name

---

## Quick Fix Checklist

- [ ] `MAPBOX_PUBLIC_TOKEN` is set in Supabase Edge Functions secrets
- [ ] Token starts with `pk.` (public token)
- [ ] Token is valid and not expired
- [ ] Edge function is deployed
- [ ] Network connection is working
- [ ] Mapbox API is accessible
- [ ] Address format is correct (includes ZIP code)

---

## Still Having Issues?

If the issue persists after checking all of the above:

1. **Check Supabase Edge Function Logs:**
   - Look for detailed error messages
   - Check for stack traces
   - Note the exact error message

2. **Test Edge Function Directly:**
   - Use curl or Postman
   - Verify it works outside of the app
   - Check response format

3. **Contact Support:**
   - Provide browser console logs
   - Provide Supabase edge function logs
   - Provide the address you're testing with
   - Provide error messages you're seeing

---

**Note:** The validation is designed to be non-blocking. Even if it fails, checkout will proceed. The restaurant can manually verify delivery addresses if needed.

