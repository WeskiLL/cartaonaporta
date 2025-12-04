import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Catalog from "@/components/Catalog";
import Benefits from "@/components/Benefits";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";

const Index = () => {
  return (
    <>
      <Helmet>
        <html lang="pt-BR" />
        <title>Tags Personalizadas para Joias, Semijoias e Bijuterias | Prime Print</title>
        <meta 
          name="description" 
          content="Tags personalizadas de alta qualidade para lojas de joias, semijoias e bijuterias. Papel couchê 250g com verniz, resistente à água, impressão a laser. Envio para todo Brasil. Solicite seu orçamento!" 
        />
        <meta name="keywords" content="tags para joias, tags para semijoias, tags para bijuterias, etiquetas para joias, etiquetas personalizadas joias, tags personalizadas semijoias, cartão de garantia joias, tag de preço joias, etiqueta para brincos, tag para colar, tag para pulseiras, material para loja de joias, prime print, cartão na porta" />
        <meta property="og:title" content="Tags Personalizadas para Joias, Semijoias e Bijuterias | Prime Print" />
        <meta property="og:description" content="Tags personalizadas de alta qualidade para lojas de joias e semijoias. Papel couchê 250g, resistente à água, envio para todo Brasil." />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="pt_BR" />
        <link rel="canonical" href="https://primeprint.com.br" />
        
        {/* Structured Data - Product */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "Tags Personalizadas para Joias e Semijoias",
            "description": "Tags personalizadas de alta qualidade em papel couchê 250g com verniz total, resistente à água, impressão a laser para lojas de joias, semijoias e bijuterias.",
            "brand": {
              "@type": "Brand",
              "name": "Prime Print - Cartão na Porta"
            },
            "offers": {
              "@type": "Offer",
              "availability": "https://schema.org/InStock",
              "areaServed": {
                "@type": "Country",
                "name": "Brasil"
              }
            }
          })}
        </script>
        
        {/* Structured Data - LocalBusiness */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Prime Print - Cartão na Porta",
            "description": "Especializada em tags personalizadas e materiais impressos para lojas de joias, semijoias e bijuterias. Qualidade premium com envio para todo Brasil.",
            "telephone": "+55-74-98113-8033",
            "url": "https://primeprint.com.br",
            "sameAs": [
              "https://www.instagram.com/cartaonaporta/"
            ],
            "founder": {
              "@type": "Person",
              "name": "Jacqueline Rodrigues"
            },
            "areaServed": {
              "@type": "Country",
              "name": "Brasil"
            },
            "priceRange": "$$",
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Catálogo de Tags e Materiais Impressos",
              "itemListElement": [
                { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Tags para Joias" }},
                { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Tags para Semijoias" }},
                { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Tags para Bijuterias" }},
                { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Certificados de Garantia" }},
                { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Cartões de Visita" }}
              ]
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen">
        <Header />
        <main>
          <Hero />
          <About />
          <Catalog />
          <Benefits />
          <Testimonials />
          <FAQ />
          <FinalCTA />
        </main>
        <Footer />
        <WhatsAppFloat />
      </div>
    </>
  );
};

export default Index;
