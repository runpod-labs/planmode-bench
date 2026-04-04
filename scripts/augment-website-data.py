#!/usr/bin/env python3
"""
Augments packages/website/src/data/sample-results.json with:
- Repo info (project name, org, URL) from task YAMLs
- Duration and token data from raw result files
- Correct difficulty levels from task YAMLs

Always resolves paths from the repo root, regardless of where you run it from.
"""
import json, os, sys, yaml

# Always resolve from repo root
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)

DATA_PATH = os.path.join(REPO_ROOT, 'packages/website/src/data/sample-results.json')
TASKS_DIR = os.path.join(REPO_ROOT, 'tasks')
RUNS_DIR = os.path.join(REPO_ROOT, 'results/runs')

if not os.path.exists(DATA_PATH):
    print(f"error: {DATA_PATH} not found", file=sys.stderr)
    sys.exit(1)

data = json.load(open(DATA_PATH))

# 1. Add repo info + fix difficulty from task YAMLs
for task in data['tasks']:
    tid = task['id']
    yaml_path = os.path.join(TASKS_DIR, tid, 'task.yaml')
    if os.path.exists(yaml_path):
        with open(yaml_path) as yf:
            task_def = yaml.safe_load(yf)
        diff = task_def.get('difficulty', 'medium')
        if diff == 'expert': diff = 'hard'
        task['difficulty'] = diff
        source = task_def.get('setup', {}).get('source_repo', {})
        if source and source.get('url'):
            url = source['url']
            if url.endswith('.git'): url = url[:-4]
            parts = url.rstrip('/').split('/')
            task['project'] = parts[-1]
            task['repoUrl'] = url
            task['repoOrg'] = parts[-2]
            task['repoRef'] = source.get('ref', '')

# 2. Collect duration + tokens from raw result files
duration_data = {}
if os.path.isdir(RUNS_DIR):
    for run_name in sorted(os.listdir(RUNS_DIR)):
        task_dir = os.path.join(RUNS_DIR, run_name, 'tasks')
        if not os.path.isdir(task_dir): continue
        for f in os.listdir(task_dir):
            if not f.endswith('.json'): continue
            try:
                d = json.load(open(os.path.join(task_dir, f)))
                key = (d['task_id'], d['mode'])
                m = d['metrics']
                duration_data[key] = {
                    'durationMs': m.get('duration_ms', 0),
                    'tokens': m.get('input_tokens', 0) + m.get('output_tokens', 0),
                }
            except: pass

# 3. Augment task results
for task in data['tasks']:
    for mode, result in task['results'].items():
        key = (task['id'], mode)
        if key in duration_data:
            result['durationMs'] = duration_data[key]['durationMs']
            result['tokens'] = duration_data[key]['tokens']
        else:
            result.setdefault('durationMs', 0)
            result.setdefault('tokens', 0)

# 4. Compute avgDurationMs for overall
for mode, stats in data['overall'].items():
    mode_tasks = [t['results'][mode] for t in data['tasks']
                  if mode in t['results'] and t['results'][mode].get('totalCost', 0) > 0]
    durations = [t.get('durationMs', 0) for t in mode_tasks if t.get('durationMs', 0) > 0]
    stats['avgDurationMs'] = sum(durations) / len(durations) if durations else 0

with open(DATA_PATH, 'w') as f:
    json.dump(data, f, indent=2)

repos = sum(1 for t in data['tasks'] if t.get('repoUrl'))
print(f"augmented {len(data['tasks'])} tasks ({repos} with repos)")
for mode in data['overall']:
    o = data['overall'][mode]
    dur = o.get('avgDurationMs', 0) / 60000
    print(f"  {mode:20s} n={o.get('n','?'):>4}  score={o['avgScore']:.1%}  cost=${o['avgCost']:.2f}  dur={dur:.1f}m")
