import { useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const topProducts = [
  { name: "Vestido Floral", provas: 4520 },
  { name: "Batom Vermelho", provas: 6200 },
  { name: "Óculos Aviador", provas: 3890 },
  { name: "Jaqueta Couro", provas: 2100 },
  { name: "Blush Pêssego", provas: 3400 },
];

const sharesByPlatform = [
  { name: "WhatsApp", value: 460, color: "hsl(142, 76%, 36%)" },
  { name: "Instagram", value: 371, color: "hsl(280, 91%, 65%)" },
  { name: "TikTok", value: 254, color: "hsl(217.2, 91.2%, 59.8%)" },
  { name: "Facebook", value: 154, color: "hsl(38, 92%, 50%)" },
  { name: "Twitter", value: 78, color: "hsl(0, 0%, 60%)" },
];

const tooltipStyle = {
  backgroundColor: "hsl(240, 10%, 6%)",
  border: "1px solid hsl(240, 3.7%, 15.9%)",
  borderRadius: "12px",
  fontSize: 12,
};

export default function AdminAnalytics() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <h1 className="text-3xl font-black mb-1">Analytics</h1>
      <p className="text-muted-foreground mb-8">Métricas detalhadas do seu provador virtual</p>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Top Products */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-bold mb-4">Produtos Mais Provados</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 3.7%, 15.9%)" />
              <XAxis type="number" stroke="hsl(240, 5%, 55%)" fontSize={12} />
              <YAxis type="category" dataKey="name" stroke="hsl(240, 5%, 55%)" fontSize={12} width={120} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="provas" fill="hsl(217.2, 91.2%, 59.8%)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Shares by Platform */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-bold mb-4">Compartilhamentos por Rede</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={sharesByPlatform} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {sharesByPlatform.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Metrics Summary */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Total de Provas (mês)", value: "87,420" },
          { label: "Simulações Compartilhadas", value: "1,317" },
          { label: "Tráfego via Compartilhamento", value: "4,892 visitas" },
        ].map((m) => (
          <div key={m.label} className="rounded-2xl border border-border bg-card p-5 text-center">
            <div className="text-2xl font-bold font-mono">{m.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{m.label}</div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
