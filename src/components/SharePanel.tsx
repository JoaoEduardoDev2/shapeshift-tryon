import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share2, Copy, Check, MessageCircle, Instagram, Facebook, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { usePlanLimits } from "@/hooks/usePlanLimits";

interface SharePanelProps {
  imageBase64: string;
  garmentName: string;
  garmentDescription?: string;
  mode?: "photo" | "mirror";
}

export function SharePanel({ imageBase64, garmentName, garmentDescription, mode = "photo" }: SharePanelProps) {
  const [saving, setSaving] = useState(false);
  const [savedLookId, setSavedLookId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const downloadImage = () => {
    const link = document.createElement("a");
    link.href = imageBase64;
    link.download = `virtualfit-${garmentName.replace(/\s/g, "-")}.png`;
    link.click();
    toast({ title: "Download iniciado!" });
  };

  const saveLook = async () => {
    if (!user) {
      toast({ title: "Faça login para salvar", description: "Crie uma conta para salvar e compartilhar looks.", variant: "destructive" });
      navigate("/auth");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.from("saved_looks").insert({
        user_id: user.id,
        image_base64: imageBase64,
        garment_name: garmentName,
        garment_description: garmentDescription || null,
        mode,
      }).select("id").single();
      if (error) throw error;
      setSavedLookId(data.id);
      toast({ title: "Look salvo!", description: "Agora você pode compartilhar." });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const lookUrl = savedLookId ? `${window.location.origin}/look/${savedLookId}` : null;

  const copyLink = async () => {
    if (!lookUrl) return;
    await navigator.clipboard.writeText(lookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link copiado!" });
  };

  const shareWhatsApp = () => {
    const text = `Olha como fiquei com ${garmentName}! Prove você também: ${lookUrl || window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(lookUrl || window.location.href)}`, "_blank");
  };

  const shareTwitter = () => {
    const text = `Experimentei ${garmentName} no provador virtual AI Virtual Fit! 🔥`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(lookUrl || window.location.href)}`, "_blank");
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <h3 className="font-bold text-sm flex items-center gap-2">
        <Share2 className="w-4 h-4 text-primary" />
        Compartilhar Look
      </h3>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={downloadImage} className="text-xs">
          <Download className="w-3.5 h-3.5" />
          Download
        </Button>
        <Button variant="outline" size="sm" onClick={saveLook} disabled={saving || !!savedLookId} className="text-xs">
          {saving ? "Salvando..." : savedLookId ? "Salvo ✓" : "Salvar Look"}
        </Button>
      </div>

      {savedLookId && (
        <>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={lookUrl || ""}
              className="flex-1 text-xs bg-secondary rounded-lg px-3 py-2 text-muted-foreground truncate border-none outline-none"
            />
            <Button variant="ghost" size="sm" onClick={copyLink}>
              {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={shareWhatsApp} className="flex-1 text-xs">
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp
            </Button>
            <Button variant="outline" size="sm" onClick={shareFacebook} className="flex-1 text-xs">
              <Facebook className="w-3.5 h-3.5" />
              Facebook
            </Button>
            <Button variant="outline" size="sm" onClick={shareTwitter} className="flex-1 text-xs">
              𝕏
            </Button>
          </div>
        </>
      )}

      {!user && (
        <p className="text-xs text-muted-foreground">
          <button onClick={() => navigate("/auth")} className="text-primary hover:underline">Faça login</button> para salvar e compartilhar seus looks.
        </p>
      )}
    </div>
  );
}
