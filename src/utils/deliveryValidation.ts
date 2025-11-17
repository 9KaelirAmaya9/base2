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
    console.log("🚀 Starting delivery validation for:", address);
    
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Validation timeout')), 30000); // 30 second timeout
    });

    // Race between the actual call and the timeout
    const validationPromise = supabase.functions.invoke('validate-delivery-address', {
      body: { address }
    });

    const { data, error } = await Promise.race([validationPromise, timeoutPromise]) as any;

    if (error) {
      console.error("❌ Delivery validation error:", error);
      return {
        isValid: false,
        message: "We apologize, but we couldn't validate your address. Pickup is always available!",
        suggestPickup: true
      };
    }

    console.log("✅ Validation successful:", data);
    return data as DeliveryValidationResult;
  } catch (error) {
    console.error("❌ Delivery validation exception:", error);
    return {
      isValid: false,
      message: "We apologize, but we couldn't validate your address. Pickup is always available!",
      suggestPickup: true
    };
  }
};
