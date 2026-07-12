# World Cup Aura — Superteam Submission

**Live:** https://worldcupaura.com

Turn a selfie + a 30-second quiz into a collectible World Cup **Aura Card** — with
AI portrait, stats, rarity, and the pro footballer you most resemble — that you
can **mint as a Solana NFT**.

## What it does
1. **Selfie → AI portrait** (OpenAI `gpt-image-1`).
2. **Quiz → your Aura**: six stats, a rarity tier, a prophecy, and your look-alike footballer.
3. **Save · Share · Mint** — mint it as a Solana devnet NFT in-app, or order a physical card.

## Why it's Solana-native
- **Verifiable rarity (VRF).** Each card's randomness is seeded by an on-chain
  **Solana slot-hash VRF** — rarity isn't just "trust us," it carries a
  *verified on-chain* badge anyone can check (`vrf_tx_sig`).
- **Frictionless sponsored minting.** No wallet setup required: a throwaway devnet
  wallet is auto-created/funded and a **treasury wallet sponsors the mint**
  (Metaplex Token Metadata). Real wallets can also be connected as the mint target.
- **On-chain data subscription.** The live World Cup fixtures ticker runs on the
  **TxOdds / TxLINE** feed, whose free tier is activated by an **on-chain Solana
  subscription** (Token-2022 ATA → `subscribe` on the oracle program → signed
  token activation) — the wallet itself proves entitlement, no API-key handoff.

## Tech
React 19 + Vite · Express 5 · Postgres (Neon) + Drizzle · Solana web3.js,
Anchor, Metaplex, wallet-adapter. Self-hosted (Docker + nginx + TLS, HTTPS,
US-East DB for low latency).

## Links
- **Live app:** https://worldcupaura.com
- **Repo:** https://github.com/Digitalfrontiersman/World-Cup-Aura (`Bilal` branch)
