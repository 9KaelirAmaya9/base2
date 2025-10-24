import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X, ShoppingCart } from "lucide-react";
import { Button } from "./ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./ui/navigation-menu";

export const Navigation = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-primary hover:text-primary/80 transition-colors">
            Ricos Tacos
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link to="/">
                    <NavigationMenuLink className={`px-4 py-2 text-sm font-medium transition-colors ${isActive("/") ? "text-primary" : "text-foreground hover:text-primary"}`}>
                      Home
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm">Comida</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4">
                      <li>
                        <Link to="/menu">
                          <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                            <div className="text-sm font-medium leading-none">Full Menu</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Browse our complete selection of authentic dishes
                            </p>
                          </NavigationMenuLink>
                        </Link>
                      </li>
                      <li>
                        <Link to="/location">
                          <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                            <div className="text-sm font-medium leading-none">Hours & Location</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Visit us in Brooklyn
                            </p>
                          </NavigationMenuLink>
                        </Link>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link to="/order">
                    <NavigationMenuLink className={`px-4 py-2 text-sm font-medium transition-colors ${isActive("/order") ? "text-primary" : "text-foreground hover:text-primary"}`}>
                      Order Online
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link to="/location">
                    <NavigationMenuLink className={`px-4 py-2 text-sm font-medium transition-colors ${isActive("/location") ? "text-primary" : "text-foreground hover:text-primary"}`}>
                      Location
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <Link to="/cart">
              <Button variant="outline" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <Link
                to="/"
                className={`text-sm font-medium ${isActive("/") ? "text-primary" : "text-foreground"}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/menu"
                className={`text-sm font-medium ${isActive("/menu") ? "text-primary" : "text-foreground"}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Full Menu
              </Link>
              <Link
                to="/order"
                className={`text-sm font-medium ${isActive("/order") ? "text-primary" : "text-foreground"}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Order Online
              </Link>
              <Link
                to="/location"
                className={`text-sm font-medium ${isActive("/location") ? "text-primary" : "text-foreground"}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Hours & Location
              </Link>
              <Link
                to="/cart"
                className="text-sm font-medium text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Cart
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
