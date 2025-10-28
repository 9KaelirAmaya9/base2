import { Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import heroImage from "@/assets/hero-tacos.jpg";
import interiorImage from "@/assets/puebla-traditional.jpg";
import logo from "@/assets/ricos-tacos-logo.png";

const Index = () => {
  const { t } = useLanguage();

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
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/30" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold mb-6 text-white text-balance leading-tight drop-shadow-lg">
            {t("home.hero.title1")}
            <br />
            <span className="text-[hsl(var(--golden-yellow))]">{t("home.hero.title2")}</span>
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-12 font-light drop-shadow-md">
            {t("home.hero.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/order">
              <Button size="lg" className="text-base font-medium shadow-elegant">
                {t("home.hero.orderNow")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/menu">
              <Button variant="outline" size="lg" className="text-base font-medium">
                {t("home.hero.viewMenu")}
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
                {t("home.about.title1")}
                <br />
                <span className="text-primary">{t("home.about.title2")}</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                {t("home.about.p1")}
              </p>
              <p className="text-muted-foreground leading-relaxed text-lg">
                {t("home.about.p2")}
              </p>
              <Link to="/menu">
                <Button variant="outline" className="mt-4">
                  {t("home.about.exploreMenu")}
                </Button>
              </Link>
            </div>
            <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-elegant">
              <img 
                src={interiorImage} 
                alt="Traditional Puebla restaurant interior" 
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
              {t("home.why.title")} <span className="text-primary">{t("home.why.titleHighlight")}</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t("home.why.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-xl shadow-soft hover:shadow-elegant transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <span className="text-3xl">🌮</span>
              </div>
              <h3 className="font-serif text-2xl font-semibold mb-4">{t("home.feature1.title")}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {t("home.feature1.desc")}
              </p>
            </div>

            <div className="bg-card p-8 rounded-xl shadow-soft hover:shadow-elegant transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <span className="text-3xl">🚗</span>
              </div>
              <h3 className="font-serif text-2xl font-semibold mb-4">{t("home.feature2.title")}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {t("home.feature2.desc")}
              </p>
            </div>

            <div className="bg-card p-8 rounded-xl shadow-soft hover:shadow-elegant transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <span className="text-3xl">🎉</span>
              </div>
              <h3 className="font-serif text-2xl font-semibold mb-4">{t("home.feature3.title")}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {t("home.feature3.desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">
            {t("home.cta.title")}
          </h2>
          <p className="text-lg md:text-xl mb-12 opacity-90 max-w-2xl mx-auto">
            {t("home.cta.subtitle")}
          </p>
          <Link to="/order">
            <Button size="lg" variant="secondary" className="text-base font-medium">
              {t("home.cta.startOrder")}
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
              <div className="flex items-center gap-3 mb-4">
                <img src={logo} alt="Ricos Tacos" className="h-16 w-16" />
                <h3 className="font-serif text-2xl font-bold">Ricos Tacos</h3>
              </div>
              <p className="text-muted-foreground">
                {t("home.footer.tagline1")}
                <br />
                {t("home.footer.tagline2")}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t("home.footer.contact")}</h4>
              <p className="text-muted-foreground space-y-2">
                <span className="block">505 51st Street</span>
                <span className="block">Brooklyn, NY 11220</span>
                <span className="block">Tel: (718) 633-4816</span>
                <span className="block">Cell: (917) 370-0430</span>
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t("home.footer.hours")}</h4>
              <p className="text-muted-foreground space-y-2">
                <span className="block">{t("home.footer.openDays")}</span>
                <span className="block">{t("common.days")}</span>
                <span className="block">{t("common.hours")}</span>
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-muted-foreground text-sm">
            <p>&copy; {new Date().getFullYear()} Ricos Tacos. {t("home.footer.copyright")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
