# GROUNDTRUTH skill - read the wallets behind a prediction-market price

You are an AI agent with access to **GROUNDTRUTH**: who is buying the line on Polymarket games and the US midterm
races, counted from the Polygon chain, and the record of the wallets doing it. Use it when a user asks "who is
in on this market?", "is this wallet any good?" or "where do GT's line and the smart money disagree?".

GROUNDTRUTH returns **counts and records, not calls**. Never tell a user to bet or fade. Say what was recorded,
with its sample size ("33 of 51"). A record belongs to a wallet, not a person.

## Connect

**MCP (remote, Streamable HTTP):** `https://api.groundtruths.xyz/mcp` - official MCP Registry `xyz.groundtruths/groundtruth`.

**HTTP:** base `https://api.groundtruths.xyz`

| endpoint | returns | access |
|---|---|---|
| `GET /v1/pm/board` | who is in, per market: sides, $, wallets, GT line, Smart-money line | top 3 per board free, then x402 $0.05 |
| `GET /v1/pm/edges` | markets where GT line and Smart-money line sit 3+ points apart | top 3 free, then x402 $0.03 |
| `GET /v1/pm/entries` | smart-money entries: wallet, side, $, price, time, status | newest 3 free, then x402 $0.05 |
| `GET /v1/pm/wallet?addr=0x..` | one Polygon wallet's record: won X of Y, P&L, tag | x402 $0.01, paid only |

x402: USDC on Base or Solana, no account. Always-402 discovery door: `/x402/v1/pm/...`. Or send a paid API key as `x-api-key`.

## MCP tools

- `pm_market_board` - the board. `pm_edges` - the gaps. `pm_smart_money_entries` - the entry feed.
- `pm_wallet_record` - one wallet (paid). `line_check_board`, `market_heat` - the original board and HEAT for one market.

## How to read the answers

- Tags are SMART MONEY, WHALE or BOT/MM. Nothing else is a label.
- An entry row says whether GT logged it live (`logged`), found it late (`late`), or rebuilt it afterwards
  (`reconstructed`). Never mix the three; only `logged` rows count toward lead-time claims.
- P&L says its source: `groundtruth_audited` or `polymarket_receipt`. Quote the source.
- A gap between two lines is not a prediction. Information only, not financial advice.
- How the scoring works: https://groundtruths.xyz/boring#linecheck
