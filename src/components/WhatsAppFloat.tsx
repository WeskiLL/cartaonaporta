import whatsappIcon from "@/assets/whatsapp-icon.png";
import { useCart } from "@/contexts/CartContext";
import { ShoppingBag } from "lucide-react";

const WHATSAPP_MESSAGE = "Olá! Vim pelo site e gostaria de saber mais sobre as tags para joias personalizadas.";

const WhatsAppFloat = () => {
  const { isCartOpen, setIsCartOpen, items } = useCart();
  
  return (
    <div className={`fixed bottom-6 right-6 flex items-center gap-3 ${isCartOpen ? "z-30" : "z-50"}`}>
      {/* Cart Button */}
      <button
        onClick={() => setIsCartOpen(!isCartOpen)}
        className="relative flex items-center justify-center w-12 h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        aria-label="Abrir carrinho"
      >
        <ShoppingBag className="w-5 h-5" />
        {items.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-secondary text-secondary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {items.length}
          </span>
        )}
      </button>

      {/* WhatsApp Button */}
      <a
        href={`https://wa.me/5574981138033?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex items-center justify-center w-12 h-12 bg-[#25D366] hover:bg-[#20BD5A] rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        aria-label="Solicitar Orçamento pelo WhatsApp"
      >
        <span className="absolute inset-0 rounded-full bg-[#25D366]/50 animate-ping" />
        <span className="absolute inset-0 rounded-full bg-[#25D366]" />
        <img src={whatsappIcon} alt="WhatsApp" className="w-6 h-6 relative z-10" />
      </a>
    </div>
  );
};

export default WhatsAppFloat;
