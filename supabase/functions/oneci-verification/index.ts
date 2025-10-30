import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ONECIRequest {
  verificationId: string;
  cniNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
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
      cniNumber,
      firstName,
      lastName,
      dateOfBirth,
      userId
    } = await req.json() as ONECIRequest;

    if (!verificationId || !cniNumber || !firstName || !lastName || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await supabaseClient
      .from('identity_verifications')
      .update({ status: 'processing' })
      .eq('id', verificationId);

    const apiKeys = await supabaseClient.rpc('get_api_keys', { service: 'oneci' });

    if (!apiKeys.data || !apiKeys.data.api_key || !apiKeys.data.api_url) {
      await supabaseClient
        .from('identity_verifications')
        .update({
          status: 'rejected',
          rejection_reason: 'API ONECI non configurée',
          error_message: 'Service de vérification temporairement indisponible'
        })
        .eq('id', verificationId);

      throw new Error('ONECI API not configured');
    }

    const response = await fetch(`${apiKeys.data.api_url}/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKeys.data.api_key}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        cni_number: cniNumber,
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dateOfBirth
      })
    });

    if (!response.ok) {
      const error = await response.json();
      
      await supabaseClient
        .from('identity_verifications')
        .update({
          status: 'rejected',
          rejection_reason: 'Vérification ONECI échouée',
          error_message: error.message || 'Données non vérifiables',
          oneci_response: error
        })
        .eq('id', verificationId);

      throw new Error(error.message || 'ONECI verification failed');
    }

    const result = await response.json();
    const verificationScore = result.confidence || result.score || 100;
    const isVerified = result.verified === true || verificationScore >= 90;

    if (isVerified) {
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 5);

      await supabaseClient
        .from('identity_verifications')
        .update({
          status: 'verified',
          first_name: result.first_name || firstName,
          last_name: result.last_name || lastName,
          date_of_birth: result.date_of_birth || dateOfBirth,
          place_of_birth: result.place_of_birth,
          nationality: result.nationality || 'Ivoirienne',
          verification_score: verificationScore,
          oneci_response: result,
          verified_at: new Date().toISOString(),
          expires_at: expiryDate.toISOString()
        })
        .eq('id', verificationId);
    } else {
      await supabaseClient
        .from('identity_verifications')
        .update({
          status: 'rejected',
          rejection_reason: 'Score de vérification insuffisant',
          verification_score: verificationScore,
          oneci_response: result
        })
        .eq('id', verificationId);
    }

    await supabaseClient.rpc('log_api_usage', {
      p_service_name: 'oneci',
      p_action: 'verify_cni',
      p_status: 'success',
      p_request_data: { cniNumber, verificationId },
      p_response_data: result,
      p_user_id: userId
    });

    return new Response(
      JSON.stringify({
        success: true,
        verified: isVerified,
        verificationScore: verificationScore,
        data: {
          fullName: result.full_name || `${firstName} ${lastName}`,
          dateOfBirth: result.date_of_birth || dateOfBirth,
          placeOfBirth: result.place_of_birth,
          nationality: result.nationality || 'Ivoirienne',
          gender: result.gender,
          address: result.address,
          issuedDate: result.issued_date,
          expiryDate: result.expiry_date
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('ONECI verification error:', error);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabaseClient.rpc('log_api_usage', {
      p_service_name: 'oneci',
      p_action: 'verify_cni',
      p_status: 'error',
      p_error_message: error.message
    });

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
