import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ProductFormDialog } from "@/components/admin/ProductFormDialog";
import { ImportProductDialog } from "@/components/admin/ImportProductDialog";
import { ProductCard } from "@/components/admin/ProductCard";
import { EditProductDialog } from "@/components/admin/EditProductDialog";
import { usePlanLimits } from "@/hooks/usePlanLimits";

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string;
  image_url: string | null;
  sku: string | null;
  price: number | null;
  is_active: boolean;
  tryon_count: number;
  share_count: number;
  tryon_mode: string;
  color_hex: string | null;
  makeup_type: string | null;
  color_rgb: string | null;
  color_tone: string | null;
  skin_tone: string | null;
  undertone: string | null;
  finish: string | null;
  intensity: number | null;
  created_at: string;
  original_url: string | null;
  status: string;
}

const categories = [
  { value: "tops", label: "Blusas & Camisetas" },
  { value: "bottoms", label: "Calças & Saias" },
  { value: "outerwear", label: "Jaquetas & Casacos" },
  { value: "dresses", label: "Vestidos" },
  { value: "accessories", label: "Acessórios" },
  { value: "eyewear", label: "Óculos" },
  { value: "shoes", label: "Sapatos" },
  { value: "makeup", label: "Beleza & Maquiagem" },
  { value: "hair", label: "Cabelo & Barba" },
];

type StatusTab = "all" | "draft" | "published";

export default function AdminProducts() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canAddProduct, remainingProducts, limits } = usePlanLimits();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const fetchProducts = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setProducts((data as any as Product[]) || []);
    setLoadingProducts(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [user]);

  const handleDelete = async (id: string) => {
    await supabase.from("products").delete().eq("id", id);
    setProducts((p) => p.filter((x) => x.id !== id));
    toast({ title: "Produto removido" });
  };

  const handlePublish = async (id: string) => {
    const { error } = await supabase.from("products").update({ status: "published" } as any).eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Produto publicado no provador!" });
      fetchProducts();
    }
  };

  const handleUnpublish = async (id: string) => {
    const { error } = await supabase.from("products").update({ status: "draft" } as any).eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Produto movido para rascunho" });
      fetchProducts();
    }
  };

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === "all" || p.category === filterCategory;
    const matchesStatus = statusTab === "all" || (p.status || "published") === statusTab;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const draftCount = products.filter((p) => (p.status || "published") === "draft").length;
  const publishedCount = products.filter((p) => (p.status || "published") === "published").length;

  if (loading || loadingProducts) {
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black">Produtos</h1>
          <p className="text-muted-foreground">Gerencie seu catálogo com provador inteligente</p>
        </div>
        {user && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {products.length}/{limits.maxProducts === Infinity ? "∞" : limits.maxProducts} produtos
            </span>
            <ImportProductDialog userId={user.id} onSaved={fetchProducts} canAddProduct={canAddProduct} />
            <ProductFormDialog userId={user.id} onSaved={fetchProducts} canAddProduct={canAddProduct} remainingProducts={remainingProducts} />
          </div>
        )}
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1 mb-4 rounded-xl bg-secondary p-1 w-fit">
        {([
          { key: "all" as StatusTab, label: "Todos", count: products.length },
          { key: "draft" as StatusTab, label: "Rascunhos", count: draftCount },
          { key: "published" as StatusTab, label: "Publicados", count: publishedCount },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusTab(tab.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusTab === tab.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs opacity-60">{tab.count}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar produto..." className="pl-9" />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-bold mb-1">
            {statusTab === "draft" ? "Nenhum rascunho" : statusTab === "published" ? "Nenhum produto publicado" : "Nenhum produto"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {statusTab === "draft"
              ? "Importe um produto por link para criar rascunhos."
              : "Adicione ou importe produtos para começar."}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onDelete={handleDelete}
              onEdit={(prod) => setEditProduct(prod as Product)}
              onPublish={handlePublish}
              onUnpublish={handleUnpublish}
            />
          ))}
        </div>
      )}

      {editProduct && user && (
        <EditProductDialog
          product={editProduct}
          userId={user.id}
          open={!!editProduct}
          onOpenChange={(open) => { if (!open) setEditProduct(null); }}
          onSaved={() => { setEditProduct(null); fetchProducts(); }}
        />
      )}
    </AdminLayout>
  );
}
