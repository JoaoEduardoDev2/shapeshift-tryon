import { useEffect, useState, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Trash2, Upload, Shirt, Palette, Glasses, Watch, Search, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
  created_at: string;
}

const categories = [
  { value: "tops", label: "Blusas & Camisetas", icon: Shirt },
  { value: "bottoms", label: "Calças & Saias", icon: Shirt },
  { value: "outerwear", label: "Jaquetas & Casacos", icon: Shirt },
  { value: "dresses", label: "Vestidos", icon: Shirt },
  { value: "accessories", label: "Acessórios", icon: Watch },
  { value: "eyewear", label: "Óculos", icon: Glasses },
  { value: "makeup", label: "Maquiagem", icon: Palette },
  { value: "hair", label: "Cabelo & Barba", icon: Palette },
];

export default function AdminProducts() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "tops",
    sku: "",
    price: "",
    image_url: "",
  });

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
    setProducts((data as Product[]) || []);
    setLoadingProducts(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
    } else {
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: urlData.publicUrl }));
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user || !form.name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("products").insert({
      user_id: user.id,
      name: form.name,
      description: form.description || null,
      category: form.category,
      sku: form.sku || null,
      price: form.price ? parseFloat(form.price) : null,
      image_url: form.image_url || null,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Produto adicionado!" });
      setForm({ name: "", description: "", category: "tops", sku: "", price: "", image_url: "" });
      setDialogOpen(false);
      fetchProducts();
    }
    setSaving(false);
  };

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
          <p className="text-muted-foreground">Gerencie seu catálogo de roupas, maquiagem e acessórios</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Produto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Nome *</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Camiseta Preta Básica" />
              </div>
              <div>
                <Label>Descrição</Label>
                <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Descrição detalhada para a IA" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Categoria</Label>
                  <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Preço (R$)</Label>
                  <Input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="99.90" />
                </div>
              </div>
              <div>
                <Label>SKU</Label>
                <Input value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} placeholder="SKU-001" />
              </div>
              <div>
                <Label>Imagem</Label>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                {form.image_url ? (
                  <div className="relative mt-2">
                    <img src={form.image_url} alt="Preview" className="w-full h-40 object-contain rounded-xl border border-border bg-secondary" />
                    <Button variant="ghost" size="sm" className="absolute top-1 right-1" onClick={() => setForm((f) => ({ ...f, image_url: "" }))}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" className="w-full mt-1" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? "Enviando..." : "Upload de Imagem"}
                  </Button>
                )}
              </div>
              <Button onClick={handleSave} disabled={saving || !form.name.trim()} className="w-full">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Salvar Produto
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
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

      {/* Products Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-bold mb-1">Nenhum produto</h3>
          <p className="text-sm text-muted-foreground">Adicione seu primeiro produto para começar.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="rounded-2xl border border-border bg-card overflow-hidden group">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="w-full h-40 object-contain bg-secondary" />
              ) : (
                <div className="w-full h-40 bg-secondary flex items-center justify-center">
                  <Shirt className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm">{p.name}</h4>
                    <span className="text-xs text-muted-foreground capitalize">{p.category}</span>
                  </div>
                  {p.price && <span className="text-sm font-mono font-bold">R${p.price}</span>}
                </div>
                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                  <span>{p.tryon_count} provas</span>
                  <span>{p.share_count} shares</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => navigate(`/photo`)}>
                    Provar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
