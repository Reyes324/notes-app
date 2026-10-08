const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export function isSupportedImage(file: File) {
  return ALLOWED_TYPES.includes(file.type);
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image decode failed"));
    };
    img.src = url;
  });
}

// 缩放并压缩图片；GIF 保持原样以保留动画
async function compressImage(file: File, maxSize: number, quality: number): Promise<Blob> {
  if (file.type === "image/gif") return file;

  const img = await loadImage(file);
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality)
  );
  // 压缩后反而更大（如小尺寸 PNG 图标）时用原图
  return blob && blob.size < file.size ? blob : file;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * 上传图片并返回可用于 <img src> 的地址。
 * 优先上传到 Vercel Blob；若服务端未配置或网络不可用，退回到压缩后的 base64 内联。
 */
export async function uploadImage(file: File): Promise<string> {
  const compressed = await compressImage(file, 1600, 0.85);

  const form = new FormData();
  form.append("file", compressed, compressed.type === "image/webp" ? "image.webp" : file.name);

  let res: Response | null = null;
  try {
    res = await fetch("/api/upload", { method: "POST", body: form });
  } catch {
    // 网络不可用，走内联
  }
  if (res?.ok) {
    const { url } = await res.json();
    return url;
  }
  if (res && res.status !== 501) {
    throw new Error(`upload failed: ${res.status}`);
  }

  // 内联存储会进入笔记数据本身，压得更小一些
  const small = await compressImage(file, 1200, 0.75);
  return blobToDataUrl(small);
}
