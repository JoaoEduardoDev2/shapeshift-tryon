import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";
import { Package, Eye, TrendingUp, Share2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { TrialBanner } from "@/components/TrialBanner";

const mockWeekly = [
  { day: "Seg", provas: 1240 },
  { day: "Ter", provas: 1890 },
  { day: "Qua", provas: 2100 },
  { day: "Qui", provas: 1780 },
  { day: "Sex", provas: 2450 },
  { day: "Sáb", provas: 3200 },
  { day: "Dom", provas: 2800 },
];

const mockConversion = [
  { week: "S1", rate: 3.2 },
  { week: "S2", rate: 4.1 },
  { week: "S3", rate: 5.8 },
  { week: "S4", rate: 7.2 },
  { week: "S5", rate: 8.4 },
  { week: "S6", rate: 9.1 },
];

const mockShares = [
  { day: "Seg", whatsapp: 45, instagram: 32, tiktok: 18, facebook: 12 },
  { day: "Ter", whatsapp: 52, instagram: 41, tiktok: 25, facebook: 15 },
  { day: "Qua", whatsapp: 68, instagram: 55, tiktok: 38, facebook: 20 },
  { day: "Qui", whatsapp: 48, instagram: 38, tiktok: 22, facebook: 14 },
  { day: "Sex", whatsapp: 75, instagram: 62, tiktok: 45, facebook: 28 },
  { day: "Sáb", whatsapp: 92, instagram: 78, tiktok: 58, facebook: 35 },
  { day: "Dom", whatsapp: 80, instagram: 65, tiktok: 48, facebook: 30 },
];

const tooltipStyle = {
  backgroundColor: "hsl(240, 10%, 6%)",
  border: "1px solid hsl(240, 3.7%, 15.9%)",
  borderRadius: "12px",
  fontSize: 12,
};

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [productCount, setProductCount] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .then(({ count }) => {
        setProductCount(count || 0);
        setLoadingData(false);
      });
  }, [user]);

  if (loading || loadingData) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const stats = [
    { label: "Produtos", value: productCount.toString(), icon: Package, change: "+12" },
    { label: "Provas Hoje", value: "3,247", icon: Eye, change: "+18%" },
    { label: "Conversão", value: "9.1%", icon: TrendingUp, change: "+2.3%" },
    { label: "Compartilhamentos", value: "460", icon: Share2, change: "+34%" },
  ];

  return (
    <AdminLayout>
      <h1 className="text-3xl font-black mb-1">
        Dashboard
      </h1>
      <p className="text-muted-foreground mb-8">Visão geral da sua loja virtual</p>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <s.icon className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs font-mono text-primary">{s.change}</span>
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
            <BarChart data={mockWeekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 3.7%, 15.9%)" />
              <XAxis dataKey="day" stroke="hsl(240, 5%, 55%)" fontSize={12} />
              <YAxis stroke="hsl(240, 5%, 55%)" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="provas" fill="hsl(217.2, 91.2%, 59.8%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-bold mb-4">Taxa de Conversão (%)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={mockConversion}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 3.7%, 15.9%)" />
              <XAxis dataKey="week" stroke="hsl(240, 5%, 55%)" fontSize={12} />
              <YAxis stroke="hsl(240, 5%, 55%)" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="rate" stroke="hsl(142, 76%, 36%)" strokeWidth={2} dot={{ fill: "hsl(142, 76%, 36%)", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Shares chart */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-bold mb-4">Compartilhamentos por Rede Social</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={mockShares}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 3.7%, 15.9%)" />
            <XAxis dataKey="day" stroke="hsl(240, 5%, 55%)" fontSize={12} />
            <YAxis stroke="hsl(240, 5%, 55%)" fontSize={12} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="whatsapp" stackId="1" fill="hsl(142, 76%, 36%)" stroke="hsl(142, 76%, 36%)" fillOpacity={0.3} />
            <Area type="monotone" dataKey="instagram" stackId="1" fill="hsl(280, 91%, 65%)" stroke="hsl(280, 91%, 65%)" fillOpacity={0.3} />
            <Area type="monotone" dataKey="tiktok" stackId="1" fill="hsl(217.2, 91.2%, 59.8%)" stroke="hsl(217.2, 91.2%, 59.8%)" fillOpacity={0.3} />
            <Area type="monotone" dataKey="facebook" stackId="1" fill="hsl(38, 92%, 50%)" stroke="hsl(38, 92%, 50%)" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </AdminLayout>
  );
}
