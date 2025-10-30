import type {
  InTouchCashinRequest,
  InTouchPayoutRequest,
  InTouchResponse,
  InTouchTransactionStatus,
  InTouchBalanceResponse,
  InTouchStatus,
  MobileMoneyProvider,
  PaymentStatus,
  INTOUCH_STATUS_MAPPING,
  INTOUCH_SERVICE_IDS,
} from '../types/payment.types';

interface InTouchConfig {
  baseUrl: string;
  username: string;
  password: string;
  partnerId: string;
  loginApi: string;
  passwordApi: string;
}

export class InTouchService {
  private config: InTouchConfig;
  private serviceIds: typeof INTOUCH_SERVICE_IDS;
  private statusMapping: typeof INTOUCH_STATUS_MAPPING;

  constructor() {
    this.config = {
      baseUrl: import.meta.env.VITE_INTOUCH_BASE_URL || 'https://apidist.gutouch.net',
      username: import.meta.env.VITE_INTOUCH_USERNAME || '',
      password: import.meta.env.VITE_INTOUCH_PASSWORD || '',
      partnerId: import.meta.env.VITE_INTOUCH_PARTNER_ID || '',
      loginApi: import.meta.env.VITE_INTOUCH_LOGIN_API || '',
      passwordApi: import.meta.env.VITE_INTOUCH_PASSWORD_API || '',
    };

    this.serviceIds = INTOUCH_SERVICE_IDS;
    this.statusMapping = INTOUCH_STATUS_MAPPING;
  }

  private getAuthHeaders(): Record<string, string> {
    const credentials = btoa(`${this.config.username}:${this.config.password}`);
    return {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    };
  }

  generateTransactionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `MTT${timestamp}${random}`;
  }

  getServiceId(provider: MobileMoneyProvider, type: 'cashin' | 'payout'): string {
    return this.serviceIds[type][provider];
  }

  mapInTouchStatus(intouchStatus: InTouchStatus): PaymentStatus {
    return this.statusMapping[intouchStatus];
  }

  async initiateCashin(
    provider: MobileMoneyProvider,
    phoneNumber: string,
    amount: number,
    callbackUrl: string
  ): Promise<InTouchResponse> {
    const transactionId = this.generateTransactionId();
    const serviceId = this.getServiceId(provider, 'cashin');

    const request: InTouchCashinRequest = {
      service_id: serviceId,
      recipient_phone_number: phoneNumber,
      amount,
      partner_id: this.config.partnerId,
      partner_transaction_id: transactionId,
      login_api: this.config.loginApi,
      password_api: this.config.passwordApi,
      call_back_url: callbackUrl,
    };

    try {
      const response = await fetch(`${this.config.baseUrl}/cashin`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: InTouchResponse = await response.json();
      return data;
    } catch (error) {
      console.error('IN TOUCH cashin error:', error);
      throw error;
    }
  }

  async initiatePayout(
    provider: MobileMoneyProvider,
    phoneNumber: string,
    amount: number,
    recipientInfo: {
      email: string;
      firstName: string;
      lastName: string;
    },
    callbackUrl: string
  ): Promise<InTouchResponse> {
    const transactionId = this.generateTransactionId();
    const serviceCode = this.getServiceId(provider, 'payout');

    const request: InTouchPayoutRequest = {
      idFromClient: transactionId,
      additionnalInfos: {
        recipientEmail: recipientInfo.email,
        recipientFirstName: recipientInfo.firstName,
        recipientLastName: recipientInfo.lastName,
        destinataire: phoneNumber,
      },
      amount,
      callback: callbackUrl,
      recipientNumber: phoneNumber,
      serviceCode,
    };

    try {
      const response = await fetch(`${this.config.baseUrl}/payout`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: InTouchResponse = await response.json();
      return data;
    } catch (error) {
      console.error('IN TOUCH payout error:', error);
      throw error;
    }
  }

  async getTransactionStatus(transactionId: string): Promise<InTouchTransactionStatus> {
    try {
      const url = new URL(`${this.config.baseUrl}/transaction/${transactionId}`);
      url.searchParams.append('loginAgent', this.config.loginApi);
      url.searchParams.append('passwordAgent', this.config.passwordApi);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: InTouchTransactionStatus = await response.json();
      return data;
    } catch (error) {
      console.error('IN TOUCH status check error:', error);
      throw error;
    }
  }

  async getBalance(): Promise<InTouchBalanceResponse> {
    try {
      const url = new URL(`${this.config.baseUrl}/balance`);
      url.searchParams.append('loginAgent', this.config.loginApi);
      url.searchParams.append('passwordAgent', this.config.passwordApi);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: InTouchBalanceResponse = await response.json();
      return data;
    } catch (error) {
      console.error('IN TOUCH balance check error:', error);
      throw error;
    }
  }

  validateWebhookData(webhookData: unknown): boolean {
    if (!webhookData || typeof webhookData !== 'object') {
      return false;
    }

    const data = webhookData as Record<string, unknown>;

    return (
      typeof data.transaction_id === 'string' &&
      typeof data.partner_transaction_id === 'string' &&
      typeof data.status === 'string' &&
      typeof data.amount === 'number' &&
      typeof data.phone_number === 'string'
    );
  }

  async sendSMS(
    phoneNumber: string,
    message: string,
    userId?: string,
    type: string = 'general'
  ): Promise<{ success: boolean; smsId?: string; error?: string }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/sms`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          recipient_phone_number: phoneNumber,
          message: message,
          partner_id: this.config.partnerId,
          partner_transaction_id: this.generateTransactionId(),
          login_api: this.config.loginApi,
          password_api: this.config.passwordApi,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        smsId: data.sms_id || data.messageId,
      };
    } catch (error) {
      console.error('INTOUCH SMS error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async initiateTransfer(
    provider: MobileMoneyProvider,
    phoneNumber: string,
    amount: number,
    recipientInfo: {
      email: string;
      firstName: string;
      lastName: string;
    },
    callbackUrl: string
  ): Promise<InTouchResponse> {
    const transactionId = this.generateTransactionId();
    const serviceCode = this.getServiceId(provider, 'payout');

    const request: InTouchPayoutRequest = {
      idFromClient: transactionId,
      additionnalInfos: {
        recipientEmail: recipientInfo.email,
        recipientFirstName: recipientInfo.firstName,
        recipientLastName: recipientInfo.lastName,
        destinataire: phoneNumber,
      },
      amount,
      callback: callbackUrl,
      recipientNumber: phoneNumber,
      serviceCode,
    };

    try {
      const response = await fetch(`${this.config.baseUrl}/payout`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: InTouchResponse = await response.json();
      return data;
    } catch (error) {
      console.error('INTOUCH transfer error:', error);
      throw error;
    }
  }
}

export const inTouchService = new InTouchService();
