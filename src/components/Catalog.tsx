import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Package, Loader2 } from "lucide-react";
import ProductCard from "./catalog/ProductCard";
import CartPanel from "./catalog/CartPanel";
import { categories } from "./catalog/catalogData";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import whatsappIcon from "@/assets/whatsapp-icon.png";

const Catalog = () => {
  const [activeCategory, setActiveCategory] = useState("tags");
  const { setIsCartOpen, items } = useCart();
  const { data: products = [], isLoading } = useProducts();

  const filteredProducts = products.filter(
    (product) => product.category === activeCategory
  );

  return (
    <section id="catalogo" className="py-20 lg:py-32 bg-background relative">
      <CartPanel />

      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-block px-4 py-1 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-4">
            Nossos Produtos
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Catálogo de{" "}
            <span className="text-gradient">Tags Personalizadas</span>
          </h2>
          <p className="text-muted-foreground text-lg font-body">
            Escolha seus produtos e monte seu kit personalizado. Todos os
            produtos incluem impressão frente e verso, papel couchê 250g e
            verniz total na frente.
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            {/* Category Tabs */}
            <div className="flex flex-wrap justify-center gap-2 bg-muted/50 p-2 rounded-2xl">
              {categories.map((category) => {
                const count = products.filter(
                  (p) => p.category === category.id
                ).length;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
                      activeCategory === category.id
                        ? "bg-primary text-primary-foreground shadow-brand-sm"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    {category.label}
                    {count > 0 && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          activeCategory === category.id
                            ? "bg-primary-foreground/20"
                            : "bg-muted-foreground/20"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Monte seu Kit Button */}
            <Button
              onClick={() => setIsCartOpen(true)}
              variant="hero"
              size="lg"
              className="gap-2 shadow-brand-lg"
            >
              <ShoppingBag className="w-5 h-5" />
              Monte o seu Kit
              {items.length > 0 && (
                <span className="bg-primary-foreground/20 px-2 py-0.5 rounded-full text-sm">
                  {items.length}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                size={product.size}
                image={product.image}
                prices={product.prices}
                isKit={product.isKit}
                kitDescription={product.kitDescription}
                availableQuantities={product.availableQuantities}
                customSpecs={product.customSpecs}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Package className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">
              Em breve
            </h3>
            <p className="text-muted-foreground">
              Novos produtos serão adicionados a esta categoria em breve.
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-4 font-body">
            Não encontrou o que procura? Entre em contato e criaremos algo único
            para você.
          </p>
          <Button variant="outline" size="lg" asChild>
            <a
              href={`https://wa.me/5574981138033?text=${encodeURIComponent("Não encontrei o que quero no catálogo, desejo fazer um orçamento personalizado")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <img src={whatsappIcon} alt="WhatsApp" className="w-5 h-5" />
              Fazer Orçamento Personalizado
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Catalog;
