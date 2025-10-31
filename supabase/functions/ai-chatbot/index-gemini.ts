import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatMessage {
  role: string;
  content: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { messages, userId, temperature = 0.8, maxTokens = 800 } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('🤖 Chatbot request received');
    console.log('Messages count:', messages.length);
    console.log('User ID:', userId);

    // Essayer Azure d'abord
    const azureEndpoint = Deno.env.get("AZURE_OPENAI_ENDPOINT");
    const azureApiKey = Deno.env.get("AZURE_OPENAI_API_KEY");
    const deploymentName = Deno.env.get("AZURE_OPENAI_DEPLOYMENT_NAME");
    const apiVersion = Deno.env.get("AZURE_OPENAI_API_VERSION");

    // Si Azure est configuré, l'utiliser
    if (azureEndpoint && azureApiKey && deploymentName && apiVersion) {
      console.log('✅ Using Azure OpenAI');
      console.log('Deployment:', deploymentName);

      try {
        const url = `${azureEndpoint}openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": azureApiKey,
          },
          body: JSON.stringify({
            messages,
            temperature,
            max_tokens: maxTokens,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Azure OpenAI error:", response.status, errorText);
          throw new Error(`Azure error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        const tokensUsed = data.usage?.total_tokens || 0;

        console.log('✅ Azure response OK, tokens:', tokensUsed);

        return new Response(
          JSON.stringify({
            content,
            tokensUsed,
            model: deploymentName,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (azureError) {
        console.warn('⚠️ Azure failed, falling back to Gemini:', azureError.message);
      }
    } else {
      console.log('⚠️ Azure not configured, using Gemini');
    }

    // Fallback sur Gemini
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    if (!geminiApiKey) {
      console.error('❌ No AI provider configured');
      return new Response(
        JSON.stringify({
          error: "No AI provider configured. Please add AZURE_OPENAI_* or GEMINI_API_KEY secrets.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('🔄 Using Gemini as fallback');

    // Convertir les messages au format Gemini
    const formattedMessages = messages.map((msg: ChatMessage) => {
      return `${msg.role === 'system' ? 'Instructions' : msg.role === 'user' ? 'Question' : 'Réponse'}: ${msg.content}`;
    }).join('\n\n');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: formattedMessages
          }]
        }],
        generationConfig: {
          temperature: temperature,
          maxOutputTokens: maxTokens,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini error:", response.status, errorText);
      return new Response(
        JSON.stringify({
          error: `Gemini error: ${response.status}`,
          details: errorText,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      console.error("Gemini returned no candidates");
      return new Response(
        JSON.stringify({
          error: "No response from Gemini",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const content = data.candidates[0].content.parts[0].text;
    const tokensUsed = data.usageMetadata?.totalTokenCount || 0;

    console.log('✅ Gemini response OK, tokens:', tokensUsed);

    return new Response(
      JSON.stringify({
        content,
        tokensUsed,
        model: "gemini-1.5-flash",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in ai-chatbot function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
