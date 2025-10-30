/**
 * Payment System Types
 * Types and interfaces for Mobile Money payment system
 */

import type { Database } from '../lib/database.types';

// Database types
export type Payment = Database['public']['Tables']['payments']['Row'];
export type PaymentInsert = Database['public']['Tables']['payments']['Insert'];
export type PaymentUpdate = Database['public']['Tables']['payments']['Update'];

export type MobileMoneyTransaction =
  Database['public']['Tables']['mobile_money_transactions']['Row'];

// Payment status
export type PaymentStatus =
  | 'pending'
  | 'initiated'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'expired';

// Mobile Money providers
export type MobileMoneyProvider = 'orange_money' | 'mtn_money' | 'moov_money' | 'wave';

// Phone number prefixes by provider
export const PROVIDER_PREFIXES: Record<MobileMoneyProvider, string[]> = {
  orange_money: ['07', '227'],
  mtn_money: ['05', '054', '055', '056'],
  moov_money: ['01'],
  wave: [], // Wave uses email or special numbers
};

// Transaction fees by provider (percentage)
export const PROVIDER_FEES: Record<MobileMoneyProvider, number> = {
  orange_money: 1.5,
  mtn_money: 1.5,
  moov_money: 1.2,
  wave: 1.0,
};

// Platform commission
export const PLATFORM_FEE_PERCENTAGE = 5;

// Payment request from client
export interface PaymentRequest {
  leaseId: string;
  amount: number;
  provider: MobileMoneyProvider;
  phoneNumber: string;
  description?: string;
}

// Payment response to client
export interface PaymentResponse {
  paymentId: string;
  transactionReference: string;
  status: PaymentStatus;
  amount: number;
  fees: number;
  totalAmount: number;
  provider: MobileMoneyProvider;
  message: string;
}

// Payment initiation request to Edge Function
export interface PaymentInitiationRequest {
  paymentId: string;
  provider: MobileMoneyProvider;
  phoneNumber: string;
  amount: number;
  transactionReference: string;
  metadata: {
    leaseId: string;
    tenantId: string;
    description: string;
  };
}

// Payment initiation response from Edge Function
export interface PaymentInitiationResponse {
  success: boolean;
  transactionId: string;
  externalTransactionId?: string;
  status: PaymentStatus;
  message: string;
  error?: string;
}

// Webhook payload from mobile money provider
export interface WebhookPayload {
  provider: MobileMoneyProvider;
  transactionId: string;
  externalTransactionId: string;
  status: 'success' | 'failed' | 'pending';
  amount: number;
  phoneNumber: string;
  timestamp: string;
  signature: string;
  metadata?: Record<string, unknown>;
}

// Provider-specific interfaces

export interface OrangeMoneyRequest {
  merchant_key: string;
  currency: string;
  order_id: string;
  amount: number;
  return_url: string;
  cancel_url: string;
  notif_url: string;
  lang: string;
  reference: string;
}

export interface OrangeMoneyResponse {
  status: number;
  message: string;
  pay_token: string;
  payment_url: string;
  notif_token: string;
}

export interface MTNMoneyRequest {
  amount: string;
  currency: string;
  externalId: string;
  payer: {
    partyIdType: string;
    partyId: string;
  };
  payerMessage: string;
  payeeNote: string;
}

export interface MTNMoneyResponse {
  status: string;
  financialTransactionId?: string;
  externalId: string;
  amount: string;
  currency: string;
  payer: {
    partyIdType: string;
    partyId: string;
  };
  payerMessage: string;
  payeeNote: string;
}

export interface MoovMoneyRequest {
  amount: number;
  currency: string;
  reference: string;
  phone_number: string;
  description: string;
  callback_url: string;
}

export interface MoovMoneyResponse {
  success: boolean;
  transaction_id: string;
  status: string;
  message: string;
}

export interface WaveRequest {
  amount: number;
  currency: string;
  error_url: string;
  success_url: string;
  client_reference: string;
}

export interface WaveResponse {
  id: string;
  wave_launch_url: string;
  business_name: string;
  currency: string;
  amount: number;
  payment_status: string;
}

// Payment calculation result
export interface PaymentCalculation {
  baseAmount: number;
  providerFee: number;
  platformFee: number;
  totalAmount: number;
  landlordAmount: number;
}

// Payment filters for history
export interface PaymentFilters {
  tenantId?: string;
  leaseId?: string;
  status?: PaymentStatus;
  provider?: MobileMoneyProvider;
  startDate?: Date;
  endDate?: Date;
}

// Payment receipt data
export interface PaymentReceipt {
  paymentId: string;
  receiptNumber: string;
  date: Date;
  tenant: {
    name: string;
    email: string;
    phone: string;
  };
  property: {
    title: string;
    address: string;
  };
  lease: {
    id: string;
    startDate: Date;
    monthlyRent: number;
  };
  payment: {
    amount: number;
    fees: number;
    totalAmount: number;
    method: string;
    transactionReference: string;
  };
}

// Landlord transfer
export interface LandlordTransfer {
  id: string;
  paymentId: string;
  landlordId: string;
  amount: number;
  fees: number;
  netAmount: number;
  provider: MobileMoneyProvider;
  phoneNumber: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transferredAt?: Date;
  createdAt: Date;
}

// Payment reminder
export interface PaymentReminder {
  leaseId: string;
  tenantId: string;
  amount: number;
  dueDate: Date;
  daysUntilDue: number;
  lastReminderSent?: Date;
  reminderType: 'email' | 'sms' | 'push' | 'all';
}

// Payment statistics
export interface PaymentStatistics {
  totalPayments: number;
  totalAmount: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  averageAmount: number;
  byProvider: Record<MobileMoneyProvider, number>;
  byStatus: Record<PaymentStatus, number>;
}

// Provider detection result
export interface ProviderDetectionResult {
  provider: MobileMoneyProvider | null;
  isValid: boolean;
  phoneNumber: string;
  formattedNumber: string;
  error?: string;
}

// Payment error types
export enum PaymentErrorCode {
  INVALID_PHONE = 'INVALID_PHONE',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  DUPLICATE_TRANSACTION = 'DUPLICATE_TRANSACTION',
  CANCELLED_BY_USER = 'CANCELLED_BY_USER',
  INVALID_OTP = 'INVALID_OTP',
  TRANSACTION_EXPIRED = 'TRANSACTION_EXPIRED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface PaymentError {
  code: PaymentErrorCode;
  message: string;
  details?: unknown;
  retryable: boolean;
}

export interface InTouchCashinRequest {
  service_id: string;
  recipient_phone_number: string;
  amount: number;
  partner_id: string;
  partner_transaction_id: string;
  login_api: string;
  password_api: string;
  call_back_url: string;
}

export interface InTouchPayoutRequest {
  idFromClient: string;
  additionnalInfos: {
    recipientEmail: string;
    recipientFirstName: string;
    recipientLastName: string;
    destinataire: string;
  };
  amount: number;
  callback: string;
  recipientNumber: string;
  serviceCode: string;
}

export interface InTouchResponse {
  status: string;
  message: string;
  transaction_id?: string;
  data?: unknown;
  code?: string;
}

export interface InTouchWebhook {
  transaction_id: string;
  partner_transaction_id: string;
  status: string;
  amount: number;
  phone_number: string;
  timestamp: string;
  service_id?: string;
  error_message?: string;
}

export interface InTouchTransactionStatus {
  transaction_id: string;
  partner_transaction_id: string;
  status: InTouchStatus;
  amount: number;
  phone_number: string;
  service_id: string;
  created_at: string;
  updated_at: string;
  error_message?: string;
}

export interface InTouchBalanceResponse {
  status: string;
  balance: number;
  currency: string;
  timestamp: string;
}

export type InTouchStatus =
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'PROCESSING'
  | 'CANCELLED';

export const INTOUCH_SERVICE_IDS = {
  cashin: {
    orange_money: 'CASHINOMCIPART2',
    mtn_money: 'CASHINMTNPART2',
    moov_money: 'CASHINMOOVPART2',
    wave: 'CI_CASHIN_WAVE_PART',
  },
  payout: {
    orange_money: 'PAIEMENTMARCHANDOMPAYCIDIRECT',
    mtn_money: 'PAIEMENTMARCHAND_MTN_CI',
    moov_money: 'PAIEMENTMARCHAND_MOOV_CI',
    wave: 'CI_PAIEMENTWAVE_TP',
  },
} as const;

export const INTOUCH_STATUS_MAPPING: Record<InTouchStatus, PaymentStatus> = {
  PENDING: 'processing',
  SUCCESS: 'completed',
  FAILED: 'failed',
  PROCESSING: 'processing',
  CANCELLED: 'cancelled',
};
