import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const Cart = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-serif text-5xl md:text-6xl font-bold mb-12 text-center">
              {t("cart.title")} <span className="text-primary">{t("cart.titleHighlight")}</span>
            </h1>

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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
