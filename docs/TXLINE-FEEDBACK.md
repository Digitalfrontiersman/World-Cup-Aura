# TxLINE (TxOdds) API — Integration Feedback

**Project:** World Cup Aura
**Use case:** a live World Cup fixtures ticker, gated by TxLINE's free World Cup tier.

## What we built with it
Guest JWT (`POST /auth/guest/start`) → **on-chain free-tier activation** (create
Token-2022 ATA → `subscribe(serviceLevel, weeks)` on the oracle program → sign
`${txSig}:${leagues}:${jwt}` → `POST /api/token/activate`) → cache the returned
API token → pull fixtures from `/api/fixtures/snapshot`, with guest-JWT
auto-renew on 401.

## What worked well
- **The on-chain subscription model is genuinely novel and a perfect fit for a Solana hackathon.** Gating API access via an on-chain subscription where the *wallet* proves entitlement — instead of a shared secret — is clever and verifiable. It was the most interesting part to implement.
- **Guest JWT + auto-renew-on-401** behaved exactly as documented.
- **Fixtures data** was clean and easy to normalize into our own model.
- The tx-on-chain devnet examples were a useful reference for the `subscribe` flow.

## Friction & suggestions
1. **Devnet SOL is an implicit precondition.** Activation needs the subscriber wallet funded (ATA rent + tx fees). With devnet faucets being flaky/rate-limited, the very first activation can stall on a cryptic `Attempt to debit an account but found no record of a prior credit`. A one-line "**fund your wallet first**" callout (ideally with a faucet pointer) up front would save a lot of debugging.
2. **Dev vs prod hosts.** `txline-dev.txodds.com` and `txline.txodds.com` map to different clusters/programs — easy to accidentally auth against one and send the on-chain tx to another. A short table of *host → Solana cluster → program IDs* would remove ambiguity.
3. **The activation signing binding is powerful but under-specified.** The exact message `${txSig}:${leagues}:${jwt}` (field order, encoding, and that empty `leagues` becomes an empty segment → `txSig::jwt`) took trial and error. A worked example in the docs would remove the guesswork.
4. **Error surfaces.** Activation failures (no SOL vs. program error vs. rejected token) tend to surface as generic errors; structured error codes/messages would speed diagnosis considerably.
5. **Caching / retry guidance.** We ended up building our own token cache (~24-day TTL) plus a failure cooldown to avoid re-subscribing on every restart. A recommended caching + retry pattern in the docs would help teams get this right by default.

## Overall
Genuinely impressed by the on-chain-subscription concept — it's a real
differentiator versus a plain API key. The main onboarding hurdle was the
**devnet-SOL / faucet dependency**, plus a few under-documented details in the
activation handshake (host↔cluster mapping and the exact signing format). A short
"quickstart: **fund → subscribe → activate**" with an explicit signing example
would make this a smooth, first-try integration.
