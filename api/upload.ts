import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Account, AccountAddress, Ed25519PrivateKey, Network } from "@aptos-labs/ts-sdk";
import { ShelbyNodeClient } from "@shelby-protocol/sdk/node";

async function verifyBlobExists(
  client: ShelbyNodeClient,
  account: AccountAddress,
  blobName: string,
  attempts = 8,
  delayMs = 2000
): Promise<{ ok: true } | { ok: false; lastError: string }> {
  let lastError = "Unknown error";
  for (let i = 0; i < attempts; i++) {
    try {
      const blob = await client.download({ account, blobName });
      // Drain the stream so a body-read failure also counts as unverified.
      await new Response(blob.readable).arrayBuffer();
      return { ok: true };
    } catch (e: any) {
      lastError = e?.message || String(e);
      console.error(`verifyBlobExists attempt ${i + 1}/${attempts} failed:`, lastError);
    }
    if (i < attempts - 1) await new Promise(r => setTimeout(r, delayMs));
  }
  return { ok: false, lastError };
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

    // Matches the network the Geomi API key was provisioned for (Shelbynet)
    const client = new ShelbyNodeClient({ network: Network.SHELBYNET, apiKey });
    const signer = Account.fromPrivateKey({ privateKey: new Ed25519PrivateKey(privateKey) });
    console.log("SIGNER:", signer.accountAddress.toString());

    const blobData = base64Data
      ? new Uint8Array(Buffer.from(base64Data, "base64"))
      : new TextEncoder().encode(promptText);

    const TIME_TO_LIVE = 365 * 24 * 60 * 60 * 1_000_000;

    try {
      // @shelby-protocol/sdk was upgraded 0.3.0 -> 0.6.0: the old version's upload()
      // called coordination.getBlobMetadata() first, which threw a BigInt coercion
      // error on every call, and its createRegisterBlobPayload() had drifted out of
      // sync with the deployed contract's register_blob ABI (missing selectedLocation/
      // locationHint params), causing "Type mismatch for argument 1, expected 'string'".
      // 0.6.0 removes the broken pre-check and matches the current contract ABI, so we
      // can go back to the documented client.upload() instead of manually orchestrating
      // registerBlob/putBlob ourselves.
      await client.upload({
        blobData,
        signer,
        blobName,
        expirationMicros: Date.now() * 1000 + TIME_TO_LIVE,
      });
      console.log("Upload call completed. blobName:", blobName, contentType || "text/plain");
    } catch (uploadErr: any) {
      console.error("Shelby upload failed:", uploadErr.message);
      return res.status(200).json({ success: false, blobUrl: "", error: uploadErr.message });
    }

    const verification = await verifyBlobExists(client, signer.accountAddress, blobName);
    if (!verification.ok) {
      console.error("Blob verification failed after upload:", blobName, "| last error:", verification.lastError);
      return res.status(200).json({
        success: false,
        blobUrl: "",
        error: `Upload could not be verified on Shelby: ${verification.lastError}`,
      });
    }

    const proxyUrl = `/api/blob?name=${encodeURIComponent(blobName)}`;
    return res.status(200).json({ success: true, blobUrl: proxyUrl });
  } catch (e: any) {
    console.error("Upload error:", e);
    return res.status(500).json({ error: e.message || "Upload failed" });
  }
}
