import { motion } from "framer-motion";

const code = `<!-- Adicione ao seu site -->
<script>
  window.VTO_CONFIG = { 
    apiKey: 'pk_live_12345' 
  };
</script>
<script 
  src="https://cdn.vto-ai.com/v1/widget.js" 
  async
></script>

<!-- No botão do produto -->
<button 
  data-vto-trigger 
  data-product-id="SKU-992"
>
  Provar Virtualmente
</button>`;

const endpoints = [
  { method: "POST", path: "/v1/upload-product", desc: "Cadastrar produto (PNG, 3D, textura)" },
  { method: "POST", path: "/v1/tryon/start", desc: "Iniciar sessão de prova" },
  { method: "POST", path: "/v1/tryon/warp", desc: "Renderizar roupa no corpo" },
  { method: "GET", path: "/v1/tryon/result/:id", desc: "Obter resultado" },
];

export function Integration() {
  return (
    <section className="py-32 px-4" id="integration">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-black mb-4">
            Integre em <span className="text-gradient">minutos</span>
          </h2>
          <p className="text-muted-foreground text-lg">Shopify · WooCommerce · Magento · Custom</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Code embed */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-border bg-card overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
              <div className="w-3 h-3 rounded-full bg-warning/60" />
              <div className="w-3 h-3 rounded-full bg-success/60" />
              <span className="ml-2 text-xs text-muted-foreground font-mono">embed.html</span>
            </div>
            <pre className="p-6 text-sm font-mono text-muted-foreground overflow-x-auto leading-relaxed">
              <code>{code}</code>
            </pre>
          </motion.div>

          {/* API endpoints */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h3 className="text-xl font-bold mb-6">API REST</h3>
            {endpoints.map((ep) => (
              <div
                key={ep.path}
                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
              >
                <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-mono font-bold min-w-[50px] text-center">
                  {ep.method}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm truncate">{ep.path}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{ep.desc}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
