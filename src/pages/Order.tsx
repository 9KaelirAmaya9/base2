import { Navigation } from "@/components/Navigation";
import { menuItems, menuCategories } from "@/data/menuData";
import { getMenuItemName, getMenuItemDescription } from "@/data/menuTranslations";
import { getCategoryTranslation } from "@/data/translations";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";

const Order = () => {
  const { t, language } = useLanguage();
  const { orderType, setOrderType, addToCart } = useCart();
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
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

          {/* Menu Items - Full Width */}
          <div className="space-y-6">
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
                        {getCategoryTranslation(language, category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Items by Category */}
              <div className="space-y-12">
                {Object.entries(groupedItems).map(([category, items]) => {
                  const CategorySection = () => {
                    const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });
                    
                    return (
                      <div key={category} ref={ref}>
                        {/* Category Header */}
                        <div className={cn(
                          "mb-6 transition-all duration-700",
                          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                        )}>
                          <h2 className="font-serif text-3xl font-bold text-foreground mb-2">
                            {getCategoryTranslation(language, category)}
                          </h2>
                          <div className="h-1 w-20 bg-primary rounded-full"></div>
                        </div>

                        {/* Items Grid */}
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {items.map((item, index) => {
                            const ItemCard = () => {
                              const { ref: cardRef, isVisible: cardVisible } = useScrollAnimation({ 
                                threshold: 0.1,
                                rootMargin: "-50px"
                              });
                              
                              return (
                                <div
                                  ref={cardRef}
                                  className={cn(
                                    "transition-all duration-500",
                                    cardVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                                  )}
                                  style={{ transitionDelay: `${index * 50}ms` }}
                                >
                                  <Card className="overflow-hidden hover:shadow-elegant transition-all duration-300 group flex flex-col border-2 border-transparent hover:border-primary/10 bg-card h-full">
                                     {item.image && (
                                       <div className="relative h-32 overflow-hidden flex-shrink-0">
                                        <img 
                                          src={item.image} 
                                          alt={item.name}
                                          loading="lazy"
                                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        {item.bestSeller && (
                                          <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground shadow-elegant gap-1">
                                            <Star className="h-3 w-3 fill-current" />
                                            Best Seller
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                    <div className="p-5 flex flex-col flex-1 bg-card">
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                          <h3 className="font-serif text-lg font-semibold">
                                            {getMenuItemName(item.id, language, item.name)}
                                          </h3>
                                          {item.bestSeller && !item.image && (
                                            <Badge variant="secondary" className="mt-1 gap-1">
                                              <Star className="h-3 w-3 fill-current" />
                                              Best Seller
                                            </Badge>
                                          )}
                                        </div>
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
                                </div>
                              );
                            };
                            
                            return <ItemCard key={item.id} />;
                          })}
                        </div>
                      </div>
                    );
                  };
                  
                  return <CategorySection key={category} />;
                })}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Order;
