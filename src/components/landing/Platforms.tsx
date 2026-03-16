import { motion } from "framer-motion";

const platforms = [
  { name: "Shopify", emoji: "🟢" },
  { name: "WooCommerce", emoji: "🟣" },
  { name: "Magento", emoji: "🟠" },
  { name: "VTEX", emoji: "🔴" },
  { name: "Nuvemshop", emoji: "💙" },
  { name: "Tray", emoji: "🧡" },
  { name: "Loja Integrada", emoji: "💚" },
  { name: "Wix", emoji: "⚫" },
  { name: "BigCommerce", emoji: "🔵" },
  { name: "Squarespace", emoji: "⬛" },
  { name: "Yampi", emoji: "💜" },
  { name: "Bagy", emoji: "🛍️" },
];

export function Platforms() {
  return (
    <section className="py-24 px-4 border-t border-border" id="platforms">
      <div className="max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl font-black mb-3">
            Integra com sua <span className="text-gradient">plataforma</span>
          </h2>
          <p className="text-muted-foreground mb-12">
            Conecte em minutos. Sem código. Sincronização automática de produtos.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4"
        >
          {platforms.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
            >
              <span className="text-xl">{p.emoji}</span>
              <span className="text-sm font-medium">{p.name}</span>
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-xs text-muted-foreground"
        >
          + TikTok Shop · Instagram Shop · Facebook Shop · Pinterest Shopping
        </motion.p>
      </div>
    </section>
  );
}
