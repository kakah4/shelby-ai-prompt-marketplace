import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const blobName = req.query.name;
  if (!blobName || typeof blobName !== "string") {
    return res.status(400).json({ error: "Missing name" });
  }

  const apiKey = process.env.SHELBY_API_KEY;
  const privateKey = process.env.SHELBY_PRIVATE_KEY;
  if (!apiKey || !privateKey) return res.status(500).json({ error: "Shelby not configured" });

  const signer = Account.fromPrivateKey({ privateKey: new Ed25519PrivateKey(privateKey) });
  const blobUrl = `https://api.shelbynet.shelby.xyz/shelby/v1/blobs/${signer.accountAddress.toString()}/${blobName
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;

  try {
    const shelbyRes = await fetch(blobUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!shelbyRes.ok || !shelbyRes.body) {
      return res.status(shelbyRes.status).json({ error: "Blob not found on Shelby" });
    }

    const contentType = shelbyRes.headers.get("content-type") || "application/octet-stream";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    const buffer = Buffer.from(await shelbyRes.arrayBuffer());
    return res.status(200).send(buffer);
  } catch (e: any) {
    console.error("Blob proxy error:", e);
    return res.status(500).json({ error: e.message || "Failed to fetch blob" });
  }
}
