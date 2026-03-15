import { motion } from "framer-motion";
import { Shirt, Palette, Camera, Scan, Zap, Shield } from "lucide-react";

const features = [
  {
    icon: Shirt,
    title: "Moda Completa",
    description: "Camisetas, vestidos, jaquetas, calças, saias, óculos, relógios, bonés e sapatos.",
  },
  {
    icon: Palette,
    title: "Beleza & Maquiagem",
    description: "Batom, blush, base, cílios, sobrancelhas, cabelo e barba com mapeamento UV.",
  },
  {
    icon: Camera,
    title: "Modo Foto",
    description: "Envie uma foto. O sistema detecta corpo, cria mapa corporal e aplica a roupa.",
  },
  {
    icon: Scan,
    title: "Espelho Virtual",
    description: "Câmera em tempo real com detecção facial e corporal. Prove tudo ao vivo.",
  },
  {
    icon: Zap,
    title: "Performance",
    description: "WebGL + MediaPipe no edge. Processamento híbrido. <30ms de latência.",
  },
  {
    icon: Shield,
    title: "Privacidade",
    description: "Imagens processadas em memória. Exclusão automática. GDPR compliance.",
  },
];

export function Features() {
  return (
    <section className="py-32 px-4" id="features">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-black mb-4">
            O que você pode <span className="text-gradient">provar</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Detecção real. Não é sobreposição de imagem.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all duration-300 shadow-card hover:shadow-glow"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
