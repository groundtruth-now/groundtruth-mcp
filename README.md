# GROUNDTRUTH MCP + x402

Sealed launch outcomes and creator records for Solana (pump.fun) and Robinhood
Chain. Paid per call over [x402](https://x402.org), or free to connect over MCP.

Every figure carries its N and its basis. Captured 2026-09-20T21:16:50Z from the live endpoint —
nothing in this file is typed by hand.

## Two paths, one price

| path | behaviour |
|---|---|
| `/v1/flag`, `/v1/record` | **5 free calls per IP per day**, then 402. For agents evaluating the product. |
| `/x402/v1/flag`, `/x402/v1/record` | **always 402** until paid. This is what a bazaar validator must probe — a free trial returns 200 and makes a resource undiscoverable. |

Same resource, same price, one constant in the worker.

## 1. Unpaid: the 402 challenge

```bash
curl -i 'https://api.groundtruths.xyz/x402/v1/flag?addr=0xdfe781868f58901c45c9507cc776be8c2f1c18dd'
```

```http
HTTP/1.1 402 Payment Required
PAYMENT-REQUIRED: eyJ4NDAyVmVyc2lvbiI6MiwicmVzb3VyY2UiOnsidXJsIjoiaHR0cHM6Ly9hcGkuZ3JvdW5kdHJ1dGhzLnh5ei94NDAyL3Yx…
```

```json
{
  "x402Version": 2,
  "resource": {
    "url": "https://api.groundtruths.xyz/x402/v1/flag"
  },
  "accepts": [
    {
      "scheme": "exact",
      "network": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
      "asset": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "amount": "10000",
      "payTo": "cpCDBTacxDtgXpKNCeK4WgtCT2EcGRG3GD9rjQYayTP",
      "maxTimeoutSeconds": 300
    },
    {
      "scheme": "exact",
      "network": "eip155:8453",
      "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      "amount": "10000",
      "payTo": "0x90a5Feb81C67FB70508158A81598363c560Cba29",
      "maxTimeoutSeconds": 300,
      "extra": {
        "name": "USD Coin",
        "version": "2"
      }
    }
  ]
}
```

Two chains are offered. The payer picks; each settles through its own facilitator.

## 2. Paid: the record

Sign the requirement and send the payload back in `PAYMENT-SIGNATURE`. Any x402
client does this for you.

```bash
curl -H 'PAYMENT-SIGNATURE: <base64 payload>' \
  'https://api.groundtruths.xyz/x402/v1/flag?addr=0xdfe781868f58901c45c9507cc776be8c2f1c18dd'
```

```json
{
  "creator": "0xdfe781868f58901c45c9507cc776be8c2f1c18dd",
  "chain": "rh",
  "known_bad": false,
  "launched": 856,
  "rugged": 12,
  "died": 367,
  "active": 7,
  "survived": 1,
  "other": 469,
  "graduated": 0,
  "resolved": 380,
  "rug_rate": 0.0316,
  "failure_rate": 0.9974,
  "population_failure_median": 1,
  "population_ranked_n": 891,
  "counts_sum_to_launched": true,
  "asof": "2026-09-19T15:54:11Z",
  "known_bad_basis": {
    "rule": "in the published set AND resolved >= min_resolved AND rug rate >= multiple_of_baseline times the chain baseline rug rate",
    "min_resolved": 5,
    "multiple_of_baseline": 1.5,
    "null_means": "not in the published set. Absence is not innocence -- this is market data we have captured, not a census of the chain."
  },
  "note": "counts from launches we can attribute to this creator in the market data we have captured. Not a rating. failure_rate counts rugged and died together over the resolved launches -- the practical \"these coins ended up worthless\" figure."
}
```

**This is a real captured response.** It was returned by a settled payment on Base
mainnet (`HTTP 200`, `x-x402-paid: 1`) that moved 0.01 USDC on-chain from the payer to
`0x90a5Feb81C67FB70508158A81598363c560Cba29`. The Solana leg returns the same body and settled the same
amount to `cpCDBTacxDtgXpKNCeK4WgtCT2EcGRG3GD9rjQYayTP`.

## 3. Paying it

- **Base** (`eip155:8453`) — USDC, EIP-3009 `transferWithAuthorization`.
  A signed message: the payer needs **no ETH**, the facilitator submits and pays gas.
- **Solana** (`solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp`) — USDC SPL transfer with the facilitator as
  fee payer, so the payer needs **no SOL**. The transaction must carry exactly three
  instructions in order: `SetComputeUnitLimit`, `SetComputeUnitPrice`, transfer.

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

## Facilitators

Per chain, because bazaars index per facilitator:

- **Base → CDP Facilitator.** Settling here is what puts the resource in Coinbase's
  Bazaar; a PayAI settle only ever reaches PayAI's catalog.
- **Solana → PayAI.** Chosen by querying `/supported` rather than from documentation:
  the public x402.org facilitator is testnet-only on EVM.

The resource passes CDP's validator **25/25**, `valid: true`,
`simulation.outcome: "accepted"`.

## Methodology

<https://groundtruths.xyz/methodology> — the base rate, the known_bad rule, and what is
excluded from every denominator.
