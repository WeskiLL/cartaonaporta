import { Button } from "@/components/ui/button";
import { MessageCircle, ArrowRight, Sparkles } from "lucide-react";
const Hero = () => {
  return <section id="hero" className="relative min-h-screen flex items-center gradient-hero pt-20 overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-40 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent border border-primary/20 mb-6 animate-fade-up">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-accent-foreground">Tags Personalizadas para Joias</span>
            </div>
            
            <h1 style={{
            animationDelay: "0.1s"
          }} className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6 animate-fade-up font-sans">
              Deixe sua loja{" "}
              <span className="text-gradient">profissional</span>{" "}
              e impressione seus clientes
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 font-body animate-fade-up" style={{
            animationDelay: "0.2s"
          }}>
              Suas tags são o primeiro contato do cliente com sua marca — faça valer a pena. 
              Materiais premium com impressão de alta qualidade que elevam o valor da sua vitrine.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-up" style={{
            animationDelay: "0.3s"
          }}>
              <Button variant="hero" size="xl" asChild>
                <a href="https://wa.me/5574981138033?text=Olá! Vim pelo site e gostaria de saber mais sobre as tags personalizadas." target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <MessageCircle className="w-6 h-6" />
                  Solicitar Orçamento
                </a>
              </Button>
              
              <Button variant="outline" size="xl" asChild>
                <a href="#catalogo" className="flex items-center gap-2">
                  Ver Catálogo
                  <ArrowRight className="w-5 h-5" />
                </a>
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-10 pt-8 border-t border-border animate-fade-up" style={{
            animationDelay: "0.4s"
          }}>
              <p className="text-sm text-muted-foreground mb-4 font-body">Confiado por centenas de lojistas em todo o Brasil</p>
              <div className="flex flex-wrap gap-6 justify-center lg:justify-start">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-sm font-medium text-foreground">Envio Nacional</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-secondary" />
                  <span className="text-sm font-medium text-foreground">Alta Qualidade</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-sm font-medium text-foreground">Atendimento Ágil</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative animate-fade-up" style={{
          animationDelay: "0.2s"
        }}>
            <div className="relative bg-card rounded-3xl shadow-brand-lg p-8 border border-border">
              {/* Placeholder para imagem hero */}
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-accent to-muted flex items-center justify-center overflow-hidden">
                <div className="text-center p-8">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full gradient-brand flex items-center justify-center animate-float">
                    <Sparkles className="w-16 h-16 text-primary-foreground" />
                  </div>
                  <p className="text-muted-foreground font-body">
                    [Espaço para imagem principal de tags/produtos]
                  </p>
                </div>
              </div>
              
              {/* Floating Badge */}
              <div className="absolute -top-4 -right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-brand-md">
                <span className="text-sm font-bold">Qualidade Premium</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default Hero;