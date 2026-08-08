import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Account, Ed25519PrivateKey, Network } from "@aptos-labs/ts-sdk";
import { ShelbyNodeClient } from "@shelby-protocol/sdk/node";

async function verifyBlobExists(url: string, apiKey: string, attempts = 8, delayMs = 2000): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { method: "GET", headers: { Authorization: `Bearer ${apiKey}` } });
      if (res.ok) return true;
    } catch {
      // ignore and retry
    }
    if (i < attempts - 1) await new Promise(r => setTimeout(r, delayMs));
  }
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { promptText, blobName, base64Data, contentType } = req.body;

    if (!blobName || (!promptText && !base64Data)) {
      return res.status(400).json({ error: "Missing blobName and (promptText or base64Data)" });
    }

    const apiKey = process.env.SHELBY_API_KEY;
    const privateKey = process.env.SHELBY_PRIVATE_KEY;
    if (!apiKey || !privateKey) return res.status(500).json({ error: "Shelby not configured" });

    // Matches the network the Geomi API key was provisioned for (Testnet)
    const client = new ShelbyNodeClient({ network: Network.TESTNET, apiKey });
    const signer = Account.fromPrivateKey({ privateKey: new Ed25519PrivateKey(privateKey) });
    console.log("SIGNER:", signer.accountAddress.toString());

    const blobData = base64Data
      ? new Uint8Array(Buffer.from(base64Data, "base64"))
      : new TextEncoder().encode(promptText);

    const TIME_TO_LIVE = 365 * 24 * 60 * 60 * 1_000_000;
    const encodedName = encodeURIComponent(blobName).replace(/%2F/g, "/");
    const blobUrl = `https://api.testnet.shelby.xyz/shelby/v1/blobs/${signer.accountAddress}/${encodedName}`;

    try {
      await client.upload({
        blobData,
        signer,
        blobName,
        expirationMicros: Date.now() * 1000 + TIME_TO_LIVE,
      });
      console.log("Upload call completed:", blobUrl, contentType || "text/plain");
    } catch (uploadErr: any) {
      console.error("Shelby upload failed:", uploadErr.message);
      return res.status(200).json({ success: false, blobUrl: "", error: uploadErr.message });
    }

    const verified = await verifyBlobExists(blobUrl, apiKey);
    if (!verified) {
      console.error("Blob verification failed after upload:", blobUrl);
      return res.status(200).json({ success: false, blobUrl: "", error: "Upload could not be verified on Shelby" });
    }

    return res.status(200).json({ success: true, blobUrl });
  } catch (e: any) {
    console.error("Upload error:", e);
    return res.status(500).json({ error: e.message || "Upload failed" });
  }
}
