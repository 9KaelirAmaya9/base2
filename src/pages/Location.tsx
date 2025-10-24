import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { MapPin, Clock, Phone, Mail } from "lucide-react";

const Location = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="font-serif text-5xl md:text-6xl font-bold mb-6">
              Visit <span className="text-primary">Us</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find us in the heart of Brooklyn. We're ready to serve you authentic Mexican cuisine.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Location Info */}
            <Card className="p-8">
              <h2 className="font-serif text-3xl font-semibold mb-6">Location</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <MapPin className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Address</h3>
                    <p className="text-muted-foreground">
                      505 51st Street<br />
                      (entre 5ta. y 6ta. Ave.)<br />
                      Brooklyn, NY 11220
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Clock className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Hours</h3>
                    <div className="text-muted-foreground space-y-1">
                      <p className="font-medium">Open 7 Days a Week</p>
                      <p>Monday - Sunday: 10:00 AM - 10:00 PM</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Phone className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Contact</h3>
                    <div className="text-muted-foreground space-y-1">
                      <p>
                        <span className="font-medium">Tel:</span>{" "}
                        <a href="tel:7186334816" className="hover:text-primary transition-colors">
                          (718) 633-4816
                        </a>
                      </p>
                      <p>
                        <span className="font-medium">Cell:</span>{" "}
                        <a href="tel:9173700430" className="hover:text-primary transition-colors">
                          (917) 370-0430
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Map */}
            <Card className="p-0 overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3027.3876959642627!2d-74.01029!3d40.64675!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25ac0a7c0b7c9%3A0x0!2s505%205th%20Ave%2C%20Brooklyn%2C%20NY%2011220!5e0!3m2!1sen!2sus!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: "450px" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ricos Tacos Location"
              />
            </Card>
          </div>

          {/* Services */}
          <div className="mt-16 max-w-6xl mx-auto">
            <h2 className="font-serif text-3xl font-semibold mb-8 text-center">
              Our Services
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🍽️</span>
                </div>
                <h3 className="font-serif text-xl font-semibold mb-2">Dine-In</h3>
                <p className="text-muted-foreground">
                  Enjoy our authentic dishes in our welcoming restaurant atmosphere
                </p>
              </Card>

              <Card className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🥡</span>
                </div>
                <h3 className="font-serif text-xl font-semibold mb-2">Takeout</h3>
                <p className="text-muted-foreground">
                  Quick pickup orders ready in 20-30 minutes
                </p>
              </Card>

              <Card className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🚗</span>
                </div>
                <h3 className="font-serif text-xl font-semibold mb-2">Free Delivery</h3>
                <p className="text-muted-foreground">
                  Free delivery available in the local Brooklyn area
                </p>
              </Card>
            </div>
          </div>

          {/* Catering Info */}
          <Card className="mt-12 p-8 bg-primary text-primary-foreground max-w-4xl mx-auto">
            <div className="text-center">
              <h2 className="font-serif text-3xl font-semibold mb-4">
                Catering Services
              </h2>
              <p className="text-lg mb-6 opacity-90">
                Planning a special event? We prepare banquets for any occasion.
              </p>
              <div className="space-y-2 mb-6 text-sm opacity-90">
                <p>Available dishes: Rica Birria, Chiles Rellenos, Flautas (Fried Tacos),</p>
                <p>Mole, Carnitas, Barbacoa, Mixiotes, Pollo Enchilado, Pico de Gallo,</p>
                <p>Guacamole c/Chips, Salsa, Ensalada Arroz y Mucho Mas</p>
              </div>
              <div className="pt-4 border-t border-primary-foreground/20">
                <p className="font-semibold text-lg mb-2">Contact for Catering (Banquetes)</p>
                <a 
                  href="tel:9173700430" 
                  className="text-2xl font-serif font-bold hover:opacity-80 transition-opacity"
                >
                  (917) 370-0430
                </a>
                <p className="mt-2 text-sm opacity-90">Ask for Josefina</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Location;
