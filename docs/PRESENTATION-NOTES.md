# Presentation / Demo Notes — World Cup Aura

Practical tech things to know before you present. **Live at https://worldcupaura.com**

## ✅ What's working right now
- App (HTTPS), API, Postgres (Neon US-East), TLS + www + deep links.
- **AI portrait** generation (OpenAI `gpt-image-1`).
- **Verifiable rarity** (Solana slot-hash VRF) + **sponsored minting** (Metaplex, devnet).
- **TxOdds/TxLINE**: live fixtures **ticker** + **odds-driven aura**, signed up via an **on-chain Solana subscription**.
- **Docs** page at `/docs`.

## 🔥 Before you present (2-min checklist)
1. **Warm up the DB.** Open the site ~1 min before — Neon auto-suspends when idle, so the *first* request after a lull can lag ~1–2 s. A quick load wakes it.
2. **Confirm the ticker is showing** live matches on the landing page.
3. **Have a France or Spain card link ready** (see the odds gotcha below).
4. Ideally rehearse on a **different network** than the venue Wi-Fi (rate limits are per-IP).

## ⚠️ Things to be aware of (avoid on-stage surprises)
1. **Everything is Solana *devnet*.** Say "devnet" — minting, VRF, and TxLINE all run on devnet. Don't claim mainnet.
2. **Odds-driven aura only appears for nations the feed has odds for.** **France / Spain have live odds** (safe to demo); some (e.g. Argentina) return none and the panel **gracefully hides**. Demo the "Live Market Read" on a **France or Spain** card (`/card/:slug`).
3. **Image generation takes ~10–20 s** (OpenAI model latency, not a bug). Narrate during the wait ("it's restyling your selfie…").
4. **Rate limits are per-IP:** ~5 cards/hr, ~3 mints/hr, ~10 transforms/15 min. Heavy rehearsal on one network can trigger a `429`. Space it out or switch networks.
5. **The "Verified on Solana" badge links a VRF *memo* tx — that's the randomness proof, *not* an NFT.** Minting an NFT is a separate step. Don't call the memo an NFT.
6. **Minting costs the treasury ~0.012 devnet SOL each** (it holds ~1 SOL ≈ ~80 mints of headroom). Don't spam-mint on stage.
7. **TxLINE token is cached** (~24 days, persistent). The on-chain subscribe already happened (proof tx below). If it ever expires it auto-re-subscribes — which needs the treasury to still have devnet SOL.
8. **Single instance, one co-hosted box** (isolated from other projects). Great for a demo; not sized for a live traffic spike.
9. **Graceful degradation is intentional:** if the ticker/odds feed hiccups, the element **hides itself** rather than showing an error — so nothing looks "broken," it just won't be there.

## 🎬 Suggested demo flow
1. **Landing** → point at the **live TxOdds ticker** (real fixtures).
2. **Selfie → quiz → generate** (narrate the ~15 s AI gen).
3. **Reveal** → rarity tier + **"Verified on Solana"** → open the VRF tx on explorer.
4. **Player resemblance** on the card.
5. **Share → open `/card/:slug`** → show the **Live Market Read (odds-driven aura)** — *use France/Spain*. "The live betting market shapes the card."
6. *(optional)* **Mint** → show the NFT on explorer.
7. **`/docs`** → clean overview for judges.

## 🔗 On-chain proof links (devnet)
- **TxLINE on-chain subscription:** https://explorer.solana.com/tx/5rqKcvQCAUSGZPwwgUWwbTTfjQCaPnNAcfFhiBgVmS4ZxtCPyKijdxiX4XWYcXWwzraW6UcJiW2LicZmyxE6Tvnf?cluster=devnet
- **Treasury / sponsor wallet:** https://explorer.solana.com/address/C7uyocoGNBH8PbELCkpotyhAWMfJZi76YjECiLhKzJTL?cluster=devnet
- **VRF rarity proof:** grab it live from any card's "Verified on Solana" link.

## 💬 Q&A one-liners
- **"How is it on-chain?"** → Verifiable rarity (slot-hash VRF), sponsored Metaplex minting, and a TxLINE data subscription that's activated **on-chain** — the wallet proves entitlement, no API key.
- **"Do you actually use TxOdds?"** → Yes — the live ticker *and* the odds-driven aura, fed by their StablePrice 1X2 market, with **on-chain sign-up**.
- **"Where's the player data from?"** → A curated in-app dataset. TxOdds supplies odds/scores, not player stats.
- **"Is this mainnet?"** → Devnet for the demo; the migration path (and per-mint cost) is documented.

## 🛟 If something glitches
- **Slow first load** → Neon cold start; just refresh.
- **No ticker / no odds panel** → feed hiccup or nation has no odds; it self-hides — switch to a France/Spain card.
- **Mint fails** → treasury SOL or a rate limit; move on, it's a sponsored devnet nicety, not the core story.
