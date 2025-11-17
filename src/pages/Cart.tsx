import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShoppingCart, ArrowRight, Plus, Minus, Trash2, CreditCard } from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import SecurePaymentModal from "@/components/checkout/SecurePaymentModal";
import { CheckoutAuthOptions } from "@/components/checkout/CheckoutAuthOptions";
import { validateDeliveryAddress } from "@/utils/deliveryValidation";

const Cart = () => {
  const { t } = useLanguage();
  const { cart, orderType, setOrderType, updateQuantity, removeFromCart, clearCart, cartTotal, cartCount } = useCart();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [checkoutClientSecret, setCheckoutClientSecret] = useState<string | null>(null);
  const [checkoutPublishableKey, setCheckoutPublishableKey] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [currentOrderNumber, setCurrentOrderNumber] = useState<string | null>(null);
  const [showAuthOptions, setShowAuthOptions] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount_amount: number; description?: string } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  useEffect(() => {
    // Check auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (session?.user?.email) {
        setCustomerInfo(prev => ({ ...prev, email: session.user.email }));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      if (session?.user?.email) {
        setCustomerInfo(prev => ({ ...prev, email: session.user.email }));
      }
    });

    const success = searchParams.get("success");
    const orderNumber = searchParams.get("order_number");
    
    if (success === "true" && orderNumber) {
      // Order status is already updated by SecurePaymentModal or webhook
      // Just show success and redirect
      toast.success(`Payment successful! Order #${orderNumber} is confirmed.`);
      clearCart();
      // Clean up URL parameters and redirect to success page
      window.history.replaceState({}, '', '/cart');
      navigate(`/order-success?order_number=${encodeURIComponent(orderNumber)}`);
    } else if (searchParams.get("canceled") === "true") {
      toast.error("Payment was canceled. Your cart items are still here.");
      window.history.replaceState({}, '', '/cart');
    }

    return () => subscription.unsubscribe();
  }, [searchParams, clearCart]);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      toast.error(t("order.cartEmpty"));
      return;
    }

    if (isProcessing) return;

    // Input validation schema - name, phone, and email are REQUIRED
    const orderSchema = z.object({
      name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
      phone: z.string().trim().min(10, "Phone number must be at least 10 digits").max(20, "Phone number is too long"),
      email: z.string().trim().email("Please enter a valid email address").max(255, "Email is too long"),
      address: z.string().trim().max(500, "Address is too long").optional().or(z.literal("")),
      notes: z.string().trim().max(1000, "Notes are too long").optional().or(z.literal("")),
    });
    
    // Validate customer information
    const validation = orderSchema.safeParse(customerInfo);
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message, {
        duration: 5000,
      });
      // Scroll to the form to show the error
      document.getElementById('name')?.focus();
      return;
    }

    if (orderType === "delivery" && !customerInfo.address.trim()) {
      toast.error("Please provide a delivery address");
      return;
    }

    // Validate delivery zone with geospatial accuracy
    if (orderType === "delivery") {
      const deliveryValidation = await validateDeliveryAddress(customerInfo.address);
      if (!deliveryValidation.isValid) {
        // Show error with pickup suggestion if outside zone
        if (deliveryValidation.suggestPickup) {
          toast.error(deliveryValidation.message || "We apologize, but delivery isn't available to this location. Pickup is always available!", {
            duration: 6000,
            action: {
              label: "Switch to Pickup",
              onClick: () => setOrderType("pickup")
            }
          });
        } else {
          toast.error(deliveryValidation.message || "Invalid delivery address");
        }
        return;
      }
      if (deliveryValidation.estimatedMinutes) {
        toast.success(deliveryValidation.message || `Estimated delivery: ${deliveryValidation.estimatedMinutes} min`, {
          duration: 4000
        });
      }
    }

    setIsProcessing(true);

    try {
      const subtotal = cartTotal;
      const discountAmount = appliedCoupon?.discount_amount || 0;
      const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
      const tax = subtotalAfterDiscount * 0.08875; // NYC sales tax: 8.875%
      const deliveryFee = orderType === "delivery" ? 5.00 : 0; // $5 delivery fee
      const total = subtotalAfterDiscount + tax + deliveryFee;

      // Get current user if authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      // Generate order number on client to avoid needing SELECT permissions
      const orderNumber = `ORD-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random() * 9000)}`;
      const { error } = await supabase
        .from("orders")
        .insert([{
          order_number: orderNumber,
          user_id: session?.user?.id || null,
          customer_name: validation.data.name,
          customer_email: validation.data.email || null,
          customer_phone: validation.data.phone,
          order_type: orderType,
          delivery_address: orderType === "delivery" ? validation.data.address : null,
          items: cart as any,
          subtotal,
          tax,
          total: total, // Include delivery fee in total
          coupon_code: appliedCoupon?.code || null,
          discount_amount: discountAmount,
          notes: validation.data.notes || null,
          status: "pending",
        }], { returning: 'minimal' } as any);

      if (error) throw error;

      // Send push notification to kitchen staff and admins
      try {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            title: 'New Order Received!',
            body: `Order #${orderNumber} - ${cart.length} items - $${total.toFixed(2)}`,
            data: {
              orderId: orderNumber,
              orderNumber: orderNumber,
              url: '/kitchen'
            },
            targetRoles: ['admin', 'kitchen']
          }
        });
      } catch (notifError) {
        console.error('Failed to send push notification:', notifError);
        // Don't fail the order if notification fails
      }

      // Create PaymentIntent for secure modal checkout
      // Map cart items to the format expected by the payment function
      const paymentItems = cart.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));

      const { data: piData, error: piError } = await supabase.functions.invoke(
        'create-payment-intent',
        {
          body: {
            items: paymentItems,
            orderType,
            customerInfo: validation.data,
            orderNumber,
            couponCode: appliedCoupon?.code || null,
            discountAmount: discountAmount,
          }
        }
      );

      if (piError) {
        console.error("Payment intent error:", piError);
        // Show the actual error message if available
        const errorMessage = piError.message || piError.error || "Failed to create payment intent";
        throw new Error(errorMessage);
      }

      if (piData?.clientSecret && piData?.publishableKey) {
        setCurrentOrderNumber(orderNumber);
        setCheckoutClientSecret(piData.clientSecret as string);
        setCheckoutPublishableKey(piData.publishableKey as string);
        setShowCheckout(true);
        setIsProcessing(false);
        return;
      } else {
        console.error("Payment intent response missing data:", piData);
        throw new Error('Payment service returned invalid data. Please try again.');
      }


    } catch (error: any) {
      console.error("Order error:", error);
      // Show the actual error message to help debug
      const errorMessage = error?.message || error?.error || "Failed to process payment. Please try again.";
      toast.error(errorMessage, {
        duration: 5000,
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Navigation />
      
      <div className="pt-24 sm:pt-28 md:pt-32 pb-16 sm:pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold mb-8 sm:mb-12 text-center">
              {t("cart.title")} <span className="text-primary">{t("cart.titleHighlight")}</span>
            </h1>

            {cart.length === 0 ? (
              <Card className="p-12 text-center">
                <ShoppingCart className="h-20 w-20 mx-auto mb-6 text-muted-foreground opacity-20" />
                <h2 className="font-serif text-3xl font-semibold mb-4">
                  {t("cart.empty")}
                </h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  {t("cart.emptyDesc")}
                </p>
                <Link to="/order">
                  <Button size="lg" className="gap-2">
                    {t("cart.browseMenu")}
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-6">
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-serif text-2xl font-semibold">
                        {t("order.yourOrder")} ({cartCount} items)
                      </h2>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={clearCart}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear All
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div key={item.id} className="flex gap-4 pb-4 border-b border-border last:border-0">
                          {item.image && (
                            <img 
                              src={item.image} 
                              alt={item.name}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              ${item.price.toFixed(2)} each
                            </p>
                            <p className="text-sm font-semibold text-primary mt-1">
                              Subtotal: ${(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                          <div className="flex flex-col items-end justify-between">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, -1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-medium">
                                {item.quantity}
                              </span>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Link to="/order">
                    <Button variant="outline" className="w-full gap-2">
                      <ArrowRight className="h-4 w-4 rotate-180" />
                      Continue Shopping
                    </Button>
                  </Link>
                </div>

                {/* Checkout Form */}
                <div className="lg:col-span-1">
                  <Card className="p-4 sm:p-6 lg:sticky lg:top-32">
                    <h2 className="font-serif text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Checkout</h2>

                    <Tabs value={orderType} onValueChange={(v) => setOrderType(v as "pickup" | "delivery")} className="mb-6">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="pickup">{t("order.pickup")}</TabsTrigger>
                        <TabsTrigger value="delivery">{t("order.delivery")}</TabsTrigger>
                      </TabsList>
                    </Tabs>

                    <div className="space-y-4 mb-6">
                      <div>
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          value={customerInfo.name}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                          placeholder="Your full name"
                          required
                          className={customerInfo.name.length > 0 && customerInfo.name.length < 2 ? "border-destructive" : ""}
                        />
                        {customerInfo.name.length > 0 && customerInfo.name.length < 2 && (
                          <p className="text-xs text-destructive mt-1">Name must be at least 2 characters</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="phone">Phone *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={customerInfo.phone}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                          placeholder="(555) 123-4567"
                          required
                          className={customerInfo.phone.length > 0 && customerInfo.phone.length < 10 ? "border-destructive" : ""}
                        />
                        {customerInfo.phone.length > 0 && customerInfo.phone.length < 10 && (
                          <p className="text-xs text-destructive mt-1">Phone must be at least 10 digits</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={customerInfo.email}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                          placeholder="your@email.com (for order confirmation)"
                          required
                          className={customerInfo.email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email.trim()) ? "border-destructive" : ""}
                        />
                        {customerInfo.email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email.trim()) && (
                          <p className="text-xs text-destructive mt-1">Please enter a valid email address</p>
                        )}
                      </div>

                      {orderType === "delivery" && (
                        <div>
                          <Label htmlFor="address">Delivery Address *</Label>
                          <Textarea
                            id="address"
                            value={customerInfo.address}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                            placeholder="Street address, apt #, city, zip"
                            rows={3}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            We deliver within a 15-minute drive from our restaurant. If you're outside this zone, pickup is always available!
                          </p>
                        </div>
                      )}

                      <div>
                        <Label htmlFor="notes">Special Instructions</Label>
                        <Textarea
                          id="notes"
                          value={customerInfo.notes}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                          placeholder="Any special requests..."
                          rows={2}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Coupon Code Input */}
                      <div className="space-y-2">
                        <Label htmlFor="coupon">Promo Code (Optional)</Label>
                        <div className="flex gap-2">
                          <Input
                            id="coupon"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            placeholder="Enter code"
                            disabled={!!appliedCoupon || isValidatingCoupon}
                            className="flex-1"
                          />
                          {appliedCoupon ? (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setAppliedCoupon(null);
                                setCouponCode("");
                              }}
                            >
                              Remove
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={async () => {
                                if (!couponCode.trim()) return;
                                setIsValidatingCoupon(true);
                                try {
                                  const subtotal = cartTotal;
                                  const tax = subtotal * 0.08875;
                                  const deliveryFee = orderType === "delivery" ? 5.00 : 0;
                                  const orderAmount = subtotal + tax + deliveryFee;

                                  const { data, error } = await supabase.functions.invoke('validate-coupon', {
                                    body: { code: couponCode.trim(), orderAmount }
                                  });

                                  if (error || !data?.valid) {
                                    toast.error(data?.error || 'Invalid coupon code');
                                    return;
                                  }

                                  setAppliedCoupon({
                                    code: data.coupon.code,
                                    discount_amount: data.coupon.discount_amount,
                                    description: data.coupon.description,
                                  });
                                  toast.success(`Coupon "${data.coupon.code}" applied! ${data.coupon.description || ''}`);
                                } catch (err: any) {
                                  toast.error(err?.message || 'Failed to validate coupon');
                                } finally {
                                  setIsValidatingCoupon(false);
                                }
                              }}
                              disabled={isValidatingCoupon || !couponCode.trim()}
                            >
                              {isValidatingCoupon ? "..." : "Apply"}
                            </Button>
                          )}
                        </div>
                        {appliedCoupon && (
                          <p className="text-sm text-green-600 dark:text-green-400">
                            ✓ {appliedCoupon.code} applied: -${appliedCoupon.discount_amount.toFixed(2)}
                            {appliedCoupon.description && ` (${appliedCoupon.description})`}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 py-4 border-t border-border">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>${cartTotal.toFixed(2)}</span>
                        </div>
                        {appliedCoupon && (
                          <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                            <span>Discount ({appliedCoupon.code})</span>
                            <span>-${appliedCoupon.discount_amount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Tax (NYC 8.875%)</span>
                          <span>${((cartTotal - (appliedCoupon?.discount_amount || 0)) * 0.08875).toFixed(2)}</span>
                        </div>
                        {orderType === "delivery" && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Delivery Fee</span>
                            <span>$5.00</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-lg font-semibold pt-2 border-t border-border">
                          <span>{t("order.total")}</span>
                          <span className="text-primary">
                            ${((cartTotal - (appliedCoupon?.discount_amount || 0)) * 1.08875 + (orderType === "delivery" ? 5.00 : 0)).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {!showAuthOptions ? (
                        <Button 
                          className="w-full" 
                          size="lg"
                          onClick={() => {
                            // Quick validation before showing auth options
                            if (!customerInfo.name.trim() || customerInfo.name.trim().length < 2) {
                              toast.error("Please enter your name (at least 2 characters)");
                              document.getElementById('name')?.focus();
                              return;
                            }
                            if (!customerInfo.phone.trim() || customerInfo.phone.trim().length < 10) {
                              toast.error("Please enter a valid phone number (at least 10 digits)");
                              document.getElementById('phone')?.focus();
                              return;
                            }
                            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                            if (!customerInfo.email.trim() || !emailRegex.test(customerInfo.email.trim())) {
                              toast.error("Please enter a valid email address");
                              document.getElementById('email')?.focus();
                              return;
                            }
                            if (orderType === "delivery" && !customerInfo.address.trim()) {
                              toast.error("Please enter a delivery address");
                              document.getElementById('address')?.focus();
                              return;
                            }
                            setShowAuthOptions(true);
                          }}
                          disabled={cart.length === 0}
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          Proceed to Checkout
                        </Button>
                      ) : (
                        <CheckoutAuthOptions
                          onContinueAsGuest={handlePlaceOrder}
                          onAuthSuccess={handlePlaceOrder}
                        />
                      )}

                      {checkoutClientSecret && checkoutPublishableKey && currentOrderNumber && (
                        <SecurePaymentModal
                          open={showCheckout}
                          onOpenChange={setShowCheckout}
                          clientSecret={checkoutClientSecret}
                          publishableKey={checkoutPublishableKey}
                          orderNumber={currentOrderNumber}
                          customerInfo={customerInfo}
                          orderType={orderType}
                          cartTotal={cartTotal}
                          cart={cart}
                          onSuccess={() => {
                            clearCart();
                            setCustomerInfo({ name: "", phone: "", email: "", address: "", notes: "" });
                            setAppliedCoupon(null);
                            setCouponCode("");
                            setShowCheckout(false);
                            setCheckoutClientSecret(null);
                            setCheckoutPublishableKey(null);
                            navigate(`/order-success?order_number=${currentOrderNumber}`);
                          }}
                        />
                      )}

                      <p className="text-xs text-center text-muted-foreground">
                        {orderType === "delivery" ? t("order.deliveryNote") : t("order.pickupNote")}
                      </p>
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
