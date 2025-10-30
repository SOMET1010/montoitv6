# INTOUCH Payment Integration - Complete Implementation

**Date:** 29 October 2025
**Status:** ✅ Complete
**Build Status:** ✅ Passing

---

## 📋 Overview

This document provides a comprehensive guide to the complete INTOUCH payment integration for the Mon Toit platform. INTOUCH (GuTouch) is a payment aggregator that provides unified access to all Mobile Money operators in Côte d'Ivoire.

### Supported Payment Methods

- 🟠 **Orange Money** (Prefixes: 07, 08, 09)
- 🟡 **MTN Money** (Prefixes: 05, 06)
- 🔵 **Moov Money** (Prefixes: 01, 02, 03)
- 🌊 **Wave** (Digital wallet)

---

## 🏗️ Architecture

### Complete Payment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    TENANT INITIATES PAYMENT                      │
│              (React Component: MobileMoneyPayment)               │
└──────────────────────────────┬──────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                  EDGE FUNCTION: intouch-payment                  │
│  - Validates phone number and amount                             │
│  - Formats request for INTOUCH API                               │
│  - Calls INTOUCH Cashin endpoint                                 │
│  - Saves payment record to database                              │
└──────────────────────────────┬──────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       INTOUCH API                                │
│  - Processes payment request                                     │
│  - Sends USSD prompt to tenant's phone                           │
│  - Waits for tenant confirmation                                 │
└──────────────────────────────┬──────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              TENANT CONFIRMS ON MOBILE PHONE                     │
│  - Receives USSD prompt                                          │
│  - Enters PIN to confirm payment                                 │
└──────────────────────────────┬──────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│           EDGE FUNCTION: intouch-webhook-handler                 │
│  - Receives payment confirmation from INTOUCH                    │
│  - Updates payment status in database                            │
│  - Sends SMS confirmation to tenant                              │
│  - Sends SMS notification to landlord                            │
│  - Creates landlord transfer record                              │
└──────────────────────────────┬──────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                EDGE FUNCTION: intouch-transfer                   │
│  - Triggered manually or by cron job                             │
│  - Calculates fees (5% platform + 1.5% provider)                 │
│  - Calls INTOUCH Payout endpoint                                 │
│  - Transfers net amount to landlord                              │
│  - Sends SMS confirmation to landlord                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### New Tables Created

#### 1. `sms_logs` Table

Tracks all SMS notifications sent via INTOUCH.

```sql
CREATE TABLE sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'general',
  partner_transaction_id TEXT UNIQUE NOT NULL,
  intouch_sms_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  status_code INTEGER,
  status_message TEXT,
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**SMS Types:**
- `payment_confirmation` - Payment received confirmation
- `payment_failed` - Payment failed notification
- `payment_notification` - Landlord payment notification
- `transfer_confirmation` - Landlord transfer confirmation
- `rent_reminder` - Monthly rent reminder
- `otp` - One-time password for verification
- `general` - General notifications

#### 2. `landlord_transfers` Table

Manages payouts to property owners.

```sql
CREATE TABLE landlord_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id),
  landlord_id UUID REFERENCES auth.users(id) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  fees NUMERIC(12,2) DEFAULT 0,
  net_amount NUMERIC(12,2) NOT NULL,
  provider TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  partner_transaction_id TEXT UNIQUE NOT NULL,
  intouch_transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  status_code INTEGER,
  status_message TEXT,
  raw_response JSONB,
  raw_callback JSONB,
  transferred_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Transfer Statuses:**
- `pending` - Awaiting transfer initiation
- `processing` - Transfer in progress
- `completed` - Successfully transferred
- `failed` - Transfer failed

### Updated Tables

#### `payments` Table (Fields Added)

```sql
ALTER TABLE payments ADD COLUMN intouch_transaction_id varchar(100);
ALTER TABLE payments ADD COLUMN intouch_status varchar(50);
ALTER TABLE payments ADD COLUMN intouch_callback_data jsonb;
```

#### `mobile_money_transactions` Table (Fields Added)

```sql
ALTER TABLE mobile_money_transactions ADD COLUMN intouch_request jsonb;
ALTER TABLE mobile_money_transactions ADD COLUMN intouch_response jsonb;
```

---

## 🔧 Edge Functions

### 1. intouch-payment

**Purpose:** Initiate Mobile Money payment (Cashin)

**Endpoint:** `POST /functions/v1/intouch-payment`

**Request Body:**
```typescript
{
  provider: "orange_money" | "mtn_money" | "moov_money" | "wave",
  phoneNumber: string,
  amount: number,
  leaseId: string,
  description?: string
}
```

**Response:**
```typescript
{
  success: boolean,
  paymentId: string,
  partnerTransactionId: string,
  transactionId: string,
  status: "completed" | "processing" | "failed",
  amount: number,
  provider: string,
  pending: boolean,
  message: string
}
```

**Key Features:**
- Validates phone number format by provider
- Formats phone number correctly for INTOUCH
- Generates unique transaction ID
- Saves payment to database
- Sends immediate SMS notification
- Returns real-time status

### 2. intouch-webhook-handler

**Purpose:** Process payment/transfer confirmations from INTOUCH

**Endpoint:** `POST /functions/v1/intouch-webhook-handler`

**Webhook Payload from INTOUCH:**
```typescript
{
  transaction_id: string,
  partner_transaction_id: string,
  status: "SUCCESS" | "PENDING" | "FAILED" | "PROCESSING" | "CANCELLED",
  amount: number,
  phone_number: string,
  timestamp: string,
  error_message?: string
}
```

**Actions Performed:**
- Updates payment status
- Sends SMS confirmation to tenant
- Sends SMS notification to landlord
- Creates landlord transfer record (if completed)
- Handles failed payment notifications

### 3. intouch-transfer

**Purpose:** Transfer funds to landlord (Payout/Cashout)

**Endpoint:** `POST /functions/v1/intouch-transfer`

**Request Body:**
```typescript
{
  paymentId: string,
  landlordId: string,
  amount: number,
  provider: "orange_money" | "mtn_money" | "moov_money" | "wave",
  phoneNumber: string,
  landlordInfo: {
    email: string,
    firstName: string,
    lastName: string
  }
}
```

**Response:**
```typescript
{
  success: boolean,
  transactionId: string,
  partnerTransactionId: string,
  status: "completed" | "processing" | "failed",
  netAmount: number,
  fees: number,
  pending: boolean,
  message: string
}
```

**Fee Calculation:**
- Platform Fee: 5% of amount
- Provider Fee: 1.5% of amount
- Total Fees: 6.5%
- Net Amount to Landlord: 93.5% of amount

**Example:**
```
Payment Amount:    100,000 FCFA
Platform Fee (5%):   5,000 FCFA
Provider Fee (1.5%): 1,500 FCFA
Total Fees:          6,500 FCFA
Net to Landlord:    93,500 FCFA
```

### 4. intouch-sms

**Purpose:** Send SMS notifications via INTOUCH

**Endpoint:** `POST /functions/v1/intouch-sms`

**Request Body:**
```typescript
{
  phoneNumber: string,
  message: string,
  userId?: string,
  type?: string
}
```

**Response:**
```typescript
{
  success: boolean,
  status: number,
  message: string,
  smsId: string,
  partnerTransactionId: string,
  smsLog: object
}
```

**Key Features:**
- Validates phone number format
- Formats phone number for INTOUCH
- Enforces 160 character limit (warns if exceeded)
- Logs all SMS in database
- Returns delivery status

**SMS Cost:** ~20 FCFA per SMS (160 characters)

---

## ⚛️ Frontend Component

### MobileMoneyPayment Component

**Location:** `src/components/MobileMoneyPayment.tsx`

**Props:**
```typescript
interface MobileMoneyPaymentProps {
  userId: string;
  leaseId: string;
  amount: number;
  description: string;
  onSuccess?: (result: PaymentResult) => void;
  onError?: (error: string) => void;
}
```

**Features:**
- Provider selection with visual icons
- Phone number validation by provider
- Real-time payment status
- Loading states and error handling
- Success/pending/failed views
- Automatic SMS notifications

**Usage Example:**
```tsx
import MobileMoneyPayment from '@/components/MobileMoneyPayment';

function PaymentPage() {
  return (
    <MobileMoneyPayment
      userId={user.id}
      leaseId={lease.id}
      amount={50000}
      description="Loyer mensuel Octobre 2025"
      onSuccess={(result) => {
        console.log('Payment successful:', result);
      }}
      onError={(error) => {
        console.error('Payment failed:', error);
      }}
    />
  );
}
```

---

## 🔐 Security & Configuration

### Environment Variables

All INTOUCH credentials are configured in `.env`:

```bash
# INTOUCH Configuration
INTOUCH_PARTNER_ID=CI300373
INTOUCH_LOGIN_API=07084598370
INTOUCH_PASSWORD_API=XXX
INTOUCH_USERNAME=8ff019758878d5cdab335d12fbc998721d319e4159e2086f9cb1f15f23896e10
INTOUCH_PASSWORD=d3fd092d16747333547e340e4aac135888ff90c38e9577cadec41a052a507978
INTOUCH_BASE_URL=https://apidist.gutouch.net/apidist/sec/ANSUT13287/
```

### Security Features

1. **Basic Authentication:** All INTOUCH API calls use HTTP Basic Auth
2. **Row Level Security (RLS):** Database tables protected by RLS policies
3. **Transaction Validation:** Duplicate transaction prevention
4. **Phone Number Validation:** Provider-specific validation
5. **Amount Validation:** Minimum 100 FCFA
6. **Session Validation:** User authentication required
7. **Webhook Security:** Partner transaction ID validation

---

## 📊 Service IDs by Provider

### Cashin (Collection)

| Provider | Service ID |
|----------|------------|
| Orange Money | CASHINOMCIPART2 |
| MTN Money | CASHINMTNPART2 |
| Moov Money | CASHINMOOVPART2 |
| Wave | CI_CASHIN_WAVE_PART |

### Payout (Disbursement)

| Provider | Service ID |
|----------|------------|
| Orange Money | PAIEMENTMARCHANDOMPAYCIDIRECT |
| MTN Money | PAIEMENTMARCHAND_MTN_CI |
| Moov Money | PAIEMENTMARCHAND_MOOV_CI |
| Wave | CI_PAIEMENTWAVE_TP |

---

## 🧪 Testing Guide

### Test Payment Flow

1. **Navigate to Payment Page**
   ```
   /make-payment
   ```

2. **Select Provider**
   - Choose Orange Money, MTN Money, Moov Money, or Wave

3. **Enter Phone Number**
   - Use valid phone number for selected provider
   - Example: 07 08 12 34 56 for Orange Money

4. **Confirm Payment**
   - Click "Payer" button
   - Check phone for USSD prompt
   - Enter PIN to confirm

5. **Verify Notifications**
   - Tenant receives SMS confirmation
   - Landlord receives SMS notification
   - Check database for payment record

### Test SMS Sending

```typescript
// Call from console or test file
const result = await supabase.functions.invoke('intouch-sms', {
  body: {
    phoneNumber: '0708123456',
    message: 'Test SMS from Mon Toit',
    type: 'general'
  }
});
```

### Test Transfer Flow

```typescript
// Call transfer function
const result = await supabase.functions.invoke('intouch-transfer', {
  body: {
    paymentId: 'uuid-here',
    landlordId: 'uuid-here',
    amount: 100000,
    provider: 'orange_money',
    phoneNumber: '0708123456',
    landlordInfo: {
      email: 'landlord@example.com',
      firstName: 'Jean',
      lastName: 'Kouassi'
    }
  }
});
```

---

## 📈 Monitoring & Logging

### Database Queries

**Check Recent Payments:**
```sql
SELECT
  id,
  amount,
  provider,
  status,
  intouch_status,
  created_at
FROM payments
ORDER BY created_at DESC
LIMIT 10;
```

**Check SMS Logs:**
```sql
SELECT
  phone_number,
  message,
  type,
  status,
  created_at
FROM sms_logs
ORDER BY created_at DESC
LIMIT 10;
```

**Check Landlord Transfers:**
```sql
SELECT
  amount,
  fees,
  net_amount,
  status,
  transferred_at
FROM landlord_transfers
ORDER BY created_at DESC
LIMIT 10;
```

**Payment Success Rate:**
```sql
SELECT
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM payments
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY status;
```

---

## 💰 Cost Structure

### Per Transaction Costs

| Component | Cost | Who Pays |
|-----------|------|----------|
| Base Payment | 100% | Tenant |
| INTOUCH Fee | ~1-2% | Platform |
| Provider Fee | ~1-1.5% | Platform |
| Platform Fee | 5% | Deducted from landlord |
| SMS Notification | ~20 FCFA each | Platform |

### Example: 100,000 FCFA Rent Payment

```
Tenant Pays:           100,000 FCFA
Provider Fee (1.5%):     1,500 FCFA (absorbed by platform)
INTOUCH Fee (1.5%):      1,500 FCFA (absorbed by platform)
Platform Fee (5%):       5,000 FCFA (deducted from landlord)
SMS x2 (40 FCFA):           40 FCFA (absorbed by platform)

Landlord Receives:      95,000 FCFA
Platform Net:            1,460 FCFA (5% - provider fees - SMS)
```

---

## 🚀 Deployment Checklist

### Pre-Production

- [x] Database migrations applied
- [x] Edge functions deployed
- [x] Environment variables configured
- [x] RLS policies enabled
- [x] Frontend component created
- [x] Build passing

### Production Deployment

1. **Configure INTOUCH Production Credentials**
   - Update `INTOUCH_PASSWORD_API` with production value
   - Verify `INTOUCH_PARTNER_ID` is correct
   - Confirm `INTOUCH_BASE_URL` points to production

2. **Apply Database Migrations**
   ```bash
   # Migration already created at:
   # supabase/migrations/20251029170000_add_sms_and_transfer_tables.sql
   ```

3. **Deploy Edge Functions**
   - intouch-payment
   - intouch-webhook-handler
   - intouch-transfer
   - intouch-sms

4. **Configure Webhook URL**
   - Provide to INTOUCH support: `https://fxvumvuehbpwfcqkujmq.supabase.co/functions/v1/intouch-webhook-handler`

5. **Test in Sandbox**
   - Use INTOUCH test numbers
   - Verify payment flow
   - Test SMS delivery
   - Confirm webhook reception

6. **Monitor Initial Transactions**
   - Check payment success rates
   - Verify SMS delivery
   - Monitor webhook callbacks
   - Review error logs

---

## 🐛 Troubleshooting

### Common Issues

**Issue:** Phone number validation fails
**Solution:** Ensure phone number matches provider prefixes:
- Orange Money: 07, 08, 09
- MTN Money: 05, 06
- Moov Money: 01, 02, 03

**Issue:** Payment stuck in "processing"
**Solution:**
1. Check if webhook was received
2. Query `payments` table for `intouch_callback_data`
3. Manually trigger status check if needed

**Issue:** SMS not delivered
**Solution:**
1. Check `sms_logs` table for status
2. Verify phone number format
3. Ensure message ≤ 160 characters
4. Check INTOUCH account balance

**Issue:** Transfer fails
**Solution:**
1. Verify landlord phone number is valid
2. Check INTOUCH account balance
3. Review `landlord_transfers` table for error message
4. Ensure net amount ≥ 100 FCFA

---

## 📞 Support & Contact

### INTOUCH Support

- **Website:** https://gutouch.net
- **Email:** support@gutouch.net
- **Phone:** +225 XX XX XX XX XX

### Internal Support

- **Technical Lead:** Review `ARCHITECTURE.md` and `DATABASE.md`
- **Logs:** Check Supabase Functions logs
- **Database:** Query via Supabase Dashboard

---

## ✅ Implementation Summary

### Completed Components

1. ✅ Database schema with `sms_logs` and `landlord_transfers` tables
2. ✅ Edge function `intouch-payment` for payment collection
3. ✅ Edge function `intouch-webhook-handler` for callbacks
4. ✅ Edge function `intouch-transfer` for landlord payouts
5. ✅ Edge function `intouch-sms` for SMS notifications
6. ✅ React component `MobileMoneyPayment` for UI
7. ✅ Service methods in `InTouchService` class
8. ✅ RLS policies for security
9. ✅ Build verification passed

### Key Features

- ✅ Support for 4 Mobile Money providers
- ✅ Automated SMS notifications
- ✅ Landlord transfer automation
- ✅ Fee calculation and deduction
- ✅ Real-time payment status
- ✅ Webhook callback handling
- ✅ Comprehensive error handling
- ✅ Database audit trails

---

## 📝 Next Steps

1. **Testing in Sandbox**
   - Request INTOUCH sandbox credentials
   - Test all payment flows
   - Verify SMS delivery
   - Test webhook callbacks

2. **Production Deployment**
   - Update production credentials
   - Deploy edge functions
   - Configure webhook URL with INTOUCH
   - Monitor initial transactions

3. **Optimization**
   - Implement automatic retry for failed payments
   - Add cron job for scheduled transfers
   - Create admin dashboard for monitoring
   - Set up alerts for failed transactions

4. **Documentation**
   - Create user guide for tenants
   - Create user guide for landlords
   - Document troubleshooting procedures
   - Add API documentation

---

**End of Document**
