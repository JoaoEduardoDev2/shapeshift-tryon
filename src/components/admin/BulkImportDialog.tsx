import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Download, Loader2, CheckCircle2, AlertCircle, Store, Globe, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BulkImportDialogProps {
  userId: string;
  onSaved: () => void;
}

type Step = "method" | "api-config" | "scrape-config" | "importing" | "done";

const platforms = [
  { value: "shopify", label: "Shopify", hint: "URL da loja + Access Token" },
  { value: "nuvemshop", label: "Nuvemshop", hint: "Store ID + Token de acesso" },
  { value: "woocommerce", label: "WooCommerce", hint: "URL da loja + consumer_key:consumer_secret" },
  { value: "vtex", label: "VTEX", hint: "URL da loja + appKey:appToken" },
  { value: "tray", label: "Tray", hint: "URL da loja + Access Token" },
];

export function BulkImportDialog({ userId, onSaved }: BulkImportDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("method");

  // API config
  const [platform, setPlatform] = useState("");
  const [storeUrl, setStoreUrl] = useState("");
  const [apiKey, setApiKey] = useState("");

  // Scrape config
  const [scrapeUrl, setScrapeUrl] = useState("");

  // Progress
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");

  // Results
  const [result, setResult] = useState<{ total: number; imported: number; skipped: number; errors: string[] } | null>(null);

  const resetState = () => {
    setStep("method");
    setPlatform("");
    setStoreUrl("");
    setApiKey("");
    setScrapeUrl("");
    setProgress(0);
    setStatusText("");
    setResult(null);
  };

  const startImport = async (method: "api" | "scrape") => {
    setStep("importing");
    setProgress(10);
    setStatusText("Conectando à loja...");

    try {
      setProgress(25);
      setStatusText("Buscando produtos...");

      const body = method === "api"
        ? { platform, store_url: storeUrl, api_key: apiKey }
        : { scrape_url: scrapeUrl };

      setProgress(40);
      setStatusText("Importando catálogo...");

      const { data, error } = await supabase.functions.invoke("bulk-import", { body });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Falha na importação");

      setProgress(100);
      setStatusText("Concluído!");
      setResult(data);
      setStep("done");

      toast({
        title: "Importação concluída!",
        description: `${data.imported} produtos importados, ${data.skipped} ignorados.`,
      });

      onSaved();
    } catch (err: any) {
      toast({ title: "Erro na importação", description: err.message, variant: "destructive" });
      setStep("method");
    }
  };

  const selectedPlatform = platforms.find((p) => p.value === platform);

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetState(); }}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <Download className="w-4 h-4" /> Importar catálogo completo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "method" && "Importar Catálogo Completo"}
            {step === "api-config" && `Conectar ${selectedPlatform?.label || "Loja"}`}
            {step === "scrape-config" && "Importar via URL"}
            {step === "importing" && "Importando..."}
            {step === "done" && "Importação Concluída"}
          </DialogTitle>
        </DialogHeader>

        {/* Step: Choose method */}
        {step === "method" && (
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Importe todos os produtos da sua loja com 1 clique. Escolha o método:
            </p>

            <button
              onClick={() => setStep("api-config")}
              className="w-full rounded-xl border border-border bg-card p-5 text-left hover:border-primary/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Store className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm group-hover:text-primary transition-colors">Via API (recomendado)</p>
                  <p className="text-xs text-muted-foreground">Shopify, Nuvemshop, Tray, WooCommerce, VTEX</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setStep("scrape-config")}
              className="w-full rounded-xl border border-border bg-card p-5 text-left hover:border-primary/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Globe className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-sm group-hover:text-primary transition-colors">Via URL (scraping)</p>
                  <p className="text-xs text-muted-foreground">Qualquer e-commerce — extração automática</p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Step: API config */}
        {step === "api-config" && (
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-xs">Plataforma</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {platforms.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {platform && (
              <>
                <div>
                  <Label className="text-xs">URL da loja</Label>
                  <Input
                    value={storeUrl}
                    onChange={(e) => setStoreUrl(e.target.value)}
                    placeholder={platform === "shopify" ? "minha-loja.myshopify.com" : "https://minhaloja.com"}
                  />
                </div>
                <div>
                  <Label className="text-xs">Chave de API / Token</Label>
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={selectedPlatform?.hint || "Token de acesso"}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">{selectedPlatform?.hint}</p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep("method")} className="flex-1">
                    Voltar
                  </Button>
                  <Button
                    onClick={() => startImport("api")}
                    disabled={!storeUrl.trim() || !apiKey.trim()}
                    className="flex-1"
                  >
                    Importar tudo
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step: Scrape config */}
        {step === "scrape-config" && (
          <div className="space-y-4 mt-4">
            <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-6 text-center">
              <Globe className="w-8 h-8 text-primary mx-auto mb-3" />
              <p className="text-sm font-medium mb-1">Informe a URL da loja</p>
              <p className="text-xs text-muted-foreground mb-4">
                O sistema vai detectar e importar produtos automaticamente via sitemap e páginas de produto.
              </p>
              <Input
                value={scrapeUrl}
                onChange={(e) => setScrapeUrl(e.target.value)}
                placeholder="https://minhaloja.com.br"
                className="text-center"
              />
            </div>

            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                A importação via scraping pode não encontrar todos os produtos. Para melhores resultados, use a integração via API.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("method")} className="flex-1">
                Voltar
              </Button>
              <Button
                onClick={() => startImport("scrape")}
                disabled={!scrapeUrl.trim()}
                className="flex-1"
              >
                Importar via URL
              </Button>
            </div>
          </div>
        )}

        {/* Step: Importing */}
        {step === "importing" && (
          <div className="space-y-6 mt-6 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <div>
              <p className="font-semibold">{statusText}</p>
              <p className="text-xs text-muted-foreground mt-1">Isso pode levar alguns minutos...</p>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">{progress}%</p>
          </div>
        )}

        {/* Step: Done */}
        {step === "done" && result && (
          <div className="space-y-4 mt-4">
            <div className="text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="font-bold text-lg">Importação concluída!</h3>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-secondary p-3">
                <p className="text-2xl font-black">{result.total}</p>
                <p className="text-[10px] text-muted-foreground">Encontrados</p>
              </div>
              <div className="rounded-xl bg-emerald-500/10 p-3">
                <p className="text-2xl font-black text-emerald-600">{result.imported}</p>
                <p className="text-[10px] text-muted-foreground">Importados</p>
              </div>
              <div className="rounded-xl bg-amber-500/10 p-3">
                <p className="text-2xl font-black text-amber-600">{result.skipped}</p>
                <p className="text-[10px] text-muted-foreground">Ignorados</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                <p className="text-xs font-medium text-destructive mb-1 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Erros ({result.errors.length})
                </p>
                <div className="text-[10px] text-muted-foreground space-y-0.5 max-h-24 overflow-y-auto">
                  {result.errors.map((e, i) => (
                    <p key={i}>{e}</p>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Todos os produtos foram salvos como <strong>rascunho</strong>. Teste no provador e publique quando estiver satisfeito.
              </p>
            </div>

            <Button onClick={() => { setOpen(false); resetState(); }} className="w-full">
              Ver produtos importados
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
