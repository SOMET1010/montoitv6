import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { ServiceManager, ServiceConfig } from '../_shared/serviceManager.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SMSRequest {
  phoneNumber: string;
  message: string;
  sender?: string;
}

function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('0')) {
    cleaned = '225' + cleaned;
  }

  if (!cleaned.startsWith('225')) {
    cleaned = '225' + cleaned;
  }

  return '+' + cleaned;
}

function validatePhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  const validPrefixes = ['07', '05', '054', '055', '056', '01', '227'];
  return validPrefixes.some(prefix =>
    cleaned.startsWith(prefix) || cleaned.startsWith('225' + prefix)
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { phoneNumber, message, sender = 'MonToit' } = await req.json() as SMSRequest;

    if (!phoneNumber || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: phoneNumber, message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!validatePhoneNumber(phoneNumber)) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone number format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (message.length > 160) {
      return new Response(
        JSON.stringify({ error: 'Message too long (max 160 characters)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    const serviceManager = new ServiceManager();

    // Define handlers for each SMS provider
    const handlers = {
      intouch: async (config: ServiceConfig, params: any) => {
        const response = await fetch(
          `${Deno.env.get('INTOUCH_BASE_URL')}sms/send`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('INTOUCH_USERNAME')}:${Deno.env.get('INTOUCH_PASSWORD')}`,
            },
            body: JSON.stringify({
              sender: config.config.sender || params.sender,
              recipient: params.phoneNumber,
              message: params.message,
              partner_id: Deno.env.get('INTOUCH_PARTNER_ID'),
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`INTOUCH SMS failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return {
          success: true,
          messageId: data.message_id || data.id,
          provider: 'intouch',
        };
      },

      azure: async (config: ServiceConfig, params: any) => {
        const { SmsClient } = await import('npm:@azure/communication-sms');
        const connectionString = Deno.env.get('AZURE_COMMUNICATION_CONNECTION_STRING');

        if (!connectionString) {
          throw new Error('Azure Communication connection string not configured');
        }

        const client = new SmsClient(connectionString);

        const sendResults = await client.send({
          from: config.config.from || '+1234567890',
          to: [params.phoneNumber],
          message: params.message,
        });

        if (!sendResults[0].successful) {
          throw new Error(`Azure SMS failed: ${sendResults[0].errorMessage}`);
        }

        return {
          success: true,
          messageId: sendResults[0].messageId,
          provider: 'azure',
        };
      },

      brevo: async (config: ServiceConfig, params: any) => {
        const apiKey = Deno.env.get('BREVO_API_KEY');

        if (!apiKey) {
          throw new Error('Brevo API key not configured');
        }

        const response = await fetch('https://api.brevo.com/v3/transactionalSMS/sms', {
          method: 'POST',
          headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            sender: (config.config.sender || params.sender).substring(0, 11),
            recipient: params.phoneNumber,
            content: params.message,
            type: 'transactional'
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Brevo SMS failed: ${errorData.message || response.statusText}`);
        }

        const result = await response.json();
        return {
          success: true,
          messageId: result.messageId,
          reference: result.reference,
          provider: 'brevo',
        };
      },
    };

    // Execute with automatic fallback
    const result = await serviceManager.executeWithFallback(
      'sms',
      handlers,
      { phoneNumber: formattedPhone, message, sender }
    );

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error sending SMS with hybrid system:', error);

    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'All SMS providers failed. Please check service configuration.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
