import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import whatsappIcon from "@/assets/whatsapp-icon.png";
import { Plus } from "lucide-react";

interface ProductCardProps {
  id: string;
  name: string;
  size: string;
  image: string;
  isKit?: boolean;
  kitDescription?: string;
  availableQuantities?: number[];
  prices: {
    qty100?: number;
    qty250?: number;
    qty500?: number;
    qty1000?: number;
  };
}

const DEFAULT_QUANTITIES = [
  { value: 100, label: "100 un" },
  { value: 250, label: "250 un" },
  { value: 500, label: "500 un" },
  { value: 1000, label: "1.000 un" },
];

const ProductCard = ({
  id,
  name,
  size,
  image,
  isKit,
  kitDescription,
  availableQuantities,
  prices,
}: ProductCardProps) => {
  // Determinar opções de quantidade disponíveis
  const quantityOptions = availableQuantities
    ? DEFAULT_QUANTITIES.filter((opt) =>
        availableQuantities.includes(opt.value)
      )
    : DEFAULT_QUANTITIES;

  const [selectedQty, setSelectedQty] = useState(
    quantityOptions[0]?.value || 100
  );
  const { addItem } = useCart();

  // Atualizar selectedQty se as opções mudarem
  useEffect(() => {
    if (quantityOptions.length > 0 && !quantityOptions.find(q => q.value === selectedQty)) {
      setSelectedQty(quantityOptions[0].value);
    }
  }, [availableQuantities]);

  const getPrice = (qty: number) => {
    switch (qty) {
      case 100:
        return prices.qty100 || 0;
      case 250:
        return prices.qty250 || 0;
      case 500:
        return prices.qty500 || 0;
      case 1000:
        return prices.qty1000 || 0;
      default:
        return 0;
    }
  };

  const currentPrice = isKit ? (prices.qty100 || 0) : getPrice(selectedQty);

  const handleBuy = () => {
    const message = isKit
      ? `Olá! Quero comprar o ${name}.`
      : `Olá! Quero comprar ${selectedQty} unidades do produto ${name}.`;
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
      selectedQty: isKit ? 1 : selectedQty,
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

        {/* Kit Description */}
        {isKit && kitDescription && (
          <div className="mb-4 p-3 bg-accent/30 rounded-lg">
            <p className="text-xs text-muted-foreground font-medium">
              Conteúdo do kit:
            </p>
            <p className="text-sm text-foreground mt-1">{kitDescription}</p>
          </div>
        )}

        {/* Features - Não mostrar para kits */}
        {!isKit && (
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
        )}

        {/* Quantity Selection - Não mostrar para kits */}
        {!isKit && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">Quantidade:</p>
            <div className="grid grid-cols-2 gap-2">
              {quantityOptions.map((option) => (
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
        )}

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
