# groundtruth-mcp

MCP server (stdio) for GROUNDTRUTH: dev history for Solana (pump.fun) and Robinhood Chain memecoins.
What a creator wallet launched and how each coin ended. Every count carries its N.

All tools are defined in [`src/index.js`](src/index.js). Each one is a direct call to the public
GROUNDTRUTH REST API (`https://api.groundtruths.xyz`).

## Tools

- `groundtruth_scan_coin`: What the KOL wallet launched, and how it ended.
- `groundtruth_screen_creator`: Given one creator address, return every wallet that was early in that creator's launches: the role each played (creator, repeat_buyer,...
- `groundtruth_screen_batch`: Screen up to 200 creator addresses in ONE call and get one compact row each: launches, rug rate, the chain baseline, the multiple of...
- `groundtruth_creator_flag`: What the KOL wallet launched, and how it ended.
- `groundtruth_wallet_record`: One WALLET in, its counts out, from GROUNDTRUTH's own Solana capture tape (not a third party feed).
- `groundtruth_copycheck`: For a copy bot about to follow a wallet into a coin: the coin's creator counts (to that coin's launch when we have them), the wallet's...
- `groundtruth_kol_board`: What the KOL wallet launched, and how it ended.
- `groundtruth_pad_hoppers`: PAD HOPPERS: devs who rugged on 2+ launchpads (pump.fun, Meteora DBC, StonkFun, letsbonk.fun, Raydium LaunchLab, Moonshot, bags.fun, and...
- `groundtruth_kol_feed`: What the KOL wallet launched, and how it ended.
- `groundtruth_scoreboard`: Return the public accuracy scoreboard: how many forward calls GROUNDTRUTH has made, how many have resolved, and how those resolved.
- `groundtruth_census_figures`: Return the corpus-level figures the site publishes: launches captured per chain, how many resolved, and the share that rugged, died,...
- `groundtruth_time_to_rug`: WITHDRAWN 2026-09-29: the bands did not beat an age-matched baseline, so this now returns nulls plus band_withdrawn.
- `groundtruth_creator_replay`: What $100 would have done across a creator's last N resolved launches.
- `groundtruth_seal_call`: Stamp a verdict ahead of the outcome, so it can be counted later.
- `groundtruth_scorecard`: How often calls stamped under this API key were right.
- `groundtruth_autopsy_index`: List the dated autopsies GROUNDTRUTH has published.
- `launch_feed`: GT Launch Feed: GT's RPC-style stream, with GT's data already embedded (not a JSON-RPC endpoint: no RPC methods).
- `beat_the_bot`: Beat the Bot: fight SWAPNUTZ, GT's paper sniper, on a live pump.fun launch.

## Install and run

```bash
npx -y github:groundtruth-now/groundtruth-mcp
```

Claude Desktop (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "groundtruth": {
      "command": "npx",
      "args": ["-y", "github:groundtruth-now/groundtruth-mcp"]
    }
  }
}
```

Docker:

```bash
docker build -t groundtruth-mcp .
docker run -i --rm groundtruth-mcp
```

## Environment

| variable | required | use |
|---|---|---|
| `GROUNDTRUTH_API_KEY` | no | sent as `x-api-key`. Free key at https://groundtruths.xyz/api. Needed for `groundtruth_seal_call`, `groundtruth_scorecard`, `launch_feed` and `beat_the_bot` orders; higher limits elsewhere. |

Without a key the read tools work on the free per-IP allowance.

## Also

- Agent skill: [`skill.md`](skill.md), [`skills/groundtruth`](skills/groundtruth)
- Pay per call over [x402](https://x402.org): `/x402/v1/flag`, `/x402/v1/record` on the same API
- Site: https://groundtruths.xyz

MIT licensed.
