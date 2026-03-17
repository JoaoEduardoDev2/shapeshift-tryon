import { motion } from "framer-motion";
import { Shirt, Palette, Glasses, Sparkles, User } from "lucide-react";

import modaFemImg from "@/assets/examples/moda-feminina.jpg";
import modaMascImg from "@/assets/examples/moda-masculina.jpg";
import maquiagemImg from "@/assets/examples/maquiagem.jpg";
import oculosImg from "@/assets/examples/oculos.jpg";
import cabeloBarbaImg from "@/assets/examples/cabelo-barba.jpg";

const examples = [
  {
    title: "Moda Feminina",
    description: "Vestidos, blusas e saias se adaptam à pose e iluminação da cliente",
    icon: Shirt,
    image: modaFemImg,
    tags: ["Vestido", "Blusa", "Saia", "Calça"],
  },
  {
    title: "Moda Masculina",
    description: "Blazers, camisas e calças ajustados com precisão ao corpo do cliente",
    icon: User,
    image: modaMascImg,
    tags: ["Blazer", "Camisa", "Calça", "Jaqueta"],
  },
  {
    title: "Maquiagem Virtual",
    description: "Batom, blush, base e sombra aplicados com mapeamento facial em 468 pontos",
    icon: Palette,
    image: maquiagemImg,
    tags: ["Batom", "Blush", "Base", "Sombra"],
  },
  {
    title: "Óculos & Acessórios",
    description: "Óculos, relógios e bonés posicionados com precisão usando landmarks faciais",
    icon: Glasses,
    image: oculosImg,
    tags: ["Óculos", "Relógio", "Boné", "Brinco"],
  },
  {
    title: "Cabelo & Barba",
    description: "Mudança de cor, estilo e comprimento de cabelo e barba com detecção de contorno",
    icon: Sparkles,
    image: cabeloBarbaImg,
    tags: ["Cabelo", "Barba", "Sobrancelha", "Cílios"],
  },
];

export function Examples() {
  return (
    <section className="py-32 px-4" id="examples">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-black mb-4">
            Exemplos de <span className="text-gradient">simulação</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Veja o que seus clientes podem provar virtualmente
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {examples.map((ex, i) => (
            <motion.div
              key={ex.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.25 } }}
              className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-all shadow-card hover:shadow-glow"
            >
              {/* Visual area with real image */}
              <div className="h-56 relative overflow-hidden">
                <img
                  src={ex.image}
                  alt={ex.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                <div className="absolute top-4 left-4 p-2 rounded-xl bg-card/70 backdrop-blur-sm border border-border/50">
                  <ex.icon className="w-5 h-5 text-primary" />
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{ex.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{ex.description}</p>
                <div className="flex flex-wrap gap-2">
                  {ex.tags.map((tag) => (
                    <span key={tag} className="text-xs px-3 py-1 rounded-full bg-secondary text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
