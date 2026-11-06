# GROUNDTRUTH MCP + x402

Who is buying the prediction-market line. Polymarket wallet records, the market board (who is in, per market),
GT line vs Smart-money line gaps, and the smart-money entry feed. Counts from the Polygon chain, each with its
sample size. Paid per call over [x402](https://x402.org) (USDC on Base or Solana), or free to connect over MCP.

The memecoin tools are paused; everything below is prediction-market data.

## Price table

| route | what | price (USDC) | free |
|---|---|---|---|
| `/x402/v1/pm/wallet?addr=0x..` | one wallet's record: won X of Y, P&L, tag | $0.01 | none |
| `/x402/v1/pm/board` | who is in, per market | $0.05 | top 3 per board |
| `/x402/v1/pm/edges` | GT line vs Smart-money line gaps | $0.03 | top 3 |
| `/x402/v1/pm/entries` | smart-money entries | $0.05 | newest 3 |

`/x402/...` is the **always-402** door a bazaar validator probes. `/v1/pm/...` answers the free rows without a
payment and a 402 for the rest. Same prices, one constant in the worker.

## 1. Unpaid: the 402 challenge

```bash
curl -i 'https://api.groundtruths.xyz/x402/v1/pm/board'
```

## 2. Paid: the board

Sign the requirement and send the payload back in `PAYMENT-SIGNATURE` (any x402 client does this; `@x402/fetch` works):

```bash
curl -s -H 'PAYMENT-SIGNATURE: <base64 payload>' 'https://api.groundtruths.xyz/x402/v1/pm/board'
```

Each market comes back with its sides, price, $ and wallets, the tagged wallets holding each side
(SMART MONEY / WHALE / BOT/MM), the GT line and the Smart-money line. No sportsbook odds and no Kalshi price
ever ride these routes.

## 3. Paying

- **Base** (`eip155:8453`): USDC, EIP-3009 `transferWithAuthorization`. A signed message: the payer needs no ETH.
- **Solana** (`solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp`): USDC SPL transfer with the facilitator as fee payer, so the
  payer needs no SOL. Exactly three instructions in order: `SetComputeUnitLimit`, `SetComputeUnitPrice`, transfer.

## 4. MCP client config

```json
{
  "mcpServers": {
    "groundtruth": {
      "type": "streamable-http",
      "url": "https://api.groundtruths.xyz/mcp"
    }
  }
}
```

Tools: `pm_market_board`, `pm_edges`, `pm_smart_money_entries`, `pm_wallet_record`, `line_check_board`, `market_heat`.
Optional header `x-api-key: gt_live_...` (free key: https://groundtruths.xyz/account). Without a key: the free rows.

## 5. Bankr

```
install the skill at https://github.com/groundtruth-now/groundtruth-mcp/tree/main/skills/groundtruth
```

## Facilitators

Per chain, because bazaars index per facilitator: **Base -> CDP**, **Solana -> PayAI**.

## How we keep score

<https://groundtruths.xyz/boring#linecheck>. A record belongs to a wallet, not a person. Information only, not financial advice.
