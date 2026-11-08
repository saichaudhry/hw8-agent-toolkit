// Standalone check: start server.js over stdio, list tools, call kalshi_lookup a few ways.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const client = new Client({ name: "smoke", version: "0" });
await client.connect(new StdioClientTransport({ command: process.execPath, args: [new URL("./server.js", import.meta.url).pathname] }));
console.log("tools:", (await client.listTools()).tools.map((t) => t.name));
const calls = process.argv.length > 2
  ? [JSON.parse(process.argv[2])]
  : [{ ticker: "KXNFLGAME", contains: "BAL", limit: 4 }, { ticker: "kxnflgame-26nov16lacbal-lac" }, { ticker: "NOTATICKER" }];
for (const args of calls) {
  const r = await client.callTool({ name: "kalshi_lookup", arguments: args });
  console.log(`\n>>> ${JSON.stringify(args)}${r.isError ? " (isError)" : ""}\n${r.content[0].text}`);
}
await client.close();
