import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Instagram } from "lucide-react";
import logoPrimePrint from "@/assets/logo-prime-print.png";
import logoCartaoNaPorta from "@/assets/logo-cartao-na-porta.png";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: "Início", href: "#hero" },
    { name: "Sobre", href: "#sobre" },
    { name: "Produtos", href: "#catalogo" },
    { name: "Vantagens", href: "#vantagens" },
    { name: "FAQ", href: "#faq" },
    { name: "Contato", href: "#contato" },
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logos */}
          <div className="flex items-center gap-3">
            <img 
              src={logoPrimePrint} 
              alt="Prime Print - Tags Personalizadas" 
              className="h-12 w-auto object-contain"
            />
            <div className="hidden sm:block w-px h-8 bg-border" />
            <img 
              src={logoCartaoNaPorta} 
              alt="Cartão na Porta" 
              className="hidden sm:block h-10 w-auto object-contain"
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => scrollToSection(link.href)}
                className="text-foreground/80 hover:text-primary transition-colors font-medium font-body text-sm"
              >
                {link.name}
              </button>
            ))}
          </nav>

          {/* Instagram Button */}
          <div className="hidden md:block">
            <Button 
              size="default" 
              asChild
              className="bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] hover:opacity-90 text-white border-0"
            >
              <a
                href="https://www.instagram.com/cartaonaporta/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Instagram className="w-5 h-5" />
                Siga-nos
              </a>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden absolute top-20 left-0 right-0 bg-card border-b border-border animate-fade-in">
            <nav className="flex flex-col py-4">
              {/* Mobile Logo Cartão na Porta */}
              <div className="px-4 pb-4 border-b border-border mb-2">
                <img 
                  src={logoCartaoNaPorta} 
                  alt="Cartão na Porta" 
                  className="h-8 w-auto object-contain sm:hidden"
                />
              </div>
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => scrollToSection(link.href)}
                  className="px-4 py-3 text-foreground/80 hover:text-primary hover:bg-accent transition-colors text-left font-body"
                >
                  {link.name}
                </button>
              ))}
              <div className="px-4 pt-4">
                <Button 
                  size="default" 
                  className="w-full bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] hover:opacity-90 text-white border-0" 
                  asChild
                >
                  <a
                    href="https://www.instagram.com/cartaonaporta/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2"
                  >
                    <Instagram className="w-5 h-5" />
                    Siga-nos
                  </a>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
