import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { X, ShoppingBag, Trash2 } from "lucide-react";
import whatsappIcon from "@/assets/whatsapp-icon.png";

const CartPanel = () => {
  const { items, removeItem, isCartOpen, setIsCartOpen, getTotal, clearCart } =
    useCart();

  const handleBuyKit = () => {
    if (items.length === 0) return;

    let message = "Olá! Quero comprar o seguinte kit:\n\n";
    items.forEach((item, index) => {
      message += `${index + 1}. ${item.name} (${item.size}) — ${item.selectedQty} unidades\n`;
    });

    window.open(
      `https://wa.me/5574981138033?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  return (
    <>
      {/* Cart Panel */}
      <div
        className={`fixed left-0 top-0 h-full w-80 bg-card border-r border-border shadow-2xl z-50 transition-transform duration-300 ${
          isCartOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-primary/5">
        <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <h3 className="font-display font-bold text-lg">Meu Carrinho</h3>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 max-h-[calc(100vh-280px)]">
          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Seu kit está vazio</p>
              <p className="text-sm mt-2">Adicione produtos para montar seu kit</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-muted/30 rounded-xl p-3 border border-border"
                >
                  <div className="flex gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-contain rounded-lg bg-white"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">
                        {item.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Tamanho: {item.size}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Qtd: {item.selectedQty} un
                      </p>
                      <p className="text-primary font-bold text-sm mt-1">
                        {item.price > 0
                          ? `R$ ${item.price.toFixed(2).replace(".", ",")}`
                          : "Consultar"}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg self-start transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
          {items.length > 0 && (
            <>
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted-foreground">Total estimado:</span>
                <span className="text-xl font-bold text-primary">
                  {getTotal() > 0
                    ? `R$ ${getTotal().toFixed(2).replace(".", ",")}`
                    : "A consultar"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground text-center mb-4">Frete a consultar</p>
              <Button
                onClick={handleBuyKit}
                variant="hero"
                className="w-full gap-2 mb-2"
                size="lg"
              >
                <img src={whatsappIcon} alt="WhatsApp" className="w-5 h-5" />
                Comprar
              </Button>
              <Button
                onClick={clearCart}
                variant="ghost"
                className="w-full text-muted-foreground"
                size="sm"
              >
                Limpar Carrinho
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Overlay */}
      {isCartOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setIsCartOpen(false)}
        />
      )}
    </>
  );
};

export default CartPanel;
