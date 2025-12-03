import { Star, Quote } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      id: 1,
      name: "Maria Silva",
      role: "Loja de Semijoias",
      content: "As tags da Prime Print transformaram a apresentação das minhas peças. Meus clientes sempre elogiam a qualidade e o profissionalismo. Recomendo demais!",
      rating: 5,
      initials: "MS",
    },
    {
      id: 2,
      name: "Ana Oliveira",
      role: "Bijuterias Artesanais",
      content: "Atendimento excepcional e entrega rápida. O material é resistente mesmo, já testei na água e ficou perfeito! Valeu cada centavo.",
      rating: 5,
      initials: "AO",
    },
    {
      id: 3,
      name: "Carla Santos",
      role: "Joalheria Premium",
      content: "Parceria de longa data. Wesley e Jacqueline são super atenciosos e sempre entregam exatamente o que promete. Qualidade top!",
      rating: 5,
      initials: "CS",
    },
    {
      id: 4,
      name: "Patrícia Lima",
      role: "Loja Virtual de Acessórios",
      content: "Minhas fotos de produto ficaram muito mais bonitas com as tags personalizadas. Os clientes percebem o cuidado e isso aumentou minhas vendas.",
      rating: 5,
      initials: "PL",
    },
  ];

  return (
    <section id="depoimentos" className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-4">
            Depoimentos
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            O que nossos{" "}
            <span className="text-gradient">clientes dizem</span>
          </h2>
          <p className="text-muted-foreground text-lg font-body">
            Centenas de lojistas já confiam na Prime Print para profissionalizar suas marcas.
            Veja o que eles têm a dizer.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              className="relative p-8 rounded-2xl bg-card border border-border hover:shadow-brand-md transition-all duration-300"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                <Quote className="w-6 h-6 text-primary" />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-secondary text-secondary" />
                ))}
              </div>

              {/* Content */}
              <p className="text-foreground font-body text-lg mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full gradient-brand flex items-center justify-center text-primary-foreground font-bold">
                  {testimonial.initials}
                </div>
                <div>
                  <p className="font-display font-semibold text-foreground">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-muted-foreground font-body">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Social Proof */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-4 px-8 py-4 rounded-full bg-accent border border-border">
            <div className="flex -space-x-3">
              {["MS", "AO", "CS", "PL", "+"].map((initial, i) => (
                <div
                  key={i}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 border-card ${
                    i === 4 ? "bg-primary text-primary-foreground" : "gradient-brand text-primary-foreground"
                  }`}
                >
                  {initial}
                </div>
              ))}
            </div>
            <p className="text-foreground font-body">
              <span className="font-bold">+500</span> clientes satisfeitos em todo o Brasil
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
