import { motion, useScroll, useTransform } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRef } from "react";

import carolinaImg from "@/assets/testimonials/carolina.jpg";
import rafaelImg from "@/assets/testimonials/rafael.jpg";
import beatrizImg from "@/assets/testimonials/beatriz.jpg";
import lucasImg from "@/assets/testimonials/lucas.jpg";
import marianaImg from "@/assets/testimonials/mariana.jpg";
import pedroImg from "@/assets/testimonials/pedro.jpg";

interface Testimonial {
  name: string;
  role: string;
  company: string;
  avatar: string;
  content: string;
  rating: number;
  metric?: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Carolina Mendes",
    role: "Head de E-commerce",
    company: "Loja Elegância",
    avatar: carolinaImg,
    content:
      "O provador virtual reduziu nossas devoluções em 40% no primeiro mês. Os clientes adoram experimentar antes de comprar.",
    rating: 5,
    metric: "−40% devoluções",
  },
  {
    name: "Rafael Costa",
    role: "CEO",
    company: "ModaViva",
    avatar: rafaelImg,
    content:
      "Implementamos em 15 minutos e a taxa de conversão subiu 28%. É a melhor ferramenta que já adicionamos à nossa loja.",
    rating: 5,
    metric: "+28% conversão",
  },
  {
    name: "Beatriz Oliveira",
    role: "Gerente de Marketing",
    company: "BeautyPlus",
    avatar: beatrizImg,
    content:
      "O try-on de maquiagem é impressionante. Nossas clientes passam 3x mais tempo no site e compram com muito mais confiança.",
    rating: 5,
    metric: "3x tempo no site",
  },
  {
    name: "Lucas Ferreira",
    role: "Diretor de Produto",
    company: "ÓculosTech",
    avatar: lucasImg,
    content:
      "O provador de óculos é tão preciso que praticamente eliminou as trocas. Nosso NPS subiu 22 pontos após a integração.",
    rating: 5,
    metric: "+22 NPS",
  },
  {
    name: "Mariana Santos",
    role: "Fundadora",
    company: "Atelier MS",
    avatar: marianaImg,
    content:
      "Como marca de moda autoral, o provador virtual me permite atender clientes de todo o Brasil sem loja física. Revolucionário.",
    rating: 5,
    metric: "5x alcance",
  },
  {
    name: "Pedro Almeida",
    role: "CTO",
    company: "FashionHub",
    avatar: pedroImg,
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

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 60,
    scale: 0.95,
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

export function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const headerScale = useTransform(scrollYProgress, [0, 0.2], [0.9, 1]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.15], [0, 1]);

  return (
    <section ref={sectionRef} className="relative py-32 px-4 overflow-hidden" id="testimonials">
      {/* Animated background glow */}
      <motion.div
        style={{ y: backgroundY }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
      </motion.div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          style={{ scale: headerScale, opacity: headerOpacity }}
          className="text-center mb-20"
        >
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wider uppercase mb-6"
          >
            Social Proof
          </motion.span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-4">
            Quem usa, <span className="text-gradient">recomenda</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Veja como nossos clientes estão transformando suas lojas com o provador virtual.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className="group relative rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-7 hover:border-primary/40 hover:shadow-glow transition-colors duration-300"
            >
              {/* Metric badge */}
              {t.metric && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: -10 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 + 0.3, type: "spring", stiffness: 200 }}
                  className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-gradient-primary text-primary-foreground text-xs font-bold shadow-lg"
                >
                  {t.metric}
                </motion.div>
              )}

              <Quote className="w-8 h-8 text-primary/15 mb-4" />

              <p className="text-sm text-muted-foreground leading-relaxed mb-8 min-h-[60px]">
                "{t.content}"
              </p>

              <div className="flex items-center gap-3 mt-auto pt-4 border-t border-border/50">
                <Avatar className="w-11 h-11 border-2 border-primary/20 ring-2 ring-primary/5">
                  <AvatarImage src={t.avatar} alt={t.name} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {t.role} · {t.company}
                  </p>
                </div>
                <div className="shrink-0">
                  <Stars count={t.rating} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
        >
          {[
            { value: "500+", label: "Lojas ativas" },
            { value: "2M+", label: "Provas realizadas" },
            { value: "4.9/5", label: "Avaliação média" },
            { value: "−35%", label: "Redução de devoluções" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              className="p-5 rounded-2xl border border-border bg-card/60 backdrop-blur-sm hover:border-primary/30 transition-colors"
            >
              <p className="text-3xl sm:text-4xl font-black text-gradient">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1.5">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
