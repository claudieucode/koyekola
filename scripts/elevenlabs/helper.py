# Aides de create-agent.sh (JSON uniquement ; aucune clé n'est lue ici).
import json, sys

def kb_body(path):
    print(json.dumps({"name": "Kolakisa - base de connaissances", "text": open(path, encoding="utf-8").read()}))

def field(name):
    try:
        d = json.load(sys.stdin)
        print(d.get(name, "") or "")
    except Exception:
        print("")

def config(path, kb_id):
    c = json.load(open(path, encoding="utf-8"))
    c["conversation_config"]["agent"]["prompt"]["knowledge_base"] = [{"type": "text", "id": kb_id, "name": "Kolakisa", "usage_mode": "prompt"}]
    print(json.dumps(c))

def kb_ids():
    try:
        d = json.load(sys.stdin)
        print(" ".join(k["id"] for k in d["conversation_config"]["agent"]["prompt"].get("knowledge_base", []) if k.get("id")))
    except Exception:
        print("")

if __name__ == "__main__":
    cmd = sys.argv[1]
    {"kb_body": kb_body, "field": field, "config": config, "kb_ids": kb_ids}[cmd](*sys.argv[2:])
