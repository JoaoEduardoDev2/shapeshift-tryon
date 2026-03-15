import { useState, useRef, useCallback } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { Upload, ImagePlus, Loader2, Scan, User, Shirt } from "lucide-react";

interface BodyPoint {
  x: number;
  y: number;
  label: string;
}

export default function PhotoTryOn() {
  const [userImage, setUserImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [bodyMap, setBodyMap] = useState<BodyPoint[]>([]);
  const [selectedGarment, setSelectedGarment] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const garments = [
    { id: 0, name: "Camiseta Preta", type: "tops", color: "#1a1a2e" },
    { id: 1, name: "Camiseta Branca", type: "tops", color: "#e2e8f0" },
    { id: 2, name: "Jaqueta Jeans", type: "tops", color: "#3b82f6" },
    { id: 3, name: "Vestido Vermelho", type: "dress", color: "#ef4444" },
  ];

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setUserImage(ev.target?.result as string);
      setBodyMap([]);
      setSelectedGarment(null);
      detectBody(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const detectBody = async (imageSrc: string) => {
    setProcessing(true);

    // Simulate body detection with realistic points
    // In production, this calls MediaPipe Pose or a server-side model
    await new Promise((r) => setTimeout(r, 1500));

    const img = new Image();
    img.onload = () => {
      const w = img.width;
      const h = img.height;

      // Simulated body landmark detection
      const points: BodyPoint[] = [
        { x: 0.5 * w, y: 0.12 * h, label: "Cabeça" },
        { x: 0.5 * w, y: 0.2 * h, label: "Pescoço" },
        { x: 0.38 * w, y: 0.28 * h, label: "Ombro E" },
        { x: 0.62 * w, y: 0.28 * h, label: "Ombro D" },
        { x: 0.3 * w, y: 0.42 * h, label: "Cotovelo E" },
        { x: 0.7 * w, y: 0.42 * h, label: "Cotovelo D" },
        { x: 0.5 * w, y: 0.38 * h, label: "Peito" },
        { x: 0.5 * w, y: 0.5 * h, label: "Cintura" },
        { x: 0.42 * w, y: 0.55 * h, label: "Quadril E" },
        { x: 0.58 * w, y: 0.55 * h, label: "Quadril D" },
        { x: 0.4 * w, y: 0.72 * h, label: "Joelho E" },
        { x: 0.6 * w, y: 0.72 * h, label: "Joelho D" },
        { x: 0.4 * w, y: 0.92 * h, label: "Tornozelo E" },
        { x: 0.6 * w, y: 0.92 * h, label: "Tornozelo D" },
      ];

      setBodyMap(points);
      drawOverlay(img, points);
      setProcessing(false);
    };
    img.src = imageSrc;
  };

  const drawOverlay = (img: HTMLImageElement, points: BodyPoint[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Scale canvas to fit
    const maxW = 600;
    const scale = maxW / img.width;
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Draw skeleton
    const connections = [
      [2, 3], [2, 4], [3, 5], [2, 6], [3, 6],
      [6, 7], [7, 8], [7, 9],
      [8, 10], [9, 11], [10, 12], [11, 13],
    ];

    ctx.strokeStyle = "hsl(217.2, 91.2%, 59.8%)";
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6;

    connections.forEach(([a, b]) => {
      const pa = points[a];
      const pb = points[b];
      if (pa && pb) {
        ctx.beginPath();
        ctx.moveTo(pa.x * scale, pa.y * scale);
        ctx.lineTo(pb.x * scale, pb.y * scale);
        ctx.stroke();
      }
    });

    // Draw points
    ctx.globalAlpha = 1;
    points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x * scale, p.y * scale, 5, 0, Math.PI * 2);
      ctx.fillStyle = "hsl(217.2, 91.2%, 59.8%)";
      ctx.fill();
      ctx.strokeStyle = "hsl(0, 0%, 100%)";
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  };

  const applyGarment = (garmentId: number) => {
    setSelectedGarment(garmentId);
    const garment = garments[garmentId];
    if (!canvasRef.current || bodyMap.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Reload original image then overlay garment
    const img = new Image();
    img.onload = () => {
      const scale = canvas.width / img.width;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Draw garment area (simplified - in production uses TPS warping)
      const shoulderL = bodyMap[2];
      const shoulderR = bodyMap[3];
      const waist = bodyMap[7];
      const hipL = bodyMap[8];
      const hipR = bodyMap[9];

      if (!shoulderL || !shoulderR || !waist) return;

      ctx.globalAlpha = 0.7;
      ctx.fillStyle = garment.color;
      ctx.beginPath();

      const endPoints = garment.type === "dress" ? [hipL, hipR] : [waist, waist];
      const bottomY = garment.type === "dress" ? (hipL!.y + 80) : waist.y + 30;

      // Garment shape
      ctx.moveTo((shoulderL.x - 15) * scale, shoulderL.y * scale);
      ctx.lineTo((shoulderR.x + 15) * scale, shoulderR.y * scale);
      ctx.lineTo((shoulderR.x + 10) * scale, bottomY * scale);
      ctx.lineTo((shoulderL.x - 10) * scale, bottomY * scale);
      ctx.closePath();
      ctx.fill();

      // Collar
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      const neckX = bodyMap[1]!.x * scale;
      const neckY = bodyMap[1]!.y * scale;
      ctx.arc(neckX, neckY + 10, 18, 0, Math.PI * 2);
      ctx.fillStyle = "hsl(var(--background))";
      ctx.fill();

      ctx.globalAlpha = 1;

      // Re-draw skeleton points on top
      ctx.globalAlpha = 0.4;
      bodyMap.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x * scale, p.y * scale, 4, 0, Math.PI * 2);
        ctx.fillStyle = "hsl(217.2, 91.2%, 59.8%)";
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    };
    img.src = userImage!;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 px-4 pb-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-black mb-2">
            Provador por <span className="text-gradient">Foto</span>
          </h1>
          <p className="text-muted-foreground mb-6">
            Envie uma foto e o sistema detecta automaticamente seu corpo
          </p>

          <div className="grid lg:grid-cols-[1fr_320px] gap-6">
            {/* Main area */}
            <div className="relative min-h-[500px] rounded-2xl border border-border bg-card overflow-hidden flex items-center justify-center">
              {!userImage && (
                <div className="text-center p-8">
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-border flex items-center justify-center mx-auto mb-4">
                    <ImagePlus className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm mb-4">
                    Envie uma foto de corpo inteiro
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <Button variant="hero" size="lg" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-5 h-5" />
                    Enviar Foto
                  </Button>
                </div>
              )}

              {userImage && (
                <canvas ref={canvasRef} className="max-w-full max-h-[600px] object-contain" />
              )}

              {processing && (
                <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <div className="text-sm font-mono text-primary">DETECTANDO CORPO...</div>
                  <div className="w-48 h-1 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: "70%" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Side panel */}
            <div className="space-y-6">
              {userImage && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4" />
                  Trocar Foto
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />

              {/* Body map info */}
              {bodyMap.length > 0 && (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
                  <h4 className="text-xs font-mono text-primary mb-3 flex items-center gap-2">
                    <Scan className="w-3 h-3" />
                    MAPA CORPORAL
                  </h4>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    {bodyMap.map((p) => (
                      <div key={p.label} className="flex items-center gap-1.5 text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {p.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Garments */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Shirt className="w-4 h-4 text-primary" />
                  Roupas
                </h3>
                <div className="space-y-2">
                  {garments.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => applyGarment(g.id)}
                      disabled={bodyMap.length === 0}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center gap-3 disabled:opacity-30 ${
                        selectedGarment === g.id
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "hover:bg-secondary text-muted-foreground"
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-lg border border-border"
                        style={{ backgroundColor: g.color }}
                      />
                      {g.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pipeline info */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <h4 className="text-xs font-mono text-muted-foreground mb-3">PIPELINE</h4>
                <div className="space-y-2 text-xs text-muted-foreground">
                  {[
                    { step: "1. Detecção", icon: User, done: bodyMap.length > 0 },
                    { step: "2. Mapa Corporal", icon: Scan, done: bodyMap.length > 0 },
                    { step: "3. Aplicar Roupa", icon: Shirt, done: selectedGarment !== null },
                  ].map((s) => (
                    <div key={s.step} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${s.done ? "bg-success/20" : "bg-secondary"}`}>
                        <s.icon className={`w-2.5 h-2.5 ${s.done ? "text-success" : "text-muted-foreground"}`} />
                      </div>
                      <span className={s.done ? "text-foreground" : ""}>{s.step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
