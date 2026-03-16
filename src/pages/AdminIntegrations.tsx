import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Check, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const platforms = [
  { name: "Shopify", logo: "🟢", status: "available", region: "Global" },
  { name: "WooCommerce", logo: "🟣", status: "available", region: "Global" },
  { name: "Magento", logo: "🟠", status: "available", region: "Global" },
  { name: "VTEX", logo: "🔴", status: "available", region: "Global" },
  { name: "BigCommerce", logo: "🔵", status: "coming", region: "Global" },
  { name: "Wix", logo: "⚫", status: "coming", region: "Global" },
  { name: "Squarespace", logo: "⬛", status: "coming", region: "Global" },
  { name: "Nuvemshop", logo: "💙", status: "available", region: "Brasil" },
  { name: "Tray", logo: "🧡", status: "available", region: "Brasil" },
  { name: "Loja Integrada", logo: "💚", status: "coming", region: "Brasil" },
  { name: "Yampi", logo: "💜", status: "coming", region: "Brasil" },
  { name: "Cartpanda", logo: "🐼", status: "coming", region: "Brasil" },
  { name: "Bagy", logo: "🛍️", status: "coming", region: "Brasil" },
];

const socialCommerce = [
  { name: "TikTok Shop", logo: "🎵", status: "coming" },
  { name: "Instagram Shop", logo: "📸", status: "coming" },
  { name: "Facebook Shop", logo: "📘", status: "coming" },
  { name: "Pinterest Shopping", logo: "📌", status: "coming" },
];

export default function AdminIntegrations() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const embedScript = `<!-- AI Virtual Fit - Provador Virtual -->
<script>
  window.VTO_CONFIG = {
    apiKey: 'pk_live_${user?.id?.slice(0, 8) || "xxxxxxxx"}',
    theme: 'auto',
    position: 'bottom-right'
  };
</script>
<script src="https://cdn.virtualfit.app/v1/widget.js" async></script>`;

  const copyScript = () => {
    navigator.clipboard.writeText(embedScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Script copiado!" });
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-black mb-1">Integrações</h1>
      <p className="text-muted-foreground mb-8">Conecte sua loja e instale o provador virtual</p>

      {/* Embed Script */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden mb-8">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-bold">Script de Instalação</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Cole no HTML do seu site para adicionar o botão "Provar Agora" automaticamente
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={copyScript}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copiado" : "Copiar"}
          </Button>
        </div>
        <pre className="p-6 text-sm font-mono text-muted-foreground overflow-x-auto leading-relaxed bg-secondary/30">
          <code>{embedScript}</code>
        </pre>
      </div>

      {/* E-commerce Platforms */}
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4">Plataformas de E-commerce</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {platforms.map((p) => (
            <div key={p.name} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{p.logo}</span>
                <div>
                  <h4 className="font-medium text-sm">{p.name}</h4>
                  <span className="text-xs text-muted-foreground">{p.region}</span>
                </div>
              </div>
              {p.status === "available" ? (
                <Button size="sm" variant="outline">
                  <ExternalLink className="w-3 h-3" />
                  Conectar
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground px-3 py-1 rounded-full bg-secondary">Em breve</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Social Commerce */}
      <div>
        <h3 className="text-xl font-bold mb-4">Social Commerce</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {socialCommerce.map((p) => (
            <div key={p.name} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
              <span className="text-2xl">{p.logo}</span>
              <div>
                <h4 className="font-medium text-sm">{p.name}</h4>
                <span className="text-xs text-muted-foreground">Em breve</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
