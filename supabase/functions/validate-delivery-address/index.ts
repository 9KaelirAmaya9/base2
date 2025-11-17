import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeliveryValidationRequest {
  address: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address }: DeliveryValidationRequest = await req.json();
    
    if (!address) {
      return new Response(
        JSON.stringify({ isValid: false, message: 'Address is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const MAPBOX_TOKEN = Deno.env.get('MAPBOX_PUBLIC_TOKEN');
    
    if (!MAPBOX_TOKEN) {
      console.error('MAPBOX_PUBLIC_TOKEN not configured');
      return new Response(
        JSON.stringify({ isValid: false, message: 'Service temporarily unavailable' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Geocode the address to get coordinates and ZIP code
    const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&country=US&proximity=-74.0060,40.6501&types=address`;
    
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();

    if (!geocodeData.features || geocodeData.features.length === 0) {
      return new Response(
        JSON.stringify({ 
          isValid: false, 
          message: 'Unable to find this address. Please check and try again.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const feature = geocodeData.features[0];
    const zipCode = feature.context?.find((c: any) => c.id.startsWith('postcode'))?.text;
    const coordinates = feature.center; // [longitude, latitude]

    if (!zipCode) {
      return new Response(
        JSON.stringify({ 
          isValid: false, 
          message: 'Please include a valid ZIP code in your delivery address.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if ZIP code is in delivery zones
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: zone, error } = await supabase
      .from('delivery_zones')
      .select('estimated_minutes, is_active')
      .eq('zip_code', zipCode)
      .eq('is_active', true)
      .single();

    if (error || !zone) {
      // Calculate driving time from restaurant using Mapbox Directions API
      const restaurantCoords = [-74.0060, 40.6501]; // 505 51st Street, Brooklyn
      const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${restaurantCoords[0]},${restaurantCoords[1]};${coordinates[0]},${coordinates[1]}?access_token=${MAPBOX_TOKEN}&geometries=geojson`;
      
      const directionsResponse = await fetch(directionsUrl);
      const directionsData = await directionsResponse.json();

      if (directionsData.routes && directionsData.routes.length > 0) {
        const drivingTimeMinutes = Math.ceil(directionsData.routes[0].duration / 60);
        
        if (drivingTimeMinutes > 15) {
          return new Response(
            JSON.stringify({ 
              isValid: false, 
              message: `Sorry, we don't currently deliver to ZIP code ${zipCode}. We only deliver within a 15-minute radius of our restaurant (estimated ${drivingTimeMinutes} minutes to your location).`
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // If within range but not in DB, add it
        await supabase
          .from('delivery_zones')
          .insert({ zip_code: zipCode, estimated_minutes: drivingTimeMinutes, is_active: true })
          .select()
          .single();

        return new Response(
          JSON.stringify({ 
            isValid: true, 
            estimatedMinutes: drivingTimeMinutes,
            message: `Estimated delivery time: ${drivingTimeMinutes} minutes`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          isValid: false, 
          message: `Sorry, we don't currently deliver to ZIP code ${zipCode}. We only deliver within a 15-minute radius of our restaurant.`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        isValid: true, 
        estimatedMinutes: zone.estimated_minutes,
        message: `Estimated delivery time: ${zone.estimated_minutes} minutes`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Delivery validation error:', error);
    return new Response(
      JSON.stringify({ 
        isValid: false, 
        message: 'Unable to validate delivery address. Please try again.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
