export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadTextToShelby(text: string, blobName: string): Promise<string> {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ promptText: text, blobName }),
  });
  const data = await res.json();
  return data.blobUrl || "";
}

export async function uploadFileToShelby(file: File, blobName: string): Promise<string> {
  const base64Data = await fileToBase64(file);
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64Data, blobName, contentType: file.type }),
  });
  const data = await res.json();
  return data.blobUrl || "";
}
