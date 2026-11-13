"""Run from backend; save explicit exit codes when shell capture is unavailable."""
from pathlib import Path
import subprocess
import sys

checks = [
    [sys.executable, '-m', 'unittest', 'discover', '-s', 'tests', '-v'],
    [sys.executable, '-m', 'compileall', '-q', 'app', 'tests'],
    ['node', '--check', '../frontend/js/pages/products.js'],
    ['node', '--check', '../frontend/js/layout.js'],
    [sys.executable, '-c', 'from app.main import app; print("OpenAPI paths:", len(app.openapi()["paths"]))'],
]
logs, codes = [], []
for command in checks:
    result = subprocess.run(command, capture_output=True, text=True)
    codes.append(result.returncode)
    logs.append(f'{command}\nExit code: {result.returncode}\n{result.stdout}\n{result.stderr}')
Path('catalog-test-results.txt').write_text('\n'.join(logs), encoding='utf-8')
print('\n'.join(logs))
sys.exit(1 if any(codes) else 0)