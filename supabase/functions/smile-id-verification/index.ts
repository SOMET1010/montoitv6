import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SmileIDRequest {
  userId: string;
  identityVerificationId: string;
  idNumber: string;
  idType?: string;
  country?: string;
  selfieImage: string;
  idImage?: string;
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
      userId,
      identityVerificationId,
      idNumber,
      idType = 'NATIONAL_ID',
      country = 'CI',
      selfieImage,
      idImage
    } = await req.json() as SmileIDRequest;

    if (!userId || !identityVerificationId || !idNumber || !selfieImage) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: verification, error: verifyError } = await supabaseClient
      .from('facial_verifications')
      .insert([{
        user_id: userId,
        identity_verification_id: identityVerificationId,
        selfie_image: selfieImage,
        status: 'processing'
      }])
      .select()
      .single();

    if (verifyError) throw verifyError;

    const apiKeys = await supabaseClient.rpc('get_api_keys', { service: 'smile_id' });

    if (!apiKeys.data || !apiKeys.data.partner_id || !apiKeys.data.api_key) {
      await supabaseClient
        .from('facial_verifications')
        .update({
          status: 'failed',
          failure_reason: 'API Smile ID non configurée'
        })
        .eq('id', verification.id);

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Service de vérification faciale temporairement indisponible' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const timestamp = new Date().toISOString();
    const jobId = `${userId}-${Date.now()}`;

    const payload = {
      partner_id: apiKeys.data.partner_id,
      partner_params: {
        job_id: jobId,
        user_id: userId,
        job_type: 5
      },
      images: [
        {
          image_type_id: 2,
          image: selfieImage
        }
      ],
      id_info: {
        id_type: idType,
        id_number: idNumber,
        country: country,
        entered: true
      },
      callback_url: apiKeys.data.callback_url || `${Deno.env.get('SUPABASE_URL')}/functions/v1/smile-id-callback`
    };

    if (idImage) {
      payload.images.push({
        image_type_id: 3,
        image: idImage
      });
    }

    const response = await fetch('https://api.smileidentity.com/v1/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      
      await supabaseClient
        .from('facial_verifications')
        .update({
          status: 'failed',
          failure_reason: error.message || 'Vérification faciale échouée',
          smile_id_response: error
        })
        .eq('id', verification.id);

      throw new Error(error.message || 'Smile ID verification failed');
    }

    const result = await response.json();
    
    const livenessScore = result.result?.Liveness?.score || 0;
    const faceMatchScore = result.result?.ConfidenceValue || 0;
    const isLive = livenessScore >= 80;
    const isMatch = faceMatchScore >= 80;
    const isPassed = isLive && isMatch;

    await supabaseClient
      .from('facial_verifications')
      .update({
        status: isPassed ? 'passed' : 'failed',
        smile_id_job_id: jobId,
        smile_id_response: result,
        liveness_check: true,
        liveness_score: livenessScore,
        face_match_score: faceMatchScore,
        is_live: isLive,
        is_match: isMatch,
        failure_reason: !isPassed ? (
          !isLive ? 'Test de vivacité échoué (score < 80%)' :
          !isMatch ? 'Photo ne correspond pas à la CNI (score < 80%)' :
          'Vérification échouée'
        ) : null
      })
      .eq('id', verification.id);

    await supabaseClient.rpc('log_api_usage', {
      p_service_name: 'smile_id',
      p_action: 'verify_face',
      p_status: 'success',
      p_request_data: { userId, idNumber, jobId },
      p_response_data: result,
      p_user_id: userId
    });

    return new Response(
      JSON.stringify({
        success: true,
        verified: isPassed,
        livenessScore: livenessScore,
        faceMatchScore: faceMatchScore,
        isLive: isLive,
        isMatch: isMatch,
        jobId: jobId,
        data: {
          resultText: result.result?.ResultText,
          resultCode: result.result?.ResultCode,
          actions: result.result?.Actions,
          feedback: !isPassed ? (
            !isLive ? 'Veuillez prendre un selfie dans un endroit bien éclairé en regardant la caméra.' :
            !isMatch ? 'Votre selfie ne correspond pas à la photo de votre CNI. Vérifiez que vous utilisez la bonne CNI.' :
            'Vérification échouée. Veuillez réessayer.'
          ) : 'Vérification réussie !'
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Smile ID verification error:', error);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabaseClient.rpc('log_api_usage', {
      p_service_name: 'smile_id',
      p_action: 'verify_face',
      p_status: 'error',
      p_error_message: error.message
    });

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
