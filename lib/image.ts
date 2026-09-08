type DecodedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
};

async function decodeWithImageElement(file: File): Promise<DecodedImage> {
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("image element decode failed"));
      image.src = objectUrl;
    });

    if (!image.naturalWidth || !image.naturalHeight) {
      throw new Error("image has no dimensions");
    }

    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      close: () => URL.revokeObjectURL(objectUrl),
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

async function decodeImage(file: File): Promise<DecodedImage> {
  try {
    const bitmap = await createImageBitmap(file);
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      close: () => bitmap.close(),
    };
  } catch {
    // Some mobile browsers can display image formats that their
    // createImageBitmap implementation cannot decode.
    return decodeWithImageElement(file);
  }
}

function conversionError(file: File) {
  const extension = file.name.split(".").pop()?.toUpperCase();
  const format = extension ? ` (${extension})` : "";
  return new Error(
    `לא הצלחנו לקרוא את התמונה „${file.name}”${format}. ` +
      "אפשר לנסות לבחור אותה מחדש או לשמור/לשתף אותה כתמונת JPG, PNG או WebP ואז להעלות שוב."
  );
}

async function canvasToJpeg(
  canvas: HTMLCanvasElement,
  quality: number,
  file: File
): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(conversionError(file))),
      "image/jpeg",
      quality
    )
  );
}

export async function sanitizeImage(
  file: File,
  maxSide = 1400,
  quality = 0.78
): Promise<Blob> {
  let decoded: DecodedImage;
  try {
    decoded = await decodeImage(file);
  } catch {
    throw conversionError(file);
  }

  try {
    const scale = Math.min(1, maxSide / Math.max(decoded.width, decoded.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(decoded.width * scale));
    canvas.height = Math.max(1, Math.round(decoded.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw conversionError(file);
    context.drawImage(decoded.source, 0, 0, canvas.width, canvas.height);
    return await canvasToJpeg(canvas, quality, file);
  } finally {
    decoded.close();
  }
}

export async function sanitizeProfileImage(
  file: File,
  size = 512,
  quality = 0.86
): Promise<Blob> {
  let decoded: DecodedImage;
  try {
    decoded = await decodeImage(file);
  } catch {
    throw conversionError(file);
  }

  try {
    const sourceSize = Math.min(decoded.width, decoded.height);
    const sourceX = Math.round((decoded.width - sourceSize) / 2);
    const sourceY = Math.round((decoded.height - sourceSize) / 2);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) throw conversionError(file);
    context.drawImage(
      decoded.source,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      size,
      size
    );
    return await canvasToJpeg(canvas, quality, file);
  } finally {
    decoded.close();
  }
}
