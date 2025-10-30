import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Smartphone, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface MobileMoneyPaymentProps {
  userId: string;
  leaseId: string;
  amount: number;
  description: string;
  onSuccess?: (result: PaymentResult) => void;
  onError?: (error: string) => void;
}

interface PaymentResult {
  success: boolean;
  paymentId?: string;
  partnerTransactionId?: string;
  transactionId?: string;
  status?: string;
  pending?: boolean;
  message?: string;
}

type MobileMoneyProvider = 'orange_money' | 'mtn_money' | 'moov_money' | 'wave';

const PROVIDER_INFO = {
  orange_money: {
    name: 'Orange Money',
    color: 'orange',
    icon: '🟠',
    prefixes: ['07', '08', '09'],
  },
  mtn_money: {
    name: 'MTN Money',
    color: 'yellow',
    icon: '🟡',
    prefixes: ['05', '06'],
  },
  moov_money: {
    name: 'Moov Money',
    color: 'blue',
    icon: '🔵',
    prefixes: ['01', '02', '03'],
  },
  wave: {
    name: 'Wave',
    color: 'pink',
    icon: '🌊',
    prefixes: ['01'],
  },
};

export default function MobileMoneyPayment({
  userId,
  leaseId,
  amount,
  description,
  onSuccess,
  onError,
}: MobileMoneyPaymentProps) {
  const [provider, setProvider] = useState<MobileMoneyProvider>('orange_money');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validatePhoneNumber = (phone: string, selectedProvider: MobileMoneyProvider): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    const prefixes = PROVIDER_INFO[selectedProvider].prefixes;
    return prefixes.some(prefix => cleaned.startsWith(prefix));
  };

  const handlePayment = async () => {
    if (!phoneNumber || phoneNumber.length < 8) {
      const errorMsg = 'Veuillez entrer un numéro de téléphone valide';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    if (!validatePhoneNumber(phoneNumber, provider)) {
      const errorMsg = `Numéro invalide pour ${PROVIDER_INFO[provider].name}. Préfixes valides: ${PROVIDER_INFO[provider].prefixes.join(', ')}`;
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }

      const { data, error: paymentError } = await supabase.functions.invoke('intouch-payment', {
        body: {
          provider,
          phoneNumber,
          amount,
          leaseId,
          description,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (paymentError) {
        throw new Error(paymentError.message);
      }

      const paymentResult: PaymentResult = {
        success: data.success,
        paymentId: data.paymentId,
        partnerTransactionId: data.partnerTransactionId,
        transactionId: data.transactionId,
        status: data.status,
        pending: data.pending,
        message: data.message,
      };

      setResult(paymentResult);
      onSuccess?.(paymentResult);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      console.error('[Payment] Error:', err);
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setPhoneNumber('');
  };

  if (result) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-2xl shadow-lg">
        <div className="text-center py-8">
          {result.success ? (
            <div className="space-y-4">
              {result.pending ? (
                <>
                  <Loader2 className="w-20 h-20 text-orange-500 animate-spin mx-auto" />
                  <h3 className="text-2xl font-bold text-orange-600">
                    Paiement en cours
                  </h3>
                  <p className="text-gray-600">
                    Veuillez confirmer le paiement sur votre téléphone
                  </p>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-4">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Référence:</strong> {result.partnerTransactionId}
                    </p>
                    <p className="text-xs text-gray-500">
                      Vous recevrez un SMS de confirmation dans quelques instants
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
                  <h3 className="text-2xl font-bold text-green-600">
                    Paiement Réussi!
                  </h3>
                  <p className="text-gray-600">
                    Votre paiement de {amount.toLocaleString()} FCFA a été confirmé
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                    <p className="text-sm text-gray-700">
                      <strong>Référence:</strong> {result.partnerTransactionId}
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <XCircle className="w-20 h-20 text-red-500 mx-auto" />
              <h3 className="text-2xl font-bold text-red-600">Paiement Échoué</h3>
              <p className="text-gray-600">{result.message || 'Une erreur est survenue'}</p>
              <button
                onClick={handleReset}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg mt-4 transition"
              >
                Réessayer
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">
        Paiement Mobile Money
      </h2>

      <div className="space-y-6">
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 mb-1">Montant à payer</p>
          <p className="text-3xl font-bold text-orange-600">{amount.toLocaleString()} FCFA</p>
          <p className="text-xs text-gray-500 mt-2">{description}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Mode de paiement
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(PROVIDER_INFO) as MobileMoneyProvider[]).map((key) => {
              const info = PROVIDER_INFO[key];
              const isSelected = provider === key;
              const colorClasses = {
                orange: 'border-orange-500 bg-orange-50',
                yellow: 'border-yellow-500 bg-yellow-50',
                blue: 'border-blue-500 bg-blue-50',
                pink: 'border-pink-500 bg-pink-50',
              };

              return (
                <button
                  key={key}
                  onClick={() => setProvider(key)}
                  className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 transition-all ${
                    isSelected
                      ? colorClasses[info.color]
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-3xl">{info.icon}</div>
                  <span className="text-sm font-medium text-gray-900">{info.name}</span>
                  <span className="text-xs text-gray-500">
                    {info.prefixes.join(', ')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Numéro de téléphone
          </label>
          <div className="relative">
            <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="07 08 12 34 56"
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition"
              disabled={isLoading}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Le numéro doit correspondre à votre compte {PROVIDER_INFO[provider].name}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handlePayment}
          disabled={isLoading || !phoneNumber}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-4 rounded-xl font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition shadow-lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Traitement en cours...
            </>
          ) : (
            <>Payer {amount.toLocaleString()} FCFA</>
          )}
        </button>

        <p className="text-xs text-center text-gray-500">
          Vous recevrez une notification sur votre téléphone pour confirmer le paiement
        </p>
      </div>
    </div>
  );
}
