import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X, ShoppingCart } from "lucide-react";
import { Button } from "./ui/button";
import { LanguageSwitch } from "./LanguageSwitch";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import logo from "@/assets/logo-illustration.png";
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
  const { t } = useLanguage();
  const { cartCount } = useCart();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src={logo} 
              alt="Ricos Tacos" 
              className="h-14 w-14 lg:h-20 lg:w-20 transition-transform group-hover:scale-105 rounded-lg"
            />
            <div className="hidden lg:flex flex-col items-start">
              <span className="font-serif text-sm font-semibold tracking-wider text-foreground/80 uppercase">
                Piaxtla es México Deli
              </span>
              <span className="font-playfair text-3xl font-black tracking-tight bg-gradient-to-r from-serape-red via-serape-pink to-serape-orange bg-clip-text text-transparent group-hover:from-serape-orange group-hover:via-serape-yellow group-hover:to-serape-red transition-all duration-500">
                Ricos Tacos
              </span>
              <div className="mt-1 w-full">
                <div className="h-2 w-full flex">
                  <div className="flex-1" style={{ backgroundColor: '#00BCD4' }}></div>
                  <div className="flex-1" style={{ backgroundColor: '#E31E24' }}></div>
                  <div className="flex-1" style={{ backgroundColor: '#FF1493' }}></div>
                  <div className="flex-1" style={{ backgroundColor: '#92278F' }}></div>
                  <div className="w-1 bg-black"></div>
                  <div className="flex-1" style={{ backgroundColor: '#0071BC' }}></div>
                  <div className="flex-1" style={{ backgroundColor: '#57B947' }}></div>
                  <div className="flex-1" style={{ backgroundColor: '#FDB913' }}></div>
                  <div className="flex-1" style={{ backgroundColor: '#F68D2E' }}></div>
                  <div className="w-1 bg-black"></div>
                  <div className="flex-1" style={{ backgroundColor: '#E31E24' }}></div>
                  <div className="flex-1" style={{ backgroundColor: '#00BCD4' }}></div>
                  <div className="flex-1" style={{ backgroundColor: '#FF1493' }}></div>
                  <div className="flex-1" style={{ backgroundColor: '#92278F' }}></div>
                  <div className="w-1 bg-black"></div>
                  <div className="flex-1" style={{ backgroundColor: '#0071BC' }}></div>
                  <div className="flex-1" style={{ backgroundColor: '#57B947' }}></div>
                  <div className="flex-1" style={{ backgroundColor: '#FDB913' }}></div>
                  <div className="flex-1" style={{ backgroundColor: '#F68D2E' }}></div>
                  <div className="w-1 bg-black"></div>
                  <div className="flex-1" style={{ backgroundColor: '#E31E24' }}></div>
                  <div className="flex-1" style={{ backgroundColor: '#FF1493' }}></div>
                  <div className="flex-1" style={{ backgroundColor: '#92278F' }}></div>
                  <div className="flex-1" style={{ backgroundColor: '#00BCD4' }}></div>
                </div>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link to="/" className="relative group">
                    <NavigationMenuLink className={`px-4 py-2 text-sm font-medium transition-all duration-300 ${isActive("/") ? "text-primary" : "text-foreground"}`}>
                      {t("nav.home")}
                    </NavigationMenuLink>
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-serape-cyan via-serape-pink to-serape-yellow scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link to="/menu" className="relative group">
                    <NavigationMenuLink className={`px-4 py-2 text-sm font-medium transition-all duration-300 ${isActive("/menu") ? "text-primary" : "text-foreground"}`}>
                      {t("nav.fullMenu")}
                    </NavigationMenuLink>
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-serape-red via-serape-orange to-serape-yellow scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link to="/order" className="relative group">
                    <NavigationMenuLink className={`px-4 py-2 text-sm font-medium transition-all duration-300 ${isActive("/order") ? "text-primary" : "text-foreground"}`}>
                      {t("nav.orderOnline")}
                    </NavigationMenuLink>
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-serape-pink via-serape-purple to-serape-blue scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link to="/location" className="relative group">
                    <NavigationMenuLink className={`px-4 py-2 text-sm font-medium transition-all duration-300 ${isActive("/location") ? "text-primary" : "text-foreground"}`}>
                      {t("nav.location")}
                    </NavigationMenuLink>
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-serape-green via-serape-yellow to-serape-orange scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <LanguageSwitch />

            <Link to="/cart">
              <Button variant="outline" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold">
                    {cartCount}
                  </span>
                )}
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
                {t("nav.home")}
              </Link>
              <Link
                to="/menu"
                className={`text-sm font-medium ${isActive("/menu") ? "text-primary" : "text-foreground"}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("nav.fullMenu")}
              </Link>
              <Link
                to="/order"
                className={`text-sm font-medium ${isActive("/order") ? "text-primary" : "text-foreground"}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("nav.orderOnline")}
              </Link>
              <Link
                to="/location"
                className={`text-sm font-medium ${isActive("/location") ? "text-primary" : "text-foreground"}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("nav.location")}
              </Link>
              <Link
                to="/cart"
                className="text-sm font-medium text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("nav.cart")}
              </Link>
              <div className="pt-2">
                <LanguageSwitch />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
