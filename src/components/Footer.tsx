import { MessageCircle, Instagram, Mail, MapPin, Phone } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: "Início", href: "#hero" },
    { name: "Sobre Nós", href: "#sobre" },
    { name: "Catálogo", href: "#catalogo" },
    { name: "Vantagens", href: "#vantagens" },
    { name: "FAQ", href: "#faq" },
  ];

  const products = [
    "Tags para Bijuterias",
    "Tags para Semijoias",
    "Tags para Joias",
    "Cartões de Visita",
    "Tags Personalizadas",
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-foreground text-primary-foreground">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <h3 className="font-display text-2xl font-bold mb-1">Prime Print</h3>
              <p className="text-sm text-primary-foreground/70 font-body">by Cartão na Porta</p>
            </div>
            <p className="text-primary-foreground/80 font-body mb-6">
              Tags personalizadas de alta qualidade para lojas de bijuterias, semijoias e joias em todo o Brasil.
            </p>
            <div className="flex gap-4">
              <a
                href="https://wa.me/5574981138033"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com/cartaonaporta/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-6">Links Rápidos</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => scrollToSection(link.href)}
                    className="text-primary-foreground/70 hover:text-primary transition-colors font-body"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-6">Produtos</h4>
            <ul className="space-y-3">
              {products.map((product) => (
                <li key={product}>
                  <span className="text-primary-foreground/70 font-body">{product}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-6">Contato</h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="https://wa.me/5574981138033"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-primary-foreground/70 hover:text-primary transition-colors font-body"
                >
                  <Phone className="w-5 h-5 text-primary" />
                  (74) 98113-8033
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/cartaonaporta/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-primary-foreground/70 hover:text-primary transition-colors font-body"
                >
                  <Instagram className="w-5 h-5 text-primary" />
                  @cartaonaporta
                </a>
              </li>
              <li className="flex items-start gap-3 text-primary-foreground/70 font-body">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                Envio para todo o Brasil
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-foreground/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-primary-foreground/60 font-body">
              © {currentYear} Prime Print - Cartão na Porta. Todos os direitos reservados.
            </p>
            <p className="text-sm text-primary-foreground/60 font-body">
              Fundadores: Wesley Rocha & Jacqueline Rodrigues
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
