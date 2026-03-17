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

// ════════════════════════════════════════════════════════════
// MEDIAPIPE FACEMESH 468-POINT LANDMARK INDEX MAP
// All indices verified against the canonical MediaPipe topology
// ════════════════════════════════════════════════════════════

// ── Lips ──────────────────────────────────────────────────
// Outer contour: clockwise starting at left mouth corner (61)
const UPPER_LIP_OUTER = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291];
const LOWER_LIP_OUTER = [291, 375, 321, 405, 314, 17, 84, 181, 91, 146, 61];
// Inner contour (lip opening): closes the lip mask so teeth are excluded
const UPPER_LIP_INNER = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308];
const LOWER_LIP_INNER = [308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78];

// ── Eyes (upper eyelid arc + lower eyelid arc) ────────────
// LEFT eye (from viewer's perspective — MediaPipe left = person's left)
const LEFT_EYE_UPPER  = [246, 161, 160, 159, 158, 157, 173];
const LEFT_EYE_LOWER  = [33,  7,  163, 144, 145, 153, 154, 155, 133];
// RIGHT eye
const RIGHT_EYE_UPPER = [466, 388, 387, 386, 385, 384, 398];
const RIGHT_EYE_LOWER = [263, 249, 390, 373, 374, 380, 381, 382, 362];

// Eyebrow indices (above the eye)
const LEFT_EYEBROW  = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46];
const RIGHT_EYEBROW = [300, 293, 334, 296, 336, 285, 295, 282, 283, 276];

// Eye corners (for sunglasses bridge / lens placement)
const LEFT_EYE_INNER  = 133;
const LEFT_EYE_OUTER  = 33;
const RIGHT_EYE_INNER = 362;
const RIGHT_EYE_OUTER = 263;

// Iris centers — only available when refineLandmarks: true
// Index 468 = left iris center, 473 = right iris center
const LEFT_IRIS_CENTER  = 468;
const RIGHT_IRIS_CENTER = 473;

// ── Nose ──────────────────────────────────────────────────
const NOSE_TIP    = 1;
const NOSE_BRIDGE = 6;

// ── Cheeks ────────────────────────────────────────────────
// Approximate highest-cheekbone landmarks (NOT the ear region)
const LEFT_CHEEK  = 50;   // left zygoma
const RIGHT_CHEEK = 280;  // right zygoma

// Broader cheek polygon for blush masking
const LEFT_CHEEK_REGION  = [205, 50, 187, 147, 123, 116, 117, 118, 119, 100, 126, 142, 203];
const RIGHT_CHEEK_REGION = [425, 280, 411, 376, 352, 345, 346, 347, 348, 329, 355, 371, 423];

// ── Ears ──────────────────────────────────────────────────
const LEFT_TRAGUS   = 234;
const RIGHT_TRAGUS  = 454;
const LEFT_EAR_LOBE  = 177;
const RIGHT_EAR_LOBE = 401;

// ── Forehead ──────────────────────────────────────────────
const FOREHEAD_TOP   = 10;
const FOREHEAD_LEFT  = 21;
const FOREHEAD_RIGHT = 251;

// ── Face oval (for foundation) ────────────────────────────
const FACE_OVAL = [
  10, 338, 297, 332, 284, 251, 389, 356, 454,
  323, 361, 288, 397, 365, 379, 378, 400, 377,
  152, 148, 176, 149, 150, 136, 172,  58, 132,
   93, 234, 127, 162,  21,  54, 103,  67, 109,
];

// ════════════════════════════════════════════════════════════
// SMOOTHING — exponential moving average
// SMOOTHING = 0 → raw (no smoothing), 1 → frozen
// 0.30 gives snappy response without jitter
// ════════════════════════════════════════════════════════════
const SMOOTHING = 0.30;

// ────────────────────────────────────────────────────────────
// TYPE GUARD: only treat result as full mesh if we got ≥468 pts
// ────────────────────────────────────────────────────────────
type LM = { x: number; y: number; z: number };

const isFullFaceMesh = (lm: unknown): lm is LM[] =>
  Array.isArray(lm) && lm.length >= 468;

// ────────────────────────────────────────────────────────────
// traceRegion — trace a polygon using landmark indices
// Caller is responsible for beginPath / closePath / fill/stroke
// ────────────────────────────────────────────────────────────
function traceRegion(
  ctx: CanvasRenderingContext2D,
  lm: LM[],
  indices: number[],
  w: number,
  h: number,
  first = true,
) {
  indices.forEach((idx, i) => {
    const p = lm[idx];
    if (!p) return;
    (i === 0 && first) ? ctx.moveTo(p.x * w, p.y * h) : ctx.lineTo(p.x * w, p.y * h);
  });
}

// ────────────────────────────────────────────────────────────
// smoothLandmarks — exponential moving average per landmark
// ────────────────────────────────────────────────────────────
function smoothLandmarks(
  current: { x: number; y: number; z?: number }[],
  previous: LM[] | null,
): LM[] {
  if (!previous || previous.length !== current.length) {
    return current.map(p => ({ x: p.x, y: p.y, z: p.z ?? 0 }));
  }
  return current.map((p, i) => {
    const prev = previous[i];
    return {
      x: prev.x * SMOOTHING + p.x * (1 - SMOOTHING),
      y: prev.y * SMOOTHING + p.y * (1 - SMOOTHING),
      z: prev.z * SMOOTHING + (p.z ?? 0) * (1 - SMOOTHING),
    };
  });
}

// ────────────────────────────────────────────────────────────
// estimateLandmarksFromBox — used by FaceDetector / manual fallback
// Produces a dense-enough array (478 slots) so isFullFaceMesh passes
// ────────────────────────────────────────────────────────────
function estimateLandmarksFromBox(
  box: { x: number; y: number; width: number; height: number },
  canvasW: number,
  canvasH: number,
): LM[] {
  const cx = (box.x + box.width  / 2) / canvasW;
  const cy = (box.y + box.height / 2) / canvasH;
  const fw = box.width  / canvasW;
  const fh = box.height / canvasH;

  // Start with a 478-slot array (covers refined iris indices up to 477)
  const lm: LM[] = Array.from({ length: 478 }, () => ({ x: cx, y: cy, z: 0 }));
  const p = (rx: number, ry: number): LM => ({ x: cx + rx * fw, y: cy + ry * fh, z: 0 });

  // ── Nose ──
  lm[NOSE_BRIDGE] = p(0, -0.12);
  lm[NOSE_TIP]    = p(0,  0.08);

  // ── Lips ──
  const uLipY = 0.22, lLipY = 0.30;
  UPPER_LIP_OUTER.forEach((idx, i, arr) => {
    const t = i / (arr.length - 1);
    lm[idx] = p(-0.14 + t * 0.28, uLipY - Math.sin(t * Math.PI) * 0.03);
  });
  LOWER_LIP_OUTER.forEach((idx, i, arr) => {
    const t = i / (arr.length - 1);
    lm[idx] = p(0.14 - t * 0.28, lLipY + Math.sin(t * Math.PI) * 0.05);
  });
  UPPER_LIP_INNER.forEach((idx, i, arr) => {
    const t = i / (arr.length - 1);
    lm[idx] = p(-0.10 + t * 0.20, uLipY + 0.015 - Math.sin(t * Math.PI) * 0.015);
  });
  LOWER_LIP_INNER.forEach((idx, i, arr) => {
    const t = i / (arr.length - 1);
    lm[idx] = p(0.10 - t * 0.20, lLipY - 0.015 + Math.sin(t * Math.PI) * 0.020);
  });

  // ── Cheeks ──
  lm[LEFT_CHEEK]   = p(-0.28,  0.05);
  lm[RIGHT_CHEEK]  = p( 0.28,  0.05);
  LEFT_CHEEK_REGION.forEach((idx, i, arr) => {
    const a = (i / arr.length) * Math.PI + Math.PI;
    lm[idx] = p(-0.22 + Math.cos(a) * 0.12, 0.06 + Math.sin(a) * 0.10);
  });
  RIGHT_CHEEK_REGION.forEach((idx, i, arr) => {
    const a = (i / arr.length) * Math.PI;
    lm[idx] = p( 0.22 + Math.cos(a) * 0.12, 0.06 + Math.sin(a) * 0.10);
  });

  // ── Ears / tragus / lobe ──
  lm[LEFT_TRAGUS]   = p(-0.48, -0.04);
  lm[RIGHT_TRAGUS]  = p( 0.48, -0.04);
  lm[LEFT_EAR_LOBE]  = p(-0.46,  0.18);
  lm[RIGHT_EAR_LOBE] = p( 0.46,  0.18);

  // ── Left eye ──
  const lEyeCx = -0.17, eyeY = -0.14;
  LEFT_EYE_UPPER.forEach((idx, i, arr) => {
    const t = i / (arr.length - 1);
    lm[idx] = p(lEyeCx - 0.08 + t * 0.16, eyeY - Math.sin(t * Math.PI) * 0.022);
  });
  LEFT_EYE_LOWER.forEach((idx, i, arr) => {
    const t = i / (arr.length - 1);
    lm[idx] = p(lEyeCx - 0.08 + t * 0.16, eyeY + Math.sin(t * Math.PI) * 0.012);
  });
  LEFT_EYEBROW.forEach((idx, i, arr) => {
    const t = i / (arr.length - 1);
    lm[idx] = p(lEyeCx - 0.09 + t * 0.18, eyeY - 0.050 - Math.sin(t * Math.PI) * 0.010);
  });
  lm[LEFT_EYE_INNER]   = p(lEyeCx + 0.08, eyeY);
  lm[LEFT_EYE_OUTER]   = p(lEyeCx - 0.08, eyeY);
  lm[LEFT_IRIS_CENTER] = p(lEyeCx,          eyeY);

  // ── Right eye ──
  const rEyeCx = 0.17;
  RIGHT_EYE_UPPER.forEach((idx, i, arr) => {
    const t = i / (arr.length - 1);
    lm[idx] = p(rEyeCx - 0.08 + t * 0.16, eyeY - Math.sin(t * Math.PI) * 0.022);
  });
  RIGHT_EYE_LOWER.forEach((idx, i, arr) => {
    const t = i / (arr.length - 1);
    lm[idx] = p(rEyeCx - 0.08 + t * 0.16, eyeY + Math.sin(t * Math.PI) * 0.012);
  });
  RIGHT_EYEBROW.forEach((idx, i, arr) => {
    const t = i / (arr.length - 1);
    lm[idx] = p(rEyeCx - 0.09 + t * 0.18, eyeY - 0.050 - Math.sin(t * Math.PI) * 0.010);
  });
  lm[RIGHT_EYE_INNER]   = p(rEyeCx - 0.08, eyeY);
  lm[RIGHT_EYE_OUTER]   = p(rEyeCx + 0.08, eyeY);
  lm[RIGHT_IRIS_CENTER] = p(rEyeCx,          eyeY);

  // ── Forehead ──
  lm[FOREHEAD_TOP]   = p( 0,    -0.46);
  lm[FOREHEAD_LEFT]  = p(-0.26, -0.42);
  lm[FOREHEAD_RIGHT] = p( 0.26, -0.42);

  // ── Face oval ──
  FACE_OVAL.forEach((idx, i, arr) => {
    const angle = (i / arr.length) * Math.PI * 2 - Math.PI / 2;
    lm[idx] = p(Math.cos(angle) * 0.44, Math.sin(angle) * 0.50);
  });

  return lm;
}

// ────────────────────────────────────────────────────────────
// getFaceAngle — roll angle derived from eye-to-eye vector
// Returns radians; positive = head tilted right
// ────────────────────────────────────────────────────────────
function getFaceAngle(lm: LM[], w: number, h: number): number {
  const le = lm[LEFT_EYE_OUTER];
  const re = lm[RIGHT_EYE_OUTER];
  if (!le || !re) return 0;
  return Math.atan2((re.y - le.y) * h, (re.x - le.x) * w);
}

// ────────────────────────────────────────────────────────────
// eyeCenter — midpoint between two eye-corner landmarks
// ────────────────────────────────────────────────────────────
function eyeCenter(lm: LM[], innerIdx: number, outerIdx: number) {
  const a = lm[innerIdx];
  const b = lm[outerIdx];
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

// ────────────────────────────────────────────────────────────
// hexToRgb — decompose "#rrggbb" → { r, g, b }
// ────────────────────────────────────────────────────────────
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  const n = parseInt(clean.length === 3
    ? clean.split("").map(c => c + c).join("")
    : clean, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
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

  const streamRef        = useRef<MediaStream | null>(null);
  const animFrameRef     = useRef<number>(0);
  const landmarksRef     = useRef<LM[] | null>(null);
  const prevLandmarksRef = useRef<LM[] | null>(null);
  const detectIntervalRef  = useRef<number>(0);
  const selectedProductRef = useRef<string | null>(null);
  const selectedColorRef   = useRef<string>("#be185d");
  const mirroredRef        = useRef(true);
  const faceDetectorRef    = useRef<any>(null);
  // Canvas logical size is set ONCE when the camera starts; never reset inside the draw loop
  const canvasSizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  selectedProductRef.current = selectedProduct;
  selectedColorRef.current   = selectedColor;
  mirroredRef.current        = mirrored;

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
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
      });
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      setCameraOn(true);
      // ── Start the render loop FIRST so the camera feed is visible immediately
      // ── (before MediaPipe CDN script finishes loading)
      startRenderLoop();
      // ── Then start detection in the background
      initDetection();
    } catch (e) {
      console.error("Camera error:", e);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    cancelAnimationFrame(animFrameRef.current);
    clearInterval(detectIntervalRef.current);
    landmarksRef.current     = null;
    prevLandmarksRef.current = null;
    setCameraOn(false);
    setDetecting(false);
  }, []);

  // ──────────────────────────────────────────────────────────
  // loadScript helper
  // ──────────────────────────────────────────────────────────
  const loadScript = (src: string): Promise<void> =>
    new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const s = document.createElement("script");
      s.src = src;
      s.crossOrigin = "anonymous";
      s.onload  = () => resolve();
      s.onerror = reject;
      document.head.appendChild(s);
    });

  // ──────────────────────────────────────────────────────────
  // initDetection — try MediaPipe, then FaceDetector, then manual
  // ──────────────────────────────────────────────────────────
  const initDetection = async () => {
    // ── Strategy 1: MediaPipe FaceMesh (468 + refined iris = 478 points) ──
    try {
      await loadScript(
        "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js"
      );
      const win = window as any;
      if (win.FaceMesh) {
        const faceMesh = new win.FaceMesh({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`,
        });
        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,       // adds iris landmarks (468–477)
          minDetectionConfidence: 0.55,
          minTrackingConfidence: 0.55,
        });

        faceMesh.onResults((results: any) => {
          if (results.multiFaceLandmarks?.length > 0) {
            const raw: { x: number; y: number; z: number }[] = results.multiFaceLandmarks[0];
            if (Array.isArray(raw) && raw.length >= 468) {
              landmarksRef.current = smoothLandmarks(raw, prevLandmarksRef.current);
              prevLandmarksRef.current = landmarksRef.current;
              setDetecting(true);
              return;
            }
          }
          landmarksRef.current     = null;
          prevLandmarksRef.current = null;
          setDetecting(false);
        });

        // Warm-up: send one frame so the WASM binary initialises before we start the loop
        const video = videoRef.current;
        if (video && video.readyState >= 2) {
          await faceMesh.send({ image: video }).catch(() => {/* ignore warm-up error */});
        }

        faceDetectorRef.current = faceMesh;
        setDetectionMode("mediapipe");
        console.log("[Mirror] ✅ MediaPipe FaceMesh 468-landmark tracking active");
        startMediaPipeLoop(faceMesh);
        return;
      }
    } catch (e) {
      console.warn("[Mirror] MediaPipe FaceMesh failed, trying fallback:", e);
    }

    // ── Strategy 2: FaceDetector API ──
    if ("FaceDetector" in window) {
      try {
        const detector = new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
        faceDetectorRef.current = detector;
        setDetectionMode("facedetector");
        console.log("[Mirror] ✅ FaceDetector API tracking active");
        startFaceDetectorLoop();
        return;
      } catch (e) {
        console.warn("[Mirror] FaceDetector API failed, using manual estimate:", e);
      }
    }

    // ── Strategy 3: center-crop manual estimate ──
    setDetectionMode("manual");
    console.log("[Mirror] ✅ Manual face estimation active");
    startManualDetection();
  };

  // ──────────────────────────────────────────────────────────
  // MediaPipe loop — throttled to ~20 fps inference
  // Uses a lock flag so frames don't queue up
  // ──────────────────────────────────────────────────────────
  const startMediaPipeLoop = (faceMesh: any) => {
    let processing = false;
    clearInterval(detectIntervalRef.current);
    detectIntervalRef.current = window.setInterval(() => {
      const video = videoRef.current;
      if (!video || video.paused || video.ended || processing) return;
      processing = true;
      faceMesh
        .send({ image: video })
        .then(() => { processing = false; })
        .catch(() => { processing = false; });
    }, 50); // 20 fps
  };

  // ──────────────────────────────────────────────────────────
  // FaceDetector API loop — ~15 fps
  // ──────────────────────────────────────────────────────────
  const startFaceDetectorLoop = () => {
    clearInterval(detectIntervalRef.current);
    detectIntervalRef.current = window.setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.paused || video.ended || !faceDetectorRef.current) return;
      try {
        const faces = await faceDetectorRef.current.detect(video);
        if (faces.length > 0) {
          const box = faces[0].boundingBox as DOMRectReadOnly;
          landmarksRef.current = smoothLandmarks(
            estimateLandmarksFromBox(
              { x: box.x, y: box.y, width: box.width, height: box.height },
              video.videoWidth,
              video.videoHeight,
            ),
            prevLandmarksRef.current,
          );
          prevLandmarksRef.current = landmarksRef.current;
          setDetecting(true);
        } else {
          landmarksRef.current     = null;
          prevLandmarksRef.current = null;
          setDetecting(false);
        }
      } catch (_) { /* ignore per-frame errors */ }
    }, 66);
  };

  // ──────────────────────────────────────────────────────────
  // Manual fallback — static centre-face estimate at ~7 fps
  // ──────────────────────────────────────────────────────────
  const startManualDetection = () => {
    clearInterval(detectIntervalRef.current);
    detectIntervalRef.current = window.setInterval(() => {
      const v = videoRef.current;
      if (!v || v.paused || v.ended) return;
      const vw = v.videoWidth, vh = v.videoHeight;
      // Guard: video dimensions not ready yet → skip this tick
      if (vw <= 0 || vh <= 0) return;
      const fw = vw * 0.36, fh = vh * 0.46;
      const box = { x: (vw - fw) / 2, y: vh * 0.07, width: fw, height: fh };
      landmarksRef.current = smoothLandmarks(
        estimateLandmarksFromBox(box, vw, vh),
        prevLandmarksRef.current,
      );
      prevLandmarksRef.current = landmarksRef.current;
      setDetecting(true);
    }, 140);
  };

  // ──────────────────────────────────────────────────────────
  // Render loop — 60 fps rAF
  // Canvas size is fixed once; only the image data changes each frame.
  // The mirror transform is applied ONCE to the full canvas via CSS
  // (scaleX(-1)) so landmark coordinates are left in their natural
  // orientation — this is the root fix for the "wrong side" bug.
  // ──────────────────────────────────────────────────────────
  const startRenderLoop = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Fix canvas size once (avoids state-reset every frame)
    const setCanvasSize = () => {
      if (video.videoWidth > 0 && (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight)) {
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        canvasSizeRef.current = { w: video.videoWidth, h: video.videoHeight };
      }
    };

    const ctx = canvas.getContext("2d", { willReadFrequently: false, alpha: false });
    if (!ctx) return;

    const draw = () => {
      // Always schedule next frame FIRST — this way an exception in draw logic
      // cannot kill the loop. The frame is simply skipped and drawing resumes next tick.
      animFrameRef.current = requestAnimationFrame(draw);

      if (video.paused || video.ended) return;

      setCanvasSize();
      const { w, h } = canvasSizeRef.current;
      if (w === 0 || h === 0) return;

      try {
        // Draw video frame — no context transform; mirroring is CSS scaleX(-1)
        ctx.drawImage(video, 0, 0, w, h);

        const lm      = landmarksRef.current;
        const product = selectedProductRef.current;
        const color   = selectedColorRef.current;

        if (isFullFaceMesh(lm) && product) {
          switch (product) {
            case "lipstick":   drawLipstick(ctx, lm, w, h, color);   break;
            case "blush":      drawBlush(ctx, lm, w, h, color);       break;
            case "eyeshadow":  drawEyeshadow(ctx, lm, w, h, color);   break;
            case "eyeliner":   drawEyeliner(ctx, lm, w, h, color);    break;
            case "foundation": drawFoundation(ctx, lm, w, h, color);  break;
            case "sunglasses": drawSunglasses(ctx, lm, w, h, color);  break;
            case "earrings":   drawEarrings(ctx, lm, w, h, color);    break;
          }
        }
      } catch (err) {
        // Log draw errors without stopping the loop
        console.warn("[Mirror] draw error (frame skipped):", err);
      }
    };
    draw();
  };

  // ════════════════════════════════════════════════════════════
  // DRAW FUNCTIONS
  // All coordinates: lm[i].x/y are in [0,1] normalised space,
  // multiply by w/h to get canvas pixels.
  // ════════════════════════════════════════════════════════════

  // ── LIPSTICK ────────────────────────────────────────────────
  // Uses evenodd fill rule: outer lip contour (CW) minus inner lip
  // opening contour (CCW) = only the lip skin is painted.
  // Contour must form a CLOSED path each sub-path.
  const drawLipstick = (ctx: CanvasRenderingContext2D, lm: LM[], w: number, h: number, color: string) => {
    const { r, g, b } = hexToRgb(color);

    ctx.save();

    // ── Pass 1: base colour fill ──
    ctx.globalAlpha = 0.72;
    ctx.fillStyle   = `rgb(${r},${g},${b})`;
    ctx.beginPath();

    // Outer lip: upper (left→right) then lower (right→left) = clockwise = "filled winding"
    traceRegion(ctx, lm, UPPER_LIP_OUTER, w, h, true);
    // Lower outer is already ordered right→left (see LOWER_LIP_OUTER definition)
    traceRegion(ctx, lm, LOWER_LIP_OUTER, w, h, false);
    ctx.closePath();

    // Inner lip opening: upper + lower inner form the "hole"
    // Must be counter-clockwise relative to the outer path for evenodd to carve it out.
    // Because UPPER_LIP_INNER goes left→right and LOWER_LIP_INNER goes right→left,
    // joining them produces a CW sub-path — so we reverse LOWER to make it CCW.
    ctx.moveTo(lm[UPPER_LIP_INNER[0]].x * w, lm[UPPER_LIP_INNER[0]].y * h);
    traceRegion(ctx, lm, UPPER_LIP_INNER, w, h, false);
    [...LOWER_LIP_INNER].reverse().forEach((idx) => ctx.lineTo(lm[idx].x * w, lm[idx].y * h));
    ctx.closePath();

    ctx.fill("evenodd");

    // ── Pass 2: soft blur edge (skin-blend illusion) ──
    // We paint again at very low opacity with a larger feathered brush
    ctx.globalAlpha = 0.14;
    ctx.filter      = "blur(3px)";
    ctx.beginPath();
    traceRegion(ctx, lm, UPPER_LIP_OUTER, w, h, true);
    traceRegion(ctx, lm, LOWER_LIP_OUTER, w, h, false);
    ctx.closePath();
    ctx.fill();
    ctx.filter = "none";

    // ── Pass 3: specular gloss highlight ──
    const lipMid = lm[13]; // centre of upper lip
    const lipW   = Math.abs(lm[291].x - lm[61].x) * w;
    ctx.globalAlpha = 0.26;
    const gloss = ctx.createRadialGradient(
      lipMid.x * w, lipMid.y * h, 0,
      lipMid.x * w, lipMid.y * h, lipW * 0.55,
    );
    gloss.addColorStop(0,   "rgba(255,255,255,0.55)");
    gloss.addColorStop(0.5, "rgba(255,255,255,0.10)");
    gloss.addColorStop(1,   "rgba(255,255,255,0)");
    ctx.fillStyle = gloss;

    // Clip to outer lip before painting glossy layer
    ctx.save();
    ctx.beginPath();
    traceRegion(ctx, lm, UPPER_LIP_OUTER, w, h, true);
    traceRegion(ctx, lm, LOWER_LIP_OUTER, w, h, false);
    ctx.closePath();
    ctx.moveTo(lm[UPPER_LIP_INNER[0]].x * w, lm[UPPER_LIP_INNER[0]].y * h);
    traceRegion(ctx, lm, UPPER_LIP_INNER, w, h, false);
    [...LOWER_LIP_INNER].reverse().forEach((idx) => ctx.lineTo(lm[idx].x * w, lm[idx].y * h));
    ctx.closePath();
    ctx.clip("evenodd");
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    ctx.restore();
  };

  // ── BLUSH ────────────────────────────────────────────────────
  // Soft radial gradient clipped inside anatomically correct cheek polygon.
  const drawBlush = (ctx: CanvasRenderingContext2D, lm: LM[], w: number, h: number, color: string) => {
    const noseTip  = lm[NOSE_TIP];
    const faceW    = Math.abs(lm[RIGHT_TRAGUS].x - lm[LEFT_TRAGUS].x) * w;
    const radius   = faceW * 0.155; // larger than before for better visibility

    const sides = [
      { cheek: lm[LEFT_CHEEK],  region: LEFT_CHEEK_REGION  },
      { cheek: lm[RIGHT_CHEEK], region: RIGHT_CHEEK_REGION },
    ];

    sides.forEach(({ cheek, region }) => {
      // Place blush centre slightly toward the nose tip for more natural look
      const cx = (cheek.x * 0.70 + noseTip.x * 0.30) * w;
      const cy = (cheek.y * 0.70 + noseTip.y * 0.30) * h;

      ctx.save();

      // Clip to exact cheek region
      ctx.beginPath();
      traceRegion(ctx, lm, region, w, h, true);
      ctx.closePath();
      ctx.clip();

      const { r, g, b } = hexToRgb(color);
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0,   `rgba(${r},${g},${b},0.52)`);
      grad.addColorStop(0.45,`rgba(${r},${g},${b},0.28)`);
      grad.addColorStop(0.75,`rgba(${r},${g},${b},0.10)`);
      grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);

      ctx.globalAlpha = 1;
      ctx.fillStyle   = grad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, radius * 1.3, radius, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  };

  // ── EYESHADOW ────────────────────────────────────────────────
  // Painted above the eyelid crease — NOT inside the eyeball area.
  // We extend the upper lid arc upward toward the eyebrow to cover the lid.
  const drawEyeshadow = (ctx: CanvasRenderingContext2D, lm: LM[], w: number, h: number, color: string) => {
    const eyeConfigs = [
      { upper: LEFT_EYE_UPPER,  lower: LEFT_EYE_LOWER,  brow: LEFT_EYEBROW  },
      { upper: RIGHT_EYE_UPPER, lower: RIGHT_EYE_LOWER, brow: RIGHT_EYEBROW },
    ];

    eyeConfigs.forEach(({ upper, lower, brow }) => {
      // Eyelid polygon: upper arc + lower arc (bounds where lashes sit)
      const upperPts = upper.map(i => ({ x: lm[i].x * w, y: lm[i].y * h }));
      const lowerPts = lower.map(i => ({ x: lm[i].x * w, y: lm[i].y * h }));
      const browPts  = brow.map(i  => ({ x: lm[i].x * w, y: lm[i].y * h }));

      // Shadow region = from upper lid arc up to ~50% toward the brow
      const shadowRegion = upperPts.map((p, i) => {
        const browP = browPts[Math.round((i / (upperPts.length - 1)) * (browPts.length - 1))];
        if (!browP) return p;
        return {
          x: p.x * 0.55 + browP.x * 0.45,
          y: p.y * 0.55 + browP.y * 0.45,
        };
      });

      // Clip to lid+shadow region
      ctx.save();
      ctx.beginPath();
      upperPts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      shadowRegion.slice().reverse().forEach(p => ctx.lineTo(p.x, p.y));
      ctx.closePath();

      // Also include the eyeball area for liner effect on lower lash
      lowerPts.forEach(p => ctx.lineTo(p.x, p.y));
      upperPts.slice().reverse().forEach(p => ctx.lineTo(p.x, p.y));
      ctx.closePath();
      ctx.clip();

      // Centre of the lid area
      const allPts = [...upperPts, ...lowerPts];
      const avgX = allPts.reduce((s, p) => s + p.x, 0) / allPts.length;
      const avgY = allPts.reduce((s, p) => s + p.y, 0) / allPts.length;
      const eyeW = Math.hypot(
        upperPts[0].x - upperPts[upperPts.length - 1].x,
        upperPts[0].y - upperPts[upperPts.length - 1].y,
      );

      const { r, g, b } = hexToRgb(color);
      // Gradient: dense near the lash line, fades toward brow
      const grad = ctx.createRadialGradient(avgX, avgY + eyeW * 0.1, 0, avgX, avgY, eyeW * 1.1);
      grad.addColorStop(0,    `rgba(${r},${g},${b},0.72)`);
      grad.addColorStop(0.55, `rgba(${r},${g},${b},0.38)`);
      grad.addColorStop(1,    `rgba(${r},${g},${b},0)`);

      ctx.globalAlpha = 0.82;
      ctx.fillStyle   = grad;
      ctx.fillRect(avgX - eyeW * 1.5, avgY - eyeW * 1.5, eyeW * 3, eyeW * 3);
      ctx.restore();
    });
  };

  // ── EYELINER ─────────────────────────────────────────────────
  // Strokes the upper lash line with a cat-eye wing.
  // Wing direction is computed in SCREEN SPACE so it respects head tilt.
  const drawEyeliner = (ctx: CanvasRenderingContext2D, lm: LM[], w: number, h: number, color: string) => {
    const lineW  = Math.max(1.5, w * 0.0025);
    const wingL  = w * 0.013;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth   = lineW;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    ctx.globalAlpha = 0.90;

    const eyes = [
      { arc: LEFT_EYE_UPPER,  outerIdx: LEFT_EYE_OUTER  },
      { arc: RIGHT_EYE_UPPER, outerIdx: RIGHT_EYE_OUTER },
    ];

    eyes.forEach(({ arc, outerIdx }) => {
      const pts = arc.map(i => ({ x: lm[i].x * w, y: lm[i].y * h }));

      // Upper lid stroke
      ctx.beginPath();
      pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();

      // Wing: extend from the outermost point in the direction the lash line is going
      const outer = { x: lm[outerIdx].x * w, y: lm[outerIdx].y * h };
      // Direction vector from last-minus-1 point to outer corner
      const prev  = pts.length >= 2 ? pts[pts.length - 2] : pts[0];
      const dx = outer.x - prev.x;
      const dy = outer.y - prev.y;
      const len = Math.hypot(dx, dy) || 1;
      // Wing goes outward and slightly upward (−0.4 perpendicular)
      const wx = (dx / len) * wingL + (-dy / len) * wingL * 0.45;
      const wy = (dy / len) * wingL + ( dx / len) * wingL * 0.45;

      ctx.beginPath();
      ctx.moveTo(outer.x, outer.y);
      ctx.lineTo(outer.x + wx, outer.y + wy);
      ctx.stroke();
    });

    ctx.restore();
  };

  // ── FOUNDATION ───────────────────────────────────────────────
  // Very light even-tone overlay across the face oval, excluding
  // the eye openings and mouth so they remain natural.
  const drawFoundation = (ctx: CanvasRenderingContext2D, lm: LM[], w: number, h: number, color: string) => {
    const { r, g, b } = hexToRgb(color);

    ctx.save();

    // Build a single compound path:
    // 1. Face oval    (filled)
    // 2. Lip opening  (hole via evenodd)
    // 3. Left eye     (hole)
    // 4. Right eye    (hole)
    ctx.beginPath();

    // Face oval — clockwise
    traceRegion(ctx, lm, FACE_OVAL, w, h, true);
    ctx.closePath();

    // Mouth hole — must wind opposite (we trace outer lip CW again but as own sub-path)
    ctx.moveTo(lm[UPPER_LIP_OUTER[0]].x * w, lm[UPPER_LIP_OUTER[0]].y * h);
    traceRegion(ctx, lm, UPPER_LIP_OUTER, w, h, false);
    traceRegion(ctx, lm, LOWER_LIP_OUTER, w, h, false);
    ctx.closePath();

    // Left eye hole
    ctx.moveTo(lm[LEFT_EYE_UPPER[0]].x * w, lm[LEFT_EYE_UPPER[0]].y * h);
    traceRegion(ctx, lm, LEFT_EYE_UPPER, w, h, false);
    [...LEFT_EYE_LOWER].reverse().forEach(i => ctx.lineTo(lm[i].x * w, lm[i].y * h));
    ctx.closePath();

    // Right eye hole
    ctx.moveTo(lm[RIGHT_EYE_UPPER[0]].x * w, lm[RIGHT_EYE_UPPER[0]].y * h);
    traceRegion(ctx, lm, RIGHT_EYE_UPPER, w, h, false);
    [...RIGHT_EYE_LOWER].reverse().forEach(i => ctx.lineTo(lm[i].x * w, lm[i].y * h));
    ctx.closePath();

    // Fill with low opacity — evenodd punches out the holes
    ctx.globalAlpha = 0.18;
    ctx.fillStyle   = `rgb(${r},${g},${b})`;
    ctx.fill("evenodd");

    // Soft blur pass for skin-blend effect
    ctx.globalAlpha = 0.09;
    ctx.filter      = "blur(8px)";
    ctx.fill("evenodd");
    ctx.filter      = "none";

    ctx.restore();
  };

  // ── SUNGLASSES ───────────────────────────────────────────────
  // Lenses sized and positioned from eye-landmark geometry.
  // Head rotation via roll angle; arms follow tragus landmarks.
  // All drawing in rotated local coordinates then un-rotated.
  const drawSunglasses = (ctx: CanvasRenderingContext2D, lm: LM[], w: number, h: number, color: string) => {
    const lCenter = eyeCenter(lm, LEFT_EYE_INNER,  LEFT_EYE_OUTER);
    const rCenter = eyeCenter(lm, RIGHT_EYE_INNER, RIGHT_EYE_OUTER);

    const eyeDist = Math.hypot(
      (rCenter.x - lCenter.x) * w,
      (rCenter.y - lCenter.y) * h,
    );
    const angle = getFaceAngle(lm, w, h);
    const midX  = ((lCenter.x + rCenter.x) / 2) * w;
    const midY  = ((lCenter.y + rCenter.y) / 2) * h;

    const lensW       = eyeDist * 0.60;
    const lensH       = lensW  * 0.72;
    const bridgeW     = eyeDist * 0.26;
    const frameStroke = Math.max(2.5, w * 0.0040);

    // Tinted lens colour from frame colour
    const { r, g, b } = hexToRgb(color);
    const lensAlpha   = color === "#18181b" ? 0.68 : 0.45;
    const lensColor   = `rgba(${r},${g},${b},${lensAlpha})`;

    ctx.save();
    ctx.translate(midX, midY);
    ctx.rotate(angle);

    ctx.strokeStyle = color;
    ctx.lineWidth   = frameStroke;

    // ── Left lens ──
    ctx.fillStyle = lensColor;
    drawRoundedRect(ctx, -bridgeW / 2 - lensW, -lensH / 2, lensW, lensH, lensH * 0.30);
    ctx.fill();
    ctx.stroke();

    // ── Right lens ──
    drawRoundedRect(ctx, bridgeW / 2, -lensH / 2, lensW, lensH, lensH * 0.30);
    ctx.fill();
    ctx.stroke();

    // ── Bridge ──
    ctx.beginPath();
    ctx.moveTo(-bridgeW / 2, lensH * 0.05);
    ctx.bezierCurveTo(-bridgeW / 6, -lensH * 0.08, bridgeW / 6, -lensH * 0.08, bridgeW / 2, lensH * 0.05);
    ctx.stroke();

    // ── Arms (temple pieces) — drawn in rotated coords, targeting tragus ──
    const leftTragus  = lm[LEFT_TRAGUS];
    const rightTragus = lm[RIGHT_TRAGUS];
    // Convert tragus from canvas coords to local rotated coords
    const toLocal = (lmx: number, lmy: number) => {
      const dx = lmx * w - midX;
      const dy = lmy * h - midY;
      return {
        x:  dx * Math.cos(-angle) - dy * Math.sin(-angle),
        y:  dx * Math.sin(-angle) + dy * Math.cos(-angle),
      };
    };
    const lTragusLocal  = toLocal(leftTragus.x,  leftTragus.y);
    const rTragusLocal  = toLocal(rightTragus.x, rightTragus.y);

    ctx.lineWidth = frameStroke * 0.68;
    ctx.beginPath();
    ctx.moveTo(-bridgeW / 2 - lensW,  lensH * 0.08);
    ctx.lineTo(lTragusLocal.x, lTragusLocal.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(bridgeW / 2 + lensW,   lensH * 0.08);
    ctx.lineTo(rTragusLocal.x, rTragusLocal.y);
    ctx.stroke();

    // ── Glare on lenses ──
    ctx.globalAlpha = 0.22;
    ctx.fillStyle   = "rgba(255,255,255,0.8)";
    ctx.beginPath();
    ctx.ellipse(-bridgeW / 2 - lensW * 0.68, -lensH * 0.20, lensW * 0.14, lensH * 0.08, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(bridgeW / 2 + lensW * 0.32, -lensH * 0.20, lensW * 0.14, lensH * 0.08, -0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  // ── EARRINGS ────────────────────────────────────────────────
  // Drop earrings anchored to ear-lobe landmarks, rotated with head tilt.
  const drawEarrings = (ctx: CanvasRenderingContext2D, lm: LM[], w: number, h: number, color: string) => {
    const faceW      = Math.abs(lm[RIGHT_TRAGUS].x - lm[LEFT_TRAGUS].x) * w;
    const stud       = faceW * 0.024;
    const dropLen    = faceW * 0.070;
    const headAngle  = getFaceAngle(lm, w, h) * 0.40; // partial tilt
    const { r, g, b } = hexToRgb(color);

    const lobes = [
      { lm: lm[LEFT_EAR_LOBE]  },
      { lm: lm[RIGHT_EAR_LOBE] },
    ];

    lobes.forEach(({ lm: lobe }) => {
      ctx.save();
      ctx.translate(lobe.x * w, lobe.y * h);
      ctx.rotate(headAngle);
      ctx.globalAlpha = 0.92;
      ctx.fillStyle   = `rgb(${r},${g},${b})`;

      // Stud / post
      ctx.beginPath();
      ctx.arc(0, 0, stud, 0, Math.PI * 2);
      ctx.fill();

      // Connector stem
      ctx.beginPath();
      ctx.moveTo(-stud * 0.25, stud * 0.9);
      ctx.lineTo( stud * 0.25, stud * 0.9);
      ctx.lineTo( stud * 0.20, stud + dropLen * 0.35);
      ctx.lineTo(-stud * 0.20, stud + dropLen * 0.35);
      ctx.closePath();
      ctx.fill();

      // Drop gem (teardrop)
      ctx.beginPath();
      ctx.arc(0, stud + dropLen, stud * 0.72, 0, Math.PI * 2);
      ctx.fill();

      // Rim highlight
      ctx.globalAlpha = 0.45;
      ctx.fillStyle   = "rgba(255,255,255,0.9)";
      ctx.beginPath();
      ctx.arc(-stud * 0.28, -stud * 0.28, stud * 0.32, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  };

  // ── Rounded rect helper ──────────────────────────────────────
  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number, y: number, rw: number, rh: number, radius: number,
  ) => {
    const r = Math.min(radius, rw / 2, rh / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + rw - r, y);
    ctx.quadraticCurveTo(x + rw, y, x + rw, y + r);
    ctx.lineTo(x + rw, y + rh - r);
    ctx.quadraticCurveTo(x + rw, y + rh, x + rw - r, y + rh);
    ctx.lineTo(x + r, y + rh);
    ctx.quadraticCurveTo(x, y + rh, x, y + rh - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  useEffect(() => () => stopCamera(), [stopCamera]);

  const filteredProducts = products.filter((p) => p.category === activeTab);

  const modeLabel: Record<DetectionMode, string> = {
    loading:     "INICIALIZANDO...",
    mediapipe:   "MEDIAPIPE 468 LANDMARKS",
    facedetector:"FACE DETECTOR API",
    manual:      "MODO ESTIMADO",
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

  // Canvas CSS mirror: only flip the displayed image via CSS transform.
  // The landmark draw functions always run in the natural (unflipped) coordinate space.
  const canvasCssTransform = mirrored ? "scaleX(-1)" : undefined;

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
              {/* Hidden video element — source for canvas */}
              <video ref={videoRef} className="hidden" playsInline muted />

              {/* Canvas: mirroring done via CSS only, canvas content is never flipped */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ transform: canvasCssTransform }}
              />

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
                  <Button variant="glass" size="icon" onClick={() => setMirrored(m => !m)}>
                    <FlipHorizontal className="w-4 h-4" />
                  </Button>
                  <Button variant="glass" size="icon" onClick={stopCamera}>
                    <CameraOff className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Product selection panel */}
            <div className="space-y-4">
              <div className="flex rounded-xl bg-secondary p-1 gap-1">
                {(["beauty", "accessories"] as ProductCategory[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { setActiveTab(tab); setSelectedProduct(null); }}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
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
                        onClick={() =>
                          setSelectedProduct(selectedProduct === product.id ? null : product.id)
                        }
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
                                selectedColor === c.color
                                  ? "border-foreground scale-110"
                                  : "border-transparent"
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
                    <div>
                      Modo:{" "}
                      <span className="text-foreground font-mono">
                        {detectionMode === "mediapipe"
                          ? "AI 468pts"
                          : detectionMode === "facedetector"
                          ? "NATIVO"
                          : "ESTIMADO"}
                      </span>
                    </div>
                    <div>
                      FPS:{" "}
                      <span className="text-foreground font-mono">
                        {detectionMode === "mediapipe" ? "~20" : detectionMode === "facedetector" ? "~15" : "~7"}
                      </span>
                    </div>
                    <div>
                      Precisão:{" "}
                      <span className="text-foreground font-mono">
                        {detectionMode === "mediapipe" ? "ALTA" : detectionMode === "facedetector" ? "MÉDIA" : "BÁSICA"}
                      </span>
                    </div>
                    <div>
                      Smooth: <span className="text-foreground font-mono">EMA {SMOOTHING}</span>
                    </div>
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
