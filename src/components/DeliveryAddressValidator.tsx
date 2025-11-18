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
  debounceDelay?: number;
}

const DeliveryAddressValidator = ({ 
  onValidationComplete,
  debounceDelay = 300 
}: DeliveryAddressValidatorProps) => {
  const { t } = useLanguage();
  const [address, setAddress] = useState('');
  const [validating, setValidating] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [autocompleteError, setAutocompleteError] = useState<string | null>(null);
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
  const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedAddress, setConfirmedAddress] = useState<string>('');

  useEffect(() => {
    const fetchToken = async () => {
      console.log('🔄 DeliveryAddressValidator: Fetching Mapbox token...');
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) {
          console.error('❌ Error fetching token:', error);
          return;
        }
        if (data?.token) {
          mapboxgl.accessToken = data.token;
          console.log('✅ Mapbox token configured');
        }
      } catch (error) {
        console.error('❌ Error loading Mapbox token:', error);
      }
    };
    fetchToken();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (query: string) => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      setAutocompleteError(null);
      return;
    }

    console.log('🔍 Fetching suggestions for:', query);
    setLoadingSuggestions(true);
    setAutocompleteError(null);
    
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Autocomplete timeout')), 10000);
      });

      const autocompletePromise = supabase.functions.invoke('geocode-autocomplete', {
        body: { query },
      });

      const { data, error } = await Promise.race([autocompletePromise, timeoutPromise]) as any;

      if (error) {
        console.error('❌ Error fetching suggestions:', error);
        setAutocompleteError('Unable to fetch address suggestions');
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      if (data && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        console.log(`✅ Got ${data.suggestions.length} suggestions`);
        setSuggestions(data.suggestions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error: any) {
      console.error('❌ Autocomplete exception:', error);
      setAutocompleteError(error?.message === 'Autocomplete timeout' 
        ? 'Address lookup timed out' 
        : 'Unable to fetch suggestions');
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    if (hoveredIndex === null || !mapContainerRef.current || !suggestions[hoveredIndex]) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      return;
    }

    const coords = suggestions[hoveredIndex].coordinates;
    
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: coords,
        zoom: 14,
        interactive: false,
      });

      new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat(coords)
        .addTo(mapRef.current);
    } else if (mapRef.current) {
      mapRef.current.flyTo({ center: coords, zoom: 14 });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [hoveredIndex, suggestions]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, 150);
    setAddress(value);
    setResult(null);
    setShowConfirmation(false);
    setSelectedAddress(null);
    
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }
    
    suggestionTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, debounceDelay);
  };

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    console.log('📍 Suggestion selected:', suggestion.address);
    setAddress(suggestion.address);
    setSelectedAddress(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
    setShowConfirmation(true);
  };

  const handleConfirmAddress = async () => {
    if (!selectedAddress) return;
    
    console.log('✅ Address confirmed, validating...');
    setConfirmedAddress(selectedAddress.address);
    setShowConfirmation(false);
    setValidating(true);
    setResult(null);
    
    try {
      const validationResult = await validateDeliveryAddress(selectedAddress.address);
      const result = {
        isValid: validationResult.isValid,
        message: validationResult.message || '',
        estimatedMinutes: validationResult.estimatedMinutes,
      };
      setResult(result);
      
      if (onValidationComplete) {
        onValidationComplete({
          address: selectedAddress.address,
          coordinates: selectedAddress.coordinates,
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

  const handleEditAddress = () => {
    setShowConfirmation(false);
    setSelectedAddress(null);
    setResult(null);
  };

  const handleValidate = async () => {
    if (!address.trim()) return;

    console.log('🔍 Validating address:', address);
    setValidating(true);
    setResult(null);
    setShowSuggestions(false);
    setConfirmedAddress(address);

    try {
      const validationResult = await validateDeliveryAddress(address);
      const result = {
        isValid: validationResult.isValid,
        message: validationResult.message || '',
        estimatedMinutes: validationResult.estimatedMinutes,
      };
      setResult(result);
      
      if (onValidationComplete) {
        onValidationComplete({
          address: address,
          isValid: validationResult.isValid,
          estimatedMinutes: validationResult.estimatedMinutes,
        });
      }
    } catch (error) {
      console.error('❌ Validation exception:', error);
      setResult({
        isValid: false,
        message: 'Unable to validate address. Please try again.',
      });
    } finally {
      setValidating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !showConfirmation) {
      handleValidate();
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 space-y-4 bg-card/95 backdrop-blur-sm border-primary/20">
        <div className="space-y-2" ref={wrapperRef}>
          <label htmlFor="delivery-address" className="text-sm font-medium text-foreground">
            {t('deliveryAddress') || 'Delivery Address'}
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              id="delivery-address"
              type="text"
              placeholder={t('enterDeliveryAddress') || 'Enter your delivery address...'}
              value={address}
              onChange={handleAddressChange}
              onKeyPress={handleKeyPress}
              className="pl-10 pr-10 bg-background border-border focus:border-primary"
              disabled={validating || showConfirmation}
              maxLength={150}
            />
            {loadingSuggestions && (
              <Loader2 className="absolute right-3 top-3 h-5 w-5 text-muted-foreground animate-spin" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {address.length}/150 characters
          </p>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-2xl max-h-80 overflow-hidden">
              <div className="py-2">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="relative"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => {
                      setHoveredIndex(null);
                      if (mapRef.current) {
                        mapRef.current.remove();
                        mapRef.current = null;
                      }
                    }}
                  >
                    <button
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-4 py-3 hover:bg-accent/50 transition-all flex items-start gap-3 group"
                    >
                      <div className="mt-0.5 p-1.5 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {suggestion.address.split(',')[0]}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {suggestion.address.split(',').slice(1).join(',')}
                        </p>
                      </div>
                    </button>
                    
                    {hoveredIndex === index && (
                      <div 
                        ref={mapContainerRef}
                        className="absolute left-full top-0 ml-2 w-72 h-56 rounded-lg shadow-2xl border-2 border-primary/20 z-50 bg-card overflow-hidden"
                        style={{ pointerEvents: 'none' }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {autocompleteError && (
            <p className="text-xs text-destructive">{autocompleteError}</p>
          )}

          {showConfirmation && selectedAddress && (
            <Card className="mt-4 p-4 border-2 border-primary/30 bg-primary/5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="font-semibold text-sm text-foreground">
                    Confirm Your Address
                  </h4>
                  <p className="text-sm text-foreground font-medium">
                    {selectedAddress.address}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Is this address correct?
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleConfirmAddress}
                  disabled={validating}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {validating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Checking Delivery...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Yes, Check Availability
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleEditAddress}
                  variant="outline"
                  disabled={validating}
                >
                  Edit
                </Button>
              </div>
            </Card>
          )}
        </div>

        {!showSuggestions && address && !result && !showConfirmation && !selectedAddress && (
          <Button 
            onClick={handleValidate}
            disabled={validating}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {validating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('validating') || 'Validating...'}
              </>
            ) : (
              t('checkDelivery') || 'Check Delivery Availability'
            )}
          </Button>
        )}

        {result && confirmedAddress && (
          <Card className={`p-5 border-2 ${
            result.isValid 
              ? 'bg-green-50 dark:bg-green-950/30 border-green-500' 
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-500'
          }`}>
            <div className="flex items-start gap-3">
              {result.isValid ? (
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/50">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              ) : (
                <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/50">
                  <XCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <div>
                  <p className={`text-sm font-semibold ${
                    result.isValid 
                      ? 'text-green-900 dark:text-green-100' 
                      : 'text-amber-900 dark:text-amber-100'
                  }`}>
                    {result.isValid ? '✓ Delivery Available' : '⚠ Outside Delivery Zone'}
                  </p>
                  <p className={`text-xs mt-1 ${
                    result.isValid 
                      ? 'text-green-700 dark:text-green-300' 
                      : 'text-amber-700 dark:text-amber-300'
                  }`}>
                    {confirmedAddress}
                  </p>
                </div>
                {result.isValid && result.estimatedMinutes && (
                  <div className="pt-2 border-t border-green-200 dark:border-green-800">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      🚗 Estimated delivery: {result.estimatedMinutes} minutes
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                      Within our 15-minute delivery zone
                    </p>
                  </div>
                )}
                {!result.isValid && (
                  <div className="pt-2 border-t border-amber-200 dark:border-amber-800">
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      {result.message}
                    </p>
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-200 mt-1">
                      💡 Pickup is available and ready in 20-30 minutes!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </Card>
    </div>
  );
};

export default DeliveryAddressValidator;
