import { useRef, useEffect, useState, useCallback } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, FlipHorizontal, Palette, Glasses, Sparkles } from "lucide-react";

// Beauty product categories
const beautyProducts = [
  {
    id: "lipstick",
    name: "Batom",
    icon: Palette,
    colors: [
      { name: "Vermelho", color: "#be185d" },
      { name: "Rosa", color: "#ec4899" },
      { name: "Nude", color: "#d4a574" },
      { name: "Coral", color: "#f97316" },
      { name: "Vinho", color: "#881337" },
    ],
  },
  {
    id: "blush",
    name: "Blush",
    icon: Sparkles,
    colors: [
      { name: "Pêssego", color: "#fda4af" },
      { name: "Rosa", color: "#f472b6" },
      { name: "Coral", color: "#fb923c" },
    ],
  },
];

// Face landmark indices for lips and cheeks
const UPPER_LIP = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291];
const LOWER_LIP = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291];
const LEFT_CHEEK_CENTER = 234;
const RIGHT_CHEEK_CENTER = 454;

export default function Mirror() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [mirrored, setMirrored] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>("#be185d");
  const [faceMeshLoaded, setFaceMeshLoaded] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const faceMeshRef = useRef<any>(null);
  const landmarksRef = useRef<any>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
      initFaceMesh();
    } catch (e) {
      console.error("Camera error:", e);
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
    setDetecting(false);
    cancelAnimationFrame(animFrameRef.current);
  }, []);

  const initFaceMesh = async () => {
    try {
      const { FaceMesh } = await import("@mediapipe/face_mesh");
      
      const faceMesh = new FaceMesh({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults((results: any) => {
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
          landmarksRef.current = results.multiFaceLandmarks[0];
          setDetecting(true);
        } else {
          landmarksRef.current = null;
          setDetecting(false);
        }
      });

      faceMeshRef.current = faceMesh;
      setFaceMeshLoaded(true);
      renderLoop();
    } catch (e) {
      console.error("FaceMesh init error:", e);
    }
  };

  const renderLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = async () => {
      if (!video.paused && !video.ended) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.save();
        if (mirrored) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0);
        ctx.restore();

        // Send frame to FaceMesh
        if (faceMeshRef.current) {
          await faceMeshRef.current.send({ image: video });
        }

        // Draw beauty overlays
        const landmarks = landmarksRef.current;
        if (landmarks && selectedProduct) {
          ctx.save();
          if (mirrored) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
          }

          if (selectedProduct === "lipstick") {
            drawLipstick(ctx, landmarks, canvas.width, canvas.height);
          } else if (selectedProduct === "blush") {
            drawBlush(ctx, landmarks, canvas.width, canvas.height);
          }

          ctx.restore();
        }
      }
      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  const drawLipstick = (ctx: CanvasRenderingContext2D, landmarks: any[], w: number, h: number) => {
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = selectedColor;

    // Upper lip
    ctx.beginPath();
    UPPER_LIP.forEach((idx, i) => {
      const x = landmarks[idx].x * w;
      const y = landmarks[idx].y * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();

    // Lower lip
    ctx.beginPath();
    LOWER_LIP.forEach((idx, i) => {
      const x = landmarks[idx].x * w;
      const y = landmarks[idx].y * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 1;
  };

  const drawBlush = (ctx: CanvasRenderingContext2D, landmarks: any[], w: number, h: number) => {
    const radius = w * 0.04;
    ctx.globalAlpha = 0.25;

    [LEFT_CHEEK_CENTER, RIGHT_CHEEK_CENTER].forEach((idx) => {
      const x = landmarks[idx].x * w;
      const y = landmarks[idx].y * h;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, selectedColor);
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    });

    ctx.globalAlpha = 1;
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Restart render loop when mirrored changes
  useEffect(() => {
    if (cameraOn && faceMeshLoaded) {
      cancelAnimationFrame(animFrameRef.current);
      renderLoop();
    }
  }, [mirrored, selectedProduct, selectedColor, cameraOn, faceMeshLoaded]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 px-4 pb-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-black mb-2">
            Espelho <span className="text-gradient">Virtual</span>
          </h1>
          <p className="text-muted-foreground mb-6">Detecção facial em tempo real com 468 landmarks</p>

          <div className="grid lg:grid-cols-[1fr_320px] gap-6">
            {/* Camera view */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-border bg-card">
              <video ref={videoRef} className="hidden" playsInline muted />
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />

              {!cameraOn && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-border flex items-center justify-center">
                    <Camera className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">Ative a câmera para começar</p>
                  <Button variant="hero" size="lg" onClick={startCamera}>
                    <Camera className="w-5 h-5" />
                    Ativar Câmera
                  </Button>
                </div>
              )}

              {/* Status indicators */}
              {cameraOn && (
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${detecting ? "bg-success animate-pulse" : "bg-warning"}`} />
                  <span className="text-xs font-mono glass px-2 py-1 rounded-full">
                    {detecting ? "FACE DETECTED" : "SCANNING..."}
                  </span>
                </div>
              )}

              {/* Controls */}
              {cameraOn && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                  <Button variant="glass" size="icon" onClick={() => setMirrored(!mirrored)}>
                    <FlipHorizontal className="w-4 h-4" />
                  </Button>
                  <Button variant="glass" size="icon" onClick={stopCamera}>
                    <CameraOff className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Product panel */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-primary" />
                  Beleza
                </h3>
                <div className="space-y-4">
                  {beautyProducts.map((product) => (
                    <div key={product.id}>
                      <button
                        onClick={() => setSelectedProduct(selectedProduct === product.id ? null : product.id)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                          selectedProduct === product.id
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-secondary text-muted-foreground"
                        }`}
                      >
                        <product.icon className="w-4 h-4 inline mr-2" />
                        {product.name}
                      </button>
                      {selectedProduct === product.id && (
                        <div className="flex gap-2 mt-2 ml-3">
                          {product.colors.map((c) => (
                            <button
                              key={c.name}
                              onClick={() => setSelectedColor(c.color)}
                              className={`w-8 h-8 rounded-full border-2 transition-all ${
                                selectedColor === c.color ? "border-foreground scale-110" : "border-transparent"
                              }`}
                              style={{ backgroundColor: c.color }}
                              title={c.name}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Glasses className="w-4 h-4 text-primary" />
                  Acessórios
                </h3>
                <p className="text-xs text-muted-foreground">
                  Óculos, relógios e bonés disponíveis com modelos 3D via API.
                </p>
              </div>

              {/* Detection info */}
              {detecting && (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
                  <h4 className="text-xs font-mono text-primary mb-2">DETECÇÃO ATIVA</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>Landmarks: <span className="text-foreground font-mono">468</span></div>
                    <div>FPS: <span className="text-foreground font-mono">~30</span></div>
                    <div>Confiança: <span className="text-foreground font-mono">HIGH</span></div>
                    <div>Iris: <span className="text-foreground font-mono">ON</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
