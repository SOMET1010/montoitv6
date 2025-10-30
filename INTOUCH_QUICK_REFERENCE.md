# INTOUCH Integration - Quick Reference Guide

## 🚀 Quick Start

### Make a Payment (Frontend)

```tsx
import MobileMoneyPayment from '@/components/MobileMoneyPayment';

<MobileMoneyPayment
  userId={user.id}
  leaseId={lease.id}
  amount={50000}
  description="Loyer Octobre 2025"
  onSuccess={(result) => console.log('Success!', result)}
  onError={(error) => console.error('Error:', error)}
/>
```

### Send SMS

```typescript
const { data, error } = await supabase.functions.invoke('intouch-sms', {
  body: {
    phoneNumber: '0708123456',
    message: 'Votre loyer est dû',
    userId: user.id,
    type: 'rent_reminder'
  }
});
```

### Initiate Transfer to Landlord

```typescript
const { data, error } = await supabase.functions.invoke('intouch-transfer', {
  body: {
    paymentId: payment.id,
    landlordId: landlord.id,
    amount: 100000,
    provider: 'orange_money',
    phoneNumber: '0708123456',
    landlordInfo: {
      email: 'landlord@email.com',
      firstName: 'Jean',
      lastName: 'KOUASSI'
    }
  }
});
```

---

## 📱 Phone Number Formats

| Provider | Prefixes | Example |
|----------|----------|---------|
| 🟠 Orange Money | 07, 08, 09 | 0708123456 |
| 🟡 MTN Money | 05, 06 | 0554123456 |
| 🔵 Moov Money | 01, 02, 03 | 0102123456 |
| 🌊 Wave | Any | 0708123456 |

---

## 💰 Fee Structure

```
Payment: 100,000 FCFA
├─ Platform Fee (5%):    5,000 FCFA
├─ Provider Fee (1.5%):  1,500 FCFA
└─ Net to Landlord:     93,500 FCFA
```

---

## 📊 Database Queries

### Check Payment Status

```sql
SELECT
  partner_transaction_id,
  amount,
  status,
  intouch_status,
  created_at
FROM payments
WHERE tenant_id = 'user-uuid'
ORDER BY created_at DESC
LIMIT 5;
```

### Check SMS Delivery

```sql
SELECT
  phone_number,
  message,
  status,
  created_at
FROM sms_logs
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC
LIMIT 5;
```

### Check Landlord Transfers

```sql
SELECT
  net_amount,
  status,
  transferred_at
FROM landlord_transfers
WHERE landlord_id = 'user-uuid'
ORDER BY created_at DESC;
```

---

## 🔧 API Endpoints

| Function | Endpoint | Method |
|----------|----------|--------|
| Payment | `/functions/v1/intouch-payment` | POST |
| Transfer | `/functions/v1/intouch-transfer` | POST |
| SMS | `/functions/v1/intouch-sms` | POST |
| Webhook | `/functions/v1/intouch-webhook-handler` | POST |

---

## 🎯 Payment Statuses

| Status | Description |
|--------|-------------|
| `pending` | Payment initiated, awaiting confirmation |
| `processing` | Payment in progress |
| `completed` | Payment successful |
| `failed` | Payment failed |
| `cancelled` | Payment cancelled |

---

## 📝 SMS Types

- `payment_confirmation` - Tenant payment received
- `payment_failed` - Tenant payment failed
- `payment_notification` - Landlord payment received
- `transfer_confirmation` - Landlord transfer complete
- `rent_reminder` - Monthly rent due reminder
- `otp` - One-time password
- `general` - General notification

---

## 🔐 Environment Variables

```bash
INTOUCH_PARTNER_ID=CI300373
INTOUCH_LOGIN_API=07084598370
INTOUCH_PASSWORD_API=XXX
INTOUCH_USERNAME=8ff0197...
INTOUCH_PASSWORD=d3fd092...
INTOUCH_BASE_URL=https://apidist.gutouch.net/apidist/sec/ANSUT13287/
```

---

## 🐛 Quick Troubleshooting

**Payment stuck in processing?**
```sql
-- Check if webhook was received
SELECT intouch_callback_data
FROM payments
WHERE partner_transaction_id = 'MTT...';
```

**SMS not delivered?**
```sql
-- Check SMS status
SELECT status, status_message
FROM sms_logs
WHERE partner_transaction_id = 'MTT_SMS...';
```

**Transfer failed?**
```sql
-- Check transfer error
SELECT status_message, raw_response
FROM landlord_transfers
WHERE partner_transaction_id = 'MTT_TRANSFER...';
```

---

## 📞 Support

- **INTOUCH:** support@gutouch.net
- **Docs:** `/INTOUCH_INTEGRATION_COMPLETE.md`
- **Logs:** Supabase Functions Dashboard
