import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Instagram, Tag, CreditCard, Sticker, MoreHorizontal, Package, Moon, Sun, ShoppingCart, X } from "lucide-react";
import { useProducts, Product } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import CartPanel from "@/components/catalog/CartPanel";
import logoPrimePrintWhite from "@/assets/logo-prime-print-white.png";
import logoCartaoNaPortaWhite from "@/assets/logo-cartao-na-porta-white.png";
import logoPrimePrint from "@/assets/logo-prime-print.png";
import logoCartaoNaPorta from "@/assets/logo-cartao-na-porta.png";
import whatsappIcon from "@/assets/whatsapp-icon.png";
import stationeryPattern from "@/assets/stationery-pattern.png";
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";

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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
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

      {/* Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl p-0 bg-transparent border-none">
          <DialogClose className="absolute right-2 top-2 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors">
            <X className="h-5 w-5" />
          </DialogClose>
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Imagem ampliada do produto"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Floating Cart Button */}
      <button
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg transition-all hover:scale-105"
        aria-label="Abrir carrinho"
      >
        <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
        {totalCartItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-secondary text-white text-xs w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-bold">
            {totalCartItems}
          </span>
        )}
      </button>

      <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        {/* Hero Header with Pattern */}
        <div className="relative py-8 sm:py-12 px-4 overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80">
          {/* Pattern Overlay */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url(${stationeryPattern})`,
              backgroundSize: '80px 80px',
              backgroundRepeat: 'repeat',
            }}
          />

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
          </button>

          <div className="relative max-w-4xl mx-auto text-center">
            {/* Dual Logos - White versions */}
            <div className="flex items-center justify-center gap-3 sm:gap-6 mb-3 sm:mb-4">
              <img
                src={logoPrimePrintWhite}
                alt="Prime Print"
                className="h-12 sm:h-16 md:h-24 drop-shadow-lg"
              />
              <img
                src={logoCartaoNaPortaWhite}
                alt="Cartão na Porta"
                className="h-12 sm:h-16 md:h-24 drop-shadow-lg"
              />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">
              Prime Print
            </h1>
            <p className="text-white/90 text-sm sm:text-lg px-2">
              Transformando ideias em apresentações que vendem. ✨
            </p>
          </div>
        </div>

        {/* Company Info Bar */}
        <div className={`border-b shadow-sm transition-colors duration-300 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white"}`}>
          <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex flex-col items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 w-full justify-center sm:justify-start">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <img
                  src={logoPrimePrint}
                  alt="Prime Print"
                  className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-contain bg-white shadow"
                />
                <img
                  src={logoCartaoNaPorta}
                  alt="Cartão na Porta"
                  className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-contain bg-white shadow"
                />
              </div>
              <div className="text-center sm:text-left">
                <h2 className={`font-bold text-sm sm:text-base ${isDarkMode ? "text-white" : "text-gray-800"}`}>Prime Print</h2>
                <p className={`text-xs sm:text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"} hidden sm:block`}>
                  Sua marca merece brilhar — e nós cuidamos disso!
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={handleWhatsAppContact}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap w-full sm:w-auto justify-center"
              >
                <img src={whatsappIcon} alt="WhatsApp" className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span>Chame no WhatsApp</span>
              </button>
              <a
                href="https://www.instagram.com/cartaonaporta/"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-1 transition-colors ${isDarkMode ? "text-gray-400 hover:text-pink-400" : "text-gray-600 hover:text-pink-500"}`}
              >
                <Instagram className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-xs sm:text-sm">@cartaonaporta</span>
              </a>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className={`border-b transition-colors duration-300 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white"}`}>
          <div className="max-w-4xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
            <div className="flex overflow-x-auto gap-1.5 sm:gap-2 pb-1 sm:pb-0 sm:flex-wrap sm:justify-center scrollbar-hide">
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
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
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
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {category.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
          <h2 className={`text-lg sm:text-2xl font-bold mb-4 sm:mb-6 ${isDarkMode ? "text-white" : "text-gray-800"}`}>
            {categoryTitles[activeCategory]}
          </h2>

          {isLoading ? (
            <div className="text-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary mx-auto"></div>
              <p className={`mt-3 sm:mt-4 text-sm sm:text-base ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Carregando produtos...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className={`text-center py-8 sm:py-12 rounded-xl shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
              <p className={`text-sm sm:text-base ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Nenhum produto disponível nesta categoria no momento.
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredProducts.map((product) => {
                const availableQtys = getAvailableQuantities(product);
                const selectedQty = getSelectedQty(product);
                const selectedPrice = getPriceForQty(product, selectedQty);
                const formattedSelectedPrice = formatPrice(selectedPrice);

                return (
                  <div
                    key={product.id}
                    className={`rounded-xl shadow-sm border p-3 sm:p-4 hover:shadow-md transition-all ${
                      isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white"
                    }`}
                  >
                    <div className="flex gap-3 sm:gap-4">
                      {/* Product Image - Clickable */}
                      <div className="flex-shrink-0">
                        <img
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg bg-gray-100 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setSelectedImage(product.image || "/placeholder.svg")}
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-2">
                          <div className="flex-1">
                            <h3 className={`text-sm sm:text-base font-bold mb-1 ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                              {product.name}
                            </h3>

                            {/* Specs */}
                            <div className={`flex flex-wrap gap-1 sm:gap-1.5 text-[10px] sm:text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                              {product.size && (
                                <span className="flex items-center gap-0.5 sm:gap-1">
                                  <Tag className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                  {product.size}
                                </span>
                              )}
                              {getProductSpecs(product).map((spec: string, index: number) => (
                                <span key={index} className="flex items-center gap-0.5 sm:gap-1">
                                  •
                                  <span>{spec}</span>
                                </span>
                              ))}
                              <span className="flex items-center gap-0.5 sm:gap-1">
                                •
                                <span>5 a 7 dias úteis</span>
                              </span>
                            </div>

                            {/* Kit Description */}
                            {product.isKit && product.kitDescription && (
                              <p className={`text-[10px] sm:text-xs mt-1.5 sm:mt-2 p-1 sm:p-1.5 rounded ${isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-50 text-gray-600"}`}>
                                📦 {product.kitDescription}
                              </p>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <button
                              onClick={() => handleAddToCart(product)}
                              className="flex items-center gap-1 sm:gap-1.5 bg-primary hover:bg-primary/90 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-colors"
                            >
                              <ShoppingCart className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              Adicionar
                            </button>
                            <button
                              onClick={() => handleWhatsAppBuy(product)}
                              className="flex items-center gap-1 sm:gap-1.5 bg-green-500 hover:bg-green-600 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-colors whitespace-nowrap"
                            >
                              <img src={whatsappIcon} alt="WhatsApp" className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              Comprar {selectedQty}
                            </button>
                          </div>
                        </div>

                        {/* Quantity Selection */}
                        {!product.isKit && (
                          <div className="mt-2 sm:mt-3">
                            <div className="flex flex-wrap gap-1 sm:gap-1.5">
                              {availableQtys.map((qty: number) => {
                                const price = getPriceForQty(product, qty);
                                const formattedPrice = formatPrice(price);
                                if (!formattedPrice) return null;
                                return (
                                  <button
                                    key={qty}
                                    onClick={() => handleQuantityChange(product.id, qty)}
                                    className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-all border ${
                                      selectedQty === qty
                                        ? "bg-primary text-white border-primary shadow-md"
                                        : isDarkMode
                                        ? "bg-gray-700 text-gray-200 border-gray-600 hover:border-primary"
                                        : "bg-gray-50 text-gray-700 border-gray-200 hover:border-primary"
                                    }`}
                                  >
                                    {qty} - {formattedPrice}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`py-4 sm:py-6 text-center text-xs sm:text-sm transition-colors duration-300 ${isDarkMode ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"}`}>
          <p>© {new Date().getFullYear()} Prime Print. Todos os direitos reservados.</p>
        </div>
      </div>
    </>
  );
};

export default Catalogo;
