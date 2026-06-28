import requests, json
s = requests.get('http://127.0.0.1:8000/api/status/run_421fd44b7f85').json()
for l in s['logs']:
    print(f"[{l['agent_name']}][{l['status']}] {l['message'][:150]}")
