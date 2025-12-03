import { Button } from "@/components/ui/button";
import { MessageCircle, ArrowRight, Sparkles } from "lucide-react";

const FinalCTA = () => {
  return (
    <section id="contato" className="py-20 lg:py-32 bg-gradient-to-br from-primary to-secondary relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-10 left-10 w-64 h-64 bg-primary-foreground/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary-foreground/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/20 backdrop-blur-sm mb-8">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
            <span className="text-sm font-medium text-primary-foreground">
              Comece Hoje Mesmo
            </span>
          </div>

          {/* Heading */}
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6 leading-tight">
            Pronto para elevar sua marca ao próximo nível?
          </h2>

          <p className="text-xl text-primary-foreground/90 font-body mb-10 max-w-2xl mx-auto">
            Suas tags são o primeiro contato do cliente com sua marca — faça valer a pena.
            Entre em contato agora e receba um orçamento personalizado em minutos.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              variant="secondary"
              size="xl"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              asChild
            >
              <a
                href="https://wa.me/5574981138033?text=Olá! Vim pelo site e quero um orçamento para tags personalizadas."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <MessageCircle className="w-6 h-6" />
                Solicitar Orçamento Grátis
              </a>
            </Button>

            <Button
              variant="outline"
              size="xl"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              asChild
            >
              <a
                href="https://www.instagram.com/cartaonaporta/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                Ver Instagram
                <ArrowRight className="w-5 h-5" />
              </a>
            </Button>
          </div>

          {/* Trust Elements */}
          <div className="flex flex-wrap justify-center gap-8 text-primary-foreground/80">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary-foreground" />
              <span className="text-sm font-body">Resposta em até 1 hora</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary-foreground" />
              <span className="text-sm font-body">Orçamento sem compromisso</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary-foreground" />
              <span className="text-sm font-body">Atendimento personalizado</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
