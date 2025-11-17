import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { validateDeliveryAddress } from '@/utils/deliveryValidation';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface AddressSuggestion {
  address: string;
  coordinates: [number, number];
}

interface ValidatedAddress {
  address: string;
  coordinates?: [number, number];
  isValid: boolean;
  estimatedMinutes?: number;
}

interface DeliveryAddressValidatorProps {
  onValidationComplete?: (result: ValidatedAddress) => void;
}

const DeliveryAddressValidator = ({ onValidationComplete }: DeliveryAddressValidatorProps) => {
  const { t } = useLanguage();
  const [address, setAddress] = useState('');
  const [validating, setValidating] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [result, setResult] = useState<{
    isValid: boolean;
    message: string;
    estimatedMinutes?: number;
  } | null>(null);

  // Initialize Mapbox token
  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;
    if (token) {
      mapboxgl.accessToken = token;
    }
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch autocomplete suggestions
  const fetchSuggestions = async (query: string) => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke('geocode-autocomplete', {
        body: { query },
      });

      if (error) {
        console.error('Autocomplete error:', error);
        setSuggestions([]);
      } else {
        setSuggestions(data?.suggestions || []);
        setShowSuggestions((data?.suggestions || []).length > 0);
      }
    } catch (error) {
      console.error('Autocomplete error:', error);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Debounced address input
  const handleAddressChange = (value: string) => {
    setAddress(value);
    setResult(null);

    // Clear previous timeout
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }

    // Set new timeout for fetching suggestions
    suggestionTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  // Handle map preview on hover
  useEffect(() => {
    if (hoveredIndex === null || !mapContainerRef.current || !suggestions[hoveredIndex]) {
      // Cleanup map if no hover
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      return;
    }

    const coords = suggestions[hoveredIndex].coordinates;
    
    // Create new map
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: coords,
        zoom: 14,
        interactive: false,
      });

      // Add marker
      new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat(coords)
        .addTo(mapRef.current);
    } else if (mapRef.current) {
      // Update existing map
      mapRef.current.flyTo({ center: coords, zoom: 14 });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [hoveredIndex, suggestions]);

  // Handle suggestion selection with auto-validation
  const handleSuggestionClick = async (suggestion: AddressSuggestion) => {
    setAddress(suggestion.address);
    setShowSuggestions(false);
    setSuggestions([]);
    setHoveredIndex(null);
    
    // Auto-validate after selection
    setValidating(true);
    setResult(null);
    
    try {
      const validationResult = await validateDeliveryAddress(suggestion.address);
      const result = {
        isValid: validationResult.isValid,
        message: validationResult.message || '',
        estimatedMinutes: validationResult.estimatedMinutes,
      };
      setResult(result);
      
      // Notify parent component
      if (onValidationComplete) {
        onValidationComplete({
          address: suggestion.address,
          coordinates: suggestion.coordinates,
          isValid: validationResult.isValid,
          estimatedMinutes: validationResult.estimatedMinutes,
        });
      }
    } catch (error) {
      setResult({
        isValid: false,
        message: 'Unable to validate address. Please try again.',
      });
    } finally {
      setValidating(false);
    }
  };

  const handleValidate = async () => {
    if (!address.trim()) return;

    setValidating(true);
    setResult(null);

    try {
      const validationResult = await validateDeliveryAddress(address);
      const result = {
        isValid: validationResult.isValid,
        message: validationResult.message || '',
        estimatedMinutes: validationResult.estimatedMinutes,
      };
      setResult(result);
      
      // Notify parent component (without coordinates as we only have address)
      if (onValidationComplete) {
        onValidationComplete({
          address: address,
          isValid: validationResult.isValid,
          estimatedMinutes: validationResult.estimatedMinutes,
        });
      }
    } catch (error) {
      setResult({
        isValid: false,
        message: 'Unable to validate address. Please try again.',
      });
    } finally {
      setValidating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleValidate();
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <MapPin className="h-6 w-6 text-primary" />
        <h3 className="font-serif text-2xl font-semibold">
          {t("location.checkDelivery")}
        </h3>
      </div>
      
      <p className="text-muted-foreground mb-4">
        {t("location.checkDeliverySubtext")}
      </p>

      <div className="flex gap-2 mb-4" ref={wrapperRef}>
        <div className="flex-1 relative">
          <Input
            type="text"
            placeholder="Enter your delivery address..."
            value={address}
            onChange={(e) => handleAddressChange(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            disabled={validating}
          />
          
          {/* Autocomplete suggestions dropdown with map preview */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 flex gap-2">
              {/* Suggestions list */}
              <div className="flex-1 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={`w-full px-4 py-3 text-left transition-colors flex items-start gap-2 border-b border-border last:border-b-0 ${
                      hoveredIndex === index ? 'bg-muted' : 'hover:bg-muted/50'
                    }`}
                  >
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{suggestion.address}</span>
                  </button>
                ))}
              </div>
              
              {/* Map preview - hidden on mobile, shown on larger screens */}
              {hoveredIndex !== null && (
                <div className="hidden lg:block w-64 h-60 bg-background border border-border rounded-lg shadow-lg overflow-hidden">
                  <div ref={mapContainerRef} className="w-full h-full" />
                </div>
              )}
            </div>
          )}

          {/* Loading indicator for suggestions */}
          {loadingSuggestions && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        
        <Button 
          onClick={handleValidate} 
          disabled={validating || !address.trim()}
        >
          {validating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            'Check'
          )}
        </Button>
      </div>

      {result && (
        <div
          className={`p-4 rounded-lg border ${
            result.isValid
              ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900'
              : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'
          }`}
        >
          <div className="flex items-start gap-3">
            {result.isValid ? (
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className={`font-semibold ${
                result.isValid 
                  ? 'text-green-900 dark:text-green-100' 
                  : 'text-amber-900 dark:text-amber-100'
              }`}>
                {result.isValid ? 'Delivery Available!' : 'Outside Delivery Zone'}
              </p>
              <p className={`text-sm mt-1 ${
                result.isValid 
                  ? 'text-green-700 dark:text-green-300' 
                  : 'text-amber-700 dark:text-amber-300'
              }`}>
                {result.message}
              </p>
              {result.estimatedMinutes && (
                <p className="text-sm font-medium mt-2 text-green-800 dark:text-green-200">
                  Estimated delivery: ~{result.estimatedMinutes} minutes
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default DeliveryAddressValidator;
