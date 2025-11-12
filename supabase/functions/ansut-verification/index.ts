import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ANSUTRequest {
  verificationId: string;
  fullName: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  address?: string;
  phone?: string;
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
      fullName,
      dateOfBirth,
      placeOfBirth,
      address,
      phone,
      userId
    } = await req.json() as ANSUTRequest;

    if (!verificationId || !fullName || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mettre à jour le statut en cours de traitement
    await supabaseClient
      .from('ansut_certifications')
      .update({ status: 'processing' })
      .eq('id', verificationId);

    // Pour l'instant, nous simulons la vérification ANSUT
    // Dans un environnement de production, cela appellerait une vraie API ANSUT
    const verificationScore = Math.floor(Math.random() * 15) + 85; // Score entre 85-100
    const isVerified = verificationScore >= 90;

    // Simuler un délai de traitement
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (isVerified) {
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 2); // Certification valable 2 ans

      await supabaseClient
        .from('ansut_certifications')
        .update({
          status: 'certified',
          verification_score: verificationScore,
          certified_at: new Date().toISOString(),
          expires_at: expiryDate.toISOString(),
          certificate_number: `ANSUT-${Date.now()}-${Math.floor(Math.random() * 1000)}`
        })
        .eq('id', verificationId);

      // Mettre à jour le profil de l'utilisateur
      await supabaseClient
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', userId);

      // Journaliser l'utilisation de l'API
      await supabaseClient.rpc('log_api_usage', {
        p_service_name: 'ansut',
        p_action: 'certify_user',
        p_status: 'success',
        p_request_data: { fullName, verificationId },
        p_response_data: { certified: true, score: verificationScore },
        p_user_id: userId
      });

      return new Response(
        JSON.stringify({
          success: true,
          certified: true,
          verificationScore: verificationScore,
          data: {
            certificateNumber: `ANSUT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            certifiedAt: new Date().toISOString(),
            expiresAt: expiryDate.toISOString(),
            fullName: fullName
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      await supabaseClient
        .from('ansut_certifications')
        .update({
          status: 'rejected',
          rejection_reason: 'Score de certification insuffisant',
          verification_score: verificationScore
        })
        .eq('id', verificationId);

      await supabaseClient.rpc('log_api_usage', {
        p_service_name: 'ansut',
        p_action: 'certify_user',
        p_status: 'rejected',
        p_request_data: { fullName, verificationId },
        p_response_data: { certified: false, score: verificationScore },
        p_user_id: userId
      });

      return new Response(
        JSON.stringify({
          success: false,
          certified: false,
          verificationScore: verificationScore,
          error: 'Score de certification insuffisant'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    console.error('ANSUT verification error:', error);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabaseClient.rpc('log_api_usage', {
      p_service_name: 'ansut',
      p_action: 'certify_user',
      p_status: 'error',
      p_error_message: error.message
    });

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});