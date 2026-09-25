# GROUNDTRUTH skill — check the record before you buy a memecoin

You are an AI agent with access to **GROUNDTRUTH**: the recorded outcomes of memecoin launches on
**Solana (pump.fun)** and **Robinhood Chain**, and the track record of the wallets that launch them.
Use it **before buying a newly launched token**, and whenever a user pastes a contract address (CA) or a
creator/deployer wallet and asks "is this a rug?", "has this dev rugged before?" or "what happened to this coin?".

GROUNDTRUTH returns **records, not safety ratings**. Never tell a user a coin or creator is "safe".
Say what was recorded: how many launches, how many rugged or died, and the chain baseline to compare against.

## Connect

**MCP (remote, Streamable HTTP):** `https://api.groundtruths.xyz/mcp` — official MCP Registry `xyz.groundtruths/groundtruth`.

**HTTP:** base `https://api.groundtruths.xyz`

| endpoint | returns | access |
|---|---|---|
| `GET /api/flag?addr=<creator>&chain=solana\|rh` | known-bad verdict + its statistical basis | free, metered |
| `GET /v1/flag?addr=<creator>` | full creator record | 5 free/IP/day, then x402 |
| `GET /v1/record?ca=<token>` | full coin record | 5 free/IP/day, then x402 |

x402 price: **$0.01 USDC per call**, on Solana mainnet or Base. Or send an API key as `x-api-key`.

**Solana Agent Kit:** `npm install solana-agent-kit-plugin-groundtruth`
(actions: creator record, CA record, known-bad flag; keyed or x402 from the agent's own wallet).

**ElizaOS:** `npm install @groundtruth-now/plugin-groundtruth`
(actions: coin record, creator record, venue figures; x402 paying-fetch supported).

## MCP tools

- `groundtruth_scan_coin` — one token: outcome (rugged / died / graduated / active), live band, creator.
- `groundtruth_creator_flag` — one creator: known bad or not, rug rate, chain baseline.
- `groundtruth_screen_creator` — one creator: every wallet early in its launches, and the operator pools.
- `groundtruth_screen_batch` — up to 200 creators in one call.
- `groundtruth_time_to_rug` — how fast coins in a risk band actually rugged (median seconds).
- `groundtruth_creator_replay` — what $100 would have done across a creator's last N resolved launches.
- `groundtruth_census_figures`, `groundtruth_scoreboard`, `groundtruth_autopsy_index` — corpus figures, accuracy, autopsies.
- `groundtruth_seal_call`, `groundtruth_scorecard` — seal a verdict before the outcome exists, then score it.

## How to read the answers

- **`known_bad: true`** means the creator rugs more often than the chain's baseline **by more than chance**:
  one-sided exact binomial, p < 0.01, at least 5 resolved launches. The basis travels with every answer — quote it.
- **`known_bad: null` / not in the set** means GROUNDTRUTH has no published record. **Absence is not innocence.**
- The baseline is the attributed-creator population on that chain; on Solana most of those launches rug. Compare a
  creator to the baseline, not to zero.
- A coin launched minutes ago has no outcome yet. Say "no outcome yet", never "clean".
- Addresses: Solana is base58, Robinhood Chain is `0x…`. Pass `chain` when the format is ambiguous.
