import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Account, AccountAddress, Ed25519PrivateKey, Network } from "@aptos-labs/ts-sdk";
import {
  ShelbyNodeClient,
  createDefaultErasureCodingProvider,
  defaultErasureCodingConfig,
  generateCommitments,
} from "@shelby-protocol/sdk/node";

async function verifyBlobExists(
  client: ShelbyNodeClient,
  account: AccountAddress,
  blobName: string,
  attempts = 8,
  delayMs = 2000
): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    try {
      // Use the same documented download() path the /api/blob proxy uses for reads,
      // rather than a raw authenticated fetch against a hand-built URL.
      const blob = await client.download({ account, blobName });
      // Drain the stream so a body-read failure also counts as unverified.
      await new Response(blob.readable).arrayBuffer();
      return true;
    } catch (e: any) {
      console.log(`verifyBlobExists attempt ${i + 1}/${attempts} failed: ${e.message}`);
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

    // Matches the network the Geomi API key was provisioned for (Shelbynet)
    const client = new ShelbyNodeClient({ network: Network.SHELBYNET, apiKey });
    const signer = Account.fromPrivateKey({ privateKey: new Ed25519PrivateKey(privateKey) });
    console.log("SIGNER:", signer.accountAddress.toString());

    const blobData = base64Data
      ? new Uint8Array(Buffer.from(base64Data, "base64"))
      : new TextEncoder().encode(promptText);

    const TIME_TO_LIVE = 365 * 24 * 60 * 60 * 1_000_000;

    try {
      // client.upload() is not used here: it unconditionally calls
      // coordination.getBlobMetadata() first to check whether the blob already exists,
      // and that call passes the SDK's internal "@<address>/<blobName>" key straight
      // into an Aptos view-function argument. On this contract/SDK version that key
      // gets coerced with BigInt(...) somewhere in argument encoding and throws
      // "Cannot convert @.../... to a BigInt" on every single call — new blob or not.
      // We replicate upload()'s own logic (register on-chain, wait for confirmation,
      // then put the bytes) while skipping that broken pre-check entirely.
      const provider = await createDefaultErasureCodingProvider();
      const blobCommitments = await generateCommitments(provider, blobData);

      const { transaction } = await client.coordination.registerBlob({
        account: signer,
        blobName,
        blobMerkleRoot: blobCommitments.blob_merkle_root,
        size: blobData.length,
        expirationMicros: Date.now() * 1000 + TIME_TO_LIVE,
        config: defaultErasureCodingConfig(),
      });
      await client.coordination.aptos.waitForTransaction({ transactionHash: transaction.hash });

      await client.rpc.putBlob({
        account: signer.accountAddress,
        blobName,
        blobData,
      });

      console.log("Upload completed via manual orchestration. txHash:", transaction.hash, "| blobName:", blobName, contentType || "text/plain");
    } catch (uploadErr: any) {
      console.error("Shelby upload failed:", uploadErr.message);
      return res.status(200).json({ success: false, blobUrl: "", error: uploadErr.message });
    }

    const verified = await verifyBlobExists(client, signer.accountAddress, blobName);
    if (!verified) {
      console.error("Blob verification failed after upload:", blobName);
      return res.status(200).json({ success: false, blobUrl: "", error: "Upload could not be verified on Shelby" });
    }

    const proxyUrl = `/api/blob?name=${encodeURIComponent(blobName)}`;
    return res.status(200).json({ success: true, blobUrl: proxyUrl });
  } catch (e: any) {
    console.error("Upload error:", e);
    return res.status(500).json({ error: e.message || "Upload failed" });
  }
}
