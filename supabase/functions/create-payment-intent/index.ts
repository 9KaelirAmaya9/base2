import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY") || "";
    if (!stripeSecret) throw new Error("Missing STRIPE_SECRET_KEY");

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2023-10-16",
    });

    const { items, orderType, customerInfo, orderNumber } = await req.json();

    // Validate input parameters
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("No items provided");
    }
    if (!orderNumber || typeof orderNumber !== 'string') {
      throw new Error("Valid order number is required");
    }
    if (!orderType || !['pickup', 'delivery'].includes(orderType)) {
      throw new Error("Valid order type (pickup/delivery) is required");
    }
    if (!customerInfo || !customerInfo.name || !customerInfo.phone) {
      throw new Error("Customer information is required");
    }

    // Verify order exists and user is authorized
    const { data: existingOrder, error: orderError } = await supabase
      .from('orders')
      .select('user_id, status')
      .eq('order_number', orderNumber)
      .single();

    if (orderError || !existingOrder) {
      return new Response(
        JSON.stringify({ error: "Order not found or invalid" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Check authorization: user must own the order or be admin/kitchen
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    
    const isAdmin = userRoles?.some(r => r.role === 'admin');
    const isKitchen = userRoles?.some(r => r.role === 'kitchen');
    const isOrderOwner = existingOrder.user_id === user.id;

    if (!isOrderOwner && !isAdmin && !isKitchen) {
      return new Response(
        JSON.stringify({ error: "Not authorized to process this order" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    console.log(`Payment intent creation authorized for order ${orderNumber} by user ${user.id}`);


    // Calculate totals in cents
    const subtotalCents = items.reduce((sum: number, item: any) => {
      const price = Math.round(Number(item.price) * 100);
      const qty = Number(item.quantity) || 0;
      return sum + price * qty;
    }, 0);

    const taxCents = Math.round(subtotalCents * 0.08875); // NYC 8.875%
    const deliveryFeeCents = orderType === "delivery" ? 500 : 0; // $5 delivery fee
    const amount = subtotalCents + taxCents + deliveryFeeCents;

    if (amount <= 0) throw new Error("Calculated amount must be greater than 0");

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      receipt_email: customerInfo?.email || undefined,
      metadata: {
        order_number: orderNumber || "",
        customer_name: customerInfo?.name || "",
        customer_phone: customerInfo?.phone || "",
        order_type: orderType || "",
        delivery_address: customerInfo?.address || "",
      },
      description: `Order ${orderNumber}`,
    });

    const publishableKey = Deno.env.get("STRIPE_PUBLISHABLE_KEY") || undefined;

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        publishableKey,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating payment intent:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
