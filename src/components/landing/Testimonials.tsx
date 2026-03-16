import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Testimonial {
  name: string;
  role: string;
  company: string;
  avatar?: string;
  content: string;
  rating: number;
  metric?: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Carolina Mendes",
    role: "Head de E-commerce",
    company: "Loja Elegância",
    content:
      "O provador virtual reduziu nossas devoluções em 40% no primeiro mês. Os clientes adoram experimentar antes de comprar.",
    rating: 5,
    metric: "−40% devoluções",
  },
  {
    name: "Rafael Costa",
    role: "CEO",
    company: "ModaViva",
    content:
      "Implementamos em 15 minutos e a taxa de conversão subiu 28%. É a melhor ferramenta que já adicionamos à nossa loja.",
    rating: 5,
    metric: "+28% conversão",
  },
  {
    name: "Beatriz Oliveira",
    role: "Gerente de Marketing",
    company: "BeautyPlus",
    content:
      "O try-on de maquiagem é impressionante. Nossas clientes passam 3x mais tempo no site e compram com muito mais confiança.",
    rating: 5,
    metric: "3x tempo no site",
  },
  {
    name: "Lucas Ferreira",
    role: "Diretor de Produto",
    company: "ÓculosTech",
    content:
      "O provador de óculos é tão preciso que praticamente eliminou as trocas. Nosso NPS subiu 22 pontos após a integração.",
    rating: 5,
    metric: "+22 NPS",
  },
  {
    name: "Mariana Santos",
    role: "Fundadora",
    company: "Atelier MS",
    content:
      "Como marca de moda autoral, o provador virtual me permite atender clientes de todo o Brasil sem loja física. Revolucionário.",
    rating: 5,
    metric: "5x alcance",
  },
  {
    name: "Pedro Almeida",
    role: "CTO",
    company: "FashionHub",
    content:
      "A integração com Shopify foi plug-and-play. Em menos de uma hora já tínhamos o espelho virtual rodando com 500 produtos.",
    rating: 5,
    metric: "Setup em 1h",
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="py-32 px-4" id="testimonials">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-black mb-4">
            Quem usa, <span className="text-gradient">recomenda</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Veja como nossos clientes estão transformando suas lojas com o provador virtual.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group relative rounded-2xl border border-border bg-card p-6 hover:border-primary/30 transition-colors duration-300"
            >
              {/* Metric badge */}
              {t.metric && (
                <div className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
                  {t.metric}
                </div>
              )}

              <Quote className="w-8 h-8 text-primary/20 mb-4" />

              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                "{t.content}"
              </p>

              <div className="flex items-center gap-3 mt-auto">
                <Avatar className="w-10 h-10 border border-border">
                  {t.avatar ? (
                    <AvatarImage src={t.avatar} alt={t.name} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.role} · {t.company}
                  </p>
                </div>
                <div className="ml-auto">
                  <Stars count={t.rating} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
        >
          {[
            { value: "500+", label: "Lojas ativas" },
            { value: "2M+", label: "Provas realizadas" },
            { value: "4.9/5", label: "Avaliação média" },
            { value: "−35%", label: "Redução de devoluções" },
          ].map((stat) => (
            <div key={stat.label} className="p-4 rounded-xl border border-border bg-card/50">
              <p className="text-2xl sm:text-3xl font-black text-primary">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
