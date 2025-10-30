import { supabase } from '../lib/supabase';

export interface ApiKeys {
  [key: string]: string;
}

class ApiKeyService {
  async getKeys(serviceName: string): Promise<ApiKeys | null> {
    try {
      const { data, error } = await supabase.rpc('get_api_keys', {
        service: serviceName
      });

      if (error) {
        console.error(`Error getting keys for ${serviceName}:`, error);
        throw error;
      }

      return data as ApiKeys;
    } catch (error) {
      console.error('Error in getKeys:', error);
      return null;
    }
  }

  async updateKeys(serviceName: string, keys: ApiKeys): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ keys, updated_at: new Date().toISOString() })
        .eq('service_name', serviceName);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating keys:', error);
      return false;
    }
  }

  async logUsage(
    serviceName: string,
    action: string,
    status: 'success' | 'error',
    requestData?: any,
    responseData?: any,
    errorMessage?: string
  ): Promise<void> {
    try {
      await supabase.rpc('log_api_usage', {
        p_service_name: serviceName,
        p_action: action,
        p_status: status,
        p_request_data: requestData ? JSON.stringify(requestData) : null,
        p_response_data: responseData ? JSON.stringify(responseData) : null,
        p_error_message: errorMessage || null,
        p_ip_address: null,
        p_user_id: null
      });
    } catch (error) {
      console.error('Error logging API usage:', error);
    }
  }

  async getAllKeys(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('service_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  }

  async toggleActive(serviceId: string, isActive: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: isActive })
        .eq('id', serviceId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error toggling service:', error);
      return false;
    }
  }

  async toggleEnvironment(serviceId: string, environment: 'sandbox' | 'production'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ environment })
        .eq('id', serviceId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error toggling environment:', error);
      return false;
    }
  }

  async sendEmail(to: string, template: string, data: any): Promise<boolean> {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ to, template, data })
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      await this.logUsage('resend', 'send_email', 'success', { to, template });
      return true;
    } catch (error: any) {
      console.error('Error sending email:', error);
      await this.logUsage('resend', 'send_email', 'error', { to, template }, null, error.message);
      return false;
    }
  }

  async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ phoneNumber, message })
      });

      if (!response.ok) {
        throw new Error('Failed to send SMS');
      }

      await this.logUsage('brevo', 'send_sms', 'success', { phoneNumber });
      return true;
    } catch (error: any) {
      console.error('Error sending SMS:', error);
      await this.logUsage('brevo', 'send_sms', 'error', { phoneNumber }, null, error.message);
      return false;
    }
  }

  async processMobileMoneyPayment(
    provider: 'orange_money' | 'mtn_money' | 'moov_money' | 'wave',
    phoneNumber: string,
    amount: number,
    reference: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mobile-money-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ provider, phoneNumber, amount, reference })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Payment failed');
      }

      await this.logUsage(provider, 'process_payment', 'success', { phoneNumber, amount, reference });
      return { success: true, transactionId: result.transactionId };
    } catch (error: any) {
      console.error('Error processing payment:', error);
      await this.logUsage(provider, 'process_payment', 'error', { phoneNumber, amount, reference }, null, error.message);
      return { success: false, error: error.message };
    }
  }
}

export const apiKeyService = new ApiKeyService();
