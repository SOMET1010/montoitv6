import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  Payment,
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
  MobileMoneyProvider,
  PaymentCalculation,
  PaymentError,
} from '../types/payment.types';

interface PaymentState {
  // Current payment flow
  currentPayment: PaymentResponse | null;
  paymentInProgress: boolean;
  paymentError: PaymentError | null;

  // Payment history
  payments: Payment[];
  paymentsFetching: boolean;

  // Selected payment details (for form)
  selectedProvider: MobileMoneyProvider | null;
  phoneNumber: string;
  amount: number;
  calculation: PaymentCalculation | null;

  // Actions
  setProvider: (provider: MobileMoneyProvider) => void;
  setPhoneNumber: (phone: string) => void;
  setAmount: (amount: number) => void;
  calculateFees: () => void;

  initiatePayment: (request: PaymentRequest) => Promise<PaymentResponse>;
  checkPaymentStatus: (paymentId: string) => Promise<PaymentStatus>;
  cancelPayment: (paymentId: string) => Promise<void>;

  fetchPaymentHistory: (tenantId: string) => Promise<void>;
  clearCurrentPayment: () => void;
  clearError: () => void;
  reset: () => void;
}

const PROVIDER_FEES = {
  orange_money: 1.5,
  mtn_money: 1.5,
  moov_money: 1.2,
  wave: 1.0,
};

const PLATFORM_FEE_PERCENTAGE = 5;

export const usePaymentStore = create<PaymentState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentPayment: null,
        paymentInProgress: false,
        paymentError: null,
        payments: [],
        paymentsFetching: false,
        selectedProvider: null,
        phoneNumber: '',
        amount: 0,
        calculation: null,

        // Set provider
        setProvider: (provider: MobileMoneyProvider) => {
          set({ selectedProvider: provider });
          get().calculateFees();
        },

        // Set phone number
        setPhoneNumber: (phone: string) => {
          set({ phoneNumber: phone });
        },

        // Set amount
        setAmount: (amount: number) => {
          set({ amount });
          get().calculateFees();
        },

        // Calculate fees
        calculateFees: () => {
          const { amount, selectedProvider } = get();

          if (!amount || !selectedProvider) {
            set({ calculation: null });
            return;
          }

          const providerFeeRate = PROVIDER_FEES[selectedProvider];
          const providerFee = (amount * providerFeeRate) / 100;
          const totalAmount = amount + providerFee;
          const platformFee = (amount * PLATFORM_FEE_PERCENTAGE) / 100;
          const landlordAmount = amount - platformFee;

          set({
            calculation: {
              baseAmount: amount,
              providerFee,
              platformFee,
              totalAmount,
              landlordAmount,
            },
          });
        },

        // Initiate payment
        initiatePayment: async (request: PaymentRequest) => {
          set({ paymentInProgress: true, paymentError: null });

          try {
            // TODO: Call payment repository to initiate payment
            // For now, simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const response: PaymentResponse = {
              paymentId: crypto.randomUUID(),
              transactionReference: `TXN${Date.now()}`,
              status: 'initiated',
              amount: request.amount,
              fees:
                (request.amount * PROVIDER_FEES[request.provider]) / 100,
              totalAmount:
                request.amount +
                (request.amount * PROVIDER_FEES[request.provider]) / 100,
              provider: request.provider,
              message:
                'Paiement initié. Veuillez valider sur votre téléphone.',
            };

            set({ currentPayment: response, paymentInProgress: false });
            return response;
          } catch (error) {
            const paymentError: PaymentError = {
              code: 'UNKNOWN_ERROR',
              message:
                error instanceof Error
                  ? error.message
                  : 'Erreur lors du paiement',
              retryable: true,
            };

            set({ paymentError, paymentInProgress: false });
            throw paymentError;
          }
        },

        // Check payment status
        checkPaymentStatus: async (paymentId: string) => {
          try {
            // TODO: Call payment repository to check status
            await new Promise((resolve) => setTimeout(resolve, 500));

            const status: PaymentStatus = 'processing';

            if (get().currentPayment?.paymentId === paymentId) {
              set({
                currentPayment: {
                  ...get().currentPayment!,
                  status,
                },
              });
            }

            return status;
          } catch (error) {
            console.error('Error checking payment status:', error);
            return 'failed';
          }
        },

        // Cancel payment
        cancelPayment: async (paymentId: string) => {
          try {
            // TODO: Call payment repository to cancel
            await new Promise((resolve) => setTimeout(resolve, 500));

            if (get().currentPayment?.paymentId === paymentId) {
              set({
                currentPayment: {
                  ...get().currentPayment!,
                  status: 'cancelled',
                },
                paymentInProgress: false,
              });
            }
          } catch (error) {
            console.error('Error cancelling payment:', error);
            throw error;
          }
        },

        // Fetch payment history
        fetchPaymentHistory: async (tenantId: string) => {
          set({ paymentsFetching: true });

          try {
            // TODO: Call payment repository to fetch history
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const payments: Payment[] = [];

            set({ payments, paymentsFetching: false });
          } catch (error) {
            console.error('Error fetching payment history:', error);
            set({ paymentsFetching: false });
          }
        },

        // Clear current payment
        clearCurrentPayment: () => {
          set({
            currentPayment: null,
            paymentInProgress: false,
            paymentError: null,
          });
        },

        // Clear error
        clearError: () => {
          set({ paymentError: null });
        },

        // Reset store
        reset: () => {
          set({
            currentPayment: null,
            paymentInProgress: false,
            paymentError: null,
            selectedProvider: null,
            phoneNumber: '',
            amount: 0,
            calculation: null,
          });
        },
      }),
      {
        name: 'payment-storage',
        partialize: (state) => ({
          payments: state.payments,
        }),
      }
    ),
    { name: 'PaymentStore' }
  )
);
