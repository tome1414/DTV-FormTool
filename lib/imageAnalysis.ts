// Canvas API-based image analysis. Runs entirely in the browser — no server or API cost.

interface RGB { r: number; g: number; b: number }

function isWhite({ r, g, b }: RGB, threshold = 235): boolean {
  return r >= threshold && g >= threshold && b >= threshold;
}

function avgRGB(data: Uint8ClampedArray, width: number, x0: number, y0: number, x1: number, y1: number): RGB {
  let r = 0, g = 0, b = 0, n = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * width + x) * 4;
      r += data[i]; g += data[i + 1]; b += data[i + 2];
      n++;
    }
  }
  return n > 0 ? { r: r / n, g: g / n, b: b / n } : { r: 0, g: 0, b: 0 };
}

// Decode image file → scaled pixel buffer (max 600px on longest side for performance)
async function decodeImage(file: File): Promise<{ data: Uint8ClampedArray; width: number; height: number } | null> {
  if (!file.type.startsWith("image/")) return null;
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const MAX = 600;
        const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.floor(img.naturalWidth * scale));
        const h = Math.max(1, Math.floor(img.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve({ data: ctx.getImageData(0, 0, w, h).data, width: w, height: h });
      } catch {
        resolve(null);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

// Count consecutive white rows/cols from an edge.
// Returns the margin depth as a ratio (0–1) of the image dimension.
function marginRatio(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  edge: "top" | "bottom" | "left" | "right",
): number {
  const isHoriz = edge === "top" || edge === "bottom";
  const major = isHoriz ? height : width;   // axis we scan along
  const minor = isHoriz ? width : height;   // axis we sample across

  const SAMPLES = Math.min(minor, 30);
  const step = Math.max(1, Math.floor(minor / SAMPLES));

  for (let d = 0; d < major; d++) {
    const pos = edge === "bottom" ? major - 1 - d : edge === "right" ? major - 1 - d : d;
    let whites = 0, total = 0;
    for (let s = 0; s < minor; s += step) {
      const [x, y] = isHoriz ? [s, pos] : [pos, s];
      const i = (y * width + x) * 4;
      if (isWhite({ r: data[i], g: data[i + 1], b: data[i + 2] })) whites++;
      total++;
    }
    // Row/column is considered "content" when >20% of sampled pixels are non-white
    if (whites / total < 0.80) return d / major;
  }
  return 1; // entire edge is white
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface AnalysisWarning {
  level: "warn";
  message: string;
}

/**
 * Passport: warn if any edge has a white margin > 30% of the image dimension.
 */
export async function checkPassportMargin(file: File): Promise<AnalysisWarning | null> {
  const px = await decodeImage(file);
  if (!px) return null;

  const ratios = (["top", "bottom", "left", "right"] as const).map((e) =>
    marginRatio(px.data, px.width, px.height, e),
  );
  const max = Math.max(...ratios);

  if (max > 0.30) {
    return {
      level: "warn",
      message: `余白が広すぎます（最大 約${Math.round(max * 100)}%）。申請サイトで読み込みエラーになる可能性があります。トリミングして再アップロードしてください。`,
    };
  }
  return null;
}

/**
 * Portrait photo: warn if the 4 corner regions are not white.
 * Corners are where background is visible before face cropping.
 */
export async function checkPhotoBackground(file: File): Promise<AnalysisWarning | null> {
  const px = await decodeImage(file);
  if (!px) return null;

  const { data, width: w, height: h } = px;
  const cw = Math.max(2, Math.floor(w * 0.12));
  const ch = Math.max(2, Math.floor(h * 0.12));

  const corners = [
    avgRGB(data, w, 0,      0,      cw,    ch),
    avgRGB(data, w, w - cw, 0,      w,     ch),
    avgRGB(data, w, 0,      h - ch, cw,    h),
    avgRGB(data, w, w - cw, h - ch, w,     h),
  ];
  const avg: RGB = {
    r: corners.reduce((s, c) => s + c.r, 0) / 4,
    g: corners.reduce((s, c) => s + c.g, 0) / 4,
    b: corners.reduce((s, c) => s + c.b, 0) / 4,
  };

  if (!isWhite(avg, 220)) {
    let hint = `RGB(${Math.round(avg.r)}, ${Math.round(avg.g)}, ${Math.round(avg.b)})`;
    if (avg.b > avg.r + 25 && avg.b > avg.g + 10) hint = "青系背景の可能性";
    else if (avg.g > avg.r + 25)                   hint = "緑系背景の可能性";
    else if (avg.r > avg.b + 40 && avg.r > avg.g + 40) hint = "赤系背景の可能性";

    return {
      level: "warn",
      message: `背景が白ではない可能性があります（${hint}）。白背景の写真に差し替えてください。`,
    };
  }
  return null;
}
