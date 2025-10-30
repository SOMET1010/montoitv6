import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailRequest {
  to: string;
  template: string;
  data: Record<string, any>;
}

const emailTemplates = {
  welcome: {
    subject: 'Bienvenue sur Mon Toit',
    html: (data: any) => `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏠 Mon Toit</h1>
            <p>Plateforme immobilière certifiée ANSUT</p>
          </div>
          <div class="content">
            <h2>Bienvenue ${data.name} !</h2>
            <p>Merci de vous être inscrit sur Mon Toit, la plateforme immobilière certifiée ANSUT de Côte d'Ivoire.</p>
            <p>Vous pouvez maintenant :</p>
            <ul>
              <li>Rechercher des propriétés vérifiées</li>
              <li>Planifier des visites</li>
              <li>Signer des contrats électroniquement</li>
              <li>Effectuer des paiements sécurisés</li>
            </ul>
            <a href="${data.dashboardUrl || 'https://montoit.ansut.ci'}" class="button">Accéder à mon tableau de bord</a>
          </div>
          <div class="footer">
            <p>© 2025 Mon Toit - ANSUT Certifié</p>
            <p>Ce message a été envoyé à ${data.email}</p>
          </div>
        </div>
      </body>
      </html>
    `
  },
  'payment-confirmation': {
    subject: 'Confirmation de paiement',
    html: (data: any) => `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px;">
            <h1>✅ Paiement confirmé</h1>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; margin-top: -10px;">
            <p>Votre paiement a été traité avec succès.</p>
            <table style="width: 100%; margin: 20px 0;">
              <tr><td><strong>Montant:</strong></td><td>${data.amount} FCFA</td></tr>
              <tr><td><strong>Référence:</strong></td><td>${data.reference}</td></tr>
              <tr><td><strong>Type:</strong></td><td>${data.type}</td></tr>
              <tr><td><strong>Date:</strong></td><td>${data.date}</td></tr>
              <tr><td><strong>Méthode:</strong></td><td>${data.method}</td></tr>
            </table>
            <p>Merci d'utiliser Mon Toit pour vos transactions.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
};

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

    const { to, template, data } = await req.json() as EmailRequest;

    if (!to || !template) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, template' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: apiKeys, error: keyError } = await supabaseClient.rpc('get_api_keys', { service: 'resend' });

    if (keyError || !apiKeys || !apiKeys.api_key) {
      throw new Error('RESEND API key not configured: ' + (keyError?.message || 'No key found'));
    }

    const emailTemplate = emailTemplates[template as keyof typeof emailTemplates];
    if (!emailTemplate) {
      return new Response(
        JSON.stringify({ error: 'Invalid template' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKeys.api_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Mon Toit <no-reply@notifications.ansut.ci>',
        to: [to],
        subject: emailTemplate.subject,
        html: emailTemplate.html(data)
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to send email');
    }

    await supabaseClient.rpc('log_api_usage', {
      p_service_name: 'resend',
      p_action: 'send_email',
      p_status: 'success',
      p_request_data: { to, template },
      p_response_data: result
    });

    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error sending email:', error);

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
