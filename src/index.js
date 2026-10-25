#!/usr/bin/env node
// GROUNDTRUTH MCP server (stdio). Dev history for Solana (pump.fun) and Robinhood Chain memecoins:
// what a creator wallet launched and how each coin ended, every count with its N.
//
// Every tool is defined in this file (name, description, input schema) and each handler is a direct
// REST call to GROUNDTRUTH's public API (https://api.groundtruths.xyz). No tool list is fetched at runtime.
//
// Env (all optional):
//   GROUNDTRUTH_API_KEY   sent as x-api-key; needed for seal_call, scorecard, launch_feed and beat_the_bot orders
//   GROUNDTRUTH_API_BASE  REST base URL (default https://api.groundtruths.xyz)
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const BASE = (process.env.GROUNDTRUTH_API_BASE || "https://api.groundtruths.xyz").replace(/\/+$/, "");
const VERSION = "1.2.0";

export const TOOLS = [
  {
    "name": "groundtruth_scan_coin",
    "description": "When the dev is on a KOL list, envelope.kol carries tag KOL / TOP PROFIT, the lists, yes-no flags and rank (never a name). Look up one token and return what GROUNDTRUTH counted about it: the outcome label (rugged, died, graduated, survived, or no outcome), liquidity and market-cap figures, holder counts, and the launch counts of the wallet that launched it. Accepts a Solana mint or a Robinhood Chain 0x contract address. This is the same read the public site performs when someone pastes a contract address. The answer carries the envelope; its live block holds the dev's last_mint_live, launched_live, bonded_live, mints_since_asof and ticker_asof (the newest mint the feed has seen). A dev WALLET pasted here answers not_token plus that dev's creator_record and the same live fields.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "address": {
          "type": "string",
          "description": "A Solana mint (base58) or a Robinhood Chain contract address (0x...). Example: So11111111111111111111111111111111111111112"
        }
      },
      "required": [
        "address"
      ]
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "groundtruth_screen_creator",
    "description": "Given one creator address, return every wallet that was early in that creator's launches: the role each played (creator, repeat_buyer, one_off), how many of this creator's launches it was early in versus how many it was early in anywhere, and the creator's own rug rate against the chain baseline, because a rate without its baseline is not a finding. It does not say who owns the wallets. LIVE FIELDS, from the mint feed every 5 s: last_mint_live (unix s of the dev's newest mint), launched_live, bonded_live and mints_since_asof; ticker_asof = the newest mint the feed has seen. A row with no mints_since_asof is not live: refuse it. bonded_asof dates the recount part; peak / pull and ttr_* are history (peak_proven / pull_proven false), not a trade signal; known_bad is the census rule. ",
    "inputSchema": {
      "type": "object",
      "properties": {
        "creator": {
          "type": "string",
          "description": "Creator address. base58 for Solana, 0x... for Robinhood Chain."
        },
        "chain": {
          "type": "string",
          "enum": [
            "solana",
            "rh"
          ],
          "default": "solana",
          "description": "Which chain the creator launched on."
        },
        "role": {
          "type": "string",
          "enum": [
            "",
            "repeat_buyer",
            "one_off"
          ],
          "description": "Optional filter. Omit for all roles."
        },
        "limit": {
          "type": "integer",
          "minimum": 1,
          "maximum": 300,
          "default": 50,
          "description": "Maximum wallet rows to return. The response reports wallets_truncated when it caps."
        }
      },
      "required": [
        "creator"
      ]
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "groundtruth_screen_batch",
    "description": "Screen up to 200 creator addresses in ONE call and get one compact row each: launches, rug rate, the chain baseline, the multiple of that baseline, wallets tied, and the apparent-versus-true operator collapse. Use this instead of calling groundtruth_screen_creator in a loop. known_bad is true only when the creator is in the published set, has at least 5 resolved launches, and rugs at 1.5 times the chain baseline or worse -- a bare rug rate is noise, the multiple is a decision. known_bad is null, NEVER false, for a creator not in our count: not in our count means nothing either way.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "creators": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "maxItems": 200,
          "description": "Creator addresses. base58 for Solana, 0x... for Robinhood Chain."
        },
        "chain": {
          "type": "string",
          "enum": [
            "solana",
            "rh"
          ],
          "default": "solana",
          "description": "Which chain these creators launched on."
        }
      },
      "required": [
        "creators"
      ]
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "groundtruth_creator_flag",
    "description": "kol: when the creator is on a public KOL list (kolscan, the pump.fun leaderboard, kolscan.fun, KolHood, Kolosseum) -- tag KOL or TOP PROFIT, the lists, tg / x / verified as yes-no, the list rank, listed now; null when it is on none. Never a name or handle. One creator in, one small answer out: is this creator known bad, with the rug rate, the chain baseline and the multiple that justifies the verdict. Also returns TTR -- ttr_median, ttr_p25 and ttr_mean, in seconds from launch to rug over this creator's rugged launches, with ttr_n and n_rugged -- and rugged_resolved / faded_resolved as x/y, all counted to the build time of the data and from launch outcomes only. The cheapest call on this server -- use it when all you need is the decision rather than the wallet list. known_bad is null, never false, for a creator not in our count. The counts are a batch recount; LIVE FIELDS, from the mint feed every 5 s: last_mint_live (unix s of the dev's newest mint), launched_live, bonded_live and mints_since_asof; ticker_asof = the newest mint the feed has seen. A row with no mints_since_asof is not live: refuse it. bonded_asof dates the recount part; peak / pull and ttr_* are history (peak_proven / pull_proven false), not a trade signal; known_bad is the census rule. ",
    "inputSchema": {
      "type": "object",
      "properties": {
        "creator": {
          "type": "string",
          "description": "Creator address. base58 for Solana, 0x... for Robinhood Chain."
        },
        "chain": {
          "type": "string",
          "enum": [
            "solana",
            "rh"
          ],
          "default": "solana",
          "description": "Which chain the creator launched on."
        }
      },
      "required": [
        "creator"
      ]
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "groundtruth_wallet_record",
    "description": "One WALLET in, its counts out, from GROUNDTRUTH's own Solana capture tape (not a third party feed). Each of four fields is x/n with a one-line definition of n beside it, its rate, the same rate over all wallets, and the word above, below or about (\"about\" = within 2 percentage points): bad_share (buys in coins from creators with 5+ launches, 80%+ rugged, judged at each coin's launch; n = buys in coins whose dev we have counted), pre_rug_exits (n = the wallet's sells in coins that rugged; x = those in the 60 s up to the rug), copier_bagholder (buys where a wallet that first bought 1-2 s later still held at the rug; n = buys in coins that rugged where another wallet's first buy in that coin landed 1-2 s later; x = those where at least one wallet that first bought 1-2 s later had not sold at the rug) and early_buys (n = buys in coins with a known launch time; x = within 30 s of the launch). Then the tape range, buys_total (counts all buys; each n counts only the buys that meet its own condition), role (a label; role_label is its display form: deployer, early buyer or trader) and, for a deployer, its launches last (hand_label), dated, with the pip legend and what rugged means. A coin the wallet created itself is left out of the four fields (own_coins_excluded counts them). wallet_record is null, with wallet_record_reason, when the wallet is not in the tape cut (fewer than 100 buys in the tape range). Counts only. creator_record (a deployer) carries the LIVE FIELDS, from the mint feed every 5 s: last_mint_live (unix s of the dev's newest mint), launched_live, bonded_live and mints_since_asof; ticker_asof = the newest mint the feed has seen. A row with no mints_since_asof is not live: refuse it. bonded_asof dates the recount part; peak / pull and ttr_* are history (peak_proven / pull_proven false), not a trade signal; known_bad is the census rule. ",
    "inputSchema": {
      "type": "object",
      "properties": {
        "wallet": {
          "type": "string",
          "description": "A Solana wallet address (base58)."
        }
      },
      "required": [
        "wallet"
      ]
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "groundtruth_copycheck",
    "description": "For a copy bot about to follow a wallet into a coin: the coin's creator counts (to that coin's launch when we have them), the wallet's counts from the capture tape, and one line built from those counts only, e.g. \"creator: SAME DEV · {r} OF {n} RUGGED (counted to this coin's launch) · wallet: {a}/{b} sells within 60 s before a rug, {vs} the all-wallet rate · {c}/{d} buys where a wallet that first bought 1-2 s later still held at the rug, {vs} the all-wallet rate · ... · tape {from}..{to}\" (every {x} is that call's own count; GT_NO_HANDTYPED_V1). Solana only. Counts only.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "wallet": {
          "type": "string",
          "description": "The wallet being copied (Solana, base58)."
        },
        "ca": {
          "type": "string",
          "description": "The coin (Solana mint, base58)."
        }
      },
      "required": [
        "wallet",
        "ca"
      ]
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "groundtruth_kol_board",
    "description": "The wallets on kolscan, the pump.fun leaderboard, kolscan.fun, KolHood and Kolosseum that launched coins, counted by GROUNDTRUTH: tag KOL or TOP PROFIT, launches, rugged / resolved, PULL, bonded, last mint, and list juice (Telegram / X / verified as yes-no, list rank, listed now). Wallets only, never a name. Free: the top 3 per list and every list total; with an API key, every row (or /v1/kol over x402).",
    "inputSchema": {
      "type": "object",
      "properties": {}
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "groundtruth_pad_hoppers",
    "description": "PAD HOPPERS: devs who rugged on 2+ launchpads (pump.fun, Meteora DBC, StonkFun, letsbonk.fun, Raydium LaunchLab, Moonshot, bags.fun, and the Robinhood Chain pads), ranked by total rugs. Each leg = that pad's rugged of resolved, with its N. Also today's PAD HOPPER OF THE DAY. groundtruth_creator_flag carries the same tag per dev (pads.hopper).",
    "inputSchema": {
      "type": "object",
      "properties": {
        "n": {
          "type": "number",
          "description": "rows, 1-100 (default 25)"
        }
      }
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "groundtruth_kol_feed",
    "description": "JUST IN: launches by wallets on the KOL and top-profit lists, newest first, each with that wallet's rugged / resolved before it; AGAIN: rugs on their coins with the seconds to the pull. 10 minutes behind. Free: the newest 3; with an API key, 30 (or /v1/kol/feed over x402).",
    "inputSchema": {
      "type": "object",
      "properties": {}
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "groundtruth_scoreboard",
    "description": "Return the public accuracy scoreboard: how many forward calls GROUNDTRUTH has made, how many have resolved, and how those resolved. Use this to judge how much weight to give the other tools.",
    "inputSchema": {
      "type": "object",
      "properties": {}
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "groundtruth_census_figures",
    "description": "Return the corpus-level figures the site publishes: launches captured per chain, how many resolved, and the share that rugged, died, survived or graduated, with the generation timestamp. This is market data GROUNDTRUTH has captured, not exhaustive coverage from a start date -- use it for baselines, not for totals of all activity.",
    "inputSchema": {
      "type": "object",
      "properties": {}
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "groundtruth_time_to_rug",
    "description": "WITHDRAWN 2026-09-29: the bands did not beat an age-matched baseline, so this now returns nulls plus band_withdrawn. Was: how fast coins in a given risk band actually rugged: median seconds from GROUNDTRUTH first seeing the curve to the rug, with p25 and p75, for one chain, band and window. Use it to answer \"how long would I have had\". The denominator is calls that rugged in the window AND carry a rug time, and it travels in the answer. Below 30 such calls the percentiles are null and enough_data is false -- say \"not enough resolved calls to state a time\" rather than quoting a number. Omit every argument to get the whole table in one call.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "chain": {
          "type": "string",
          "enum": [
            "solana",
            "rh"
          ],
          "description": "solana (pump.fun) or rh (Robinhood Chain)"
        },
        "band": {
          "type": "string",
          "enum": [
            "RED",
            "AMBER",
            "GREEN"
          ],
          "description": "withdrawn: GROUNDTRUTH no longer assigns a band; ignored"
        },
        "window": {
          "type": "string",
          "enum": [
            "24h",
            "7d",
            "30d"
          ],
          "description": "the resolution window; defaults to 24h"
        }
      }
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "groundtruth_creator_replay",
    "description": "What $100 would have done across a creator's last N resolved launches. Returns two rows. held_to_end is a MEASUREMENT: the recorded multiple at the end of each launch, with rugged launches counted as zero because the liquidity was pulled. clock_upper_bound is a CEILING, not a prediction: it uses the recorded PEAK multiple and only where the peak arrived at or before the band p25, because the published data carries the peak and the final multiple, not the path between them. Say \"at most\" when you quote it. Launches with no recorded multiple are excluded from BOTH the stake and the return, so the two describe the same set -- quote computed_for and of, never just the total. Solana only today: the Robinhood outcome data carries no peak multiple, so neither row can be computed there.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "creator": {
          "type": "string",
          "description": "the creator wallet (base58)"
        },
        "n": {
          "type": "integer",
          "description": "how many of the most recent resolved launches, 1-12, default 10"
        },
        "usd": {
          "type": "number",
          "description": "the stake per launch in dollars, default 100"
        }
      },
      "required": [
        "creator"
      ]
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "groundtruth_seal_call",
    "description": "Stamp a verdict ahead of the outcome, so it can be counted later. This is the honesty mechanism: the row is hash-chained to the previous one under your API key, so a verdict cannot be edited or removed after the coin resolves. Stamp every call you make, including the ones you are confident about -- a scorecard built only from remembered wins is not a scorecard. Returns the row hash and sequence number.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "ca": {
          "type": "string",
          "description": "the coin address you are calling"
        },
        "chain": {
          "type": "string",
          "enum": [
            "solana",
            "rh"
          ]
        },
        "band": {
          "type": "string",
          "enum": [
            "RED",
            "AMBER",
            "GREEN"
          ],
          "description": "your own call, in your own scorecard; GROUNDTRUTH no longer publishes a band"
        },
        "rule_id": {
          "type": "string",
          "description": "optional: your own rule label"
        },
        "note": {
          "type": "string",
          "description": "optional, up to 200 characters"
        }
      },
      "required": [
        "ca"
      ]
    },
    "annotations": {
      "readOnlyHint": false,
      "destructiveHint": false,
      "idempotentHint": false,
      "openWorldHint": true
    }
  },
  {
    "name": "groundtruth_scorecard",
    "description": "How often calls stamped under this API key were right. Groups them by band and by what the coin actually did, resolved from the same data the card reads. A call whose coin has not resolved counts as PENDING, never as a win -- report pending alongside resolved, because the denominator is the point. Also returns whether the hash chain is intact; if it is not, say so rather than quoting the numbers.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "limit": {
          "type": "integer",
          "description": "rows to read, 1-500, default 200"
        }
      }
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "groundtruth_autopsy_index",
    "description": "List the dated autopsies GROUNDTRUTH has published. Each is a writeup of one launch and what happened to it. Returns the available days; fetch a specific one from the public site at /autopsy/<day>.",
    "inputSchema": {
      "type": "object",
      "properties": {}
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "launch_feed",
    "description": "GT Launch Feed: GT's RPC-style stream, with GT's data already embedded (not a JSON-RPC endpoint: no RPC methods). The newest launches on Solana and Robinhood Chain, each with the dev's rap sheet attached: SAME DEV X OF Y RUGGED, median pull, last launch, bonded count, the dev's labels where backed, active hours, the $100 line for the dev's last coin, a link to the card. Tiers: FREE 5 min behind (no key on GET /v1/launches, attribution required); LIVE real time at $0.01 a call over x402 (/x402/v1/launches) or a paid key; LIVE PUSH every launch streamed at $99/mo; $GTRUTH holders at the tier read LIVE free. Every item carries source: Data: GroundTruth. Counts only, wallets only. This tool needs a key.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "n": {
          "type": "integer",
          "description": "How many launches, 1 to 100. Default 20."
        },
        "chain": {
          "type": "string",
          "enum": [
            "solana",
            "rh"
          ],
          "description": "Optional: one chain."
        }
      }
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "beat_the_bot",
    "description": "Beat the Bot: fight SWAPNUTZ, GT's paper sniper, on a live pump.fun launch. action \"state\" lists open rounds, the bot's live P&L and the rules. action \"in\" enters a round (round = the coin mint, size_sol, optional tp_pct / sl_pct / hold_s for an auto exit); action \"out\" exits. action \"replay\" runs a strategy (size_sol, delay_s, tp_pct, sl_pct, hold_s, filters {skip_red, skip_rap, min_holders, min_liq_sol, kol_in}) on every coin the bot traded in 7 days. Orders are stamped on arrival and fill on GT's captured curve, same fees as the bot. action \"session\" reads a result. Paper only. Not financial advice.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "action": {
          "type": "string",
          "enum": [
            "state",
            "in",
            "out",
            "session",
            "replay"
          ]
        },
        "round": {
          "type": "string",
          "description": "the coin mint of an open round"
        },
        "size_sol": {
          "type": "number"
        },
        "tp_pct": {
          "type": "number"
        },
        "sl_pct": {
          "type": "number"
        },
        "hold_s": {
          "type": "number"
        },
        "delay_s": {
          "type": "number"
        },
        "filters": {
          "type": "object"
        },
        "session": {
          "type": "integer"
        }
      },
      "required": [
        "action"
      ]
    },
    "annotations": {
      "readOnlyHint": false,
      "destructiveHint": false,
      "idempotentHint": false,
      "openWorldHint": true
    }
  }
];

// ---- REST handlers: tool name -> { method, path, query | body } ----
const s = (v) => (v == null ? "" : String(v).trim());
const need = (args, ...keys) => {
  for (const k of keys) if (!s(args[k])) throw new Error(`${k} is required.`);
};

const HANDLERS = {
  groundtruth_scan_coin: (a) => (need(a, "address"), { path: "/api/scan", query: { ca: s(a.address) } }),
  groundtruth_screen_creator: (a) => (need(a, "creator"), {
    path: "/api/screener",
    query: { addr: s(a.creator), chain: s(a.chain) || "solana", role: s(a.role), limit: Math.min(300, Math.max(1, parseInt(a.limit, 10) || 50)) },
  }),
  groundtruth_screen_batch: (a) => {
    const list = (Array.isArray(a.creators) ? a.creators : []).map(s).filter(Boolean);
    if (!list.length) throw new Error("creators is required: an array of 1 to 200 addresses.");
    if (list.length > 200) throw new Error(`too many addresses: ${list.length}. The cap is 200 per call.`);
    return { path: "/api/screen", query: { addrs: list.join(","), chain: s(a.chain) || "solana" } };
  },
  groundtruth_creator_flag: (a) => (need(a, "creator"), { path: "/api/flag", query: { addr: s(a.creator), chain: s(a.chain) || "solana" } }),
  groundtruth_wallet_record: (a) => (need(a, "wallet"), { path: "/v1/flag", query: { addr: s(a.wallet), chain: "solana" }, allow404: true }),
  groundtruth_copycheck: (a) => (need(a, "wallet", "ca"), { path: "/v1/copycheck", query: { wallet: s(a.wallet), ca: s(a.ca) } }),
  groundtruth_kol_board: () => ({ path: "/api/boards/kol" }),
  groundtruth_kol_feed: () => ({ path: "/api/boards/kol/feed" }),
  groundtruth_pad_hoppers: (a) => ({ path: "/api/boards/hoppers", query: { n: Math.min(100, Math.max(1, Number(a.n) || 25)) } }),
  groundtruth_scoreboard: () => ({ path: "/api/scoreboard" }),
  groundtruth_census_figures: () => ({ path: "/api/figures" }),
  groundtruth_autopsy_index: () => ({ path: "/api/autopsy/index" }),
  groundtruth_time_to_rug: (a) => ({ path: "/v1/ttr", query: { chain: s(a.chain), band: s(a.band), window: s(a.window) } }),
  groundtruth_creator_replay: (a) => (need(a, "creator"), { path: `/v1/creator/${encodeURIComponent(s(a.creator))}/replay`, query: { n: s(a.n), usd: s(a.usd) } }),
  groundtruth_seal_call: (a) => (need(a, "ca"), {
    method: "POST", path: "/v1/seal",
    body: { ca: s(a.ca), chain: a.chain, band: a.band, rule_id: a.rule_id, note: a.note },
  }),
  groundtruth_scorecard: (a) => ({ path: "/v1/scorecard", query: { limit: s(a.limit) } }),
  launch_feed: (a) => ({ path: "/v1/launches", query: { n: s(a.n), chain: s(a.chain) } }),
  beat_the_bot: (a) => {
    const act = s(a.action) || "state";
    const { action, ...rest } = a;
    if (act === "state") return { path: "/v1/btb" };
    if (act === "session") return { path: "/v1/btb/session", query: { id: s(a.session) } };
    if (act === "replay") return { method: "POST", path: "/v1/btb/replay", body: rest };
    if (act === "in" || act === "out") return { method: "POST", path: "/v1/btb/order", body: { ...rest, side: act } };
    throw new Error("action is state | in | out | session | replay");
  },
};

async function callApi(name, args) {
  const spec = HANDLERS[name](args || {});
  const url = new URL(BASE + spec.path);
  for (const [k, v] of Object.entries(spec.query || {})) if (v !== "" && v != null) url.searchParams.set(k, String(v));
  const headers = { "user-agent": `groundtruth-mcp/${VERSION}`, accept: "application/json" };
  if (process.env.GROUNDTRUTH_API_KEY) headers["x-api-key"] = process.env.GROUNDTRUTH_API_KEY;
  if (spec.body) headers["content-type"] = "application/json";
  const res = await fetch(url, { method: spec.method || "GET", headers, body: spec.body ? JSON.stringify(spec.body) : undefined });
  const text = await res.text();
  if (res.ok || (spec.allow404 && res.status === 404)) return { content: [{ type: "text", text }] };
  const hint = res.status === 401 || res.status === 402 ? " This tool needs GROUNDTRUTH_API_KEY (free key: https://groundtruths.xyz/api)." : "";
  return { isError: true, content: [{ type: "text", text: `${name} failed with HTTP ${res.status}: ${text.slice(0, 300)}.${hint}` }] };
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
