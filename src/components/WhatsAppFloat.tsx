import { MessageCircle } from "lucide-react";

const WhatsAppFloat = () => {
  return (
    <a
      href="https://wa.me/5574981138033"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white px-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-body font-medium"
      aria-label="Solicitar Orçamento pelo WhatsApp"
    >
      <MessageCircle className="w-5 h-5" />
      <span>Orçamento Rápido</span>
    </a>
  );
};

export default WhatsAppFloat;
