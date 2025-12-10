import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { MessageCircle, Instagram, Tag, CreditCard, Sticker, MoreHorizontal, Package } from "lucide-react";
import { useProducts, Product } from "@/hooks/useProducts";
import logoPrimePrint from "@/assets/logo-prime-print.png";
import whatsappIcon from "@/assets/whatsapp-icon.png";

const categories = [
  { id: "tags", label: "Tags", icon: Tag },
  { id: "kits", label: "Kits", icon: Package },
  { id: "cartoes", label: "Cartões", icon: CreditCard },
  { id: "adesivos", label: "Adesivos", icon: Sticker },
  { id: "outros", label: "Outros", icon: MoreHorizontal },
] as const;

type CategoryId = typeof categories[number]["id"];

const categoryTitles: Record<CategoryId, string> = {
  tags: "🏷️ Tags Individuais",
  kits: "📦 Kits Especiais",
  cartoes: "💳 Cartões",
  adesivos: "🏷️ Adesivos",
  outros: "📋 Outros Produtos",
};

const Catalogo = () => {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("tags");
  const { data: products = [], isLoading } = useProducts();

  const filteredProducts = products.filter(
    (product) => product.category === activeCategory
  );

  const formatPrice = (price: number | undefined) => {
    if (!price || price === 0) return null;
    return `R$ ${price.toFixed(2).replace(".", ",")}`;
  };

  const getProductSpecs = (product: Product) => {
    if (product.customSpecs && product.customSpecs.length > 0) {
      return product.customSpecs;
    }
    return ["Frente e Verso", "Couchê 250g", "Verniz total frente"];
  };

  const getAvailableQuantities = (product: Product) => {
    if (product.availableQuantities && product.availableQuantities.length > 0) {
      return product.availableQuantities;
    }
    return [100, 250, 500, 1000];
  };

  const getPriceForQty = (product: Product, qty: number) => {
    const priceMap: Record<number, number | undefined> = {
      100: product.prices.qty100,
      200: product.prices.qty200,
      250: product.prices.qty250,
      500: product.prices.qty500,
      1000: product.prices.qty1000,
      2000: product.prices.qty2000,
    };
    return priceMap[qty];
  };

  const handleWhatsAppBuy = (product: Product) => {
    const message = encodeURIComponent(
      `Olá! Vim pelo catálogo e gostaria de saber mais sobre o produto: ${product.name}`
    );
    window.open(`https://wa.me/5574981138033?text=${message}`, "_blank");
  };

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      "Olá! Vim pelo catálogo e gostaria de saber mais sobre as tags para joias personalizadas."
    );
    window.open(`https://wa.me/5574981138033?text=${message}`, "_blank");
  };

  return (
    <>
      <Helmet>
        <title>Catálogo - Prime Print | Tags Personalizadas para Joias</title>
        <meta
          name="description"
          content="Catálogo completo de tags personalizadas para joias, semijoias e bijuterias. Tags, cartões, adesivos e muito mais."
        />
        <html lang="pt-BR" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Hero Header */}
        <div className="bg-gradient-to-br from-primary via-primary to-primary-foreground/90 py-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <img
              src={logoPrimePrint}
              alt="Prime Print"
              className="h-20 mx-auto mb-4 drop-shadow-lg"
            />
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Prime Print
            </h1>
            <p className="text-white/90 text-lg">
              O novo padrão de apresentação de luxo para joias e acessórios.
            </p>
          </div>
        </div>

        {/* Company Info Bar */}
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={logoPrimePrint}
                alt="Prime Print"
                className="h-12 w-12 rounded-full object-contain bg-white shadow"
              />
              <div>
                <h2 className="font-bold text-gray-800">Prime Print</h2>
                <p className="text-sm text-gray-600">
                  Identidade, qualidade e acessibilidade em papelaria para bijuterias, semijoias e acessórios.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleWhatsAppContact}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
              >
                <img src={whatsappIcon} alt="WhatsApp" className="h-5 w-5" />
                Chame no WhatsApp
              </button>
              <a
                href="https://www.instagram.com/cartaonaporta/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-gray-600 hover:text-pink-500 transition-colors"
              >
                <Instagram className="h-5 w-5" />
                <span className="text-sm">@cartaonaporta</span>
              </a>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((category) => {
                const Icon = category.icon;
                const hasProducts = products.some(
                  (p) => p.category === category.id
                );
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    disabled={!hasProducts}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      activeCategory === category.id
                        ? "bg-primary text-white shadow-md"
                        : hasProducts
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : "bg-gray-50 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {category.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {categoryTitles[activeCategory]}
          </h2>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando produtos...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
              <p className="text-gray-500">
                Nenhum produto disponível nesta categoria no momento.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-sm border p-4 md:p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        className="w-24 h-24 md:w-28 md:h-28 object-cover rounded-lg bg-gray-100"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-gray-800">
                          {product.name}
                        </h3>
                        <button
                          onClick={() => handleWhatsAppBuy(product)}
                          className="flex items-center gap-1 bg-pink-500 hover:bg-pink-600 text-white px-3 py-1 rounded-full text-sm font-medium transition-colors"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Comprar
                        </button>
                      </div>

                      {/* Specs */}
                      <div className="flex flex-wrap gap-2 mb-3 text-xs text-gray-600">
                        {product.size && (
                          <span className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {product.size}
                          </span>
                        )}
                        {getProductSpecs(product).map((spec: string, index: number) => (
                          <span key={index} className="flex items-center gap-1">
                            •
                            <span>{spec}</span>
                          </span>
                        ))}
                        <span className="flex items-center gap-1">
                          •
                          <span>5 a 7 dias úteis</span>
                        </span>
                      </div>

                      {/* Kit Description */}
                      {product.isKit && product.kitDescription && (
                        <p className="text-sm text-gray-600 mb-3 bg-gray-50 p-2 rounded">
                          📦 {product.kitDescription}
                        </p>
                      )}

                      {/* Prices */}
                      <div className="flex flex-wrap gap-2">
                        {getAvailableQuantities(product).map((qty: number) => {
                          const price = getPriceForQty(product, qty);
                          const formattedPrice = formatPrice(price);
                          if (!formattedPrice) return null;
                          return (
                            <span
                              key={qty}
                              className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-pink-50 text-pink-600 border border-pink-200"
                            >
                              {qty} unid. - {formattedPrice}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-100 py-6 text-center text-sm text-gray-600">
          <p>© {new Date().getFullYear()} Prime Print. Todos os direitos reservados.</p>
        </div>
      </div>
    </>
  );
};

export default Catalogo;
