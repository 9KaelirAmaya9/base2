import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  validateDeliveryAddressGoogle,
  type GoogleMapsValidationResult,
} from "@/utils/googleMapsValidation";
import { GooglePlacesAutocomplete } from "@/components/GooglePlacesAutocomplete";

interface ValidatedAddress {
  address: string;
  isValid: boolean;
  estimatedMinutes?: number;
}

interface DeliveryAddressValidatorProps {
  onValidationComplete?: (result: ValidatedAddress) => void;
  debounceDelay?: number; // kept for backwards compatibility, not used
}

const DeliveryAddressValidator = ({
  onValidationComplete,
}: DeliveryAddressValidatorProps) => {
  const { t } = useLanguage();
  const [address, setAddress] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<{
    place_id: string;
    formatted_address: string;
  } | null>(null);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<GoogleMapsValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleValidate = async () => {
    if (!selectedPlace?.place_id) {
      setError("Please select an address from the suggestions before validating.");
      return;
    }

    setValidating(true);
    setResult(null);
    setError(null);

    try {
      const validation = await validateDeliveryAddressGoogle(
        selectedPlace.place_id,
        selectedPlace.formatted_address,
      );

      setResult(validation);

      if (onValidationComplete) {
        onValidationComplete({
          address: validation.formattedAddress || selectedPlace.formatted_address,
          isValid: validation.isValid,
          estimatedMinutes: validation.estimatedMinutes,
        });
      }
    } catch (e: any) {
      console.error("❌ Google Maps validation error on Location page:", e);
      setError(
        e?.message ||
          "We couldn't validate this address right now. Please try again or call to confirm.",
      );
    } finally {
      setValidating(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="space-y-2">
        <h3 className="font-serif text-2xl font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          {t("location.deliveryCheckTitle") || "Check Delivery Availability"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("location.deliveryCheckSubtitle") ||
            "Enter your address to see if you're within our 15-minute delivery zone."}
        </p>
      </div>

      <GooglePlacesAutocomplete
        id="location-delivery-address"
        label={t("location.deliveryAddressLabel") || "Delivery Address"}
        value={address}
        onChange={(value, place) => {
          setAddress(value);
          if (place) {
            setSelectedPlace({
              place_id: place.place_id,
              formatted_address: place.formatted_address,
            });
          }
        }}
        onPlaceSelect={(place) => {
          setSelectedPlace({
            place_id: place.place_id,
            formatted_address: place.formatted_address,
          });
          setAddress(place.formatted_address);
        }}
        placeholder="Start typing your address..."
        required
      />

      <Button
        onClick={handleValidate}
        disabled={validating}
        className="w-full bg-primary hover:bg-primary/90"
      >
        {validating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {t("validating") || "Validating..."}
          </>
        ) : (
          <>
            <CheckCircle className="h-4 w-4 mr-2" />
            {t("location.checkButton") || "Check Delivery"}
          </>
        )}
      </Button>

      {error && (
        <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/30 p-3">
          <XCircle className="h-4 w-4 text-destructive mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {result && (
        <div
          className={`flex items-start gap-2 rounded-md border p-3 ${
            result.isValid
              ? "bg-emerald-500/10 border-emerald-500/40"
              : "bg-destructive/10 border-destructive/40"
          }`}
        >
          {result.isValid ? (
            <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5" />
          ) : (
            <XCircle className="h-4 w-4 text-destructive mt-0.5" />
          )}
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {result.message ||
                (result.isValid
                  ? "You're within our delivery zone!"
                  : "This address is outside our delivery zone.")}
            </p>
            {result.estimatedMinutes && result.isValid && (
              <p className="text-xs text-muted-foreground">
                Estimated delivery time: {result.estimatedMinutes} minutes
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default DeliveryAddressValidator;

