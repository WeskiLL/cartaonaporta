import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import whatsappIcon from "@/assets/whatsapp-icon.png";
import { Plus, ShoppingCart } from "lucide-react";

interface ProductCardProps {
  id: string;
  name: string;
  size: string;
  image: string;
  prices: {
    qty100: number;
    qty250: number;
    qty500: number;
    qty1000: number;
  };
}

const QUANTITY_OPTIONS = [
  { value: 100, label: "100 un" },
  { value: 250, label: "250 un" },
  { value: 500, label: "500 un" },
  { value: 1000, label: "1.000 un" },
];

const ProductCard = ({ id, name, size, image, prices }: ProductCardProps) => {
  const [selectedQty, setSelectedQty] = useState(100);
  const { addItem, setIsCartOpen } = useCart();

  const getPrice = (qty: number) => {
    switch (qty) {
      case 100:
        return prices.qty100;
      case 250:
        return prices.qty250;
      case 500:
        return prices.qty500;
      case 1000:
        return prices.qty1000;
      default:
        return prices.qty100;
    }
  };

  const currentPrice = getPrice(selectedQty);

  const handleBuy = () => {
    const message = `Olá! Quero comprar ${selectedQty} unidades do produto ${name}.`;
    window.open(
      `https://wa.me/5574981138033?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  const handleAddToKit = () => {
    addItem({
      name,
      size,
      quantity: 1,
      selectedQty,
      price: currentPrice,
      image,
    });
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-brand-lg transition-all duration-300 hover:-translate-y-1 flex flex-col">
      {/* Product Image */}
      <div className="aspect-square relative overflow-hidden bg-muted/30">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-contain p-4"
        />
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-display text-lg font-semibold text-foreground mb-1">
          {name}
        </h3>
        <p className="text-primary font-semibold text-sm mb-3">
          Tamanho: {size}
        </p>

        {/* Features */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs bg-accent/50 text-accent-foreground px-2 py-1 rounded-full">
            Frente e Verso
          </span>
          <span className="text-xs bg-accent/50 text-accent-foreground px-2 py-1 rounded-full">
            Couchê 250g
          </span>
          <span className="text-xs bg-accent/50 text-accent-foreground px-2 py-1 rounded-full">
            Verniz Total
          </span>
        </div>

        {/* Quantity Selection */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">Quantidade:</p>
          <div className="grid grid-cols-2 gap-2">
            {QUANTITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedQty(option.value)}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  selectedQty === option.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80 text-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Price */}
        <div className="mb-4">
          <p className="text-2xl font-bold text-primary">
            {currentPrice > 0
              ? `R$ ${currentPrice.toFixed(2).replace(".", ",")}`
              : "Consultar"}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <Button
            onClick={handleBuy}
            variant="hero"
            className="flex-1 gap-2"
            size="sm"
          >
            <img src={whatsappIcon} alt="WhatsApp" className="w-4 h-4" />
            Comprar
          </Button>
          <Button
            onClick={handleAddToKit}
            variant="outline"
            size="sm"
            className="gap-1"
          >
            <Plus className="w-4 h-4" />
            Kit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
