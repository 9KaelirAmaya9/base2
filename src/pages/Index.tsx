import { Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-tacos.jpg";
import interiorImage from "@/assets/restaurant-interior.jpg";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Elegant tacos presentation" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background/80" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold mb-6 text-foreground text-balance leading-tight">
            Auténtica Cocina
            <br />
            <span className="text-primary">Mexicana</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 font-light">
            Experience the refined flavors of Mexico in the heart of Brooklyn. 
            Every dish crafted with passion and tradition.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/order">
              <Button size="lg" className="text-base font-medium shadow-elegant">
                Order Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/menu">
              <Button variant="outline" size="lg" className="text-base font-medium">
                View Menu
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 md:py-32 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground">
                A Taste of
                <br />
                <span className="text-primary">Tradition</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                At Ricos Tacos, we bring the authentic flavors of Mexico to Brooklyn. 
                Each dish is prepared with traditional recipes passed down through generations, 
                using only the finest ingredients.
              </p>
              <p className="text-muted-foreground leading-relaxed text-lg">
                From our signature tacos to our rich moles and fresh aguas frescas, 
                every bite tells a story of Mexican culinary heritage.
              </p>
              <Link to="/menu">
                <Button variant="outline" className="mt-4">
                  Explore Our Menu
                </Button>
              </Link>
            </div>
            <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-elegant">
              <img 
                src={interiorImage} 
                alt="Restaurant interior" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">
              Why Choose <span className="text-primary">Ricos Tacos</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Quality, authenticity, and convenience—all in one place
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-xl shadow-soft hover:shadow-elegant transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <span className="text-3xl">🌮</span>
              </div>
              <h3 className="font-serif text-2xl font-semibold mb-4">Authentic Recipes</h3>
              <p className="text-muted-foreground leading-relaxed">
                Traditional Mexican recipes made with love and the finest ingredients, 
                bringing you genuine flavors from our kitchen to your table.
              </p>
            </div>

            <div className="bg-card p-8 rounded-xl shadow-soft hover:shadow-elegant transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <span className="text-3xl">🚗</span>
              </div>
              <h3 className="font-serif text-2xl font-semibold mb-4">Fast Delivery</h3>
              <p className="text-muted-foreground leading-relaxed">
                Quick pickup and delivery options to enjoy our delicious food 
                wherever you are in Brooklyn. Order online for convenience.
              </p>
            </div>

            <div className="bg-card p-8 rounded-xl shadow-soft hover:shadow-elegant transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <span className="text-3xl">🎉</span>
              </div>
              <h3 className="font-serif text-2xl font-semibold mb-4">Catering Available</h3>
              <p className="text-muted-foreground leading-relaxed">
                Planning an event? We offer full catering services with authentic 
                Mexican dishes perfect for any celebration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">
            Ready to Experience Authentic Mexican Cuisine?
          </h2>
          <p className="text-lg md:text-xl mb-12 opacity-90 max-w-2xl mx-auto">
            Order now for pickup or delivery and taste the difference that tradition makes
          </p>
          <Link to="/order">
            <Button size="lg" variant="secondary" className="text-base font-medium">
              Start Your Order
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-serif text-2xl font-bold mb-4">Ricos Tacos</h3>
              <p className="text-muted-foreground">
                Auténtica Comida Mexicana
                <br />
                Authentic Mexican Food
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <p className="text-muted-foreground space-y-2">
                <span className="block">505 51st Street</span>
                <span className="block">Brooklyn, NY 11220</span>
                <span className="block">Tel: (718) 633-4816</span>
                <span className="block">Cell: (917) 370-0430</span>
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Hours</h4>
              <p className="text-muted-foreground space-y-2">
                <span className="block">Monday - Sunday</span>
                <span className="block">10:00 AM - 10:00 PM</span>
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-muted-foreground text-sm">
            <p>&copy; {new Date().getFullYear()} Ricos Tacos. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
