#!/usr/bin/env node
// GROUNDTRUTH MCP server over stdio.
// Serves the same tools as the live remote server (https://api.groundtruths.xyz/mcp): tools/list and
// tools/call are answered from it, so the tool set never drifts from what the API serves.
// Keyless by default (free per-IP allowance). Optional env:
//   GROUNDTRUTH_API_KEY  sent as x-api-key (higher limits)
//   GROUNDTRUTH_MCP_URL  override the upstream endpoint
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const UPSTREAM = process.env.GROUNDTRUTH_MCP_URL || "https://api.groundtruths.xyz/mcp";
const VERSION = "1.1.0";

let upstream = null;

async function connect() {
  if (upstream) return upstream;
  const headers = { "user-agent": `groundtruth-mcp-stdio/${VERSION}` };
  if (process.env.GROUNDTRUTH_API_KEY) headers["x-api-key"] = process.env.GROUNDTRUTH_API_KEY;
  const client = new Client({ name: "groundtruth-mcp-stdio", version: VERSION });
  await client.connect(new StreamableHTTPClientTransport(new URL(UPSTREAM), { requestInit: { headers } }));
  upstream = client;
  return client;
}

const server = new Server(
  { name: "groundtruth-mcp", title: "GROUNDTRUTH", version: VERSION },
  {
    capabilities: { tools: {} },
    instructions:
      "Dev history for Solana (pump.fun) and Robinhood Chain memecoins: what a creator wallet launched and how each coin ended, every count with its N. " +
      "Start with groundtruth_scan_coin for one token or groundtruth_creator_flag for one dev wallet.",
  },
);

server.setRequestHandler(ListToolsRequestSchema, async (req) => {
  const client = await connect();
  return client.listTools(req.params);
});

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const client = await connect();
  try {
    return await client.callTool(req.params);
  } catch (err) {
    return { isError: true, content: [{ type: "text", text: `GROUNDTRUTH upstream error: ${err?.message || String(err)}` }] };
  }
});

await server.connect(new StdioServerTransport());
