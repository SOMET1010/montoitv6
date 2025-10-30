import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CNAMRequest {
  verificationId: string;
  cnamNumber: string;
  firstName: string;
  lastName: string;
  userId: string;
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
      verificationId,
      cnamNumber,
      firstName,
      lastName,
      userId
    } = await req.json() as CNAMRequest;

    if (!verificationId || !cnamNumber || !firstName || !lastName || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKeys = await supabaseClient.rpc('get_api_keys', { service: 'cnam' });

    if (!apiKeys.data || !apiKeys.data.api_key || !apiKeys.data.api_url) {
      await supabaseClient
        .from('cnam_verifications')
        .update({
          status: 'rejected',
          cnam_response: { error: 'API CNAM non configurée' }
        })
        .eq('id', verificationId);

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Service CNAM temporairement indisponible. Votre vérification sera traitée plus tard.' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch(`${apiKeys.data.api_url}/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKeys.data.api_key}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        cnam_number: cnamNumber,
        first_name: firstName,
        last_name: lastName
      })
    });

    if (!response.ok) {
      const error = await response.json();
      
      await supabaseClient
        .from('cnam_verifications')
        .update({
          status: 'rejected',
          cnam_response: error
        })
        .eq('id', verificationId);

      throw new Error(error.message || 'CNAM verification failed');
    }

    const result = await response.json();
    const isVerified = result.verified === true || result.status === 'active';

    await supabaseClient
      .from('cnam_verifications')
      .update({
        status: isVerified ? 'verified' : 'rejected',
        insured_name: result.full_name || `${firstName} ${lastName}`,
        policy_status: result.status || result.policy_status,
        cnam_response: result,
        verified_at: isVerified ? new Date().toISOString() : null
      })
      .eq('id', verificationId);

    await supabaseClient.rpc('log_api_usage', {
      p_service_name: 'cnam',
      p_action: 'verify_cnam',
      p_status: 'success',
      p_request_data: { cnamNumber, verificationId },
      p_response_data: result,
      p_user_id: userId
    });

    return new Response(
      JSON.stringify({
        success: true,
        verified: isVerified,
        data: {
          fullName: result.full_name || `${firstName} ${lastName}`,
          affiliationNumber: result.affiliation_number,
          affiliationDate: result.affiliation_date,
          status: result.status || result.policy_status,
          employer: result.employer,
          isActive: result.is_active || isVerified
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('CNAM verification error:', error);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabaseClient.rpc('log_api_usage', {
      p_service_name: 'cnam',
      p_action: 'verify_cnam',
      p_status: 'error',
      p_error_message: error.message
    });

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
