import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Como funciona o provador virtual?",
    a: "O sistema usa IA (MediaPipe + Gemini) para detectar corpo e rosto em tempo real. A roupa é deformada e ajustada respeitando pose, proporção e iluminação — não é uma simples sobreposição de imagem.",
  },
  {
    q: "Precisa instalar algum app?",
    a: "Não. O provador funciona direto no navegador do celular ou computador. Basta adicionar nosso script ao seu site e o botão 'Provar Agora' aparece automaticamente nas páginas de produto.",
  },
  {
    q: "Funciona com qualquer plataforma de e-commerce?",
    a: "Sim! Temos integrações nativas com Shopify, WooCommerce, Magento, VTEX, Nuvemshop, Tray e mais. Para outras plataformas, basta colar nosso script embed.",
  },
  {
    q: "Os dados dos clientes ficam seguros?",
    a: "Sim. As fotos são processadas em memória e nunca armazenadas. Somos compatíveis com LGPD e GDPR, com criptografia de ponta a ponta e exclusão automática.",
  },
  {
    q: "Quanto tempo leva para integrar?",
    a: "Menos de 5 minutos. Copie o script de instalação, cole no HTML do seu site e pronto. A sincronização de produtos é automática com as plataformas integradas.",
  },
  {
    q: "O provador funciona para maquiagem?",
    a: "Sim! Batom, blush, base, sombra, cílios, sobrancelhas e até mudança de cabelo e barba. Tudo mapeado com 468 pontos faciais em tempo real.",
  },
  {
    q: "Posso testar antes de assinar?",
    a: "Sim! Todos os planos incluem 7 dias grátis. Cancele quando quiser, sem compromisso.",
  },
  {
    q: "Como o compartilhamento social aumenta vendas?",
    a: "Cada simulação pode ser compartilhada com link público que inclui o produto e botão de compra. Seus clientes se tornam divulgadores orgânicos da sua loja.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-32 px-4" id="faq">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-black mb-4">
            Perguntas <span className="text-gradient">frequentes</span>
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-card overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="font-medium text-sm pr-4">{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  open === i ? "max-h-48 pb-5" : "max-h-0"
                }`}
              >
                <p className="px-5 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
