# INTOUCH Integration - Deployment Checklist

## ✅ Implementation Status: COMPLETE

All code has been written and the build is passing. Follow this checklist to deploy to production.

---

## 📋 Pre-Deployment Checklist

### 1. Verify Local Files

- [x] Database migration created: `supabase/migrations/20251029170000_add_sms_and_transfer_tables.sql`
- [x] Edge function `intouch-payment` updated
- [x] Edge function `intouch-webhook-handler` updated
- [x] Edge function `intouch-sms` created
- [x] Edge function `intouch-transfer` created
- [x] Frontend component `MobileMoneyPayment.tsx` created
- [x] Service methods added to `InTouchService`
- [x] Build passing successfully
- [x] Documentation complete

### 2. Review Configuration

Check your `.env` file has all required variables:

```bash
# Review these values
INTOUCH_PARTNER_ID=CI300373
INTOUCH_LOGIN_API=07084598370
INTOUCH_PASSWORD_API=XXX  # ⚠️ Need production value
INTOUCH_USERNAME=8ff019758878d5cdab335d12fbc998721d319e4159e2086f9cb1f15f23896e10
INTOUCH_PASSWORD=d3fd092d16747333547e340e4aac135888ff90c38e9577cadec41a052a507978
INTOUCH_BASE_URL=https://apidist.gutouch.net/apidist/sec/ANSUT13287/
```

**Action Required:** Get production `INTOUCH_PASSWORD_API` from INTOUCH support

---

## 🚀 Deployment Steps

### Step 1: Apply Database Migration

The migration creates two new tables: `sms_logs` and `landlord_transfers`

**Using Supabase CLI:**
```bash
# If you have Supabase CLI installed
supabase db push
```

**Using Supabase Dashboard:**
1. Go to https://supabase.com/dashboard/project/fxvumvuehbpwfcqkujmq/editor
2. Navigate to SQL Editor
3. Copy contents of `supabase/migrations/20251029170000_add_sms_and_transfer_tables.sql`
4. Paste and run the SQL
5. Verify tables created:
   ```sql
   SELECT * FROM information_schema.tables
   WHERE table_name IN ('sms_logs', 'landlord_transfers');
   ```

### Step 2: Deploy Edge Functions

You need to deploy 4 edge functions to Supabase.

**Option A: Using Supabase Dashboard**
1. Go to Edge Functions section
2. For each function below, create/update it:

**Functions to deploy:**
- `intouch-payment` (EXISTING - needs update)
- `intouch-webhook-handler` (EXISTING - needs update)
- `intouch-sms` (NEW)
- `intouch-transfer` (NEW)

**For each function:**
1. Click "Deploy new function" or "Update function"
2. Copy the code from `supabase/functions/[function-name]/index.ts`
3. Paste into the editor
4. Deploy

**Option B: Automated Deploy Script**

Create a deploy script if you have access to Supabase CLI:

```bash
#!/bin/bash
# deploy-intouch-functions.sh

echo "Deploying INTOUCH edge functions..."

supabase functions deploy intouch-payment
supabase functions deploy intouch-webhook-handler
supabase functions deploy intouch-sms
supabase functions deploy intouch-transfer

echo "✅ All functions deployed!"
```

### Step 3: Configure Environment Secrets

Make sure all secrets are set in Supabase:

```bash
# If using CLI
supabase secrets set INTOUCH_PARTNER_ID=CI300373
supabase secrets set INTOUCH_LOGIN_API=07084598370
supabase secrets set INTOUCH_PASSWORD_API=your-production-password
supabase secrets set INTOUCH_USERNAME=8ff019758878d5cdab335d12fbc998721d319e4159e2086f9cb1f15f23896e10
supabase secrets set INTOUCH_PASSWORD=d3fd092d16747333547e340e4aac135888ff90c38e9577cadec41a052a507978
supabase secrets set INTOUCH_BASE_URL=https://apidist.gutouch.net/apidist/sec/ANSUT13287/
```

**Or via Dashboard:**
1. Go to Project Settings → Edge Functions
2. Add each environment variable

### Step 4: Configure INTOUCH Webhook

Provide this webhook URL to INTOUCH support team:

```
https://fxvumvuehbpwfcqkujmq.supabase.co/functions/v1/intouch-webhook-handler
```

**Email to send to INTOUCH:**
```
Subject: Webhook URL Configuration for Partner ID CI300373

Hello INTOUCH Support Team,

Please configure our webhook URL for payment and transfer notifications:

Webhook URL: https://fxvumvuehbpwfcqkujmq.supabase.co/functions/v1/intouch-webhook-handler

Partner ID: CI300373
Login API: 07084598370

Events to notify:
- Payment confirmations (Cashin)
- Transfer confirmations (Payout)
- Payment failures
- Transfer failures

Thank you!
```

### Step 5: Test in Sandbox (Optional but Recommended)

Before going live, test with INTOUCH sandbox:

1. Get sandbox credentials from INTOUCH
2. Update environment variables temporarily:
   ```bash
   INTOUCH_BASE_URL=https://testapi.gutouch.net/apidist/sec/ANSUT13287/
   # Use sandbox credentials
   ```
3. Run test payments
4. Verify webhook callbacks
5. Check SMS delivery
6. Test transfer functionality

**Test Script:**
```typescript
// Test payment
const payment = await supabase.functions.invoke('intouch-payment', {
  body: {
    provider: 'orange_money',
    phoneNumber: '0708123456', // INTOUCH test number
    amount: 1000, // Test amount
    leaseId: 'test-lease-id',
    description: 'Test payment'
  }
});

console.log('Payment result:', payment);
```

### Step 6: Deploy Frontend

Build and deploy your frontend application:

```bash
# Build the app
npm run build

# Deploy to your hosting (Netlify, Vercel, etc.)
# The MobileMoneyPayment component is ready to use
```

### Step 7: Monitor Initial Transactions

After deployment, monitor the first transactions:

**Check Logs:**
```sql
-- Recent payments
SELECT * FROM payments
ORDER BY created_at DESC
LIMIT 10;

-- SMS delivery
SELECT * FROM sms_logs
ORDER BY created_at DESC
LIMIT 10;

-- Landlord transfers
SELECT * FROM landlord_transfers
ORDER BY created_at DESC
LIMIT 10;
```

**Check Edge Function Logs:**
1. Go to Supabase Dashboard → Edge Functions
2. Select each function
3. View logs for errors

---

## 🧪 Testing Checklist

### Payment Flow Test

- [ ] Navigate to a property with active lease
- [ ] Click "Make Payment" or use MobileMoneyPayment component
- [ ] Select Orange Money
- [ ] Enter valid phone number (07xxxxxxxx)
- [ ] Enter amount
- [ ] Click "Payer"
- [ ] Verify payment initiates successfully
- [ ] Check phone for USSD prompt
- [ ] Confirm payment on phone
- [ ] Wait for webhook callback
- [ ] Verify SMS received by tenant
- [ ] Verify SMS received by landlord
- [ ] Check payment status in database

### SMS Test

- [ ] Send test SMS via `intouch-sms` function
- [ ] Verify SMS delivered to phone
- [ ] Check `sms_logs` table for record
- [ ] Verify status is "sent"

### Transfer Test

- [ ] Create or use existing completed payment
- [ ] Call `intouch-transfer` function
- [ ] Verify landlord phone number is valid
- [ ] Check transfer initiates
- [ ] Wait for confirmation
- [ ] Verify SMS to landlord
- [ ] Check `landlord_transfers` table
- [ ] Verify net amount calculation (93.5% of payment)

### Error Handling Test

- [ ] Try payment with invalid phone number → Should fail with clear error
- [ ] Try payment with amount < 100 FCFA → Should fail
- [ ] Try payment with wrong provider prefix → Should fail
- [ ] Try transfer with insufficient balance → Should handle gracefully

---

## 📊 Monitoring

### Key Metrics to Track

**Success Rates:**
```sql
-- Payment success rate (last 7 days)
SELECT
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM payments
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY status;
```

**SMS Delivery:**
```sql
-- SMS delivery rate (last 7 days)
SELECT
  status,
  COUNT(*) as count
FROM sms_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY status;
```

**Transfer Processing:**
```sql
-- Transfer status (last 7 days)
SELECT
  status,
  COUNT(*) as count,
  SUM(net_amount) as total_transferred
FROM landlord_transfers
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY status;
```

### Set Up Alerts

Create alerts for:
- Payment failure rate > 5%
- SMS delivery failure rate > 10%
- Transfer failure rate > 5%
- Webhook not received after 5 minutes
- Any payment stuck in "processing" for > 1 hour

---

## 🐛 Troubleshooting

### Common Issues After Deployment

**Issue: Payments fail immediately**
- Check INTOUCH credentials are correct
- Verify INTOUCH_BASE_URL includes agency code
- Check edge function logs for detailed error

**Issue: Webhooks not received**
- Verify webhook URL configured with INTOUCH
- Check edge function logs for incoming requests
- Ensure function is deployed and accessible

**Issue: SMS not delivered**
- Check phone number format
- Verify INTOUCH SMS credits available
- Check `sms_logs` table for error messages
- Contact INTOUCH support

**Issue: Transfers fail**
- Verify landlord phone number is valid for provider
- Check INTOUCH account balance
- Ensure net amount >= 100 FCFA
- Review error in `landlord_transfers` table

---

## 📞 Support Contacts

**INTOUCH Support:**
- Website: https://gutouch.net
- Email: support@gutouch.net
- Phone: Contact for 24/7 support number

**Internal Team:**
- Review documentation: `INTOUCH_INTEGRATION_COMPLETE.md`
- Check quick reference: `INTOUCH_QUICK_REFERENCE.md`
- Review logs in Supabase Dashboard

---

## ✅ Post-Deployment Verification

After everything is deployed, verify:

- [ ] Database tables created (`sms_logs`, `landlord_transfers`)
- [ ] All 4 edge functions deployed and running
- [ ] Environment variables configured
- [ ] Webhook URL provided to INTOUCH
- [ ] Frontend component accessible
- [ ] Test payment completed successfully
- [ ] SMS notifications working
- [ ] Webhook callbacks received
- [ ] Transfer functionality tested
- [ ] Monitoring and alerts set up
- [ ] Team trained on new features

---

## 🎉 Launch Ready!

Once all checkboxes are complete, your INTOUCH integration is fully deployed and ready for production use.

**Features Available:**
- ✅ Mobile Money payments (Orange, MTN, Moov, Wave)
- ✅ Automatic SMS notifications
- ✅ Landlord transfer automation
- ✅ Real-time payment tracking
- ✅ Webhook processing
- ✅ Complete audit trails

---

**Good luck with your deployment! 🚀**
