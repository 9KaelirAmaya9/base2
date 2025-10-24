import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X, ShoppingCart } from "lucide-react";
import { Button } from "./ui/button";
import { LanguageSwitch } from "./LanguageSwitch";
import { useLanguage } from "@/contexts/LanguageContext";
import logo from "@/assets/logo.png";
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
              className="h-16 w-16 md:h-20 md:w-20 transition-transform group-hover:scale-105"
            />
            <span className="hidden sm:block font-serif text-2xl md:text-3xl font-bold tracking-tight text-primary group-hover:text-primary/80 transition-colors">
              Ricos Tacos
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link to="/">
                    <NavigationMenuLink className={`px-4 py-2 text-sm font-medium transition-colors ${isActive("/") ? "text-primary" : "text-foreground hover:text-primary"}`}>
                      {t("nav.home")}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm">{t("nav.comida")}</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4">
                      <li>
                        <Link to="/menu">
                          <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                            <div className="text-sm font-medium leading-none">{t("nav.fullMenu")}</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {t("nav.menuDesc")}
                            </p>
                          </NavigationMenuLink>
                        </Link>
                      </li>
                      <li>
                        <Link to="/location">
                          <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                            <div className="text-sm font-medium leading-none">{t("nav.hoursLocation")}</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {t("nav.hoursDesc")}
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
                      {t("nav.orderOnline")}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link to="/location">
                    <NavigationMenuLink className={`px-4 py-2 text-sm font-medium transition-colors ${isActive("/location") ? "text-primary" : "text-foreground hover:text-primary"}`}>
                      {t("nav.location")}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <LanguageSwitch />

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
