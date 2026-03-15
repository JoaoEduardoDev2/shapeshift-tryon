import { Navbar } from "@/components/landing/Navbar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Package, Eye, TrendingUp, RotateCcw, Shirt, Palette } from "lucide-react";

const tryOnData = [
  { day: "Seg", provas: 1240 },
  { day: "Ter", provas: 1890 },
  { day: "Qua", provas: 2100 },
  { day: "Qui", provas: 1780 },
  { day: "Sex", provas: 2450 },
  { day: "Sáb", provas: 3200 },
  { day: "Dom", provas: 2800 },
];

const conversionData = [
  { week: "S1", rate: 3.2 },
  { week: "S2", rate: 4.1 },
  { week: "S3", rate: 5.8 },
  { week: "S4", rate: 7.2 },
  { week: "S5", rate: 8.4 },
  { week: "S6", rate: 9.1 },
];

const products = [
  { name: "Vestido Floral", category: "Moda", tryOns: 4520, conversion: 12.3 },
  { name: "Óculos Aviador", category: "Acessório", tryOns: 3890, conversion: 15.7 },
  { name: "Batom Vermelho #42", category: "Beleza", tryOns: 6200, conversion: 18.2 },
  { name: "Jaqueta Couro", category: "Moda", tryOns: 2100, conversion: 9.8 },
  { name: "Blush Pêssego", category: "Beleza", tryOns: 3400, conversion: 14.1 },
];

const stats = [
  { label: "Produtos", value: "248", icon: Package, change: "+12" },
  { label: "Provas Hoje", value: "3,247", icon: Eye, change: "+18%" },
  { label: "Conversão", value: "9.1%", icon: TrendingUp, change: "+2.3%" },
  { label: "Devoluções", value: "-24%", icon: RotateCcw, change: "↓" },
];

export default function Admin() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 px-4 pb-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-black mb-2">
            Painel <span className="text-gradient">Admin</span>
          </h1>
          <p className="text-muted-foreground mb-8">Analytics e gerenciamento de produtos</p>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <s.icon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs font-mono text-success">{s.change}</span>
                </div>
                <div className="text-2xl font-bold font-mono">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-bold mb-4">Provas por Dia</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={tryOnData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 3.7%, 15.9%)" />
                  <XAxis dataKey="day" stroke="hsl(240, 5%, 55%)" fontSize={12} />
                  <YAxis stroke="hsl(240, 5%, 55%)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(240, 10%, 6%)",
                      border: "1px solid hsl(240, 3.7%, 15.9%)",
                      borderRadius: "12px",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="provas" fill="hsl(217.2, 91.2%, 59.8%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-bold mb-4">Taxa de Conversão (%)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={conversionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 3.7%, 15.9%)" />
                  <XAxis dataKey="week" stroke="hsl(240, 5%, 55%)" fontSize={12} />
                  <YAxis stroke="hsl(240, 5%, 55%)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(240, 10%, 6%)",
                      border: "1px solid hsl(240, 3.7%, 15.9%)",
                      borderRadius: "12px",
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="hsl(142, 76%, 36%)"
                    strokeWidth={2}
                    dot={{ fill: "hsl(142, 76%, 36%)", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Products table */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="p-6 border-b border-border">
              <h3 className="font-bold">Produtos Cadastrados</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="px-6 py-3 font-medium">Produto</th>
                    <th className="px-6 py-3 font-medium">Categoria</th>
                    <th className="px-6 py-3 font-medium text-right">Provas</th>
                    <th className="px-6 py-3 font-medium text-right">Conversão</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.name} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4 font-medium flex items-center gap-2">
                        {p.category === "Beleza" ? (
                          <Palette className="w-4 h-4 text-primary" />
                        ) : (
                          <Shirt className="w-4 h-4 text-primary" />
                        )}
                        {p.name}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{p.category}</td>
                      <td className="px-6 py-4 text-right font-mono">{p.tryOns.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-mono text-success">{p.conversion}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
