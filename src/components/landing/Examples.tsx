import { motion } from "framer-motion";
import { Shirt, Palette, Glasses, Sparkles } from "lucide-react";

const examples = [
  {
    title: "Moda Feminina",
    description: "Vestidos, blusas e saias se adaptam à pose e iluminação da cliente",
    icon: Shirt,
    gradient: "from-pink-500/20 to-purple-500/20",
    tags: ["Vestido", "Blusa", "Saia", "Calça"],
  },
  {
    title: "Maquiagem Virtual",
    description: "Batom, blush, base e sombra aplicados com mapeamento facial em 468 pontos",
    icon: Palette,
    gradient: "from-rose-500/20 to-orange-500/20",
    tags: ["Batom", "Blush", "Base", "Sombra"],
  },
  {
    title: "Óculos & Acessórios",
    description: "Óculos, relógios e bonés posicionados com precisão usando landmarks faciais",
    icon: Glasses,
    gradient: "from-blue-500/20 to-cyan-500/20",
    tags: ["Óculos", "Relógio", "Boné", "Brinco"],
  },
  {
    title: "Cabelo & Barba",
    description: "Mudança de cor, estilo e comprimento de cabelo com detecção de contorno",
    icon: Sparkles,
    gradient: "from-amber-500/20 to-yellow-500/20",
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
              className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-all shadow-card hover:shadow-glow"
            >
              {/* Visual area */}
              <div className={`h-48 bg-gradient-to-br ${ex.gradient} flex items-center justify-center relative overflow-hidden`}>
                <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border)/0.15)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.15)_1px,transparent_1px)] bg-[size:24px_24px]" />
                <ex.icon className="w-16 h-16 text-foreground/20 group-hover:text-foreground/30 transition-colors relative z-10" />
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
