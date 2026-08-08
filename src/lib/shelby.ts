export async function uploadTextToShelby(text: string, blobName: string): Promise<string> {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ promptText: text, blobName }),
  });
  const data = await res.json();
  return data.success ? data.blobUrl || "" : "";
}
