import { supabase } from '../../lib/supabase';
import type {
  Payment,
  PaymentInsert,
  PaymentUpdate,
  PaymentRequest,
  PaymentResponse,
  PaymentFilters,
  MobileMoneyTransaction,
} from '../../types/payment.types';

export class PaymentRepository {
  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const apiUrl = `${import.meta.env['VITE_SUPABASE_URL']}/functions/v1/intouch-payment`;

      const headers = {
        Authorization: `Bearer ${import.meta.env['VITE_SUPABASE_ANON_KEY']}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          provider: request.provider,
          phoneNumber: request.phoneNumber,
          amount: request.amount,
          leaseId: request.leaseId,
          description: request.description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Payment failed' }));
        throw new Error(errorData.error || 'Payment initiation failed');
      }

      const data = await response.json();

      return {
        paymentId: data.paymentId,
        transactionReference: data.transactionId,
        status: data.status,
        amount: data.amount,
        fees: data.fees || 0,
        totalAmount: data.totalAmount || data.amount,
        provider: data.provider,
        message: data.message,
      };
    } catch (error) {
      console.error('Payment initiation error:', error);
      throw error;
    }
  }

  async getPaymentById(paymentId: string): Promise<Payment | null> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching payment:', error);
      throw error;
    }
  }

  async getPaymentByReference(reference: string): Promise<Payment | null> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('transaction_reference', reference)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching payment by reference:', error);
      throw error;
    }
  }

  async getPaymentHistory(filters: PaymentFilters): Promise<Payment[]> {
    try {
      let query = supabase.from('payments').select('*');

      if (filters.tenantId) {
        query = query.eq('tenant_id', filters.tenantId);
      }

      if (filters.leaseId) {
        query = query.eq('lease_id', filters.leaseId);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.provider) {
        query = query.eq('provider', filters.provider);
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  }

  async getTransactionById(transactionId: string): Promise<MobileMoneyTransaction | null> {
    try {
      const { data, error } = await supabase
        .from('mobile_money_transactions')
        .select('*')
        .eq('id', transactionId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw error;
    }
  }

  async updatePaymentStatus(
    paymentId: string,
    updates: PaymentUpdate
  ): Promise<Payment | null> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update(updates)
        .eq('id', paymentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  }

  async getPendingPayments(tenantId: string): Promise<Payment[]> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('tenant_id', tenantId)
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      throw error;
    }
  }

  async getLeasePayments(leaseId: string): Promise<Payment[]> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('lease_id', leaseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching lease payments:', error);
      throw error;
    }
  }

  async getPaymentStatistics(tenantId: string) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('status, provider, amount')
        .eq('tenant_id', tenantId);

      if (error) throw error;

      const stats = {
        totalPayments: data?.length || 0,
        totalAmount: data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
        successfulPayments: data?.filter((p) => p.status === 'completed').length || 0,
        failedPayments: data?.filter((p) => p.status === 'failed').length || 0,
        pendingPayments: data?.filter((p) => p.status === 'processing' || p.status === 'pending').length || 0,
        averageAmount: 0,
        byProvider: {} as Record<string, number>,
        byStatus: {} as Record<string, number>,
      };

      if (stats.totalPayments > 0) {
        stats.averageAmount = stats.totalAmount / stats.totalPayments;
      }

      data?.forEach((payment) => {
        if (payment.provider) {
          stats.byProvider[payment.provider] = (stats.byProvider[payment.provider] || 0) + 1;
        }
        if (payment.status) {
          stats.byStatus[payment.status] = (stats.byStatus[payment.status] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error fetching payment statistics:', error);
      throw error;
    }
  }
}

export const paymentRepository = new PaymentRepository();
