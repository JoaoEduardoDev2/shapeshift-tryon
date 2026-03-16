import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
import { Integration } from "@/components/landing/Integration";
import { Navbar } from "@/components/landing/Navbar";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Features />
      <Pricing />
      <Integration />
      <footer className="border-t border-border py-12 px-4 text-center text-sm text-muted-foreground">
        <p>© 2026 AI Virtual Fit — Provador Virtual Inteligente. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
