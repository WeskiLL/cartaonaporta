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
        <title>Prime Print | Tags Personalizadas para Bijuterias, Semijoias e Joias</title>
        <meta 
          name="description" 
          content="Tags personalizadas de alta qualidade para lojas de bijuterias, semijoias e joias. Papel couchê 250g, resistente à água, envio para todo Brasil. Solicite seu orçamento!" 
        />
        <meta name="keywords" content="tags personalizadas, etiquetas para joias, tags para bijuterias, tags para semijoias, cartão na porta, prime print" />
        <meta property="og:title" content="Prime Print | Tags Personalizadas para Bijuterias, Semijoias e Joias" />
        <meta property="og:description" content="Tags personalizadas de alta qualidade. Papel couchê 250g, resistente à água, envio para todo Brasil." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://primeprint.com.br" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Prime Print - Cartão na Porta",
            "description": "Tags personalizadas de alta qualidade para lojas de bijuterias, semijoias e joias.",
            "telephone": "+55-74-98113-8033",
            "url": "https://primeprint.com.br",
            "sameAs": [
              "https://www.instagram.com/cartaonaporta/"
            ],
            "founder": [
              { "@type": "Person", "name": "Wesley Rocha" },
              { "@type": "Person", "name": "Jacqueline Rodrigues" }
            ],
            "areaServed": {
              "@type": "Country",
              "name": "Brasil"
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
