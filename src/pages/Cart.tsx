import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShoppingCart, ArrowRight, Plus, Minus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const Cart = () => {
  const { t } = useLanguage();
  const { cart, orderType, setOrderType, updateQuantity, removeFromCart, clearCart, cartTotal, cartCount } = useCart();
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      toast.error(t("order.cartEmpty"));
      return;
    }

    // Input validation schema
    const orderSchema = z.object({
      name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
      phone: z.string().trim().min(10, "Phone number must be at least 10 digits").max(20, "Phone number is too long"),
      email: z.string().trim().email("Invalid email format").max(255, "Email is too long"),
      address: z.string().trim().max(500, "Address is too long").optional().or(z.literal("")),
      notes: z.string().trim().max(1000, "Notes are too long").optional().or(z.literal("")),
    });
    
    // Validate customer information
    const validation = orderSchema.safeParse(customerInfo);
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    if (orderType === "delivery" && !customerInfo.address.trim()) {
      toast.error("Please provide a delivery address");
      return;
    }

    try {
      const subtotal = cartTotal;
      const tax = subtotal * 0.08875; // NYC sales tax: 8.875%
      const total = subtotal + tax;

      const { data: orderData, error } = await supabase
        .from("orders")
        .insert([{
          order_number: "",
          customer_name: validation.data.name,
          customer_email: validation.data.email || null,
          customer_phone: validation.data.phone,
          order_type: orderType,
          delivery_address: orderType === "delivery" ? validation.data.address : null,
          items: cart as any,
          subtotal,
          tax,
          total,
          notes: validation.data.notes || null,
        }])
        .select()
        .single();

      if (error) throw error;

      // Send notification
      try {
        await supabase.functions.invoke('send-order-notification', {
          body: {
            orderNumber: orderData.order_number,
            customerName: validation.data.name,
            customerEmail: validation.data.email || null,
            customerPhone: validation.data.phone,
            orderType: orderType,
            total: total,
            items: cart.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price * item.quantity
            }))
          }
        });
      } catch (notifError) {
        // Don't fail the order if notification fails
        toast.warning("Order placed but notification failed to send");
      }

      toast.success(`${t("order.placed")} #${orderData.order_number} for ${orderType}!`);
      clearCart();
      setCustomerInfo({ name: "", phone: "", email: "", address: "", notes: "" });
    } catch (error: any) {
      toast.error("Failed to place order. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Navigation />
      
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h1 className="font-serif text-5xl md:text-6xl font-bold mb-12 text-center">
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
                  <Card className="p-6 sticky top-32">
                    <h2 className="font-serif text-2xl font-semibold mb-6">Checkout</h2>

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
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone">Phone *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={customerInfo.phone}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                          placeholder="(555) 123-4567"
                        />
                      </div>

                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={customerInfo.email}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                          placeholder="your@email.com (for order confirmation)"
                        />
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
                      <div className="space-y-2 py-4 border-t border-border">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>${cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Tax (NYC 8.875%)</span>
                          <span>${(cartTotal * 0.08875).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-lg font-semibold pt-2 border-t border-border">
                          <span>{t("order.total")}</span>
                          <span className="text-primary">${(cartTotal * 1.08875).toFixed(2)}</span>
                        </div>
                      </div>

                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={handlePlaceOrder}
                      >
                        Place Order
                      </Button>

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
