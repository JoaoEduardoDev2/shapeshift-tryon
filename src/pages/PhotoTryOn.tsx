import { useState, useRef, useCallback } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { Upload, ImagePlus, Loader2, Scan, Shirt, Sparkles, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SharePanel } from "@/components/SharePanel";

import blackTshirt from "@/assets/garments/black-tshirt.png";
import whiteTshirt from "@/assets/garments/white-tshirt.png";
import denimJacket from "@/assets/garments/denim-jacket.png";
import redDress from "@/assets/garments/red-dress.png";
import blueJeans from "@/assets/garments/blue-jeans.png";
import blackSkirt from "@/assets/garments/black-skirt.png";
import beigeCoat from "@/assets/garments/beige-coat.png";
import grayHoodie from "@/assets/garments/gray-hoodie.png";
import navyPolo from "@/assets/garments/navy-polo.png";
import blackBlazer from "@/assets/garments/black-blazer.png";
import greenBomber from "@/assets/garments/green-bomber.png";
import floralDress from "@/assets/garments/floral-dress.png";
import khakiChinos from "@/assets/garments/khaki-chinos.png";
import stripedBreton from "@/assets/garments/striped-breton.png";
import pinkBlouse from "@/assets/garments/pink-blouse.png";
import leatherJacket from "@/assets/garments/leather-jacket.png";
import whiteCargo from "@/assets/garments/white-cargo.png";
import greenGown from "@/assets/garments/green-gown.png";

type GarmentCategory = "tops" | "bottoms" | "outerwear" | "dresses";

interface Garment {
  id: number;
  name: string;
  description: string;
  image: string;
  category: GarmentCategory;
}

const garments: Garment[] = [
  // Tops
  { id: 0, name: "Camiseta Preta", description: "A plain black crew neck cotton t-shirt, casual fit, short sleeves", image: blackTshirt, category: "tops" },
  { id: 1, name: "Camiseta Branca", description: "A plain white crew neck cotton t-shirt, casual fit, short sleeves", image: whiteTshirt, category: "tops" },
  { id: 4, name: "Polo Azul Marinho", description: "A classic navy blue polo shirt with collar and buttons, slim fit", image: navyPolo, category: "tops" },
  { id: 7, name: "Hoodie Cinza", description: "A comfortable gray hoodie sweatshirt with kangaroo pocket, relaxed fit", image: grayHoodie, category: "tops" },
  { id: 12, name: "Blusa Listrada", description: "A navy and white striped breton long-sleeve top, classic French style", image: stripedBreton, category: "tops" },
  { id: 13, name: "Blusa Rosa", description: "A pink linen blouse with bow detail and ruffled sleeves, feminine cut", image: pinkBlouse, category: "tops" },
  // Bottoms
  { id: 5, name: "Calça Jeans", description: "Classic blue straight-fit denim jeans pants", image: blueJeans, category: "bottoms" },
  { id: 6, name: "Saia Preta", description: "An elegant black pleated midi skirt, flowing fabric", image: blackSkirt, category: "bottoms" },
  { id: 14, name: "Chino Khaki", description: "Khaki beige chino pants, slim fit, casual smart style", image: khakiChinos, category: "bottoms" },
  { id: 15, name: "Cargo Branca", description: "White cargo pants with side pockets, relaxed streetwear fit", image: whiteCargo, category: "bottoms" },
  // Outerwear
  { id: 2, name: "Jaqueta Jeans", description: "A classic blue denim jacket with metal buttons, collar, and front pockets", image: denimJacket, category: "outerwear" },
  { id: 8, name: "Blazer Preto", description: "A tailored black formal blazer jacket, slim fit, single button", image: blackBlazer, category: "outerwear" },
  { id: 9, name: "Bomber Verde", description: "A military green bomber jacket with zipper and ribbed cuffs", image: greenBomber, category: "outerwear" },
  { id: 10, name: "Trench Coat Bege", description: "A classic beige trench coat, long, double-breasted with belt", image: beigeCoat, category: "outerwear" },
  { id: 16, name: "Jaqueta de Couro", description: "A camel brown leather biker jacket with asymmetric zipper and metal details", image: leatherJacket, category: "outerwear" },
  // Dresses
  { id: 3, name: "Vestido Vermelho", description: "An elegant red midi cocktail dress with spaghetti straps and flowing fabric", image: redDress, category: "dresses" },
  { id: 11, name: "Vestido Floral", description: "A light colorful floral summer dress, sleeveless, A-line silhouette", image: floralDress, category: "dresses" },
  { id: 17, name: "Vestido Esmeralda", description: "An elegant emerald green sleeveless evening gown with cinched waist and flowing skirt", image: greenGown, category: "dresses" },
];

const categoryLabels: Record<GarmentCategory, string> = {
  tops: "Blusas & Camisetas",
  bottoms: "Calças & Saias",
  outerwear: "Jaquetas & Casacos",
  dresses: "Vestidos",
};

export default function PhotoTryOn() {
  const [userImage, setUserImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [selectedGarment, setSelectedGarment] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<GarmentCategory>("tops");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Envie uma imagem de até 4MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUserImage(ev.target?.result as string);
      setResultImage(null);
      setSelectedGarment(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const applyGarment = async (garmentId: number) => {
    if (!userImage) return;
    setSelectedGarment(garmentId);
    setProcessing(true);
    setError(null);
    setResultImage(null);
    const garment = garments.find((g) => g.id === garmentId)!;

    try {
      setProcessingStep("Analisando corpo e pose...");
      await new Promise((r) => setTimeout(r, 500));
      setProcessingStep("Aplicando roupa com IA...");

      const { data, error: fnError } = await supabase.functions.invoke("virtual-tryon", {
        body: { userImageBase64: userImage, garmentName: garment.name, garmentDescription: garment.description },
      });

      if (fnError) throw new Error(fnError.message || "Erro ao processar");
      if (data?.error) throw new Error(data.error);
      if (data?.image) {
        setResultImage(data.image);
        setProcessingStep("");
        toast({ title: "Prova virtual concluída!", description: `${garment.name} aplicada com sucesso.` });
      } else {
        throw new Error("A IA não gerou uma imagem. Tente novamente.");
      }
    } catch (err: any) {
      console.error("Try-on error:", err);
      const msg = err?.message || "Erro desconhecido";
      setError(msg);
      toast({ title: "Erro no provador", description: msg, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const displayImage = resultImage || userImage;
  const filteredGarments = garments.filter((g) => g.category === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 px-4 pb-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-black mb-2">
            Provador por <span className="text-gradient">Foto</span>
          </h1>
          <p className="text-muted-foreground mb-6">Envie uma foto e a IA aplica a roupa de forma realista</p>

          <div className="grid lg:grid-cols-[1fr_360px] gap-6">
            {/* Main area */}
            <div className="relative min-h-[500px] rounded-2xl border border-border bg-card overflow-hidden flex items-center justify-center">
              {!userImage && (
                <div className="text-center p-8">
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-border flex items-center justify-center mx-auto mb-4">
                    <ImagePlus className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm mb-4">Envie uma foto de corpo inteiro</p>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <Button variant="hero" size="lg" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-5 h-5" />
                    Enviar Foto
                  </Button>
                </div>
              )}

              {displayImage && (
                <img src={displayImage} alt="Try-on result" className="max-w-full max-h-[600px] object-contain" />
              )}

              {resultImage && (
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="text-xs font-mono glass px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-primary" />
                    GERADO POR IA
                  </span>
                </div>
              )}

              {processing && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  <div className="text-sm font-mono text-primary">{processingStep}</div>
                  <p className="text-xs text-muted-foreground max-w-xs text-center">
                    A IA está analisando sua foto e aplicando a roupa. Isso pode levar alguns segundos.
                  </p>
                  <div className="w-48 h-1 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: "60%" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Side panel */}
            <div className="space-y-4">
              {userImage && (
                <>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4" />
                    Trocar Foto
                  </Button>
                </>
              )}

              {error && (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  <p className="text-xs text-destructive">{error}</p>
                </div>
              )}

              {/* Category tabs */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Shirt className="w-4 h-4 text-primary" />
                  Catálogo de Roupas
                </h3>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {(Object.keys(categoryLabels) as GarmentCategory[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        activeCategory === cat
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {categoryLabels[cat]}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
                  {filteredGarments.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => applyGarment(g.id)}
                      disabled={!userImage || processing}
                      className={`rounded-xl border text-center p-3 transition-all disabled:opacity-30 ${
                        selectedGarment === g.id
                          ? "border-primary/50 bg-primary/5"
                          : "border-border hover:border-primary/20 hover:bg-secondary/50"
                      }`}
                    >
                      <img src={g.image} alt={g.name} className="w-full aspect-square object-contain mb-2 rounded-lg" />
                      <span className="text-xs font-medium">{g.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pipeline */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <h4 className="text-xs font-mono text-muted-foreground mb-3">PIPELINE IA</h4>
                <div className="space-y-2.5 text-xs text-muted-foreground">
                  {[
                    { step: "1. Upload da foto", done: !!userImage },
                    { step: "2. Selecionar roupa", done: selectedGarment !== null },
                    { step: "3. Análise de corpo e pose", done: !!resultImage },
                    { step: "4. Deformação e iluminação", done: !!resultImage },
                    { step: "5. Renderização final", done: !!resultImage },
                  ].map((s) => (
                    <div key={s.step} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${s.done ? "bg-success" : "bg-muted"}`} />
                      <span className={s.done ? "text-foreground" : ""}>{s.step}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <Sparkles className="w-3 h-3 text-primary inline mr-1" />
                  Usando <strong className="text-foreground">Gemini AI</strong> para análise de corpo, 
                  deformação de roupa e ajuste de iluminação. Suas fotos são processadas em memória 
                  e nunca armazenadas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
