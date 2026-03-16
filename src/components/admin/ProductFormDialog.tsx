import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2, Trash2, Upload, Camera, Image, RefreshCw, Pipette } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

const makeupTypes = [
  { value: "lipstick", label: "Batom" },
  { value: "foundation", label: "Base" },
  { value: "blush", label: "Blush" },
  { value: "eyeshadow", label: "Sombra" },
  { value: "eyeliner", label: "Delineador" },
  { value: "concealer", label: "Corretivo" },
];

const finishOptions = [
  { value: "matte", label: "Matte" },
  { value: "brilho", label: "Brilho" },
  { value: "acetinado", label: "Acetinado" },
  { value: "metalico", label: "Metálico" },
  { value: "cremoso", label: "Cremoso" },
];

const defaultTryonMode = (category: string): string => {
  switch (category) {
    case "eyewear":
    case "makeup":
      return "mirror";
    case "shoes":
      return "photo";
    default:
      return "both";
  }
};

interface ProductFormDialogProps {
  userId: string;
  onSaved: () => void;
}

export function ProductFormDialog({ userId, onSaved }: ProductFormDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "tops",
    sku: "",
    price: "",
    image_url: "",
    tryon_mode: "both",
    makeup_type: "",
    color_hex: "",
    color_rgb: "",
    color_tone: "",
    skin_tone: "",
    undertone: "",
    finish: "",
    intensity: 80,
  });

  const isMakeup = form.category === "makeup";
  const isFoundation = form.makeup_type === "foundation" || form.makeup_type === "concealer";

  const handleCategoryChange = (v: string) => {
    setForm((f) => ({ ...f, category: v, tryon_mode: defaultTryonMode(v) }));
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
      setForm((f) => ({ ...f, image_url: urlData.publicUrl }));
    }
    setUploading(false);
  };

  const handleDetectColor = async () => {
    if (!form.image_url) return;
    setDetecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("detect-color", {
        body: { image_url: form.image_url },
      });
      if (error) throw error;
      setForm((f) => ({
        ...f,
        color_hex: data.color_hex || f.color_hex,
        color_rgb: data.color_rgb || f.color_rgb,
        color_tone: data.color_tone || f.color_tone,
        skin_tone: data.skin_tone || f.skin_tone,
        undertone: data.undertone || f.undertone,
        finish: data.finish || f.finish,
      }));
      toast({ title: "Cor detectada!", description: `${data.color_tone} (${data.color_hex})` });
    } catch (err: any) {
      toast({ title: "Erro na detecção", description: err.message, variant: "destructive" });
    }
    setDetecting(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("products").insert({
      user_id: userId,
      name: form.name,
      description: form.description || null,
      category: form.category,
      sku: form.sku || null,
      price: form.price ? parseFloat(form.price) : null,
      image_url: form.image_url || null,
      tryon_mode: form.tryon_mode,
      makeup_type: isMakeup ? form.makeup_type || null : null,
      color_hex: form.color_hex || null,
      color_rgb: form.color_rgb || null,
      color_tone: form.color_tone || null,
      skin_tone: isFoundation ? form.skin_tone || null : null,
      undertone: isFoundation ? form.undertone || null : null,
      finish: isMakeup ? form.finish || null : null,
      intensity: isMakeup ? form.intensity : 80,
    } as any);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Produto adicionado!" });
      setForm({
        name: "", description: "", category: "tops", sku: "", price: "", image_url: "",
        tryon_mode: "both", makeup_type: "", color_hex: "", color_rgb: "", color_tone: "",
        skin_tone: "", undertone: "", finish: "",
      });
      setOpen(false);
      onSaved();
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="w-4 h-4" /> Novo Produto</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Produto</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {/* Name */}
          <div>
            <Label>Nome *</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Camiseta Preta Básica" />
          </div>

          {/* Description */}
          <div>
            <Label>Descrição</Label>
            <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Descrição detalhada para a IA" />
          </div>

          {/* Category + Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={handleCategoryChange}>
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

          {/* SKU */}
          <div>
            <Label>SKU</Label>
            <Input value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} placeholder="SKU-001" />
          </div>

          {/* Tryon Mode */}
          <div className="rounded-xl border border-border p-4 bg-secondary/30">
            <Label className="text-sm font-bold mb-2 block">Tipo de Provador</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "photo", label: "Foto", icon: Image, desc: "Enviar foto" },
                { value: "mirror", label: "Espelho", icon: Camera, desc: "Câmera ao vivo" },
                { value: "both", label: "Ambos", icon: RefreshCw, desc: "Foto + câmera" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, tryon_mode: opt.value }))}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs transition-all ${
                    form.tryon_mode === opt.value
                      ? "border-primary bg-primary/10 text-primary font-bold"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <opt.icon className="w-5 h-5" />
                  <span>{opt.label}</span>
                  <span className="text-[10px] opacity-70">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Image */}
          <div>
            <Label>Imagem</Label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            {form.image_url ? (
              <div className="relative mt-2">
                <img src={form.image_url} alt="Preview" className="w-full h-40 object-contain rounded-xl border border-border bg-secondary" />
                <Button variant="ghost" size="sm" className="absolute top-1 right-1" onClick={() => setForm((f) => ({ ...f, image_url: "" }))}>
                  <Trash2 className="w-3 h-3" />
                </Button>
                {isMakeup && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute bottom-2 right-2"
                    onClick={handleDetectColor}
                    disabled={detecting}
                  >
                    {detecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Pipette className="w-3 h-3" />}
                    {detecting ? "Detectando..." : "Detectar Cor"}
                  </Button>
                )}
              </div>
            ) : (
              <Button variant="outline" className="w-full mt-1" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? "Enviando..." : "Upload de Imagem"}
              </Button>
            )}
          </div>

          {/* Makeup-specific fields */}
          {isMakeup && (
            <div className="rounded-xl border border-border p-4 bg-accent/10 space-y-3">
              <Label className="text-sm font-bold block">🎨 Dados de Maquiagem</Label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Tipo</Label>
                  <Select value={form.makeup_type} onValueChange={(v) => setForm((f) => ({ ...f, makeup_type: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {makeupTypes.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Acabamento</Label>
                  <Select value={form.finish} onValueChange={(v) => setForm((f) => ({ ...f, finish: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {finishOptions.map((f) => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Color fields */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Cor HEX</Label>
                  <div className="flex gap-1 items-center">
                    {form.color_hex && (
                      <div className="w-6 h-6 rounded-full border border-border shrink-0" style={{ backgroundColor: form.color_hex }} />
                    )}
                    <Input value={form.color_hex} onChange={(e) => setForm((f) => ({ ...f, color_hex: e.target.value }))} placeholder="#D94A64" className="text-xs" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">RGB</Label>
                  <Input value={form.color_rgb} onChange={(e) => setForm((f) => ({ ...f, color_rgb: e.target.value }))} placeholder="217, 74, 100" className="text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Tom</Label>
                  <Input value={form.color_tone} onChange={(e) => setForm((f) => ({ ...f, color_tone: e.target.value }))} placeholder="vermelho rosado" className="text-xs" />
                </div>
              </div>

              {/* Foundation-specific */}
              {isFoundation && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Tom de Pele</Label>
                    <Select value={form.skin_tone} onValueChange={(v) => setForm((f) => ({ ...f, skin_tone: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="claro">Claro</SelectItem>
                        <SelectItem value="medio">Médio</SelectItem>
                        <SelectItem value="bronze">Bronze</SelectItem>
                        <SelectItem value="escuro">Escuro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Subtom</Label>
                    <Select value={form.undertone} onValueChange={(v) => setForm((f) => ({ ...f, undertone: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quente">Quente</SelectItem>
                        <SelectItem value="frio">Frio</SelectItem>
                        <SelectItem value="neutro">Neutro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          )}

          <Button onClick={handleSave} disabled={saving || !form.name.trim()} className="w-full">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Salvar Produto
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
