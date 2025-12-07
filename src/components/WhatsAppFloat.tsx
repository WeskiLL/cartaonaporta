import whatsappIcon from "@/assets/whatsapp-icon.png";
import { useCart } from "@/contexts/CartContext";

const WHATSAPP_MESSAGE = "Olá! Vim pelo site e gostaria de saber mais sobre as tags para joias personalizadas.";

const WhatsAppFloat = () => {
  const { isCartOpen } = useCart();
  
  return (
    <a
      href={`https://wa.me/5574981138033?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed bottom-6 right-6 flex items-center gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white px-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-body font-medium group ${
        isCartOpen ? "z-30" : "z-50"
      }`}
      aria-label="Solicitar Orçamento pelo WhatsApp"
    >
      {/* Pulsing background */}
      <span className="absolute inset-0 rounded-full bg-[#25D366]/50 animate-ping" />
      <span className="absolute inset-0 rounded-full bg-[#25D366]" />
      
      <img src={whatsappIcon} alt="WhatsApp" className="w-5 h-5 relative z-10" />
      <span className="relative z-10">Orçamento Rápido</span>
    </a>
  );
};

export default WhatsAppFloat;
