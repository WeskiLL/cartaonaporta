import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import whatsappIcon from "@/assets/whatsapp-icon.png";

const WHATSAPP_MESSAGE = "Olá! Vim pelo site e gostaria de saber mais sobre as tags para joias personalizadas.";

const FAQ = () => {
  const faqs = [
    {
      question: "Qual o prazo de produção e entrega?",
      answer: "O prazo de produção é de 2 a 5 dias úteis após a aprovação da arte. O envio é feito pelos Correios para todo o Brasil, e o prazo de entrega varia de acordo com a região (geralmente de 3 a 15 dias úteis).",
    },
    {
      question: "Qual a quantidade mínima de pedido?",
      answer: "Trabalhamos com pedidos a partir de 100 unidades. Quanto maior a quantidade, melhor o custo-benefício. Entre em contato para um orçamento personalizado.",
    },
    {
      question: "Vocês fazem a arte ou preciso enviar pronta?",
      answer: "Criamos a arte totalmente personalizada da maneira que preferir, sem nenhum custo adicional. Você também pode enviar sua arte pronta, se preferir!",
    },
    {
      question: "As tags são realmente resistentes à água?",
      answer: "Sim! Utilizamos papel couchê 250g com verniz total na frente, o que garante resistência à água. Se molhar acidentalmente, não desbota e não mancha.",
    },
    {
      question: "Quais formas de pagamento vocês aceitam?",
      answer: "Aceitamos Pix, transferência bancária e cartão de crédito. O pagamento é feito antecipadamente para garantir sua produção.",
    },
    {
      question: "Posso fazer pedidos recorrentes?",
      answer: "Claro! Temos clientes que fazem pedidos mensais. Guardamos sua arte e podemos oferecer condições especiais para pedidos frequentes.",
    },
    {
      question: "Como funciona o envio para outros estados?",
      answer: "Enviamos para todo o Brasil através dos Correios, com código de rastreamento. O frete é calculado de acordo com o destino e pode ser consultado no momento do orçamento.",
    },
    {
      question: "De onde vocês são?",
      answer: "Temos produção na Bahia, em São Paulo e no Paraná. Enviamos de onde o frete for mais barato e a entrega mais rápida, garantindo o melhor custo-benefício para você.",
    },
  ];

  return (
    <section id="faq" className="py-20 lg:py-32 bg-card">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Header Column */}
          <div className="lg:sticky lg:top-32">
            <span className="inline-block px-4 py-1 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-4">
              Perguntas Frequentes
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
              Tire suas{" "}
              <span className="text-gradient">dúvidas</span>
            </h2>
            <p className="text-muted-foreground text-lg font-body mb-8">
              Reunimos as perguntas mais comuns dos nossos clientes. 
              Se ainda tiver dúvidas, é só entrar em contato!
            </p>

            <Button variant="hero" size="lg" asChild>
              <a
                href={`https://wa.me/5574981138033?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <img src={whatsappIcon} alt="WhatsApp" className="w-5 h-5" />
                Fale com a gente
              </a>
            </Button>
          </div>

          {/* FAQ Accordion */}
          <div>
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-background border border-border rounded-xl px-6 data-[state=open]:shadow-brand-sm transition-shadow"
                >
                  <AccordionTrigger className="text-left font-display font-semibold text-foreground hover:text-primary hover:no-underline py-5">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground font-body pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
