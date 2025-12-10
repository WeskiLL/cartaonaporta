import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Instagram, Tag, CreditCard, Sticker, MoreHorizontal, Package, Moon, Sun, ShoppingCart } from "lucide-react";
import { useProducts, Product } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import CartPanel from "@/components/catalog/CartPanel";
import logoPrimePrint from "@/assets/logo-prime-print.png";
import logoCartaoNaPorta from "@/assets/logo-cartao-na-porta.png";
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
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { data: products = [], isLoading } = useProducts();
  const { addItem, setIsCartOpen, items } = useCart();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

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

  const getSelectedQty = (product: Product) => {
    const availableQtys = getAvailableQuantities(product);
    return selectedQuantities[product.id] || availableQtys[0];
  };

  const handleQuantityChange = (productId: string, qty: number) => {
    setSelectedQuantities((prev) => ({ ...prev, [productId]: qty }));
  };

  const handleWhatsAppBuy = (product: Product) => {
    const qty = getSelectedQty(product);
    const price = getPriceForQty(product, qty);
    const formattedPrice = formatPrice(price);
    const message = encodeURIComponent(
      `Olá! Quero comprar ${qty} unidades do produto ${product.name}${formattedPrice ? ` por ${formattedPrice}` : ""}.`
    );
    window.open(`https://wa.me/5574981138033?text=${message}`, "_blank");
  };

  const handleAddToCart = (product: Product) => {
    const qty = getSelectedQty(product);
    const price = getPriceForQty(product, qty) || 0;
    addItem({
      name: product.name,
      size: product.size,
      quantity: qty,
      selectedQty: qty,
      price: price,
      image: product.image || "/placeholder.svg",
    });
  };

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      "Olá! Vim pelo catálogo e gostaria de saber mais sobre as tags para joias personalizadas."
    );
    window.open(`https://wa.me/5574981138033?text=${message}`, "_blank");
  };

  const totalCartItems = items.reduce((sum, item) => sum + item.quantity, 0);

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

      <CartPanel />

      <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        {/* Hero Header with Pattern */}
        <div className="relative py-12 px-4 overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80">
          {/* Stationery Pattern Background */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="stationeryPattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                  {/* Tag */}
                  <path d="M10 5 L20 5 L25 10 L25 25 L10 25 L10 5 M22 8 A1.5 1.5 0 1 1 22 8.01" fill="none" stroke="white" strokeWidth="1.5"/>
                  {/* Scissors */}
                  <path d="M40 10 C35 15 35 20 40 20 M40 10 C45 15 45 20 40 20 M40 20 L40 30" fill="none" stroke="white" strokeWidth="1.5"/>
                  {/* Pencil */}
                  <path d="M60 5 L70 5 L70 25 L65 30 L60 25 L60 5" fill="none" stroke="white" strokeWidth="1.5"/>
                  {/* Card */}
                  <path d="M5 45 L25 45 L25 65 L5 65 L5 45 M8 50 L22 50 M8 55 L18 55" fill="none" stroke="white" strokeWidth="1.5"/>
                  {/* Sticker roll */}
                  <circle cx="50" cy="55" r="10" fill="none" stroke="white" strokeWidth="1.5"/>
                  <circle cx="50" cy="55" r="4" fill="none" stroke="white" strokeWidth="1"/>
                  {/* Price tag */}
                  <path d="M70 45 L75 50 L75 70 L65 70 L65 50 L70 45 M70 52 A2 2 0 1 1 70 52.01" fill="none" stroke="white" strokeWidth="1.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#stationeryPattern)"/>
            </svg>
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <div className="relative max-w-4xl mx-auto text-center">
            {/* Dual Logos */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <img
                src={logoPrimePrint}
                alt="Prime Print"
                className="h-16 md:h-20 drop-shadow-lg"
              />
              <img
                src={logoCartaoNaPorta}
                alt="Cartão na Porta"
                className="h-16 md:h-20 drop-shadow-lg"
              />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Prime Print
            </h1>
            <p className="text-white/90 text-lg">
              Transformando ideias em apresentações que vendem. ✨
            </p>
          </div>
        </div>

        {/* Company Info Bar */}
        <div className={`border-b shadow-sm transition-colors duration-300 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white"}`}>
          <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <img
                  src={logoPrimePrint}
                  alt="Prime Print"
                  className="h-10 w-10 rounded-full object-contain bg-white shadow"
                />
                <img
                  src={logoCartaoNaPorta}
                  alt="Cartão na Porta"
                  className="h-10 w-10 rounded-full object-contain bg-white shadow"
                />
              </div>
              <div>
                <h2 className={`font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>Prime Print</h2>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Sua marca merece brilhar — e nós cuidamos disso!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleWhatsAppContact}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap"
              >
                <img src={whatsappIcon} alt="WhatsApp" className="h-5 w-5" />
                Chame no WhatsApp
              </button>
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
              >
                <ShoppingCart className="h-5 w-5" />
                Carrinho
                {totalCartItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-secondary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {totalCartItems}
                  </span>
                )}
              </button>
              <a
                href="https://www.instagram.com/cartaonaporta/"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-1 transition-colors ${isDarkMode ? "text-gray-400 hover:text-pink-400" : "text-gray-600 hover:text-pink-500"}`}
              >
                <Instagram className="h-5 w-5" />
                <span className="text-sm">@cartaonaporta</span>
              </a>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className={`border-b transition-colors duration-300 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white"}`}>
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
                        ? isDarkMode
                          ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : isDarkMode
                        ? "bg-gray-800 text-gray-600 cursor-not-allowed"
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
          <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? "text-white" : "text-gray-800"}`}>
            {categoryTitles[activeCategory]}
          </h2>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className={`mt-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Carregando produtos...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className={`text-center py-12 rounded-xl shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
              <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                Nenhum produto disponível nesta categoria no momento.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((product) => {
                const availableQtys = getAvailableQuantities(product);
                const selectedQty = getSelectedQty(product);
                const selectedPrice = getPriceForQty(product, selectedQty);
                const formattedSelectedPrice = formatPrice(selectedPrice);

                return (
                  <div
                    key={product.id}
                    className={`rounded-xl shadow-sm border p-4 md:p-6 hover:shadow-md transition-all ${
                      isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white"
                    }`}
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
                        <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                          {product.name}
                        </h3>

                        {/* Specs */}
                        <div className={`flex flex-wrap gap-2 mb-3 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
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
                          <p className={`text-sm mb-3 p-2 rounded ${isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-50 text-gray-600"}`}>
                            📦 {product.kitDescription}
                          </p>
                        )}

                        {/* Quantity Selection */}
                        {!product.isKit && (
                          <div className="mb-4">
                            <label className={`text-sm font-medium mb-2 block ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                              Selecione a quantidade:
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {availableQtys.map((qty: number) => {
                                const price = getPriceForQty(product, qty);
                                const formattedPrice = formatPrice(price);
                                if (!formattedPrice) return null;
                                return (
                                  <button
                                    key={qty}
                                    onClick={() => handleQuantityChange(product.id, qty)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                                      selectedQty === qty
                                        ? "bg-primary text-white border-primary shadow-md"
                                        : isDarkMode
                                        ? "bg-gray-700 text-gray-200 border-gray-600 hover:border-primary"
                                        : "bg-gray-50 text-gray-700 border-gray-200 hover:border-primary"
                                    }`}
                                  >
                                    {qty} unid. - {formattedPrice}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleAddToCart(product)}
                            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
                          >
                            <ShoppingCart className="h-4 w-4" />
                            Adicionar ao Carrinho
                          </button>
                          <button
                            onClick={() => handleWhatsAppBuy(product)}
                            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap"
                          >
                            <img src={whatsappIcon} alt="WhatsApp" className="h-4 w-4" />
                            Comprar {selectedQty} unid.
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`py-6 text-center text-sm transition-colors duration-300 ${isDarkMode ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"}`}>
          <p>© {new Date().getFullYear()} Prime Print. Todos os direitos reservados.</p>
        </div>
      </div>
    </>
  );
};

export default Catalogo;
