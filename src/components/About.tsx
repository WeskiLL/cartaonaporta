import { Users, Award, Heart, Target } from "lucide-react";
import jacquelinePhoto from "@/assets/jacqueline.jpeg";

const About = () => {
  const values = [
    {
      icon: Award,
      title: "Qualidade Premium",
      description: "Utilizamos os melhores materiais e equipamentos de impressão do mercado.",
    },
    {
      icon: Heart,
      title: "Paixão pelo que fazemos",
      description: "Cada tag é produzida com dedicação e atenção aos detalhes.",
    },
    {
      icon: Target,
      title: "Foco no cliente",
      description: "Seu sucesso é o nosso objetivo. Trabalhamos para que sua marca brilhe.",
    },
    {
      icon: Users,
      title: "Parceria duradoura",
      description: "Construímos relacionamentos de confiança com nossos clientes.",
    },
  ];

  return (
    <section id="sobre" className="py-20 lg:py-32 bg-card">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div>
            <span className="inline-block px-4 py-1 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-4">
              Quem Somos
            </span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Sua marca merece materiais que{" "}
              <span className="text-gradient">elevam o valor</span> da sua vitrine
            </h2>
            
            <p className="text-muted-foreground text-lg mb-6 font-body leading-relaxed">
              A <strong className="text-foreground">Prime Print</strong>, através do perfil{" "}
              <strong className="text-foreground">Cartão na Porta</strong>, é referência na produção de tags 
              personalizadas e materiais impressos para o segmento de bijuterias, semijoias e joias.
            </p>
            
            <p className="text-muted-foreground text-lg mb-8 font-body leading-relaxed">
              Fundada por <strong className="text-foreground">Jacqueline Rodrigues</strong>, nossa missão é ajudar 
              empreendedores a profissionalizar suas lojas com materiais que transmitem credibilidade 
              e valorizam cada peça.
            </p>

            {/* Founder */}
            <div className="flex items-center gap-6 p-6 rounded-2xl bg-accent/50 border border-border">
              <img 
                src={jacquelinePhoto} 
                alt="Jacqueline Rodrigues" 
                className="w-16 h-16 rounded-full object-cover border-4 border-card"
              />
              <div>
                <p className="font-display font-semibold text-foreground">Jacqueline Rodrigues</p>
                <p className="text-sm text-muted-foreground font-body">Fundadora da Prime Print</p>
              </div>
            </div>
          </div>

          {/* Values Grid */}
          <div className="grid sm:grid-cols-2 gap-6">
            {values.map((value, index) => (
              <div
                key={value.title}
                className="p-6 rounded-2xl bg-background border border-border hover:border-primary/30 hover:shadow-brand-md transition-all duration-300 group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-14 h-14 rounded-xl gradient-brand flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <value.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  {value.title}
                </h3>
                <p className="text-muted-foreground text-sm font-body">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
