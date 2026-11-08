#!/usr/bin/env node
// kalshi-lookup: a one-tool MCP server (stdio) over Kalshi's PUBLIC market-data API.
// No API key, GET requests only. Nothing here can place, cancel, or read account data.
// Log to stderr only: stdout carries the MCP protocol.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE = "https://api.elections.kalshi.com/trade-api/v2";
const MAX_SCAN = 1000; // markets scanned per series lookup before giving up

async function get(path, params = {}) {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) if (v !== undefined) url.searchParams.set(k, v);
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "hw8-kalshi-lookup/1.0" },
      signal: AbortSignal.timeout(15000),
    });
    if (res.status === 404) return null;
    if (res.status === 429 || res.status >= 500) {
      await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
      continue;
    }
    if (!res.ok) throw new Error(`Kalshi ${res.status} on ${url.pathname}`);
    return res.json();
  }
  throw new Error(`Kalshi kept failing on ${url.pathname} (rate limit or outage)`);
}

// Kalshi returns prices as dollar STRINGS ("0.4600") and sizes as float strings ("12953.19").
const cents = (s) => (s === undefined || s === null || s === "" ? null : Math.round(parseFloat(s) * 100));
const num = (s) => Math.round(parseFloat(s || 0)).toLocaleString("en-US");
const isOpen = (m) => m.status === "active" || m.status === "open";

// Kalshi titles use city names ("Los Angeles C", "Buffalo"), never nicknames. v1 had no mapping, and an
// agent asked about "the Bills" guessed contains="BAL" (Baltimore). Map nicknames to Kalshi team codes.
const NFL = {
  cardinals: "ARI", falcons: "ATL", ravens: "BAL", bills: "BUF", panthers: "CAR", bears: "CHI", bengals: "CIN",
  browns: "CLE", cowboys: "DAL", broncos: "DEN", lions: "DET", packers: "GB", texans: "HOU", colts: "IND",
  jaguars: "JAC", chiefs: "KC", chargers: "LAC", rams: "LAR", raiders: "LV", dolphins: "MIA", vikings: "MIN",
  patriots: "NE", saints: "NO", giants: "NYG", jets: "NYJ", eagles: "PHI", steelers: "PIT", seahawks: "SEA",
  "49ers": "SF", niners: "SF", buccaneers: "TB", bucs: "TB", titans: "TEN", commanders: "WAS",
};

function matches(m, needle) {
  if (!needle) return true;
  const hay = [m.ticker, m.event_ticker, m.title, m.yes_sub_title, m.no_sub_title].join(" ").toLowerCase();
  return needle.toLowerCase().split(/\s+/).every((w) => hay.includes((NFL[w] || w).toLowerCase()));
}

function fmtMarket(m) {
  const bid = cents(m.yes_bid_dollars), ask = cents(m.yes_ask_dollars), last = cents(m.last_price_dollars);
  const quote = bid === null && ask === null ? "no quotes" : `bid ${bid ?? "-"}c / ask ${ask ?? "-"}c`;
  const label = m.yes_sub_title || m.title || "";
  const result = m.result ? `  RESULT ${m.result.toUpperCase()}` : "";
  return `  ${m.ticker}  "${label}"  ${quote}  last ${last ?? "-"}c  vol ${num(m.volume_fp)}  OI ${num(m.open_interest_fp)}  [${m.status}] closes ${m.close_time}${result}`;
}

const RAW_KEYS = ["ticker", "event_ticker", "title", "yes_sub_title", "status", "yes_bid_dollars", "yes_ask_dollars",
  "last_price_dollars", "volume_fp", "open_interest_fp", "close_time", "result"];

function render(header, events, shown, total, raw) {
  const lines = [header, "Prices: YES side, in cents (converted from Kalshi's dollar strings). vol/OI in contracts.", ""];
  for (const ev of events) {
    if (!ev.markets.length) continue;
    lines.push(`EVENT ${ev.event_ticker}  ${ev.title ?? ""}${ev.sub_title ? `  (${ev.sub_title})` : ""}`);
    for (const m of ev.markets) lines.push(fmtMarket(m));
  }
  if (shown < total) lines.push("", `Showing ${shown} of ${total} matching markets. Narrow with 'contains' or raise 'limit'.`);
  const first = events.find((e) => e.markets.length)?.markets[0];
  if (raw && first) {
    lines.push("", `For code: GET ${BASE}/markets?event_ticker=<EVENT> (or /events?series_ticker=<SERIES>&with_nested_markets=true).`,
      "Raw API fields for the first market above (prices are dollar STRINGS, sizes are float STRINGS):",
      JSON.stringify(Object.fromEntries(RAW_KEYS.map((k) => [k, first[k]])), null, 2));
  }
  return lines.join("\n");
}

async function lookup({ ticker, contains, status, limit, raw }) {
  const t = ticker.trim().toUpperCase();
  const wantOpen = status === "open";

  // 1) A single market ticker, e.g. KXNFLGAME-26NOV16LACBAL-LAC
  const mk = await get(`/markets/${encodeURIComponent(t)}`);
  if (mk?.market) {
    const ev = await get(`/events/${encodeURIComponent(mk.market.event_ticker)}`);
    return render(`Kalshi market ${t}`, [{ ...(ev?.event ?? { event_ticker: mk.market.event_ticker }), markets: [mk.market] }], 1, 1, raw);
  }

  // 2) An event ticker, e.g. KXNFLGAME-26NOV16LACBAL (all markets in one game/question)
  const ev = await get(`/events/${encodeURIComponent(t)}`);
  if (ev?.event) {
    const all = (ev.markets || []).filter((m) => (wantOpen ? isOpen(m) : true) && matches(m, contains));
    return render(`Kalshi event ${t}: ${all.length} ${wantOpen ? "open " : ""}markets`, [{ ...ev.event, markets: all.slice(0, limit) }], Math.min(limit, all.length), all.length, raw);
  }

  // 3) A series ticker, e.g. KXNFLGAME (every game in the league)
  const series = await get(`/series/${encodeURIComponent(t)}`);
  if (series?.series) {
    const events = [];
    let cursor, scanned = 0, total = 0, shown = 0;
    do {
      const page = await get("/events", {
        series_ticker: t, with_nested_markets: "true", limit: "100", cursor,
        status: wantOpen ? "open" : undefined,
      });
      if (!page) break;
      for (const e of page.events || []) {
        const ms = (e.markets || []).filter((m) => (wantOpen ? isOpen(m) : true) && matches(m, contains));
        scanned += (e.markets || []).length;
        total += ms.length;
        const keep = ms.slice(0, Math.max(0, limit - shown));
        shown += keep.length;
        if (keep.length) events.push({ ...e, markets: keep });
      }
      cursor = page.cursor;
    } while (cursor && scanned < MAX_SCAN);
    if (!total) return `Series ${t} (${series.series.title}) exists but has no ${wantOpen ? "open " : ""}markets${contains ? ` matching "${contains}"` : ""}.`;
    return render(`Kalshi series ${t} (${series.series.title}): ${total} ${wantOpen ? "open " : ""}markets${contains ? ` matching "${contains}"` : ""}`, events, shown, total, raw);
  }

  return `No Kalshi market, event, or series is named "${t}". Tickers look like SERIES (KXNFLGAME), ` +
    `SERIES-EVENT (KXNFLGAME-26NOV16LACBAL), or SERIES-EVENT-OUTCOME (KXNFLGAME-26NOV16LACBAL-LAC).`;
}

// v3: Claude Code defers MCP tools, so the model sees only the tool NAME until it runs ToolSearch, and
// the description above never reaches it. Server `instructions` are always put in the system prompt.
const server = new McpServer(
  { name: "kalshi-lookup", version: "3.0.0" },
  {
    instructions:
      "kalshi_lookup gives live, read-only data from Kalshi's public API. Whenever a task involves Kalshi " +
      "(writing or debugging code that calls the Kalshi API, or answering questions about Kalshi markets or prices), " +
      "call kalshi_lookup before using curl, urllib, or memory: use raw=true to see the exact tickers, endpoint, " +
      "and raw JSON field names/formats (prices are dollar strings like \"0.4600\"). Team nicknames work in 'contains'.",
  },
);

server.registerTool(
  "kalshi_lookup",
  {
    title: "Kalshi market lookup",
    description:
      "Live data from Kalshi's public prediction-market API (read-only, no key). Call this BEFORE writing or " +
      "debugging any code that talks to Kalshi, instead of curl/urllib or guessing from memory: it shows the real " +
      "tickers that exist right now and, with raw=true, the exact raw JSON field names and formats your code must " +
      "parse (prices are dollar strings like \"0.4600\", not integer cents). Also use it for any question about " +
      "current Kalshi prices or odds. Ticker levels: series KXNFLGAME (NFL winners; also KXNFLSPREAD, KXNFLTOTAL, " +
      "KXNBAGAME, KXNCAAFGAME, KXMLBGAME), event KXNFLGAME-26NOV16LACBAL (one game: YYMONDD + away + home team " +
      "codes), market KXNFLGAME-26NOV16LACBAL-LAC. 'contains' filters by team code, city, or nickname " +
      "('BUF', 'Buffalo', or 'Bills'). Returns YES bid/ask/last in cents, volume, open interest, status, close time.",
    inputSchema: {
      ticker: z.string().min(2).describe("Kalshi series, event, or market ticker, e.g. KXNFLGAME"),
      contains: z.string().optional().describe("Case-insensitive filter on ticker/title/team, e.g. 'BAL'"),
      status: z.enum(["open", "any"]).default("open").describe("'open' (default) hides closed/settled markets"),
      limit: z.number().int().min(1).max(100).default(25).describe("Max markets to return"),
      raw: z.boolean().default(false).describe("Also return the raw API JSON fields for one market (use when writing code)"),
    },
  },
  async (args) => {
    try {
      return { content: [{ type: "text", text: await lookup(args) }] };
    } catch (err) {
      console.error("[kalshi-lookup]", err);
      return { content: [{ type: "text", text: `Kalshi lookup failed: ${err.message}` }], isError: true };
    }
  },
);

await server.connect(new StdioServerTransport());
console.error("[kalshi-lookup] ready on stdio");
