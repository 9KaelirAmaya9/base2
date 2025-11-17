import { supabase } from "@/integrations/supabase/client";

export interface DeliveryValidationResult {
  isValid: boolean;
  estimatedMinutes?: number;
  message?: string;
  suggestPickup?: boolean;
  distanceMiles?: number;
}

export const validateDeliveryAddress = async (address: string): Promise<DeliveryValidationResult> => {
  try {
    // Use edge function for real-time validation with Mapbox
    const { data, error } = await supabase.functions.invoke('validate-delivery-address', {
      body: { address }
    });

    if (error) {
      console.error("Delivery validation error:", error);
      return {
        isValid: false,
        message: "We apologize, but we couldn't validate your address. Pickup is always available!",
        suggestPickup: true
      };
    }

    return data as DeliveryValidationResult;
  } catch (error) {
    console.error("Delivery validation error:", error);
    return {
      isValid: false,
      message: "We apologize, but we couldn't validate your address. Pickup is always available!",
      suggestPickup: true
    };
  }
};
