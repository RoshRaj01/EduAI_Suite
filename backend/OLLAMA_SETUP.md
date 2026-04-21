# Ollama Connection - Quick Start & Troubleshooting

## Quick Check (Run This First!)

```bash
cd backend

# 1. Check if Ollama is running and has models
python check_ollama_status.py

# 2. If that shows ❌, run this diagnostic
python test_ollama_connection.py

# 3. Fix any issues, then restart backend
python -m uvicorn app.main:app --reload
```

---

## What These Tools Do

### ✅ `check_ollama_status.py`

- **What**: Checks if Ollama process is running
- **Shows**: Installed models and process status
- **When to use**: Quick sanity check before running backend

### 🧪 `test_ollama_connection.py`

- **What**: Tests connectivity to Ollama from backend code
- **Shows**: Which endpoints are reachable
- **When to use**: Backend says "Ollama not available" but you know it's running

### ⚙️ `OLLAMA_TROUBLESHOOTING.md`

- **What**: Comprehensive troubleshooting guide
- **Shows**: Common issues and solutions
- **When to use**: Backend/frontend not detecting Ollama

---

## Typical Workflow

### First Time Setup

```bash
# 1. Start Ollama
ollama serve

# 2. In another terminal, verify it works
python check_ollama_status.py

# 3. Start backend
python -m uvicorn app.main:app --reload

# 4. Check status endpoint (should show green)
curl http://localhost:8000/api/games/chain-answer/status/ollama
```

### If "Ollama Not Available" Shows Up

```bash
# 1. Quick diagnostic
python test_ollama_connection.py

# 2. Output tells you which URL works
# 3. Update backend/.env with correct URL
# 4. Restart backend

# 5. Verify with status endpoint
curl http://localhost:8000/api/games/chain-answer/status/ollama
```

---

## Debug Endpoints (Backend Must Be Running)

### Check Status (User-Friendly)

```bash
curl http://localhost:8000/api/games/chain-answer/status/ollama
```

Response shows: `"ollama_available": true/false`

### Detailed Diagnostics

```bash
curl http://localhost:8000/api/games/chain-answer/debug/ollama
```

Response shows: All endpoints tested, models found, connection status

---

## Configuration (.env)

Create `backend/.env`:

```
# Default - works for local Ollama
OLLAMA_BASE_URL=http://localhost:11434

# For Docker on Windows
OLLAMA_BASE_URL=http://host.docker.internal:11434

# For remote machine
OLLAMA_BASE_URL=http://192.168.x.x:11434

# Specify which model to use
OLLAMA_MODEL=qwen2.5-coder:7b
```

Then restart backend for changes to take effect.

---

## Common Issues

| Problem                                 | Solution                                                      |
| --------------------------------------- | ------------------------------------------------------------- |
| "Ollama not available" but it's running | Run `python test_ollama_connection.py` to find right endpoint |
| Port 11434 in use                       | Check what's using it, or set different port in Ollama config |
| Backend in Docker can't reach Ollama    | Use `http://host.docker.internal:11434` in `.env`             |
| No models installed                     | Run `ollama pull qwen2.5-coder:7b`                            |
| Very slow word generation               | First call loads model - subsequent calls are fast            |

---

## Need Help?

1. **Run diagnostic**: `python test_ollama_connection.py`
2. **Check configuration**: Review `backend/.env` against outputs
3. **Read full guide**: `OLLAMA_TROUBLESHOOTING.md`
4. **Check backend logs**: Look for "Ollama" messages when backend starts

---

## Expected Output When Working ✅

### Backend Startup

```
============================================================
Ollama Service Initialization
============================================================
Endpoint: http://localhost:11434
Default Model: qwen2.5-coder:7b
✅ Ollama Connected - 2 models available
   Models: qwen2.5-coder:7b, mistral
============================================================
```

### Status Endpoint

```bash
$ curl http://localhost:8000/api/games/chain-answer/status/ollama
{
  "ollama_available": true,
  "endpoint": "http://localhost:11434",
  "available_models": ["qwen2.5-coder:7b", "mistral"],
  "default_model": "qwen2.5-coder:7b",
  "message": "Ollama service is running"
}
```

### Frontend Indicator

Should show: 🟢 **"✓ AI Word Generation Available"**

---

**If you see any issues, run the diagnostic tools above - they'll help identify the exact problem!**
