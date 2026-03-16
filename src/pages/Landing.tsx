import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { Examples } from "@/components/landing/Examples";
import { Platforms } from "@/components/landing/Platforms";
import { Pricing } from "@/components/landing/Pricing";
import { Integration } from "@/components/landing/Integration";
import { FAQ } from "@/components/landing/FAQ";
import { Navbar } from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <Examples />
      <Platforms />
      <Pricing />
      <Integration />
      <FAQ />

      {/* Final CTA */}
      <section className="py-32 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-black mb-4">
            Pronto para <span className="text-gradient">começar</span>?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            14 dias grátis. Sem cartão de crédito. Cancele quando quiser.
          </p>
          <Link to="/auth">
            <Button variant="hero" size="xl">
              Começar Grátis
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-12 px-4 text-center text-sm text-muted-foreground">
        <p>© 2026 AI Virtual Fit — Provador Virtual Inteligente. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
