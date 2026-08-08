# Shelby Prompts Marketplace

A decentralized marketplace for buying and selling AI prompts (Midjourney, ChatGPT, Claude, Stable Diffusion, and more) — built on Aptos and Shelby.

**Live:** https://shelby-ai-prompt-marketplace.vercel.app
**Repo:** https://github.com/kakah4/shelby-ai-prompt-marketplace

## What it does

Creators upload AI prompts along with proof of what the prompt actually produces — written sample output and an optional screenshot/image — so buyers can judge quality before paying. Buyers unlock the full prompt with an on-chain ShelbyUSD payment straight to the creator's wallet. No platform cut.

## How Shelby is used

The full prompt text — the actual content being sold — is stored as a blob on **Shelby** (Shelbynet), not in a centralized database. When a creator uploads a prompt:

1. The prompt text is uploaded to Shelby via `ShelbyNodeClient` (server-side, `api/upload.ts`)
2. The resulting Shelby blob is served back to the browser through a proxy route (`api/blob.ts`) using the SDK's documented `client.download()` method
3. Only the Shelby blob URL + listing metadata (title, price, category, sample output, creator address) are indexed in Supabase for browsing/search

Avatars and proof-of-output images are stored in Supabase Storage — they're supporting metadata, not the product itself, so the core "buy/sell prompts" flow is what lives on Shelby.

## Payments

Buyers pay ShelbyUSD directly to the creator's connected wallet using Aptos's `0x1::primary_fungible_store::transfer`, signed via Petra (Aptos Wallet Adapter). 100% of the payment goes to the creator.

## Pages

- **`/`** — Landing page
- **`/browse`** — Browse and filter all listed prompts
- **`/sell`** — Upload a prompt (title, price, category, full prompt, proof of output)
- **`/creator/:address`** — Creator profile (avatar, bio, their listed prompts) — editable if it's your own connected wallet

## Stack

- React + TypeScript + Vite
- Aptos Wallet Adapter (Petra) for wallet connection and payments
- `@shelby-protocol/sdk` for blob storage on Shelby
- Supabase for listing metadata, creator profiles, and image storage
- Vercel for hosting + serverless upload/proxy functions

## Local development

```bash
npm install
npm run dev
```

### Environment variables

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SHELBY_API_KEY=
SHELBY_PRIVATE_KEY=
```

`SHELBY_API_KEY` and `SHELBY_PRIVATE_KEY` are server-side only (used in `api/upload.ts` and `api/blob.ts`) — they authenticate the app's own Shelby account for storing content. They're unrelated to which wallet a user connects for browsing, selling, or paying.
