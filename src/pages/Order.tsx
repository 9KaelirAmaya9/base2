import { Navigation } from "@/components/Navigation";
import { menuItems, menuCategories } from "@/data/menuData";
import { getMenuItemName, getMenuItemDescription } from "@/data/menuTranslations";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";

const Order = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { cart, orderType, setOrderType, addToCart, updateQuantity, cartTotal, cartCount } = useCart();
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Group items by category
  const groupedItems = selectedCategory === "All"
    ? menuCategories.reduce((acc, category) => {
        const items = menuItems.filter(item => item.category === category);
        if (items.length > 0) {
          acc[category] = items;
        }
        return acc;
      }, {} as Record<string, typeof menuItems>)
    : { [selectedCategory]: menuItems.filter(item => item.category === selectedCategory) };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error(t("order.cartEmpty"));
      return;
    }
    navigate("/cart");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-serif text-5xl md:text-6xl font-bold mb-6">
              {t("order.title")} <span className="text-primary">{t("order.titleHighlight")}</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              {t("order.subtitle")}
            </p>

            {/* Order Type Selection */}
            <Tabs value={orderType} onValueChange={(v) => setOrderType(v as "pickup" | "delivery")} className="max-w-md mx-auto">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pickup">{t("order.pickup")}</TabsTrigger>
                <TabsTrigger value="delivery">{t("order.delivery")}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Menu Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Category Filter */}
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">{t("order.filterBy")}</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">{t("order.allItems")}</SelectItem>
                    {menuCategories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Items by Category */}
              <div className="space-y-12">
                {Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category}>
                    {/* Category Header */}
                    <div className="mb-6">
                      <h2 className="font-serif text-3xl font-bold text-foreground mb-2">
                        {category}
                      </h2>
                      <div className="h-1 w-20 bg-primary rounded-full"></div>
                    </div>

                    {/* Items Grid */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      {items.map((item) => (
                        <Card key={item.id} className="overflow-hidden hover:shadow-elegant transition-all group flex flex-col">
                          {item.image && (
                            <div className="relative h-40 overflow-hidden flex-shrink-0">
                              <img 
                                src={item.image} 
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}
                          <div className="p-5 flex flex-col flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-serif text-lg font-semibold">
                                {getMenuItemName(item.id, language, item.name)}
                              </h3>
                              <span className="text-lg font-semibold text-primary whitespace-nowrap ml-2">
                                ${item.price.toFixed(2)}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {getMenuItemDescription(item.id, language, item.description)}
                              </p>
                            )}
                            
                            <Button 
                              size="sm" 
                              onClick={() => addToCart({ 
                                id: item.id, 
                                name: getMenuItemName(item.id, language, item.name), 
                                price: item.price,
                                image: item.image 
                              })}
                              className="w-full mt-auto gap-2"
                            >
                              <Plus className="h-4 w-4" />
                              {t("order.addToCart")}
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cart Sidebar */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-32">
                <div className="flex items-center gap-2 mb-6">
                  <ShoppingCart className="h-5 w-5" />
                  <h2 className="font-serif text-2xl font-semibold">{t("order.yourOrder")}</h2>
                  {cartCount > 0 && (
                    <span className="ml-auto bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                      {cartCount}
                    </span>
                  )}
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>{t("order.emptyCart")}</p>
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
                        <span>{t("order.total")}</span>
                        <span className="text-primary">${cartTotal.toFixed(2)}</span>
                      </div>

                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={handleCheckout}
                      >
                        {t("order.checkout")}
                      </Button>

                      <p className="text-xs text-center text-muted-foreground">
                        {orderType === "delivery" ? t("order.deliveryNote") : t("order.pickupNote")}
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
