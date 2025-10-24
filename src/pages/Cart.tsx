import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Cart = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-serif text-5xl md:text-6xl font-bold mb-12 text-center">
              Your <span className="text-primary">Cart</span>
            </h1>

            <Card className="p-12 text-center">
              <ShoppingCart className="h-20 w-20 mx-auto mb-6 text-muted-foreground opacity-20" />
              <h2 className="font-serif text-3xl font-semibold mb-4">
                Your cart is empty
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Start adding delicious items from our menu to begin your order
              </p>
              <Link to="/order">
                <Button size="lg" className="gap-2">
                  Browse Menu
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
