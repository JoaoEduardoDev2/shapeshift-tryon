import { Button } from "@/components/ui/button";
import { Trash2, Shirt, Camera, Image, RefreshCw, Pencil, Globe, FileText, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

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
  original_url?: string | null;
  status?: string;
}

const tryonIcons: Record<string, { icon: typeof Camera; label: string }> = {
  photo: { icon: Image, label: "📷 Foto" },
  mirror: { icon: Camera, label: "🎥 Espelho" },
  both: { icon: RefreshCw, label: "🔄 Ambos" },
};

interface ProductCardProps {
  product: Product;
  onDelete: (id: string) => void;
  onEdit?: (product: Product) => void;
  onPublish?: (id: string) => void;
  onUnpublish?: (id: string) => void;
}

export function ProductCard({ product, onDelete, onEdit, onPublish, onUnpublish }: ProductCardProps) {
  const navigate = useNavigate();
  const [choiceOpen, setChoiceOpen] = useState(false);
  const tryonInfo = tryonIcons[product.tryon_mode] || tryonIcons.both;
  const isDraft = (product.status || "published") === "draft";

  const handleTryOn = () => {
    const params = `?product=${product.id}`;
    if (product.tryon_mode === "photo") {
      navigate(`/photo${params}`);
    } else if (product.tryon_mode === "mirror") {
      navigate(`/mirror${params}`);
    } else {
      setChoiceOpen(true);
    }
  };

  return (
    <>
      <div className={`rounded-2xl border bg-card overflow-hidden group ${isDraft ? "border-amber-500/30" : "border-border"}`}>
        {/* Status badge */}
        <div className="relative">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-40 object-contain bg-secondary" />
          ) : (
            <div className="w-full h-40 bg-secondary flex items-center justify-center">
              <Shirt className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          <div className="absolute top-2 left-2 flex gap-1.5">
            {isDraft ? (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px]">
                <FileText className="w-3 h-3 mr-0.5" /> Rascunho
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]">
                <Globe className="w-3 h-3 mr-0.5" /> Publicado
              </Badge>
            )}
          </div>
          {product.original_url && (
            <a
              href={product.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
            >
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </a>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-bold text-sm">{product.name}</h4>
              <span className="text-xs text-muted-foreground capitalize">{product.category}</span>
              {product.color_hex && (
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: product.color_hex }} />
                  <span className="text-[10px] text-muted-foreground">{product.color_hex}</span>
                </div>
              )}
            </div>
            <div className="text-right">
              {product.price && <span className="text-sm font-mono font-bold">R${product.price}</span>}
              <div className="text-[10px] text-muted-foreground mt-1">{tryonInfo.label}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            <span>{product.tryon_count} provas</span>
            <span>{product.share_count} shares</span>
          </div>
          <div className="flex gap-2 mt-3">
            {isDraft ? (
              <>
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={handleTryOn}>
                  Testar
                </Button>
                {onPublish && (
                  <Button size="sm" className="flex-1 text-xs" onClick={() => onPublish(product.id)}>
                    Publicar
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={handleTryOn}>
                  Provar
                </Button>
                {onUnpublish && (
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => onUnpublish(product.id)}>
                    Despublicar
                  </Button>
                )}
              </>
            )}
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={() => onEdit(product)}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => onDelete(product.id)}>
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={choiceOpen} onOpenChange={setChoiceOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Como deseja provar?</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            <Button onClick={() => { setChoiceOpen(false); navigate(`/photo?product=${product.id}`); }} className="w-full">
              <Image className="w-4 h-4" /> Provar com Foto
            </Button>
            <Button variant="outline" onClick={() => { setChoiceOpen(false); navigate(`/mirror?product=${product.id}`); }} className="w-full">
              <Camera className="w-4 h-4" /> Provar com Câmera
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
