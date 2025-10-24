import { Navigation } from "@/components/Navigation";
import { menuItems, menuCategories } from "@/data/menuData";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const Menu = () => {
  const { t } = useLanguage();

  const handleAddToCart = (itemName: string) => {
    toast.success(`${itemName} ${t("menu.addToCart")}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="font-serif text-5xl md:text-6xl font-bold mb-6">
              {t("menu.title")} <span className="text-primary">{t("menu.titleHighlight")}</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("menu.subtitle")}
            </p>
          </div>

          {/* Menu by Category */}
          <div className="space-y-20">
            {menuCategories.map((category) => {
              const categoryItems = menuItems.filter(item => item.category === category);
              
              if (categoryItems.length === 0) return null;

              return (
                <section key={category} id={category.toLowerCase().replace(/\s+/g, '-')}>
                  <h2 className="font-serif text-3xl md:text-4xl font-bold mb-8 pb-4 border-b-2 border-primary/20">
                    {category}
                  </h2>
                  
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryItems.map((item) => (
                      <Card key={item.id} className="p-6 hover:shadow-elegant transition-all duration-300 group">
                        <div className="flex flex-col h-full">
                          <div className="flex-1">
                            <h3 className="font-serif text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                              {item.name}
                            </h3>
                            {item.description && (
                              <p className="text-sm text-muted-foreground mb-4">
                                {item.description}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                            <span className="text-2xl font-semibold text-primary">
                              ${item.price.toFixed(2)}
                            </span>
                            <Button 
                              size="sm" 
                              onClick={() => handleAddToCart(item.name)}
                              className="gap-2"
                            >
                              <Plus className="h-4 w-4" />
                              {t("menu.add")}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          {/* Notes */}
          <div className="mt-16 p-8 bg-card rounded-xl border border-border">
            <h3 className="font-serif text-2xl font-semibold mb-4">{t("menu.notes.title")}</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>• {t("menu.notes.1")}</li>
              <li>• {t("menu.notes.2")}</li>
              <li>• {t("menu.notes.3")}</li>
              <li>• {t("menu.notes.4")}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Menu;
