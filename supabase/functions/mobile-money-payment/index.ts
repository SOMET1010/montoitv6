import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PaymentRequest {
  provider: 'orange_money' | 'mtn_money' | 'moov_money' | 'wave';
  phoneNumber: string;
  amount: number;
  reference: string;
  description?: string;
}

function validatePhoneForProvider(phone: string, provider: string): boolean {
  const cleaned = phone.replace(/\D/g, '');

  switch (provider) {
    case 'orange_money':
      return cleaned.startsWith('07') || cleaned.startsWith('227') || cleaned.startsWith('22507') || cleaned.startsWith('225227');
    case 'mtn_money':
      return cleaned.startsWith('05') || cleaned.startsWith('054') || cleaned.startsWith('055') || cleaned.startsWith('056');
    case 'moov_money':
      return cleaned.startsWith('01') || cleaned.startsWith('22501');
    case 'wave':
      return cleaned.length >= 8 && cleaned.length <= 10;
    default:
      return false;
  }
}

function calculateFees(amount: number, provider: string): number {
  const feeRates: Record<string, number> = {
    orange_money: 0.015,
    mtn_money: 0.015,
    moov_money: 0.012,
    wave: 0.01
  };

  return Math.round(amount * (feeRates[provider] || 0.015));
}

async function processOrangeMoneyPayment(
  apiKeys: any,
  phoneNumber: string,
  amount: number,
  reference: string,
  description: string
): Promise<any> {
  const response = await fetch('https://api.orange.com/orange-money-webpay/ci/v1/webpayment', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKeys.api_key}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      merchant_key: apiKeys.merchant_id,
      currency: 'XOF',
      order_id: reference,
      amount: amount,
      return_url: 'https://montoit.ansut.ci/paiement/retour',
      cancel_url: 'https://montoit.ansut.ci/paiement/annule',
      notif_url: 'https://montoit.ansut.ci/paiement/webhook',
      lang: 'fr',
      reference: description
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Orange Money payment failed');
  }

  return await response.json();
}

async function processMTNPayment(
  apiKeys: any,
  phoneNumber: string,
  amount: number,
  reference: string,
  description: string
): Promise<any> {
  const authResponse = await fetch('https://sandbox.momodeveloper.mtn.com/collection/token/', {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': apiKeys.subscription_key,
      'Authorization': `Basic ${btoa(apiKeys.api_user + ':' + apiKeys.api_key)}`
    }
  });

  if (!authResponse.ok) {
    throw new Error('MTN authentication failed');
  }

  const authData = await authResponse.json();

  const response = await fetch('https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authData.access_token}`,
      'X-Reference-Id': reference,
      'X-Target-Environment': 'sandbox',
      'Ocp-Apim-Subscription-Key': apiKeys.subscription_key,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: amount.toString(),
      currency: 'XOF',
      externalId: reference,
      payer: {
        partyIdType: 'MSISDN',
        partyId: phoneNumber.replace(/\D/g, '')
      },
      payerMessage: description,
      payeeNote: description
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'MTN payment failed');
  }

  return { transactionId: reference, status: 'PENDING' };
}

async function processMoovPayment(
  apiKeys: any,
  phoneNumber: string,
  amount: number,
  reference: string,
  description: string
): Promise<any> {
  const response = await fetch('https://api.moov-africa.ci/v1/payments/init', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKeys.api_key}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      merchant_id: apiKeys.merchant_id,
      phone: phoneNumber,
      amount: amount,
      currency: 'XOF',
      reference: reference,
      description: description,
      callback_url: 'https://montoit.ansut.ci/paiement/webhook'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Moov payment failed');
  }

  return await response.json();
}

async function processWavePayment(
  apiKeys: any,
  phoneNumber: string,
  amount: number,
  reference: string,
  description: string
): Promise<any> {
  const response = await fetch('https://api.wave.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKeys.api_key}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      amount: amount,
      currency: 'XOF',
      business_id: apiKeys.merchant_id,
      client_reference: reference,
      merchant_name: 'Mon Toit',
      merchant_logo: 'https://montoit.ansut.ci/logo.png',
      success_url: 'https://montoit.ansut.ci/paiement/succes',
      error_url: 'https://montoit.ansut.ci/paiement/erreur'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Wave payment failed');
  }

  return await response.json();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const {
      provider,
      phoneNumber,
      amount,
      reference,
      description = 'Paiement Mon Toit'
    } = await req.json() as PaymentRequest;

    if (!provider || !phoneNumber || !amount || !reference) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (amount < 100) {
      return new Response(
        JSON.stringify({ error: 'Amount must be at least 100 FCFA' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!validatePhoneForProvider(phoneNumber, provider)) {
      return new Response(
        JSON.stringify({ error: `Invalid phone number for ${provider}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKeys = await supabaseClient.rpc('get_api_keys', { service: provider });

    if (!apiKeys.data) {
      throw new Error(`${provider} API keys not configured`);
    }

    const fees = calculateFees(amount, provider);
    const totalAmount = amount + fees;

    let result;
    switch (provider) {
      case 'orange_money':
        result = await processOrangeMoneyPayment(apiKeys.data, phoneNumber, totalAmount, reference, description);
        break;
      case 'mtn_money':
        result = await processMTNPayment(apiKeys.data, phoneNumber, totalAmount, reference, description);
        break;
      case 'moov_money':
        result = await processMoovPayment(apiKeys.data, phoneNumber, totalAmount, reference, description);
        break;
      case 'wave':
        result = await processWavePayment(apiKeys.data, phoneNumber, totalAmount, reference, description);
        break;
      default:
        throw new Error('Invalid provider');
    }

    await supabaseClient.rpc('log_api_usage', {
      p_service_name: provider,
      p_action: 'process_payment',
      p_status: 'success',
      p_request_data: { phoneNumber, amount, reference },
      p_response_data: result
    });

    return new Response(
      JSON.stringify({
        success: true,
        transactionId: result.transactionId || result.payment_token || result.id,
        amount: amount,
        fees: fees,
        totalAmount: totalAmount,
        provider: provider,
        status: result.status || 'PENDING',
        paymentUrl: result.payment_url || result.wave_launch_url
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Payment error:', error);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabaseClient.rpc('log_api_usage', {
      p_service_name: 'mobile_money',
      p_action: 'process_payment',
      p_status: 'error',
      p_error_message: error.message
    });

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
