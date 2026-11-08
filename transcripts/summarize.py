"""Turn a `claude -p --output-format stream-json --verbose` log into a short readable transcript.
Usage: python3 summarize.py run.jsonl > run.md"""
import json, sys

def text_of(c):
    if isinstance(c, str): return c
    return "\n".join(b.get("text", "") for b in c if isinstance(b, dict) and b.get("type") == "text")

for line in open(sys.argv[1]):
    line = line.strip()
    if not line.startswith("{"): continue
    e = json.loads(line)
    t = e.get("type")
    if t == "system" and e.get("subtype") == "init":
        print(f"[session] model={e.get('model')} cwd={e.get('cwd')} mcp={[(s['name'], s['status']) for s in e.get('mcp_servers', []) if 'kalshi' in s['name']]}\n")
    msg = e.get("message") if isinstance(e.get("message"), dict) else {}
    for b in msg.get("content", []) if isinstance(msg.get("content"), list) else []:
        if b.get("type") == "text" and t == "assistant" and b["text"].strip():
            print(f"AGENT: {b['text'].strip()[:600]}\n")
        elif b.get("type") == "tool_use":
            inp = b["input"]
            s = json.dumps(inp) if "mcp__" in b["name"] else (inp.get("command") or inp.get("file_path") or json.dumps(inp))[:300]
            print(f"  -> TOOL {b['name']}: {s}")
        elif b.get("type") == "tool_result":
            out = text_of(b.get("content") or "")
            print("     <- " + out[:400].replace("\n", "\n        ") + (" ..." if len(out) > 400 else "") + "\n")
    if t == "result":
        print(f"FINAL ({e.get('subtype')}, {e.get('num_turns')} turns, ${e.get('total_cost_usd', 0):.2f}):\n{e.get('result', '')}")
