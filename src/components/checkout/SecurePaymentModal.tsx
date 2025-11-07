import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { AlertCircle, CreditCard, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  address?: string;
  notes?: string;
}

interface SecurePaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientSecret: string;
  publishableKey: string;
  orderNumber: string;
  customerInfo: CustomerInfo;
  orderType: 'pickup' | 'delivery';
  cartTotal: number;
  onSuccess: () => void;
}

function PaymentForm({ 
  orderNumber, 
  customerInfo, 
  orderType, 
  cartTotal, 
  onSuccess 
}: { 
  orderNumber: string; 
  customerInfo: CustomerInfo;
  orderType: string;
  cartTotal: number;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const tax = cartTotal * 0.08875;
  const total = cartTotal + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      toast.error('Payment system not ready. Please try again.');
      return;
    }

    if (!isReady) {
      toast.error('Please wait for the payment form to load.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Validate the payment element
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMessage(submitError.message || 'Please check your payment details.');
        toast.error(submitError.message || 'Please check your payment details.');
        setIsProcessing(false);
        return;
      }

      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/cart?success=true&order_number=${encodeURIComponent(orderNumber)}`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || 'Payment failed. Please try again.');
        toast.error(error.message || 'Payment failed. Please try again.');
        setIsProcessing(false);
        return;
      }

      if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
        toast.success('Payment successful!');
        onSuccess();
      } else {
        setErrorMessage('Payment status unclear. Please check your order status.');
        toast.warning('Payment status unclear. Please check your order status.');
        setIsProcessing(false);
      }
    } catch (err: any) {
      const message = err?.message || 'An unexpected error occurred.';
      setErrorMessage(message);
      toast.error(message);
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order Summary */}
      <Card className="p-4 bg-muted/50">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Order Summary
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Order Number:</span>
            <span className="font-medium">{orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type:</span>
            <span className="font-medium capitalize">{orderType}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal:</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax (8.875%):</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between font-semibold text-base">
            <span>Total:</span>
            <span className="text-primary">${total.toFixed(2)}</span>
          </div>
        </div>
      </Card>

      {/* Customer Info Review */}
      <Card className="p-4 bg-muted/50">
        <h3 className="font-semibold mb-3">Customer Information</h3>
        <div className="space-y-1 text-sm">
          <p><span className="text-muted-foreground">Name:</span> {customerInfo.name}</p>
          <p><span className="text-muted-foreground">Email:</span> {customerInfo.email}</p>
          <p><span className="text-muted-foreground">Phone:</span> {customerInfo.phone}</p>
          {customerInfo.address && (
            <p><span className="text-muted-foreground">Address:</span> {customerInfo.address}</p>
          )}
        </div>
      </Card>

      {/* Stripe Payment Element */}
      <div className="space-y-2">
        <h3 className="font-semibold flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Payment Details
        </h3>
        <p className="text-xs text-muted-foreground">
          Enter your card number, expiration date, CVC, and billing address below. All payment information is securely processed by Stripe.
        </p>
        <div className="border rounded-lg p-4 bg-background">
          <PaymentElement 
            options={{
              layout: 'tabs',
              business: { name: 'Ricos Tacos' },
              fields: {
                billingDetails: {
                  address: {
                    country: 'auto',
                    postalCode: 'auto'
                  }
                }
              },
              terms: {
                card: 'auto'
              }
            }}
            onReady={() => setIsReady(true)}
          />
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
          <p className="text-destructive">{errorMessage}</p>
        </div>
      )}

      {/* Submit Button */}
      <Button 
        type="submit"
        className="w-full" 
        size="lg"
        disabled={!stripe || !elements || !isReady || isProcessing}
      >
        {isProcessing ? (
          'Processing Payment...'
        ) : !isReady ? (
          'Loading Payment Form...'
        ) : (
          `Pay $${total.toFixed(2)}`
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
        <Lock className="h-3 w-3" />
        Secure payment powered by Stripe • PCI-DSS compliant
      </p>
    </form>
  );
}

export default function SecurePaymentModal({
  open,
  onOpenChange,
  clientSecret,
  publishableKey,
  orderNumber,
  customerInfo,
  orderType,
  cartTotal,
  onSuccess,
}: SecurePaymentModalProps) {
  const stripePromise = useMemo<Promise<Stripe | null>>(
    () => loadStripe(publishableKey),
    [publishableKey]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Your Payment</DialogTitle>
          <DialogDescription>
            Review your order details and enter your payment information below.
          </DialogDescription>
        </DialogHeader>
        
        {clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm
              orderNumber={orderNumber}
              customerInfo={customerInfo}
              orderType={orderType}
              cartTotal={cartTotal}
              onSuccess={onSuccess}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
}
