import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Account, Ed25519PrivateKey, Network } from "@aptos-labs/ts-sdk";
import { ShelbyNodeClient } from "@shelby-protocol/sdk/node";

const EXT_CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  txt: "text/plain",
};

function contentTypeForBlobName(blobName: string): string {
  const ext = blobName.split(".").pop()?.toLowerCase() || "";
  return EXT_CONTENT_TYPES[ext] || "application/octet-stream";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const blobName = req.query.name;
  if (!blobName || typeof blobName !== "string") {
    return res.status(400).json({ error: "Missing name" });
  }

  const apiKey = process.env.SHELBY_API_KEY;
  const privateKey = process.env.SHELBY_PRIVATE_KEY;
  if (!apiKey || !privateKey) return res.status(500).json({ error: "Shelby not configured" });

  try {
    const client = new ShelbyNodeClient({ network: Network.SHELBYNET, apiKey });
    const signer = Account.fromPrivateKey({ privateKey: new Ed25519PrivateKey(privateKey) });

    const blob = await client.download({
      account: signer.accountAddress,
      blobName,
    });

    res.setHeader("Content-Type", contentTypeForBlobName(blobName));
    res.setHeader("Content-Length", String(blob.contentLength));
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    const reader = blob.readable.getReader();
    res.status(200);
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  } catch (e: any) {
    console.error("Blob download error:", e.message);
    return res.status(404).json({ error: e.message || "Blob not found on Shelby" });
  }
}
