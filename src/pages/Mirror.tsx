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

// ─── MediaPipe FaceMesh landmark indices ───
// Lips
const UPPER_LIP_OUTER = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291];
const LOWER_LIP_OUTER = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291];
const UPPER_LIP_INNER = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308];
const LOWER_LIP_INNER = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308];

// Eyes
const LEFT_EYE_UPPER = [246, 161, 160, 159, 158, 157, 173];
const LEFT_EYE_LOWER = [33, 7, 163, 144, 145, 153, 154, 155, 133];
const RIGHT_EYE_UPPER = [466, 388, 387, 386, 385, 384, 398];
const RIGHT_EYE_LOWER = [263, 249, 390, 373, 374, 380, 381, 382, 362];

// Eye corners for sunglasses
const LEFT_EYE_INNER = 133;
const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_INNER = 362;
const RIGHT_EYE_OUTER = 263;

// Iris centers (available with refineLandmarks: true)
const LEFT_IRIS_CENTER = 468;
const RIGHT_IRIS_CENTER = 473;

// Cheeks (proper cheekbone landmarks, NOT ear)
const LEFT_CHEEK = 50;
const RIGHT_CHEEK = 280;

// Nose
const NOSE_TIP = 1;
const NOSE_BRIDGE = 6;

// Ears / Tragus area for earrings
const LEFT_TRAGUS = 234;
const RIGHT_TRAGUS = 454;

// Ear lobe approximation
const LEFT_EAR_LOBE = 177;
const RIGHT_EAR_LOBE = 401;

// Forehead / top of head
const FOREHEAD_TOP = 10;
const FOREHEAD_LEFT = 21;
const FOREHEAD_RIGHT = 251;

// Face outline for foundation
const FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];

// Full-region polygons
const LEFT_CHEEK_REGION = [205, 50, 187, 147, 123, 116, 117, 118, 119, 100, 126, 142, 203];
const RIGHT_CHEEK_REGION = [425, 280, 411, 376, 352, 345, 346, 347, 348, 329, 355, 371, 423];

// ─── Landmark smoothing ───
const SMOOTHING = 0.55; // 0 = no smoothing, 1 = infinite smoothing

const isFullFaceMesh = (lm: unknown): lm is { x: number; y: number; z?: number }[] => {
  return Array.isArray(lm) && lm.length >= 468;
};

const traceRegion = (
  ctx: CanvasRenderingContext2D,
  lm: { x: number; y: number }[],
  indices: number[],
  w: number,
  h: number
) => {
  indices.forEach((idx, i) => {
    const p = lm[idx];
    if (!p) return;
    const x = p.x * w;
    const y = p.y * h;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
};

function smoothLandmarks(
  current: { x: number; y: number; z?: number }[],
  previous: { x: number; y: number; z?: number }[] | null
): { x: number; y: number; z: number }[] {
  if (!previous) return current.map(p => ({ x: p.x, y: p.y, z: p.z ?? 0 }));
  return current.map((p, i) => {
    const prev = previous[i];
    if (!prev) return { x: p.x, y: p.y, z: p.z ?? 0 };
    return {
      x: prev.x * SMOOTHING + p.x * (1 - SMOOTHING),
      y: prev.y * SMOOTHING + p.y * (1 - SMOOTHING),
      z: (prev.z ?? 0) * SMOOTHING + (p.z ?? 0) * (1 - SMOOTHING),
    };
  });
}

// ─── Estimate landmarks from bounding box (FaceDetector / manual fallback) ───
function estimateLandmarksFromBox(box: { x: number; y: number; width: number; height: number }, canvasW: number, canvasH: number) {
  const cx = (box.x + box.width / 2) / canvasW;
  const cy = (box.y + box.height / 2) / canvasH;
  const fw = box.width / canvasW;
  const fh = box.height / canvasH;

  const lm: Record<number, { x: number; y: number; z: number }> = {};
  const p = (rx: number, ry: number) => ({ x: cx + rx * fw, y: cy + ry * fh, z: 0 });

  // Nose
  lm[NOSE_BRIDGE] = p(0, -0.12);
  lm[NOSE_TIP] = p(0, 0.08);

  // Upper lip
  const upperLipY = 0.26;
  UPPER_LIP_OUTER.forEach((idx, i, arr) => {
    const t = i / (arr.length - 1);
    lm[idx] = p(-0.13 + t * 0.26, upperLipY + Math.sin(t * Math.PI) * -0.02);
  });
  UPPER_LIP_INNER.forEach((idx, i, arr) => {
    const t = i / (arr.length - 1);
    lm[idx] = p(-0.10 + t * 0.20, upperLipY + 0.01 + Math.sin(t * Math.PI) * -0.01);
  });

  // Lower lip
  const lowerLipY = 0.30;
  LOWER_LIP_OUTER.forEach((idx, i, arr) => {
    const t = i / (arr.length - 1);
    lm[idx] = p(-0.13 + t * 0.26, lowerLipY + Math.sin(t * Math.PI) * 0.04);
  });
  LOWER_LIP_INNER.forEach((idx, i, arr) => {
    const t = i / (arr.length - 1);
    lm[idx] = p(-0.10 + t * 0.20, lowerLipY - 0.01 + Math.sin(t * Math.PI) * 0.02);
  });

  // Cheeks (actual cheekbone area)
  lm[LEFT_CHEEK] = p(-0.28, 0.05);
  lm[RIGHT_CHEEK] = p(0.28, 0.05);

  // Ears/Tragus
  lm[LEFT_TRAGUS] = p(-0.42, -0.02);
  lm[RIGHT_TRAGUS] = p(0.42, -0.02);
  lm[LEFT_EAR_LOBE] = p(-0.40, 0.12);
  lm[RIGHT_EAR_LOBE] = p(0.40, 0.12);

  // Left eye
  const leftEyeCx = -0.15, eyeY = -0.12;
  LEFT_EYE_UPPER.forEach((idx, i, arr) => {
    const t = i / (arr.length - 1);
    lm[idx] = p(leftEyeCx - 0.07 + t * 0.14, eyeY - Math.sin(t * Math.PI) * 0.018);
  });
  LEFT_EYE_LOWER.forEach((idx, i, arr) => {
    const t = i / (arr.length - 1);
    lm[idx] = p(leftEyeCx - 0.07 + t * 0.14, eyeY + Math.sin(t * Math.PI) * 0.010);
  });
  lm[LEFT_EYE_INNER] = p(leftEyeCx + 0.07, eyeY);
  lm[LEFT_EYE_OUTER] = p(leftEyeCx - 0.07, eyeY);
  lm[LEFT_IRIS_CENTER] = p(leftEyeCx, eyeY);

  // Right eye
  const rightEyeCx = 0.15;
  RIGHT_EYE_UPPER.forEach((idx, i, arr) => {
    const t = i / (arr.length - 1);
    lm[idx] = p(rightEyeCx - 0.07 + t * 0.14, eyeY - Math.sin(t * Math.PI) * 0.018);
  });
  RIGHT_EYE_LOWER.forEach((idx, i, arr) => {
    const t = i / (arr.length - 1);
    lm[idx] = p(rightEyeCx - 0.07 + t * 0.14, eyeY + Math.sin(t * Math.PI) * 0.010);
  });
  lm[RIGHT_EYE_INNER] = p(rightEyeCx - 0.07, eyeY);
  lm[RIGHT_EYE_OUTER] = p(rightEyeCx + 0.07, eyeY);
  lm[RIGHT_IRIS_CENTER] = p(rightEyeCx, eyeY);

  // Forehead
  lm[FOREHEAD_TOP] = p(0, -0.45);
  lm[FOREHEAD_LEFT] = p(-0.25, -0.40);
  lm[FOREHEAD_RIGHT] = p(0.25, -0.40);

  // Face oval
  FACE_OVAL.forEach((idx, i, arr) => {
    if (lm[idx]) return; // Don't overwrite already set landmarks
    const angle = (i / arr.length) * Math.PI * 2 - Math.PI / 2;
    lm[idx] = p(Math.cos(angle) * 0.42, Math.sin(angle) * 0.48);
  });

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

// ─── Helper: compute face rotation angle from eye positions ───
function getFaceAngle(lm: any, w: number, h: number): number {
  const le = lm[LEFT_EYE_OUTER];
  const re = lm[RIGHT_EYE_OUTER];
  if (!le || !re) return 0;
  return Math.atan2((re.y - le.y) * h, (re.x - le.x) * w);
}

// ─── Helper: get eye center ───
function eyeCenter(lm: any, innerIdx: number, outerIdx: number) {
  const a = lm[innerIdx];
  const b = lm[outerIdx];
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

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
  const prevLandmarksRef = useRef<any>(null);
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
    prevLandmarksRef.current = null;
  }, []);

  const initDetection = async () => {
    // Strategy 1 (primary): MediaPipe FaceMesh completo (468+ pontos)
    try {
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js");
      const w = window as any;
      if (w.FaceMesh) {
        const faceMesh = new w.FaceMesh({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`,
        });
        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });
        faceMesh.onResults((results: any) => {
          if (results.multiFaceLandmarks?.length > 0) {
            const raw = results.multiFaceLandmarks[0];
            if (Array.isArray(raw) && raw.length >= 468) {
              landmarksRef.current = smoothLandmarks(raw, prevLandmarksRef.current);
              prevLandmarksRef.current = landmarksRef.current;
              setDetecting(true);
              return;
            }
          }

          landmarksRef.current = null;
          prevLandmarksRef.current = null;
          setDetecting(false);
        });

        const video = videoRef.current;
        if (video) await faceMesh.send({ image: video });

        faceDetectorRef.current = faceMesh;
        setDetectionMode("mediapipe");
        console.log("[Mirror] Using MediaPipe FaceMesh 468 landmarks");
        startMediaPipeLoop(faceMesh);
        startRenderLoop();
        return;
      }
    } catch (e) {
      console.warn("[Mirror] MediaPipe FaceMesh failed:", e);
    }

    // Strategy 2: FaceDetector (somente fallback de detecção, sem precisão de malha completa)
    if ("FaceDetector" in window) {
      try {
        const detector = new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
        faceDetectorRef.current = detector;
        setDetectionMode("facedetector");
        console.log("[Mirror] Using FaceDetector API fallback");
        startFaceDetectorLoop();
        startRenderLoop();
        return;
      } catch (e) {
        console.warn("[Mirror] FaceDetector API failed:", e);
      }
    }

    // Strategy 3: Manual fallback (detecção estimada)
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
    }, 50); // ~20fps detection
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
          const estimated = estimateLandmarksFromBox(box, video.videoWidth, video.videoHeight);
          landmarksRef.current = estimated;
          setDetecting(true);
        } else {
          landmarksRef.current = null;
          setDetecting(false);
        }
      } catch (e) { /* ignore frame errors */ }
    }, 66); // ~15fps detection
  };

  const startManualDetection = () => {
    clearInterval(detectIntervalRef.current);
    detectIntervalRef.current = window.setInterval(() => {
      const v = videoRef.current;
      if (!v || v.paused || v.ended) return;
      const w = v.videoWidth, h = v.videoHeight;
      const faceW = w * 0.35, faceH = h * 0.45;
      const box = { x: (w - faceW) / 2, y: h * 0.08, width: faceW, height: faceH };
      landmarksRef.current = estimateLandmarksFromBox(box, w, h);
      setDetecting(true);
    }, 150);
  };

  // ─── Render loop (60fps) ───
  const startRenderLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: false });
    if (!ctx) return;

    const draw = () => {
      if (!video.paused && !video.ended) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const w = canvas.width, h = canvas.height;
        const isMirrored = mirroredRef.current;

        ctx.save();
        if (isMirrored) { ctx.translate(w, 0); ctx.scale(-1, 1); }
        ctx.drawImage(video, 0, 0);
        ctx.restore();

        const landmarks = landmarksRef.current;
        const product = selectedProductRef.current;
        const color = selectedColorRef.current;
        const hasFullMesh = isFullFaceMesh(landmarks);

        if (hasFullMesh && product) {
          ctx.save();
          if (isMirrored) { ctx.translate(w, 0); ctx.scale(-1, 1); }

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

  // ─── Draw functions ───

  const drawLipstick = (ctx: CanvasRenderingContext2D, lm: any, w: number, h: number, color: string) => {
    if (!isFullFaceMesh(lm)) return;

    ctx.save();
    ctx.globalAlpha = 0.58;
    ctx.fillStyle = color;

    // Outer mouth region
    ctx.beginPath();
    traceRegion(ctx, lm, UPPER_LIP_OUTER, w, h);
    [...LOWER_LIP_OUTER].reverse().forEach((idx) => {
      ctx.lineTo(lm[idx].x * w, lm[idx].y * h);
    });
    ctx.closePath();

    // Carve inner mouth opening to avoid painting teeth/tongue
    ctx.moveTo(lm[UPPER_LIP_INNER[0]].x * w, lm[UPPER_LIP_INNER[0]].y * h);
    traceRegion(ctx, lm, UPPER_LIP_INNER, w, h);
    [...LOWER_LIP_INNER].reverse().forEach((idx) => {
      ctx.lineTo(lm[idx].x * w, lm[idx].y * h);
    });
    ctx.closePath();
    ctx.fill("evenodd");

    // Light glossy pass constrained to lips
    ctx.globalAlpha = 0.22;
    const lipCenter = lm[13];
    const lipGrad = ctx.createRadialGradient(
      lipCenter.x * w,
      lipCenter.y * h,
      0,
      lipCenter.x * w,
      lipCenter.y * h,
      Math.abs(lm[291].x - lm[61].x) * w * 0.65
    );
    lipGrad.addColorStop(0, "rgba(255,255,255,0.2)");
    lipGrad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = lipGrad;

    ctx.beginPath();
    traceRegion(ctx, lm, UPPER_LIP_OUTER, w, h);
    [...LOWER_LIP_OUTER].reverse().forEach((idx) => {
      ctx.lineTo(lm[idx].x * w, lm[idx].y * h);
    });
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  const drawBlush = (ctx: CanvasRenderingContext2D, lm: any, w: number, h: number, color: string) => {
    if (!isFullFaceMesh(lm)) return;

    const leftCheek = lm[LEFT_CHEEK];
    const rightCheek = lm[RIGHT_CHEEK];
    const noseTip = lm[NOSE_TIP];
    const faceWidth = Math.abs(lm[RIGHT_TRAGUS].x - lm[LEFT_TRAGUS].x) * w;
    const radius = faceWidth * 0.11;

    const cheekPoints = [
      { x: leftCheek.x * w, y: (leftCheek.y * 0.68 + noseTip.y * 0.32) * h, region: LEFT_CHEEK_REGION },
      { x: rightCheek.x * w, y: (rightCheek.y * 0.68 + noseTip.y * 0.32) * h, region: RIGHT_CHEEK_REGION },
    ];

    cheekPoints.forEach((pt) => {
      ctx.save();
      ctx.beginPath();
      traceRegion(ctx, lm, pt.region, w, h);
      ctx.closePath();
      ctx.clip();

      const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, radius);
      grad.addColorStop(0, `${color}CC`);
      grad.addColorStop(0.6, `${color}66`);
      grad.addColorStop(1, "rgba(0,0,0,0)");

      ctx.globalAlpha = 0.28;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  };

  const drawEyeshadow = (ctx: CanvasRenderingContext2D, lm: any, w: number, h: number, color: string) => {
    if (!isFullFaceMesh(lm)) return;

    [
      { upper: LEFT_EYE_UPPER, lower: LEFT_EYE_LOWER },
      { upper: RIGHT_EYE_UPPER, lower: RIGHT_EYE_LOWER },
    ].forEach(({ upper, lower }) => {
      const upperPts = upper.map((idx) => ({ x: lm[idx].x * w, y: lm[idx].y * h }));
      const lowerPts = lower.map((idx) => ({ x: lm[idx].x * w, y: lm[idx].y * h }));

      // Apply only inside eyelid polygon (upper + lower contour)
      ctx.save();
      ctx.beginPath();
      upperPts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      [...lowerPts].reverse().forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.closePath();
      ctx.clip();

      const center = upperPts[Math.floor(upperPts.length / 2)];
      const eyeWidth = Math.hypot(upperPts[0].x - upperPts[upperPts.length - 1].x, upperPts[0].y - upperPts[upperPts.length - 1].y);
      const grad = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, eyeWidth * 0.75);
      grad.addColorStop(0, `${color}E6`);
      grad.addColorStop(1, `${color}22`);

      ctx.globalAlpha = 0.38;
      ctx.fillStyle = grad;
      ctx.fillRect(center.x - eyeWidth, center.y - eyeWidth, eyeWidth * 2, eyeWidth * 2);
      ctx.restore();
    });
  };

  const drawEyeliner = (ctx: CanvasRenderingContext2D, lm: any, w: number, h: number, color: string) => {
    if (!isFullFaceMesh(lm)) return;

    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1.4, w * 0.0024);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    [LEFT_EYE_UPPER, RIGHT_EYE_UPPER].forEach((eye, eyeIdx) => {
      const points = eye.map((idx) => ({ x: lm[idx].x * w, y: lm[idx].y * h }));

      ctx.beginPath();
      points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();

      const outerIdx = eyeIdx === 0 ? LEFT_EYE_OUTER : RIGHT_EYE_OUTER;
      const outer = { x: lm[outerIdx].x * w, y: lm[outerIdx].y * h };
      const prev = points[points.length - 2];
      const dirX = outer.x - prev.x;
      const dirY = outer.y - prev.y;
      const len = Math.hypot(dirX, dirY) || 1;
      const nx = dirX / len;
      const ny = dirY / len;
      const wingLen = w * 0.012;

      ctx.beginPath();
      ctx.moveTo(outer.x, outer.y);
      ctx.lineTo(outer.x + nx * wingLen, outer.y + ny * wingLen - wingLen * 0.35);
      ctx.stroke();
    });

    ctx.globalAlpha = 1;
  };

  const drawFoundation = (ctx: CanvasRenderingContext2D, lm: any, w: number, h: number, color: string) => {
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = color;
    ctx.beginPath();
    FACE_OVAL.forEach((idx, i) => {
      const x = lm[idx].x * w, y = lm[idx].y * h;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();

    // Second pass with blur for smoother look
    ctx.globalAlpha = 0.08;
    ctx.filter = "blur(8px)";
    ctx.fill();
    ctx.filter = "none";
    ctx.globalAlpha = 1;
  };

  const drawSunglasses = (ctx: CanvasRenderingContext2D, lm: any, w: number, h: number, color: string) => {
    // Use eye centers for lens placement
    const leftCenter = eyeCenter(lm, LEFT_EYE_INNER, LEFT_EYE_OUTER);
    const rightCenter = eyeCenter(lm, RIGHT_EYE_INNER, RIGHT_EYE_OUTER);
    const bridge = lm[NOSE_BRIDGE];
    const leftEar = lm[LEFT_TRAGUS];
    const rightEar = lm[RIGHT_TRAGUS];

    const angle = getFaceAngle(lm, w, h);

    // Eye distance for scaling
    const eyeDist = Math.hypot(
      (rightCenter.x - leftCenter.x) * w,
      (rightCenter.y - leftCenter.y) * h
    );
    const lensW = eyeDist * 0.52;
    const lensH = lensW * 0.72;
    const frameThickness = Math.max(2.5, w * 0.004);

    // Lens centers
    const lxc = leftCenter.x * w;
    const lyc = leftCenter.y * h;
    const rxc = rightCenter.x * w;
    const ryc = rightCenter.y * h;

    ctx.save();

    // Frame color
    ctx.strokeStyle = color;
    ctx.lineWidth = frameThickness;

    // Lens fill
    const lensColor = color === "#d4a017"
      ? "rgba(120, 90, 30, 0.45)"
      : color === "#92400e"
        ? "rgba(80, 50, 20, 0.5)"
        : "rgba(0, 0, 0, 0.65)";
    ctx.fillStyle = lensColor;

    // Left lens
    drawRoundedRect(ctx, lxc - lensW / 2, lyc - lensH / 2, lensW, lensH, lensH * 0.25);
    ctx.fill();
    ctx.stroke();

    // Right lens
    drawRoundedRect(ctx, rxc - lensW / 2, ryc - lensH / 2, lensW, lensH, lensH * 0.25);
    ctx.fill();
    ctx.stroke();

    // Bridge
    ctx.beginPath();
    ctx.moveTo(lxc + lensW / 2, lyc);
    ctx.quadraticCurveTo(bridge.x * w, bridge.y * h + lensH * 0.1, rxc - lensW / 2, ryc);
    ctx.stroke();

    // Temple arms to ears
    ctx.lineWidth = frameThickness * 0.7;
    ctx.beginPath();
    ctx.moveTo(lxc - lensW / 2, lyc - lensH * 0.15);
    ctx.lineTo(leftEar.x * w, leftEar.y * h);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rxc + lensW / 2, ryc - lensH * 0.15);
    ctx.lineTo(rightEar.x * w, rightEar.y * h);
    ctx.stroke();

    ctx.restore();
  };

  const drawEarrings = (ctx: CanvasRenderingContext2D, lm: any, w: number, h: number, color: string) => {
    // Use ear lobe landmarks for proper positioning
    const leftLobe = lm[LEFT_EAR_LOBE];
    const rightLobe = lm[RIGHT_EAR_LOBE];

    // Scale based on face width
    const faceWidth = Math.abs(lm[RIGHT_TRAGUS].x - lm[LEFT_TRAGUS].x) * w;
    const baseRadius = faceWidth * 0.022;
    const dropLength = faceWidth * 0.06;

    ctx.globalAlpha = 0.9;

    [
      { x: leftLobe.x * w, y: leftLobe.y * h },
      { x: rightLobe.x * w, y: rightLobe.y * h },
    ].forEach((ear) => {
      // Stud
      ctx.beginPath();
      ctx.arc(ear.x, ear.y, baseRadius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Drop
      ctx.beginPath();
      ctx.moveTo(ear.x - baseRadius * 0.3, ear.y + baseRadius);
      ctx.lineTo(ear.x, ear.y + baseRadius + dropLength);
      ctx.lineTo(ear.x + baseRadius * 0.3, ear.y + baseRadius);
      ctx.closePath();
      ctx.fill();

      // Bottom gem
      ctx.beginPath();
      ctx.arc(ear.x, ear.y + baseRadius + dropLength, baseRadius * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Highlight
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(ear.x - baseRadius * 0.25, ear.y - baseRadius * 0.25, baseRadius * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.9;
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

  if (false && !planLoading && !limits.hasMirror) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-black mb-2">Espelho Virtual</h1>
          <p className="text-muted-foreground max-w-md mb-6">
            O espelho virtual com câmera ao vivo está disponível a partir do plano <strong>Growth</strong>.
          </p>
          <Button onClick={() => navigate("/paywall")}>Fazer Upgrade</Button>
        </div>
      </div>
    );
  }

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
                      {detectionMode === "mediapipe" ? "~20" : detectionMode === "facedetector" ? "~15" : "~7"}
                    </span></div>
                    <div>Precisão: <span className="text-foreground font-mono">
                      {detectionMode === "mediapipe" ? "ALTA" : detectionMode === "facedetector" ? "MÉDIA" : "BÁSICA"}
                    </span></div>
                    <div>Smooth: <span className="text-foreground font-mono">ON</span></div>
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
