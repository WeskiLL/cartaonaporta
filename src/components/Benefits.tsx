import { 
  FileText, 
  Sparkles, 
  Droplets, 
  Printer, 
  Truck, 
  Shield,
  Clock,
  ThumbsUp,
  Scissors,
  Layers,
  Sun,
  Star
} from "lucide-react";

const Benefits = () => {
  const mainBenefits = [
    {
      icon: FileText,
      title: "Papel Couchê 250g",
      description: "Material resistente e encorpado que transmite qualidade e profissionalismo.",
    },
    {
      icon: Sparkles,
      title: "Verniz Total na Frente",
      description: "Acabamento brilhante que realça as cores e protege a impressão.",
    },
    {
      icon: Droplets,
      title: "Resistente à Água",
      description: "Se molhar, não desbota e não mancha. Durabilidade garantida.",
    },
    {
      icon: Printer,
      title: "Impressão Laser",
      description: "Alta definição e precisão em cada detalhe da sua arte.",
    },
    {
      icon: Truck,
      title: "Envio para Todo Brasil",
      description: "Entregamos em qualquer lugar do país com segurança.",
    },
    {
      icon: Shield,
      title: "Qualidade Garantida",
      description: "Compromisso com a excelência em todos os pedidos.",
    },
  ];

  const additionalBenefits = [
    { icon: Clock, text: "Produção Rápida" },
    { icon: ThumbsUp, text: "Clientes Satisfeitos" },
    { icon: Shield, text: "Pagamento Seguro" },
  ];

  return (
    <section id="vantagens" className="py-20 lg:py-32 bg-card relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-accent/50 to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-4">
            Por que escolher a Prime Print?
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Qualidade que{" "}
            <span className="text-gradient">faz a diferença</span>
          </h2>
          <p className="text-muted-foreground text-lg font-body">
            Investimos nos melhores materiais e processos para garantir que suas tags 
            impressionem à primeira vista e durem por muito tempo.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {mainBenefits.map((benefit, index) => (
            <div
              key={benefit.title}
              className="relative p-8 rounded-2xl bg-background border border-border hover:border-primary/30 hover:shadow-brand-md transition-all duration-300 group"
            >
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-brand-sm">
                <benefit.icon className="w-8 h-8 text-primary-foreground" />
              </div>
              
              {/* Content */}
              <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                {benefit.title}
              </h3>
              <p className="text-muted-foreground font-body">
                {benefit.description}
              </p>

              {/* Number Badge */}
              <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                <span className="text-sm font-bold text-accent-foreground">{index + 1}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Premium Finishes Section */}
        <div className="mb-16 p-8 rounded-2xl bg-gradient-to-br from-accent/80 to-accent/30 border border-primary/20">
          <div className="text-center mb-8">
            <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
              Acabamentos <span className="text-gradient">Diferenciados</span>
            </h3>
            <p className="text-muted-foreground font-body">
              Para você que deseja se destacar ainda mais, oferecemos opções premium:
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { icon: Scissors, title: "Corte Especial" },
              { icon: Layers, title: "Papel Couchê 300g" },
              { icon: Sun, title: "Papel Fosco" },
              { icon: Sparkles, title: "Verniz Localizado" },
              { icon: Star, title: "Hot Stamping" },
            ].map((item) => (
              <div
                key={item.title}
                className="flex flex-col items-center text-center p-4 rounded-xl bg-background/60 backdrop-blur-sm border border-border hover:border-primary/40 hover:shadow-brand-sm transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-full gradient-brand flex items-center justify-center mb-3 shadow-brand-sm">
                  <item.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="font-body font-semibold text-foreground text-sm">
                  {item.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Benefits Bar */}
        <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-8">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {additionalBenefits.map((benefit) => (
              <div key={benefit.text} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <benefit.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="text-primary-foreground font-semibold font-body">
                  {benefit.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Benefits;
