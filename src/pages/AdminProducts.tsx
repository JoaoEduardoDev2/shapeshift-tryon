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
import { ProductCard } from "@/components/admin/ProductCard";
import { EditProductDialog } from "@/components/admin/EditProductDialog";

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

export default function AdminProducts() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
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

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === "all" || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

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
        {user && <ProductFormDialog userId={user.id} onSaved={fetchProducts} />}
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
          <h3 className="font-bold mb-1">Nenhum produto</h3>
          <p className="text-sm text-muted-foreground">Adicione seu primeiro produto para começar.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} onDelete={handleDelete} onEdit={(prod) => setEditProduct(prod as Product)} />
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
