import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Instagram, Tag, CreditCard, Sticker, MoreHorizontal, Package, Moon, Sun, ShoppingCart, X, Search } from "lucide-react";
import { useProducts, Product } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { useCatalogSettings } from "@/hooks/useCatalogSettings";
import CartPanel from "@/components/catalog/CartPanel";
import logoPrimePrintWhite from "@/assets/logo-prime-print-white.png";
import logoCartaoNaPortaWhite from "@/assets/logo-cartao-na-porta-white.png";
import logoPrimePrint from "@/assets/logo-prime-print.png";
import logoCartaoNaPorta from "@/assets/logo-cartao-na-porta.png";
import whatsappIcon from "@/assets/whatsapp-icon.png";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
const categoryIcons = {
  tags: Tag,
  kits: Package,
  cartoes: CreditCard,
  adesivos: Sticker,
  outros: MoreHorizontal,
} as const;

const categoryIds = ["tags", "kits", "cartoes", "adesivos", "outros"] as const;
type CategoryId = typeof categoryIds[number];

const categoryTitles: Record<CategoryId, string> = {
  tags: "🏷️ Tags Individuais",
  kits: "📦 Kits Especiais",
  cartoes: "💳 Cartões",
  adesivos: "🏷️ Adesivos",
  outros: "📋 Outros Produtos"
};
const Catalogo = () => {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("tags");
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const hasTrackedVisit = useRef(false);
  const {
    data: products = [],
    isLoading
  } = useProducts();
  const {
    addItem,
    setIsCartOpen,
    items
  } = useCart();
  const { settings, getCategoryLabel, trackEvent } = useCatalogSettings();

  // Track page visit on mount
  useEffect(() => {
    if (!hasTrackedVisit.current) {
      trackEvent("visit");
      hasTrackedVisit.current = true;
    }
  }, [trackEvent]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);
  const filteredProducts = products.filter(product => product.category === activeCategory);
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
      2000: product.prices.qty2000
    };
    return priceMap[qty];
  };
  const getSelectedQty = (product: Product) => {
    const availableQtys = getAvailableQuantities(product);
    return selectedQuantities[product.id] || availableQtys[0];
  };
  const handleQuantityChange = (productId: string, qty: number) => {
    setSelectedQuantities(prev => ({
      ...prev,
      [productId]: qty
    }));
  };
  const handleWhatsAppBuy = (product: Product) => {
    const qty = getSelectedQty(product);
    const price = getPriceForQty(product, qty);
    const formattedPrice = formatPrice(price);
    trackEvent("whatsapp_click", product.id);
    const message = encodeURIComponent(`Olá! Quero comprar ${qty} unidades do produto ${product.name}${formattedPrice ? ` por ${formattedPrice}` : ""}.`);
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
      image: product.image || "/placeholder.svg"
    });
  };
  const handleWhatsAppContact = () => {
    trackEvent("whatsapp_click");
    const message = encodeURIComponent("Olá! Vim pelo catálogo e gostaria de saber mais sobre as tags para joias personalizadas.");
    window.open(`https://wa.me/5574981138033?text=${message}`, "_blank");
  };
  const totalCartItems = items.reduce((sum, item) => sum + item.quantity, 0);
  return <>
      <Helmet>
        <title>Catálogo - Prime Print | Tags Personalizadas para Joias</title>
        <meta name="description" content="Catálogo completo de tags personalizadas para joias, semijoias e bijuterias. Tags, cartões, adesivos e muito mais." />
        <html lang="pt-BR" />
      </Helmet>

      <CartPanel />

      {/* Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl p-0 bg-transparent border-none">
          <DialogClose className="absolute right-2 top-2 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors">
            <X className="h-5 w-5" />
          </DialogClose>
          {selectedImage && <img src={selectedImage} alt="Imagem ampliada do produto" className="w-full h-auto max-h-[80vh] object-contain rounded-lg" />}
        </DialogContent>
      </Dialog>

      {/* Floating Cart Button */}
      <button onClick={() => setIsCartOpen(true)} className="fixed bottom-4 right-4 z-40 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg transition-all hover:scale-105" aria-label="Abrir carrinho">
        <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
        {totalCartItems > 0 && <span className="absolute -top-1 -right-1 bg-secondary text-white text-xs w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-bold">
            {totalCartItems}
          </span>}
      </button>

      <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        {/* Hero Header - Simple Orange */}
        <div className="relative py-4 px-4 bg-primary">
          {/* Dark Mode Toggle */}
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white" aria-label="Toggle dark mode">
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div className="max-w-4xl mx-auto flex items-center justify-center gap-3 sm:gap-4">
            {/* Dual Logos - White versions */}
            <img src={logoPrimePrintWhite} alt="Prime Print" className="h-8 sm:h-10 md:h-12 drop-shadow-lg" />
            <img src={logoCartaoNaPortaWhite} alt="Cartão na Porta" className="h-8 sm:h-10 md:h-12 drop-shadow-lg" />
          </div>
        </div>

        {/* Company Info Bar */}
        <div className={`border-b shadow-sm transition-colors duration-300 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white"}`}>
          <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <img src={logoPrimePrint} alt="Prime Print" className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-contain bg-white shadow" />
                <img src={logoCartaoNaPorta} alt="Cartão na Porta" className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-contain bg-white shadow" />
              </div>
              <div className="text-center sm:text-left">
                <h2 className={`font-bold text-sm sm:text-base ${isDarkMode ? "text-white" : "text-gray-800"}`}>Prime Print</h2>
                <p className={`text-xs sm:text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"} hidden sm:block`}>
                  Sua marca merece brilhar — e nós cuidamos disso!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <button onClick={handleWhatsAppContact} className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap">
                <img src={whatsappIcon} alt="WhatsApp" className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span>Chame no WhatsApp</span>
              </button>
              <a href="https://www.instagram.com/cartaonaporta/" target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1 transition-colors ${isDarkMode ? "text-gray-400 hover:text-pink-400" : "text-gray-600 hover:text-pink-500"}`}>
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
              {categoryIds.map(catId => {
              const Icon = categoryIcons[catId];
              const hasProducts = products.some(p => p.category === catId);
              return <button key={catId} onClick={() => setActiveCategory(catId)} disabled={!hasProducts} className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${activeCategory === catId ? "bg-primary text-white shadow-md" : hasProducts ? isDarkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200" : isDarkMode ? "bg-gray-800 text-gray-600 cursor-not-allowed" : "bg-gray-50 text-gray-400 cursor-not-allowed"}`}>
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {getCategoryLabel(catId)}
                  </button>;
            })}
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
          <h2 className={`text-lg sm:text-2xl font-bold mb-4 sm:mb-6 ${isDarkMode ? "text-white" : "text-gray-800"}`}>
            {categoryTitles[activeCategory]}
          </h2>

          {isLoading ? <div className="text-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary mx-auto"></div>
              <p className={`mt-3 sm:mt-4 text-sm sm:text-base ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Carregando produtos...</p>
            </div> : filteredProducts.length === 0 ? <div className={`text-center py-8 sm:py-12 rounded-xl shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
              <p className={`text-sm sm:text-base ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Nenhum produto disponível nesta categoria no momento.
              </p>
            </div> : <div className="space-y-3 sm:space-y-4">
              {filteredProducts.map(product => {
            const availableQtys = getAvailableQuantities(product);
            const selectedQty = getSelectedQty(product);
            const selectedPrice = getPriceForQty(product, selectedQty);
            const formattedSelectedPrice = formatPrice(selectedPrice);
            const isInCart = items.some(item => item.name === product.name && item.selectedQty === selectedQty);
            return <div key={product.id} className={`rounded-2xl shadow-sm border p-4 sm:p-5 hover:shadow-md transition-all ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white"}`}>
                    {/* Header: Image + Name + Buttons */}
                    <div className="flex items-center gap-3 mb-3">
                      {/* Product Image - Small with magnifying glass - always visible */}
                      <div 
                        className="relative w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 cursor-pointer"
                        onClick={() => setSelectedImage(product.image || "/placeholder.svg")}
                      >
                        <img 
                          src={product.image || "/placeholder.svg"} 
                          alt={product.name} 
                          className="w-full h-full object-cover rounded-lg bg-gray-100" 
                        />
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md border border-border">
                          <Search className="w-3 h-3 text-primary" />
                        </div>
                      </div>
                      
                      {/* Name + Buttons */}
                      <div className="flex items-center flex-wrap gap-2">
                        <h3 className={`text-sm sm:text-base font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                          {product.name}
                        </h3>
                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => handleWhatsAppBuy(product)} 
                            className="flex items-center gap-1 bg-primary hover:bg-primary/90 text-white px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-medium transition-colors"
                          >
                            <ShoppingCart className="h-3 w-3" />
                            Comprar
                          </button>
                          <button 
                            onClick={() => handleAddToCart(product)} 
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-medium transition-all border ${
                              isInCart 
                                ? "bg-green-500 border-green-500 text-white" 
                                : isDarkMode 
                                  ? "border-primary/50 text-primary hover:bg-primary/10" 
                                  : "border-primary/40 text-primary hover:bg-primary/5"
                            }`}
                          >
                            <ShoppingCart className="h-3 w-3" />
                            {isInCart ? "Adicionado ✓" : "Adicionar ao carrinho"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Specs Line */}
                    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-xs mb-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {product.size && <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {product.size}
                        </span>}
                      {getProductSpecs(product).map((spec: string, index: number) => <span key={index} className="flex items-center gap-1">
                          ✦ {spec}
                        </span>)}
                      <span className="flex items-center gap-1">
                        ⏱ 5 a 7 dias úteis
                      </span>
                    </div>

                    {/* Kit Description */}
                    {product.isKit && product.kitDescription && <p className={`text-[10px] sm:text-xs mb-3 p-2 rounded-lg ${isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-50 text-gray-600"}`}>
                        📦 {product.kitDescription}
                      </p>}

                    {/* Quantity/Price Pills - Grid */}
                    {!product.isKit && <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {availableQtys.map((qty: number) => {
                          const price = getPriceForQty(product, qty);
                          const formattedPrice = formatPrice(price);
                          if (!formattedPrice) return null;
                          return <button 
                            key={qty} 
                            onClick={() => handleQuantityChange(product.id, qty)} 
                            className={`px-3 py-2 rounded-full text-[11px] sm:text-xs font-medium transition-all border-2 ${selectedQty === qty 
                              ? "bg-primary/10 text-primary border-primary" 
                              : isDarkMode 
                                ? "bg-transparent text-primary border-primary/30 hover:border-primary/60" 
                                : "bg-primary/5 text-primary border-primary/20 hover:border-primary/50"}`}
                          >
                            {qty} unid. - {formattedPrice}
                          </button>;
                        })}
                      </div>}
                  </div>;
          })}
            </div>}
        </div>

        {/* Info Notice Section */}
        <div className={`px-4 py-8 sm:py-12 transition-colors duration-300 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <div className="max-w-md mx-auto text-center space-y-6">
            {/* Customization Notice */}
            <div className={`p-4 rounded-2xl ${isDarkMode ? "bg-primary/20" : "bg-primary/10"}`}>
              <p className={`text-lg sm:text-xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                ✨ PERSONALIZAÇÃO TOTAL!
              </p>
              <p className={`text-sm sm:text-base ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                Você escolhe: cores, logo, estilo, informações e o que mais desejar!
              </p>
            </div>

            {/* Cut Warning */}
            <div className={`p-4 rounded-2xl border-2 border-dashed ${isDarkMode ? "border-yellow-500/50 bg-yellow-500/10" : "border-yellow-500/40 bg-yellow-50"}`}>
              <p className={`text-sm sm:text-base font-medium ${isDarkMode ? "text-yellow-300" : "text-yellow-700"}`}>
                ⚠️ Os cortes são exatamente como na imagem e <strong>NÃO PODEM SER ALTERADOS</strong>.
              </p>
            </div>

            {/* Custom Order Notice */}
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Caso deseje fazer um pedido de um material diferente do que está no catálogo, converse com a gente no WhatsApp
            </p>

            {/* Shipping Info */}
            <p className={`text-base sm:text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-700"}`}>
              🚚 Entregamos para todo o Brasil
            </p>

            {/* WhatsApp CTA */}
            <div className="pt-2">
              <button
                onClick={handleWhatsAppContact}
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full text-sm sm:text-base font-semibold transition-colors shadow-lg hover:shadow-xl"
              >
                <img src={whatsappIcon} alt="WhatsApp" className="h-5 w-5" />
                Faça seu pedido pelo WhatsApp
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`py-4 sm:py-6 text-center text-xs sm:text-sm transition-colors duration-300 ${isDarkMode ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"}`}>
          <p>© {new Date().getFullYear()} Prime Print. Todos os direitos reservados.</p>
        </div>
      </div>
    </>;
};
export default Catalogo;