import { Navigation } from "@/components/Navigation";
import { menuItems, menuCategories } from "@/data/menuData";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const Order = () => {
  const [orderType, setOrderType] = useState<"pickup" | "delivery">("pickup");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);

  const filteredItems = selectedCategory === "All" 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const addToCart = (item: { id: string; name: string; price: number }) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
    toast.success(`${item.name} added to cart`);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prevCart => {
      const updatedCart = prevCart.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item
      ).filter(item => item.quantity > 0);
      return updatedCart;
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    toast.success(`Order placed for ${orderType}!`);
    setCart([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-serif text-5xl md:text-6xl font-bold mb-6">
              Order <span className="text-primary">Online</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Choose pickup or delivery and start building your order
            </p>

            {/* Order Type Selection */}
            <Tabs value={orderType} onValueChange={(v) => setOrderType(v as "pickup" | "delivery")} className="max-w-md mx-auto">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pickup">Pickup</TabsTrigger>
                <TabsTrigger value="delivery">Delivery</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Menu Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Category Filter */}
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">Filter by category:</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Items</SelectItem>
                    {menuCategories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Items Grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                {filteredItems.map((item) => (
                  <Card key={item.id} className="p-5 hover:shadow-elegant transition-all">
                    <div className="flex flex-col h-full">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-serif text-lg font-semibold">
                            {item.name}
                          </h3>
                          <span className="text-lg font-semibold text-primary whitespace-nowrap ml-2">
                            ${item.price.toFixed(2)}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {item.description}
                          </p>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {item.category}
                        </div>
                      </div>
                      
                      <Button 
                        size="sm" 
                        onClick={() => addToCart(item)}
                        className="w-full mt-4 gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add to Cart
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Cart Sidebar */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-32">
                <div className="flex items-center gap-2 mb-6">
                  <ShoppingCart className="h-5 w-5" />
                  <h2 className="font-serif text-2xl font-semibold">Your Order</h2>
                  {cartCount > 0 && (
                    <span className="ml-auto bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                      {cartCount}
                    </span>
                  )}
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Your cart is empty</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 pb-3 border-b border-border">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              ${item.price.toFixed(2)}
                            </p>
                          </div>
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
                      ))}
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-lg font-semibold pt-4 border-t border-border">
                        <span>Total:</span>
                        <span className="text-primary">${cartTotal.toFixed(2)}</span>
                      </div>

                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={handleCheckout}
                      >
                        Proceed to Checkout
                      </Button>

                      <p className="text-xs text-center text-muted-foreground">
                        {orderType === "delivery" ? "Delivery fee will be calculated at checkout" : "Pickup available in 20-30 minutes"}
                      </p>
                    </div>
                  </>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Order;
