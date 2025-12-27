import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import whatsappIcon from "@/assets/whatsapp-icon.png";
import { Plus, Search } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ProductCardProps {
  id: string;
  name: string;
  size: string;
  image: string;
  isKit?: boolean;
  kitDescription?: string;
  availableQuantities?: number[];
  customSpecs?: string[];
  prices: {
    qty100?: number;
    qty200?: number;
    qty250?: number;
    qty500?: number;
    qty1000?: number;
    qty2000?: number;
  };
}

const ALL_QUANTITIES = [
  { value: 100, label: "100 un" },
  { value: 200, label: "200 un" },
  { value: 250, label: "250 un" },
  { value: 500, label: "500 un" },
  { value: 1000, label: "1.000 un" },
  { value: 2000, label: "2.000 un" },
];

const DEFAULT_SPECS = ["Frente e Verso", "Couchê 250g", "Verniz Total na Frente"];

const ProductCard = ({
  name,
  size,
  image,
  isKit,
  kitDescription,
  availableQuantities,
  customSpecs,
  prices,
}: ProductCardProps) => {
  const [imageOpen, setImageOpen] = useState(false);
  
  // Determinar opções de quantidade disponíveis
  const quantityOptions = availableQuantities
    ? ALL_QUANTITIES.filter((opt) =>
        availableQuantities.includes(opt.value)
      )
    : ALL_QUANTITIES.filter((opt) => 
        // Mostrar apenas as quantidades que têm preço > 0 ou são padrão (100, 250, 500, 1000)
        [100, 250, 500, 1000].includes(opt.value)
      );

  // Pre-select 250 if available, otherwise first option
  const defaultQty = quantityOptions.find(q => q.value === 250)?.value || quantityOptions[0]?.value || 100;
  const [selectedQty, setSelectedQty] = useState(defaultQty);
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
      case 200:
        return prices.qty200 || 0;
      case 250:
        return prices.qty250 || 0;
      case 500:
        return prices.qty500 || 0;
      case 1000:
        return prices.qty1000 || 0;
      case 2000:
        return prices.qty2000 || 0;
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
    <>
    <div className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-brand-lg transition-all duration-300 hover:-translate-y-1 flex flex-col">
      {/* Product Image */}
      <div 
        className="aspect-square relative overflow-hidden bg-muted/30 cursor-pointer group"
        onClick={() => setImageOpen(true)}
      >
        <img
          src={image}
          alt={name}
          className="w-full h-full object-contain p-4 transition-transform group-hover:scale-105"
        />
        {/* Magnifying glass overlay - always visible */}
        <div className="absolute bottom-3 right-3 bg-white/90 rounded-full p-2 shadow-md hover:bg-white transition-colors">
          <Search className="w-5 h-5 text-primary" />
        </div>
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
            {(customSpecs || DEFAULT_SPECS).map((spec, index) => (
              <span
                key={index}
                className="text-xs bg-accent/50 text-accent-foreground px-2 py-1 rounded-full"
              >
                {spec}
              </span>
            ))}
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
            onClick={handleAddToKit}
            variant="hero"
            className="flex-1 gap-2"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            Adicionar ao Carrinho
          </Button>
          <Button
            onClick={handleBuy}
            variant="outline"
            size="sm"
            className="gap-1"
          >
            <img src={whatsappIcon} alt="WhatsApp" className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
    
    {/* Image Modal */}
    <Dialog open={imageOpen} onOpenChange={setImageOpen}>
      <DialogContent className="max-w-3xl p-2">
        <img
          src={image}
          alt={name}
          className="w-full h-auto object-contain max-h-[80vh]"
        />
      </DialogContent>
    </Dialog>
    </>
  );
};

export default ProductCard;
