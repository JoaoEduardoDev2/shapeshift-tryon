import { motion } from "framer-motion";
import { Upload, Scan, Sparkles, Share2 } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Envie uma foto ou abra a câmera",
    description: "O cliente escolhe entre enviar uma foto de corpo inteiro ou usar o espelho virtual em tempo real.",
  },
  {
    number: "02",
    icon: Scan,
    title: "IA detecta corpo e rosto",
    description: "MediaPipe + Gemini AI mapeiam 468 pontos faciais e 33 pontos corporais com precisão em milissegundos.",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Roupa se adapta ao corpo",
    description: "A peça é deformada respeitando pose, proporção, perspectiva e iluminação — não é sobreposição.",
  },
  {
    number: "04",
    icon: Share2,
    title: "Compartilhe e compre",
    description: "O cliente baixa a imagem, compartilha nas redes sociais e compra direto — aumentando conversão e viralizando.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-32 px-4" id="how-it-works">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl sm:text-5xl font-black mb-4">
            Como <span className="text-gradient">funciona</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            4 passos para transformar a experiência de compra dos seus clientes
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative text-center"
            >
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-px bg-border" />
              )}

              <div className="relative z-10">
                <span className="text-5xl font-black text-primary/10 font-mono block mb-2">{step.number}</span>
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
