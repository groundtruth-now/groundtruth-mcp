# GROUNDTRUTH MCP + x402

Sealed launch outcomes and creator records for Solana (pump.fun) and Robinhood
Chain. Paid per call over [x402](https://x402.org), or free to connect over MCP.

Every figure carries its N and its basis. Captured 2026-09-19T17:29:34Z from the live endpoint --
nothing in this file is typed by hand.

## 1. Unpaid: the 402 challenge

```bash
curl -i 'https://api.groundtruths.xyz/v1/flag?addr=0xdfe781868f58901c45c9507cc776be8c2f1c18dd'
```

```http
HTTP/1.1 402 Payment Required
PAYMENT-REQUIRED: eyJ4NDAyVmVyc2lvbiI6IjIiLCJhY2NlcHRzIjpbeyJzY2hlbWUiOiJleGFjdCIsIm5ldHdvcmsiOiJzb2xhbmE6NWV5a3Q0VXNGdjhQOE5KZFRSRXBZMXZ6

{
  "x402Version": "2",
  "accepts": [
    {
      "scheme": "exact",
      "network": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
      "asset": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "amount": "10000",
      "payTo": "cpCDBTacxDtgXpKNCeK4WgtCT2EcGRG3GD9rjQYayTP",
      "resource": "https://api.groundtruths.xyz/v1/flag",
      "description": "GROUNDTRUTH creator record: launches, rugged, died, active, survived, graduated, and the observed-only baseline the known_bad line is drawn from.",
      "mimeType": "application/json",
      "maxTimeoutSeconds": 300,
      "outputSchema": {
        "input": {
          "type": "http",
          "method": "GET",
          "queryParams": {
            "addr": "EVM 0x address or Solana base58 creator wallet"
          }
        },
        "output": {
          "type": "object",
          "description": "launched, rugged, died, active, s
```

## 2. Paid: the record

Send the signed payload back in `PAYMENT-SIGNATURE` (any x402 client does this
for you) and the same URL returns the record:

```bash
curl -H 'PAYMENT-SIGNATURE: <base64 payload>' \
  'https://api.groundtruths.xyz/v1/flag?addr=0xdfe781868f58901c45c9507cc776be8c2f1c18dd'
```

> Endpoint returned HTTP 402 at capture time; not shown rather than faked.

## 3. MCP client config

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

## Facilitator

Settlement goes through **PayAI** (`facilitator.payai.network`), chosen by
querying `/supported` rather than from documentation: it is the only candidate
advertising x402 **v2** on **both** Base mainnet (`eip155:8453`) and Solana
mainnet (`solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp`). The public x402.org
facilitator is testnet-only on EVM.

## Methodology

<https://groundtruths.xyz/methodology> -- the base rate, the known_bad rule, and
what is excluded from every denominator.
