import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface InTouchWebhook {
  transaction_id: string;
  partner_transaction_id: string;
  status: string;
  amount: number;
  phone_number: string;
  timestamp: string;
  service_id?: string;
  error_message?: string;
}

const STATUS_MAPPING: Record<string, string> = {
  PENDING: "processing",
  SUCCESS: "completed",
  FAILED: "failed",
  PROCESSING: "processing",
  CANCELLED: "cancelled",
};

function validateWebhookData(data: unknown): data is InTouchWebhook {
  if (!data || typeof data !== "object") {
    return false;
  }

  const webhook = data as Record<string, unknown>;

  return (
    typeof webhook.transaction_id === "string" &&
    typeof webhook.partner_transaction_id === "string" &&
    typeof webhook.status === "string" &&
    typeof webhook.amount === "number" &&
    typeof webhook.phone_number === "string"
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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const webhookData = await req.json();

    if (!validateWebhookData(webhookData)) {
      return new Response(
        JSON.stringify({ error: "Invalid webhook data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      transaction_id,
      partner_transaction_id,
      status,
      amount,
      phone_number,
      timestamp,
      error_message,
    } = webhookData;

    console.log(`Processing webhook for transaction ${partner_transaction_id}:`, {
      transaction_id,
      status,
      amount,
    });

    const mappedStatus = STATUS_MAPPING[status] || "processing";

    const { data: existingPayment, error: fetchError } = await supabaseClient
      .from("payments")
      .select("id, status, tenant_id, lease_id")
      .eq("transaction_reference", partner_transaction_id)
      .maybeSingle();

    if (fetchError) {
      throw new Error(`Failed to fetch payment: ${fetchError.message}`);
    }

    if (!existingPayment) {
      console.error(`Payment not found: ${partner_transaction_id}`);
      return new Response(
        JSON.stringify({ error: "Payment not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (existingPayment.status === "completed" || existingPayment.status === "failed") {
      console.log(`Payment already finalized: ${partner_transaction_id}`);
      return new Response(
        JSON.stringify({ message: "Payment already processed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const updateData: Record<string, unknown> = {
      status: mappedStatus,
      intouch_transaction_id: transaction_id,
      intouch_status: status,
      intouch_callback_data: webhookData,
      updated_at: new Date().toISOString(),
    };

    if (mappedStatus === "completed") {
      updateData.paid_at = new Date().toISOString();
    }

    const { error: updateError } = await supabaseClient
      .from("payments")
      .update(updateData)
      .eq("transaction_reference", partner_transaction_id);

    if (updateError) {
      throw new Error(`Failed to update payment: ${updateError.message}`);
    }

    await supabaseClient.from("mobile_money_transactions").update({
      status: mappedStatus,
      external_transaction_id: transaction_id,
      intouch_response: webhookData,
      updated_at: new Date().toISOString(),
    }).eq("payment_id", partner_transaction_id);

    if (mappedStatus === "completed") {
      console.log(`Payment completed successfully: ${partner_transaction_id}`);

      const { data: user } = await supabaseClient
        .from("profiles")
        .select("phone")
        .eq("id", existingPayment.tenant_id)
        .maybeSingle();

      if (user?.phone) {
        await supabaseClient.functions.invoke("intouch-sms", {
          body: {
            phoneNumber: user.phone,
            message: `Votre paiement de ${amount.toLocaleString()} FCFA a été confirmé. Merci! Ref: ${partner_transaction_id.substring(0, 16)}`,
            userId: existingPayment.tenant_id,
            type: "payment_confirmation",
          },
        });
      }

      const { data: lease } = await supabaseClient
        .from("leases")
        .select("landlord_id, properties!inner(owner_id)")
        .eq("id", existingPayment.lease_id)
        .maybeSingle();

      const landlordId = lease?.landlord_id || lease?.properties?.owner_id;

      if (landlordId) {
        const { data: landlord } = await supabaseClient
          .from("profiles")
          .select("phone, full_name")
          .eq("id", landlordId)
          .maybeSingle();

        if (landlord?.phone) {
          await supabaseClient.functions.invoke("intouch-sms", {
            body: {
              phoneNumber: landlord.phone,
              message: `Paiement reçu: ${amount.toLocaleString()} FCFA. Votre transfert sera effectué sous peu. Ref: ${partner_transaction_id.substring(0, 16)}`,
              userId: landlordId,
              type: "payment_notification",
            },
          });
        }

        const platformFeePercentage = 0.05;
        const providerFeePercentage = 0.015;
        const totalFees = amount * (platformFeePercentage + providerFeePercentage);
        const landlordAmount = amount - totalFees;

        const { data: existingTransfer } = await supabaseClient
          .from("landlord_transfers")
          .select("id")
          .eq("payment_id", existingPayment.id)
          .maybeSingle();

        if (!existingTransfer) {
          await supabaseClient.from("landlord_transfers").insert({
            payment_id: existingPayment.id,
            landlord_id: landlordId,
            amount: amount,
            fees: totalFees,
            net_amount: landlordAmount,
            provider: existingPayment.provider,
            phone_number: landlord?.phone || "",
            partner_transaction_id: `MTT_TRANSFER_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            status: "pending",
          });
        }
      }
    } else if (mappedStatus === "failed") {
      console.error(`Payment failed: ${partner_transaction_id}`, error_message);

      const { data: user } = await supabaseClient
        .from("profiles")
        .select("phone")
        .eq("id", existingPayment.tenant_id)
        .maybeSingle();

      if (user?.phone) {
        await supabaseClient.functions.invoke("intouch-sms", {
          body: {
            phoneNumber: user.phone,
            message: `Votre paiement a échoué. Veuillez réessayer. Ref: ${partner_transaction_id.substring(0, 16)}`,
            userId: existingPayment.tenant_id,
            type: "payment_failed",
          },
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Webhook processed successfully",
        status: mappedStatus,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Webhook processing error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
