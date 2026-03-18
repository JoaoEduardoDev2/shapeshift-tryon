import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link, Loader2, CheckCircle2, AlertCircle, ImageIcon, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRef } from "react";

interface ImportProductDialogProps {
  userId: string;
  onSaved: () => void;
  canAddProduct?: boolean;
}

export function ImportProductDialog({ userId, onSaved, canAddProduct = true }: ImportProductDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<"input" | "preview" | "editing">("input");
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [product, setProduct] = useState<{
    name: string;
    description: string;
    price: number | null;
    images: string[];
    category: string;
    sizes: string[];
    colors: string[];
    platform: string;
    original_url: string;
  } | null>(null);

  const [customImage, setCustomImage] = useState<string>("");

  const handleImport = async () => {
    if (!url.trim()) return;
    console.log("[ImportProduct] iniciando importação →", url.trim());
    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-product", {
        body: { url: url.trim() },
      });
      console.log("[ImportProduct] resposta da função:", { data, error });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Falha ao importar");

      console.log("[ImportProduct] produto extraído:", data.product);
      setProduct(data.product);
      setCustomImage(data.product.images?.[0] || "");
      setStep("preview");
      toast({ title: "Produto importado!", description: `${data.product.name} encontrado via ${data.product.platform || "web"}` });
    } catch (err: any) {
      toast({ title: "Erro na importação", description: err.message, variant: "destructive" });
    }
    setImporting(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
    } else {
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      setCustomImage(urlData.publicUrl);
    }
    setUploading(false);
  };

  const mapCategory = (cat: string): string => {
    const lower = (cat || "").toLowerCase();
    if (lower.includes("camiseta") || lower.includes("blusa") || lower.includes("top") || lower.includes("shirt")) return "tops";
    if (lower.includes("calça") || lower.includes("saia") || lower.includes("short") || lower.includes("pant")) return "bottoms";
    if (lower.includes("jaqueta") || lower.includes("casaco") || lower.includes("jacket") || lower.includes("coat")) return "outerwear";
    if (lower.includes("vestido") || lower.includes("dress")) return "dresses";
    if (lower.includes("óculos") || lower.includes("glasses") || lower.includes("sunglasses")) return "eyewear";
    if (lower.includes("sapato") || lower.includes("tênis") || lower.includes("shoe") || lower.includes("boot")) return "shoes";
    if (lower.includes("maquiagem") || lower.includes("makeup") || lower.includes("batom") || lower.includes("cosmetic")) return "makeup";
    if (lower.includes("acessório") || lower.includes("accessory") || lower.includes("bijuteria") || lower.includes("jewelry")) return "accessories";
    return "tops";
  };

  const handleSaveAsDraft = async () => {
    if (!product) return;
    setSaving(true);
    try {
      const mappedCategory = mapCategory(product.category);
      console.log("[ImportProduct] salvando no banco →", { name: product.name, category: mappedCategory, image: customImage || product.images?.[0] });
      const { error } = await supabase.from("products").insert({
        user_id: userId,
        name: product.name,
        description: product.description || null,
        category: mappedCategory,
        price: product.price,
        image_url: customImage || product.images?.[0] || null,
        sizes: product.sizes || [],
        colors: product.colors || [],
        original_url: product.original_url,
        imported_images: product.images || [],
        custom_images: customImage && customImage !== product.images?.[0] ? [customImage] : [],
        sync_enabled: false,
        status: "draft",
        tryon_mode: mappedCategory === "eyewear" || mappedCategory === "makeup" ? "mirror" : "both",
      } as any);
      if (error) throw error;

      toast({ title: "Produto salvo como rascunho!", description: "Teste no provador antes de publicar." });
      resetState();
      setOpen(false);
      onSaved();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const resetState = () => {
    setUrl("");
    setProduct(null);
    setCustomImage("");
    setStep("input");
  };

  const platformLabels: Record<string, string> = {
    shopify: "Shopify",
    nuvemshop: "Nuvemshop",
    tray: "Tray",
    woocommerce: "WooCommerce",
    vtex: "VTEX",
    unknown: "Web",
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetState(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={!canAddProduct}>
          <Link className="w-4 h-4" /> Importar por Link
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "input" ? "Importar Produto" : step === "preview" ? "Pré-visualização" : "Editar Imagem"}
          </DialogTitle>
        </DialogHeader>

        {step === "input" && (
          <div className="space-y-4 mt-4">
            <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-6 text-center">
              <Link className="w-8 h-8 text-primary mx-auto mb-3" />
              <p className="text-sm font-medium mb-1">Cole o link do produto</p>
              <p className="text-xs text-muted-foreground mb-4">
                Suportamos Shopify, Nuvemshop, Tray, WooCommerce, VTEX e qualquer e-commerce
              </p>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://loja.com/produto/camiseta-x"
                className="text-center"
                onKeyDown={(e) => e.key === "Enter" && handleImport()}
              />
            </div>
            <Button onClick={handleImport} disabled={importing || !url.trim()} className="w-full">
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Importando...
                </>
              ) : (
                "Importar Produto"
              )}
            </Button>
          </div>
        )}

        {step === "preview" && product && (
          <div className="space-y-4 mt-4">
            {/* Platform badge */}
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-xs font-medium text-green-600">
                Importado via {platformLabels[product.platform] || "Web"}
              </span>
            </div>

            {/* Image preview & editing */}
            <div className="relative rounded-xl border border-border bg-secondary overflow-hidden">
              {customImage ? (
                <img src={customImage} alt={product.name} className="w-full h-48 object-contain" />
              ) : (
                <div className="w-full h-48 flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              <div className="absolute bottom-2 right-2 flex gap-1.5">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  Substituir
                </Button>
                {customImage && customImage !== product.images?.[0] && (
                  <Button variant="ghost" size="sm" onClick={() => setCustomImage(product.images?.[0] || "")}>
                    Restaurar
                  </Button>
                )}
              </div>
            </div>

            {/* Imported images gallery */}
            {product.images.length > 1 && (
              <div>
                <Label className="text-xs mb-2 block">Imagens importadas ({product.images.length})</Label>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setCustomImage(img)}
                      className={`shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden transition-all ${
                        customImage === img ? "border-primary" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <img src={img} alt={`Img ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Product info */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Nome</Label>
                <Input
                  value={product.name}
                  onChange={(e) => setProduct({ ...product, name: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Descrição</Label>
                <Input
                  value={product.description}
                  onChange={(e) => setProduct({ ...product, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Preço (R$)</Label>
                  <Input
                    type="number"
                    value={product.price ?? ""}
                    onChange={(e) => setProduct({ ...product, price: e.target.value ? parseFloat(e.target.value) : null })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Categoria detectada</Label>
                  <Input value={product.category || "Não detectada"} readOnly className="bg-muted" />
                </div>
              </div>

              {product.sizes.length > 0 && (
                <div>
                  <Label className="text-xs">Tamanhos</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.sizes.map((s) => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary border border-border">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {product.colors.length > 0 && (
                <div>
                  <Label className="text-xs">Cores</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.colors.map((c) => (
                      <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary border border-border">{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Info box */}
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-0.5">Salvo como Rascunho</p>
                <p>O produto será salvo como rascunho. Teste no provador virtual antes de publicar. Alterações de imagem valem apenas no simulador.</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setStep("input"); setProduct(null); }} className="flex-1">
                Voltar
              </Button>
              <Button onClick={handleSaveAsDraft} disabled={saving || !product.name.trim()} className="flex-1">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Salvar como Rascunho
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
