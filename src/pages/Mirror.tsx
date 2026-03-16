import { useRef, useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, FlipHorizontal, Palette, Glasses, Sparkles, Eye, Brush, Crown, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePlanLimits } from "@/hooks/usePlanLimits";

type ProductCategory = "beauty" | "accessories";

interface ColorOption {
  name: string;
  color: string;
}

interface ProductItem {
  id: string;
  name: string;
  icon: any;
  colors: ColorOption[];
  category: ProductCategory;
}

const products: ProductItem[] = [
  {
    id: "lipstick", name: "Batom", icon: Palette, category: "beauty",
    colors: [
      { name: "Vermelho", color: "#be185d" },
      { name: "Rosa", color: "#ec4899" },
      { name: "Nude", color: "#d4a574" },
      { name: "Coral", color: "#f97316" },
      { name: "Vinho", color: "#881337" },
      { name: "Roxo", color: "#7c3aed" },
    ],
  },
  {
    id: "blush", name: "Blush", icon: Sparkles, category: "beauty",
    colors: [
      { name: "Pêssego", color: "#fda4af" },
      { name: "Rosa", color: "#f472b6" },
      { name: "Coral", color: "#fb923c" },
      { name: "Berry", color: "#c026d3" },
    ],
  },
  {
    id: "eyeshadow", name: "Sombra", icon: Eye, category: "beauty",
    colors: [
      { name: "Dourado", color: "#d4a017" },
      { name: "Bronze", color: "#a0522d" },
      { name: "Roxo", color: "#7c3aed" },
      { name: "Azul", color: "#3b82f6" },
      { name: "Verde", color: "#22c55e" },
      { name: "Rosa", color: "#ec4899" },
    ],
  },
  {
    id: "eyeliner", name: "Delineador", icon: Brush, category: "beauty",
    colors: [
      { name: "Preto", color: "#18181b" },
      { name: "Marrom", color: "#78350f" },
      { name: "Azul", color: "#1d4ed8" },
      { name: "Verde", color: "#166534" },
    ],
  },
  {
    id: "foundation", name: "Base", icon: Palette, category: "beauty",
    colors: [
      { name: "Clara", color: "#f5deb3" },
      { name: "Média", color: "#d2b48c" },
      { name: "Morena", color: "#a0522d" },
      { name: "Escura", color: "#6b3a2a" },
    ],
  },
  {
    id: "sunglasses", name: "Óculos de Sol", icon: Glasses, category: "accessories",
    colors: [
      { name: "Preto", color: "#18181b" },
      { name: "Tartaruga", color: "#92400e" },
      { name: "Aviador Dourado", color: "#d4a017" },
    ],
  },
  {
    id: "earrings", name: "Brincos", icon: Crown, category: "accessories",
    colors: [
      { name: "Ouro", color: "#d4a017" },
      { name: "Prata", color: "#a1a1aa" },
      { name: "Rosê Gold", color: "#e8a0bf" },
    ],
  },
];

// Generate estimated face landmarks from a bounding box
// Based on standard face proportions (De Myer's proportions)
function estimateLandmarksFromBox(box: { x: number; y: number; width: number; height: number }, canvasW: number, canvasH: number) {
  const cx = (box.x + box.width / 2) / canvasW;
  const cy = (box.y + box.height / 2) / canvasH;
  const fw = box.width / canvasW;
  const fh = box.height / canvasH;

  // Create a sparse landmarks array (only the indices we use)
  const lm: Record<number, { x: number; y: number; z: number }> = {};
  const p = (rx: number, ry: number) => ({ x: cx + rx * fw, y: cy + ry * fh, z: 0 });

  // Nose bridge (6)
  lm[6] = p(0, -0.12);

  // Upper lip landmarks
  const upperLipY = 0.28;
  [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291].forEach((idx, i, arr) => {
    const t = i / (arr.length - 1);
    lm[idx] = p(-0.12 + t * 0.24, upperLipY + Math.sin(t * Math.PI) * -0.02);
  });

  // Lower lip landmarks
  const lowerLipY = 0.32;
  [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291].forEach((idx, i, arr) => {
    const t = i / (arr.length - 1);
    lm[idx] = p(-0.12 + t * 0.24, lowerLipY + Math.sin(t * Math.PI) * 0.03);
  });

  // Cheeks
  lm[234] = p(-0.38, 0.05);  // Left cheek / left ear
  lm[454] = p(0.38, 0.05);   // Right cheek / right ear

  // Left eye landmarks
  const leftEyeCx = -0.15, eyeY = -0.1;
  [246, 161, 160, 159, 158, 157, 173].forEach((idx, i, arr) => {
    const t = i / (arr.length - 1);
    lm[idx] = p(leftEyeCx - 0.06 + t * 0.12, eyeY - Math.sin(t * Math.PI) * 0.015);
  });
  [33, 7, 163, 144, 145, 153, 154, 155, 133].forEach((idx, i, arr) => {
    const t = i / (arr.length - 1);
    lm[idx] = p(leftEyeCx - 0.06 + t * 0.12, eyeY + Math.sin(t * Math.PI) * 0.008);
  });

  // Right eye landmarks
  const rightEyeCx = 0.15;
  [466, 388, 387, 386, 385, 384, 398].forEach((idx, i, arr) => {
    const t = i / (arr.length - 1);
    lm[idx] = p(rightEyeCx - 0.06 + t * 0.12, eyeY - Math.sin(t * Math.PI) * 0.015);
  });
  [263, 249, 390, 373, 374, 380, 381, 382, 362].forEach((idx, i, arr) => {
    const t = i / (arr.length - 1);
    lm[idx] = p(rightEyeCx - 0.06 + t * 0.12, eyeY + Math.sin(t * Math.PI) * 0.008);
  });

  // Face outline
  const faceOutlineIndices = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
  faceOutlineIndices.forEach((idx, i, arr) => {
    const angle = (i / arr.length) * Math.PI * 2 - Math.PI / 2;
    lm[idx] = p(Math.cos(angle) * 0.4, Math.sin(angle) * 0.45);
  });

  // Return as array-like with proxy for missing indices
  return new Proxy(lm, {
    get(target, prop) {
      const idx = typeof prop === 'string' ? parseInt(prop) : prop;
      if (typeof idx === 'number' && !isNaN(idx)) {
        return target[idx] || { x: cx, y: cy, z: 0 };
      }
      return (target as any)[prop];
    }
  });
}

// Face landmark indices used by draw functions
const UPPER_LIP = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291];
const LOWER_LIP = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291];
const LEFT_CHEEK_CENTER = 234;
const RIGHT_CHEEK_CENTER = 454;
const LEFT_EYE_UPPER = [246, 161, 160, 159, 158, 157, 173];
const LEFT_EYE_LOWER = [33, 7, 163, 144, 145, 153, 154, 155, 133];
const RIGHT_EYE_UPPER = [466, 388, 387, 386, 385, 384, 398];
const RIGHT_EYE_LOWER = [263, 249, 390, 373, 374, 380, 381, 382, 362];
const NOSE_BRIDGE = 6;
const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_OUTER = 263;
const LEFT_EAR = 234;
const RIGHT_EAR = 454;
const FACE_OUTLINE = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];

type DetectionMode = "loading" | "mediapipe" | "facedetector" | "manual";

export default function Mirror() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { limits, loading: planLoading } = usePlanLimits();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [mirrored, setMirrored] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>("#be185d");
  const [detecting, setDetecting] = useState(false);
  const [activeTab, setActiveTab] = useState<ProductCategory>("beauty");
  const [detectionMode, setDetectionMode] = useState<DetectionMode>("loading");

  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const landmarksRef = useRef<any>(null);
  const detectIntervalRef = useRef<number>(0);
  const selectedProductRef = useRef<string | null>(null);
  const selectedColorRef = useRef<string>("#be185d");
  const mirroredRef = useRef(true);
  const faceDetectorRef = useRef<any>(null);

  // Keep refs in sync
  selectedProductRef.current = selectedProduct;
  selectedColorRef.current = selectedColor;
  mirroredRef.current = mirrored;

  // Load product from query param
  useEffect(() => {
    const productId = searchParams.get("product");
    if (!productId) return;
    supabase.from("products").select("*").eq("id", productId).single().then(({ data }) => {
      if (!data) return;
      const p = data as any;
      // Map makeup_type to local product id and set color
      if (p.makeup_type && p.color_hex) {
        setSelectedProduct(p.makeup_type);
        setSelectedColor(p.color_hex);
        setActiveTab("beauty");
      } else if (p.category === "eyewear") {
        setSelectedProduct("sunglasses");
        if (p.color_hex) setSelectedColor(p.color_hex);
        setActiveTab("accessories");
      }
    });
  }, [searchParams]);

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
      initDetection();
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
    clearInterval(detectIntervalRef.current);
  }, []);

  const initDetection = async () => {
    // Strategy 1: Try Chrome's FaceDetector API (no WebGL needed)
    if ("FaceDetector" in window) {
      try {
        const detector = new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
        faceDetectorRef.current = detector;
        setDetectionMode("facedetector");
        console.log("[Mirror] Using FaceDetector API (native)");
        startFaceDetectorLoop();
        startRenderLoop();
        return;
      } catch (e) {
        console.warn("[Mirror] FaceDetector API failed:", e);
      }
    }

    // Strategy 2: Try MediaPipe FaceMesh
    try {
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js");
      const w = window as any;
      if (w.FaceMesh) {
        const faceMesh = new w.FaceMesh({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`,
        });
        faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.4 });
        faceMesh.onResults((results: any) => {
          if (results.multiFaceLandmarks?.length > 0) {
            landmarksRef.current = results.multiFaceLandmarks[0];
            setDetecting(true);
          } else {
            landmarksRef.current = null;
            setDetecting(false);
          }
        });

        // Warm-up test
        const video = videoRef.current;
        if (video) await faceMesh.send({ image: video });

        faceDetectorRef.current = faceMesh;
        setDetectionMode("mediapipe");
        console.log("[Mirror] Using MediaPipe FaceMesh");
        startMediaPipeLoop(faceMesh);
        startRenderLoop();
        return;
      }
    } catch (e) {
      console.warn("[Mirror] MediaPipe FaceMesh failed (WebGL unavailable):", e);
    }

    // Strategy 3: Manual fallback - estimate face at center
    console.log("[Mirror] Using manual fallback detection");
    setDetectionMode("manual");
    startManualDetection();
    startRenderLoop();
  };

  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const s = document.createElement("script");
      s.src = src;
      s.crossOrigin = "anonymous";
      s.onload = () => resolve();
      s.onerror = reject;
      document.head.appendChild(s);
    });
  };

  const startMediaPipeLoop = (faceMesh: any) => {
    let processing = false;
    clearInterval(detectIntervalRef.current);
    detectIntervalRef.current = window.setInterval(() => {
      const video = videoRef.current;
      if (!video || video.paused || video.ended || processing) return;
      processing = true;
      faceMesh.send({ image: video }).then(() => { processing = false; }).catch(() => { processing = false; });
    }, 66);
  };

  const startFaceDetectorLoop = () => {
    clearInterval(detectIntervalRef.current);
    detectIntervalRef.current = window.setInterval(async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || video.paused || video.ended || !faceDetectorRef.current || !canvas) return;

      try {
        const faces = await faceDetectorRef.current.detect(video);
        if (faces.length > 0) {
          const box = faces[0].boundingBox;
          landmarksRef.current = estimateLandmarksFromBox(box, video.videoWidth, video.videoHeight);
          setDetecting(true);
        } else {
          landmarksRef.current = null;
          setDetecting(false);
        }
      } catch (e) {
        // FaceDetector can throw on certain frames
      }
    }, 100);
  };

  const startManualDetection = () => {
    // Estimate face at center of video (assuming user is facing camera)
    const video = videoRef.current;
    if (!video) return;

    clearInterval(detectIntervalRef.current);
    detectIntervalRef.current = window.setInterval(() => {
      const v = videoRef.current;
      if (!v || v.paused || v.ended) return;
      const w = v.videoWidth;
      const h = v.videoHeight;
      // Assume face is roughly centered, taking up ~40% of frame
      const faceW = w * 0.35;
      const faceH = h * 0.45;
      const box = { x: (w - faceW) / 2, y: h * 0.08, width: faceW, height: faceH };
      landmarksRef.current = estimateLandmarksFromBox(box, w, h);
      setDetecting(true);
    }, 200);
  };

  const startRenderLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      if (!video.paused && !video.ended) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const isMirrored = mirroredRef.current;
        ctx.save();
        if (isMirrored) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
        ctx.drawImage(video, 0, 0);
        ctx.restore();

        const landmarks = landmarksRef.current;
        const product = selectedProductRef.current;
        const color = selectedColorRef.current;
        if (landmarks && product) {
          ctx.save();
          if (isMirrored) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
          const w = canvas.width, h = canvas.height;

          switch (product) {
            case "lipstick": drawLipstick(ctx, landmarks, w, h, color); break;
            case "blush": drawBlush(ctx, landmarks, w, h, color); break;
            case "eyeshadow": drawEyeshadow(ctx, landmarks, w, h, color); break;
            case "eyeliner": drawEyeliner(ctx, landmarks, w, h, color); break;
            case "foundation": drawFoundation(ctx, landmarks, w, h, color); break;
            case "sunglasses": drawSunglasses(ctx, landmarks, w, h, color); break;
            case "earrings": drawEarrings(ctx, landmarks, w, h, color); break;
          }
          ctx.restore();
        }
      }
      animFrameRef.current = requestAnimationFrame(draw);
    };
    draw();
  };

  // --- Draw functions ---
  const drawLipstick = (ctx: CanvasRenderingContext2D, lm: any, w: number, h: number, color: string) => {
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = color;
    [UPPER_LIP, LOWER_LIP].forEach((lip) => {
      ctx.beginPath();
      lip.forEach((idx, i) => {
        const x = lm[idx].x * w, y = lm[idx].y * h;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  };

  const drawBlush = (ctx: CanvasRenderingContext2D, lm: any, w: number, h: number, color: string) => {
    const radius = w * 0.04;
    ctx.globalAlpha = 0.25;
    [LEFT_CHEEK_CENTER, RIGHT_CHEEK_CENTER].forEach((idx) => {
      const x = lm[idx].x * w, y = lm[idx].y * h;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      grad.addColorStop(0, color);
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    });
    ctx.globalAlpha = 1;
  };

  const drawEyeshadow = (ctx: CanvasRenderingContext2D, lm: any, w: number, h: number, color: string) => {
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = color;
    [LEFT_EYE_UPPER, RIGHT_EYE_UPPER].forEach((eye) => {
      ctx.beginPath();
      const points = eye.map((idx) => ({ x: lm[idx].x * w, y: lm[idx].y * h }));
      points.forEach((p, i) => {
        const adjusted = { x: p.x, y: p.y - w * 0.012 };
        i === 0 ? ctx.moveTo(adjusted.x, adjusted.y) : ctx.lineTo(adjusted.x, adjusted.y);
      });
      const lowerPoints = (eye === LEFT_EYE_UPPER ? LEFT_EYE_LOWER : RIGHT_EYE_LOWER).map((idx) => ({ x: lm[idx].x * w, y: lm[idx].y * h }));
      lowerPoints.reverse().forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.closePath();
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  };

  const drawEyeliner = (ctx: CanvasRenderingContext2D, lm: any, w: number, h: number, color: string) => {
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1.5, w * 0.003);
    ctx.lineCap = "round";
    [LEFT_EYE_UPPER, RIGHT_EYE_UPPER].forEach((eye) => {
      ctx.beginPath();
      eye.forEach((idx, i) => {
        const x = lm[idx].x * w, y = lm[idx].y * h;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  };

  const drawFoundation = (ctx: CanvasRenderingContext2D, lm: any, w: number, h: number, color: string) => {
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = color;
    ctx.beginPath();
    FACE_OUTLINE.forEach((idx, i) => {
      const x = lm[idx].x * w, y = lm[idx].y * h;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  };

  const drawSunglasses = (ctx: CanvasRenderingContext2D, lm: any, w: number, h: number, color: string) => {
    const bridge = { x: lm[NOSE_BRIDGE].x * w, y: lm[NOSE_BRIDGE].y * h };
    const leftEye = { x: lm[LEFT_EYE_OUTER].x * w, y: lm[LEFT_EYE_OUTER].y * h };
    const rightEye = { x: lm[RIGHT_EYE_OUTER].x * w, y: lm[RIGHT_EYE_OUTER].y * h };
    const leftEar = { x: lm[LEFT_EAR].x * w, y: lm[LEFT_EAR].y * h };
    const rightEar = { x: lm[RIGHT_EAR].x * w, y: lm[RIGHT_EAR].y * h };

    const eyeWidth = Math.abs(rightEye.x - leftEye.x);
    const lensW = eyeWidth * 0.55;
    const lensH = lensW * 0.7;

    ctx.globalAlpha = 0.75;
    ctx.fillStyle = color === "#d4a017" ? "rgba(80, 60, 20, 0.5)" : "rgba(0,0,0,0.7)";
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, w * 0.004);

    const lxc = leftEye.x + (bridge.x - leftEye.x) * 0.4;
    const lyc = bridge.y;
    drawRoundedRect(ctx, lxc - lensW / 2, lyc - lensH / 2, lensW, lensH, lensH * 0.3);
    ctx.fill(); ctx.stroke();

    const rxc = rightEye.x - (rightEye.x - bridge.x) * 0.4;
    drawRoundedRect(ctx, rxc - lensW / 2, lyc - lensH / 2, lensW, lensH, lensH * 0.3);
    ctx.fill(); ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(lxc + lensW / 2, bridge.y);
    ctx.lineTo(rxc - lensW / 2, bridge.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(lxc - lensW / 2, lyc - lensH * 0.2);
    ctx.lineTo(leftEar.x, leftEar.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(rxc + lensW / 2, lyc - lensH * 0.2);
    ctx.lineTo(rightEar.x, rightEar.y);
    ctx.stroke();

    ctx.globalAlpha = 1;
  };

  const drawEarrings = (ctx: CanvasRenderingContext2D, lm: any, w: number, h: number, color: string) => {
    const leftEar = { x: lm[234].x * w, y: lm[234].y * h };
    const rightEar = { x: lm[454].x * w, y: lm[454].y * h };
    const radius = w * 0.012;

    ctx.globalAlpha = 0.85;
    [leftEar, rightEar].forEach((ear) => {
      ctx.beginPath();
      ctx.arc(ear.x, ear.y + w * 0.03, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(ear.x, ear.y + w * 0.05, radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  };

  const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  useEffect(() => { return () => { stopCamera(); }; }, [stopCamera]);

  const filteredProducts = products.filter((p) => p.category === activeTab);

  const modeLabel: Record<DetectionMode, string> = {
    loading: "INICIALIZANDO...",
    mediapipe: "MEDIAPIPE 468 LANDMARKS",
    facedetector: "FACE DETECTOR API",
    manual: "MODO ESTIMADO",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 px-4 pb-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-black mb-2">
            Espelho <span className="text-gradient">Virtual</span>
          </h1>
          <p className="text-muted-foreground mb-6">Prova virtual de maquiagem e acessórios em tempo real</p>

          <div className="grid lg:grid-cols-[1fr_340px] gap-6">
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

              {cameraOn && (
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${detecting ? "bg-success animate-pulse" : "bg-warning"}`} />
                  <span className="text-xs font-mono glass px-2 py-1 rounded-full">
                    {detecting ? modeLabel[detectionMode] : "SCANNING..."}
                  </span>
                </div>
              )}

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
            <div className="space-y-4">
              {/* Tab switch */}
              <div className="flex rounded-xl bg-secondary p-1 gap-1">
                {(["beauty", "accessories"] as ProductCategory[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { setActiveTab(tab); setSelectedProduct(null); }}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab === "beauty" ? "💄 Beleza" : "💎 Acessórios"}
                  </button>
                ))}
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {filteredProducts.map((product) => (
                    <div key={product.id}>
                      <button
                        onClick={() => setSelectedProduct(selectedProduct === product.id ? null : product.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                          selectedProduct === product.id
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-secondary text-muted-foreground"
                        }`}
                      >
                        <product.icon className="w-4 h-4" />
                        {product.name}
                        <span className="ml-auto text-xs opacity-50">{product.colors.length} cores</span>
                      </button>
                      {selectedProduct === product.id && (
                        <div className="flex flex-wrap gap-2 mt-2 ml-3 pb-1">
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

              {detecting && (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
                  <h4 className="text-xs font-mono text-primary mb-2">DETECÇÃO ATIVA</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>Modo: <span className="text-foreground font-mono">
                      {detectionMode === "mediapipe" ? "AI" : detectionMode === "facedetector" ? "NATIVO" : "ESTIMADO"}
                    </span></div>
                    <div>FPS: <span className="text-foreground font-mono">
                      {detectionMode === "mediapipe" ? "~15" : detectionMode === "facedetector" ? "~10" : "~5"}
                    </span></div>
                    <div>Precisão: <span className="text-foreground font-mono">
                      {detectionMode === "mediapipe" ? "ALTA" : detectionMode === "facedetector" ? "MÉDIA" : "BÁSICA"}
                    </span></div>
                    <div>Status: <span className="text-foreground font-mono">ON</span></div>
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
