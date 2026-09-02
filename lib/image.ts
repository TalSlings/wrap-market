export async function sanitizeImage(file:File,maxSide=1800,quality=.82):Promise<Blob>{
 const bitmap=await createImageBitmap(file);const scale=Math.min(1,maxSide/Math.max(bitmap.width,bitmap.height));
 const canvas=document.createElement("canvas");canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
 canvas.getContext("2d")!.drawImage(bitmap,0,0,canvas.width,canvas.height);
 return await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("image conversion failed")),"image/jpeg",quality));
}

export async function sanitizeProfileImage(
  file: File,
  size = 512,
  quality = 0.86
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const sourceSize = Math.min(bitmap.width, bitmap.height);
  const sourceX = Math.round((bitmap.width - sourceSize) / 2);
  const sourceY = Math.round((bitmap.height - sourceSize) / 2);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  canvas
    .getContext("2d")!
    .drawImage(
      bitmap,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      size,
      size
    );
  bitmap.close();

  return await new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("image conversion failed")),
      "image/jpeg",
      quality
    )
  );
}
