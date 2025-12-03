import depoimentoEshetChayil from "@/assets/depoimento-eshet-chayil.jpeg";
import depoimentoMrJoias from "@/assets/depoimento-mr-joias.jpeg";
import depoimentoRbPratas from "@/assets/depoimento-rb-pratas.jpeg";

const Testimonials = () => {
  const testimonials = [
    {
      id: 1,
      name: "Eshet Chayil",
      segment: "Moda Evangélica",
      image: depoimentoEshetChayil,
    },
    {
      id: 2,
      name: "MR Joias",
      segment: "Loja de Joias",
      image: depoimentoMrJoias,
    },
    {
      id: 3,
      name: "RB Pratas",
      segment: "Loja de Joias",
      image: depoimentoRbPratas,
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
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="relative rounded-2xl bg-card border border-border overflow-hidden hover:shadow-brand-md transition-all duration-300"
            >
              {/* WhatsApp Screenshot */}
              <div className="aspect-[3/4] relative overflow-hidden">
                <img
                  src={testimonial.image}
                  alt={`Depoimento de ${testimonial.name}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Store Info */}
              <div className="p-5 text-center">
                <p className="font-display font-semibold text-foreground text-lg">
                  {testimonial.name}
                </p>
                <p className="text-sm text-muted-foreground font-body">
                  {testimonial.segment}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Social Proof */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-4 px-8 py-4 rounded-full bg-accent border border-border">
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