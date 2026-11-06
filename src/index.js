#!/usr/bin/env node
// GROUNDTRUTH MCP server (stdio), 2.0.0. Prediction-market data only: who is buying the Polymarket line.
// Four tools, each a direct REST call to GROUNDTRUTH's public API (https://api.groundtruths.xyz). Every figure carries its sample size.
// The memecoin tools are paused and not listed here. No Odds API fields ever come back from these routes.
//
// Env (all optional):
//   GROUNDTRUTH_API_KEY   sent as x-api-key; a paid key returns every row and wallet records. Without it: top 3 of each board free.
//   GROUNDTRUTH_API_BASE  REST base URL (default https://api.groundtruths.xyz)
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const BASE = (process.env.GROUNDTRUTH_API_BASE || "https://api.groundtruths.xyz").replace(/\/+$/, "");
const VERSION = "2.0.0";
const ANN = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true };

export const TOOLS = [
  {
    name: "pm_wallet_record",
    description: "A Polygon (Polymarket) wallet's record: won X of Y with the sample size, P&L (labelled GT audited or Polymarket receipt), category split, tag. Paid only (x402 https://api.groundtruths.xyz/x402/v1/pm/wallet?addr= at $0.01, or a paid API key). A record belongs to a wallet, not a person. Information only, not financial advice.",
    inputSchema: { type: "object", properties: { addr: { type: "string", description: "Polygon wallet, 0x + 40 hex" } }, required: ["addr"] },
    annotations: ANN,
  },
  {
    name: "pm_market_board",
    description: "GROUNDTRUTH market board: who is in on Polymarket games and US midterm races. Per market: sides, price, $, wallets, tagged holders, GT line and Smart-money line. Top 3 per board free; a paid key or x402 ($0.05) returns every market. Information only, not financial advice.",
    inputSchema: { type: "object", properties: {} },
    annotations: ANN,
  },
  {
    name: "pm_edges",
    description: "Markets where the GT line and the Smart-money line sit 3 or more points apart on the same side, with the fills and wallets behind each. Top 3 free; the rest paid ($0.03). A gap is not a call. Information only, not financial advice.",
    inputSchema: { type: "object", properties: {} },
    annotations: ANN,
  },
  {
    name: "pm_smart_money_entries",
    description: "Smart-money entry feed: wallet, side, $, price, time, lag, and whether GT logged it live, late, or rebuilt it afterwards. Newest 3 free; the rest paid ($0.05). Information only, not financial advice.",
    inputSchema: { type: "object", properties: { n: { type: "integer", minimum: 1, maximum: 500, description: "Rows, 1 to 500 (paid callers only)" } } },
    annotations: ANN,
  },
];

const s = (v) => (v == null ? "" : String(v).trim());
const HANDLERS = {
  pm_wallet_record: (a) => {
    if (!/^0x[0-9a-fA-F]{40}$/.test(s(a.addr))) throw new Error("addr must be a Polygon wallet: 0x + 40 hex.");
    return { path: "/v1/pm/wallet", query: { addr: s(a.addr).toLowerCase() } };
  },
  pm_market_board: () => ({ path: "/v1/pm/board" }),
  pm_edges: () => ({ path: "/v1/pm/edges" }),
  pm_smart_money_entries: (a) => ({ path: "/v1/pm/entries", query: { n: a.n ? Math.min(500, Math.max(1, parseInt(a.n, 10) || 100)) : "" } }),
};

async function callApi(name, args) {
  const spec = HANDLERS[name](args || {});
  const url = new URL(BASE + spec.path);
  for (const [k, v] of Object.entries(spec.query || {})) if (v !== "" && v != null) url.searchParams.set(k, String(v));
  const headers = { "user-agent": `groundtruth-mcp/${VERSION}`, accept: "application/json" };
  if (process.env.GROUNDTRUTH_API_KEY) headers["x-api-key"] = process.env.GROUNDTRUTH_API_KEY;
  const res = await fetch(url, { headers });
  const text = await res.text();
  if (res.ok) return { content: [{ type: "text", text }] };
  const hint = res.status === 401 || res.status === 402
    ? " Paid: set GROUNDTRUTH_API_KEY, or pay per call over x402 at https://api.groundtruths.xyz/.well-known/x402."
    : "";
  return { isError: true, content: [{ type: "text", text: `${name} failed with HTTP ${res.status}: ${text.slice(0, 300)}.${hint}` }] };
}

const server = new Server(
  { name: "groundtruth-mcp", title: "GROUNDTRUTH", version: VERSION },
  {
    capabilities: { tools: {} },
    instructions:
      "Who is buying the prediction-market line, counted from the Polygon chain. Each figure carries its sample size. " +
      "Start with pm_market_board. GT never predicts and never says bet or fade.",
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  if (!HANDLERS[name]) return { isError: true, content: [{ type: "text", text: `unknown tool: ${name}` }] };
  try {
    return await callApi(name, args);
  } catch (err) {
    return { isError: true, content: [{ type: "text", text: `${name}: ${err?.message || String(err)}` }] };
  }
});

await server.connect(new StdioServerTransport());
