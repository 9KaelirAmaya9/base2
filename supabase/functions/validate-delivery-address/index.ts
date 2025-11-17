import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeliveryValidationRequest {
  address: string;
}

// Restaurant location: 505 51st Street, Brooklyn, NY 11220
// Verified coordinates: 40.6501° N, 74.0060° W (longitude is negative for Western hemisphere)
const RESTAURANT_COORDINATES = {
  longitude: -74.0060,
  latitude: 40.6501,
  address: '505 51st Street, Brooklyn, NY 11220'
};

// Maximum delivery time in minutes
const MAX_DELIVERY_TIME_MINUTES = 15;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address }: DeliveryValidationRequest = await req.json();
    
    if (!address || address.trim().length === 0) {
      return new Response(
        JSON.stringify({ 
          isValid: false, 
          message: 'Please provide a delivery address.',
          suggestPickup: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const MAPBOX_TOKEN = Deno.env.get('MAPBOX_PUBLIC_TOKEN');
    
    if (!MAPBOX_TOKEN) {
      console.error('MAPBOX_PUBLIC_TOKEN not configured');
      return new Response(
        JSON.stringify({ 
          isValid: false, 
          message: 'Service temporarily unavailable. Please try pickup instead.',
          suggestPickup: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Step 1: Geocode the address to get precise coordinates and ZIP code
    // Using proximity bias to improve accuracy for NYC addresses
    const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&country=US&proximity=${RESTAURANT_COORDINATES.longitude},${RESTAURANT_COORDINATES.latitude}&types=address&limit=1`;
    
    const geocodeResponse = await fetch(geocodeUrl);
    
    if (!geocodeResponse.ok) {
      console.error('Mapbox geocoding error:', geocodeResponse.statusText);
      return new Response(
        JSON.stringify({ 
          isValid: false, 
          message: 'We apologize, but we couldn\'t verify your address. Pickup is always available!',
          suggestPickup: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geocodeData = await geocodeResponse.json();

    if (!geocodeData.features || geocodeData.features.length === 0) {
      return new Response(
        JSON.stringify({ 
          isValid: false, 
          message: 'We apologize, but we couldn\'t find that address. Please check and try again, or choose pickup instead.',
          suggestPickup: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const feature = geocodeData.features[0];
    const zipCode = feature.context?.find((c: any) => c.id?.startsWith('postcode'))?.text;
    const coordinates = feature.center; // [longitude, latitude]
    const [deliveryLongitude, deliveryLatitude] = coordinates;

    // Validate coordinates are valid numbers
    if (!deliveryLongitude || !deliveryLatitude || 
        isNaN(deliveryLongitude) || isNaN(deliveryLatitude) ||
        Math.abs(deliveryLongitude) > 180 || Math.abs(deliveryLatitude) > 90) {
      return new Response(
        JSON.stringify({ 
          isValid: false, 
          message: 'We apologize, but we couldn\'t verify the coordinates for that address. Pickup is always available!',
          suggestPickup: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!zipCode) {
      return new Response(
        JSON.stringify({ 
          isValid: false, 
          message: 'Please include a valid ZIP code in your delivery address, or choose pickup instead.',
          suggestPickup: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Check if ZIP code is in pre-approved delivery zones
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: zone, error: zoneError } = await supabase
      .from('delivery_zones')
      .select('estimated_minutes, is_active')
      .eq('zip_code', zipCode)
      .eq('is_active', true)
      .single();

    // Step 3: If not in database, calculate real-time driving time with traffic
    if (zoneError || !zone) {
      // Use Mapbox Directions API with traffic-aware routing
      // The 'driving-traffic' profile uses real-time traffic data
      const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${RESTAURANT_COORDINATES.longitude},${RESTAURANT_COORDINATES.latitude};${deliveryLongitude},${deliveryLatitude}?access_token=${MAPBOX_TOKEN}&geometries=geojson&overview=full&steps=false&alternatives=false`;
      
      const directionsResponse = await fetch(directionsUrl);
      
      if (!directionsResponse.ok) {
        console.error('Mapbox directions error:', directionsResponse.statusText);
        // Fallback to regular driving (without traffic) if traffic API fails
        const fallbackUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${RESTAURANT_COORDINATES.longitude},${RESTAURANT_COORDINATES.latitude};${deliveryLongitude},${deliveryLatitude}?access_token=${MAPBOX_TOKEN}&geometries=geojson`;
        const fallbackResponse = await fetch(fallbackUrl);
        const fallbackData = await fallbackResponse.json();
        
        if (fallbackData.routes && fallbackData.routes.length > 0) {
          const drivingTimeMinutes = Math.ceil(fallbackData.routes[0].duration / 60);
          
          if (drivingTimeMinutes > MAX_DELIVERY_TIME_MINUTES) {
            return new Response(
              JSON.stringify({ 
                isValid: false, 
                message: `We apologize, but your location is outside our 15-minute delivery zone (estimated ${drivingTimeMinutes} minutes away). Pickup is always available and ready in 20-30 minutes!`,
                suggestPickup: true,
                estimatedMinutes: drivingTimeMinutes
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      } else {
        const directionsData = await directionsResponse.json();

        if (directionsData.routes && directionsData.routes.length > 0) {
          // Use the fastest route with current traffic conditions
          const route = directionsData.routes[0];
          const drivingTimeMinutes = Math.ceil(route.duration / 60); // Duration in seconds, convert to minutes
          const distanceMiles = (route.distance / 1609.34).toFixed(1); // Distance in meters, convert to miles
          
          // Validate the route is reasonable (not too far)
          if (drivingTimeMinutes > MAX_DELIVERY_TIME_MINUTES) {
            return new Response(
              JSON.stringify({ 
                isValid: false, 
                message: `We apologize, but your location is outside our 15-minute delivery zone (estimated ${drivingTimeMinutes} minutes away with current traffic). Pickup is always available and ready in 20-30 minutes!`,
                suggestPickup: true,
                estimatedMinutes: drivingTimeMinutes,
                distanceMiles: parseFloat(distanceMiles)
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          // If within range but not in DB, add it for future reference
          try {
            await supabase
              .from('delivery_zones')
              .upsert({ 
                zip_code: zipCode, 
                estimated_minutes: drivingTimeMinutes, 
                is_active: true 
              }, {
                onConflict: 'zip_code'
              });
          } catch (dbError) {
            console.error('Error saving delivery zone:', dbError);
            // Don't fail validation if DB insert fails
          }

          return new Response(
            JSON.stringify({ 
              isValid: true, 
              estimatedMinutes: drivingTimeMinutes,
              message: `Estimated delivery time: ${drivingTimeMinutes} minutes (with current traffic)`,
              distanceMiles: parseFloat(distanceMiles)
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // If we can't calculate route, be conservative and suggest pickup
      return new Response(
        JSON.stringify({ 
          isValid: false, 
          message: 'We apologize, but we couldn\'t calculate the delivery time to your location. Pickup is always available and ready in 20-30 minutes!',
          suggestPickup: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 4: Return validated zone data
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
        message: 'We apologize, but we couldn\'t validate your address. Pickup is always available!',
        suggestPickup: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
