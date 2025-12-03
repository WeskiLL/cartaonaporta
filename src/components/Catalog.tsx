import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

import produto1 from "@/assets/produto-1.png";
import produto2 from "@/assets/produto-2.png";
import produto3 from "@/assets/produto-3.png";
import produto4 from "@/assets/produto-4.png";
import produto5 from "@/assets/produto-5.png";
import produto6 from "@/assets/produto-6.png";

const Catalog = () => {
  const products = [
    {
      id: 1,
      name: "Tag para Bijuterias",
      description: "Tags elegantes e resistentes para destacar suas bijuterias.",
      image: produto1,
    },
    {
      id: 2,
      name: "Tag para Semijoias",
      description: "Material premium que valoriza cada peça da sua coleção.",
      image: produto2,
    },
    {
      id: 3,
      name: "Tag para Joias",
      description: "Acabamento sofisticado para joias de alto padrão.",
      image: produto3,
    },
    {
      id: 4,
      name: "Tag para Brincos",
      description: "Tags especiais para expor brincos com elegância.",
      image: produto4,
    },
    {
      id: 5,
      name: "Tag para Colares",
      description: "Resistente à água, não desbota nem mancha quando molha.",
      image: produto5,
    },
    {
      id: 6,
      name: "Certificado de Garantia",
      description: "Profissionalize sua marca com certificados personalizados.",
      image: produto6,
    },
  ];

  return (
    <section id="catalogo" className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-4">
            Nossos Produtos
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Catálogo de{" "}
            <span className="text-gradient">Tags Personalizadas</span>
          </h2>
          <p className="text-muted-foreground text-lg font-body">
            Comece hoje mesmo com a qualidade que sua empresa precisa para se destacar.
            Confira alguns dos nossos produtos mais procurados.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div
              key={product.id}
              className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-brand-lg transition-all duration-300 hover:-translate-y-1"
            >
              {/* Product Image */}
              <div className="aspect-[4/3] relative overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Button variant="secondary" size="sm" asChild>
                    <a
                      href={`https://wa.me/5574981138033?text=Olá! Gostaria de saber mais sobre o produto: ${product.name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Solicitar Orçamento
                    </a>
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  {product.name}
                </h3>
                <p className="text-muted-foreground text-sm font-body mb-4">
                  {product.description}
                </p>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" asChild>
                  <a
                    href={`https://wa.me/5574981138033?text=Olá! Gostaria de saber mais sobre: ${product.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Saiba mais
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4 font-body">
            Não encontrou o que procura? Entre em contato e criaremos algo único para você.
          </p>
          <Button variant="hero" size="lg" asChild>
            <a
              href="https://wa.me/5574981138033?text=Olá! Gostaria de um orçamento personalizado."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Orçamento Personalizado
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Catalog;
