# Ollama Connectivity Troubleshooting Guide

## Quick Diagnostics

### Step 1: Run the diagnostic test

```bash
cd backend
python test_ollama_connection.py
```

This will test multiple endpoints and tell you which one works.

### Step 2: Check if Ollama is actually running

```bash
# On Windows
tasklist | findstr ollama

# Or try to reach it directly
curl http://localhost:11434/api/tags
```

### Step 3: Verify Ollama has models

```bash
ollama list
```

Should show something like:

```
NAME                    ID              SIZE      MODIFIED
qwen2.5-coder:7b       abc123...       4.7 GB    2 hours ago
mistral:latest         def456...       4.1 GB    1 day ago
```

If no models show, pull one:

```bash
ollama pull qwen2.5-coder:7b
```

---

## Common Issues & Solutions

### ❌ Issue: "Ollama service is not available"

**Possible Causes & Solutions:**

1. **Ollama not running**

   ```bash
   # Start Ollama
   ollama serve
   ```

2. **Wrong endpoint URL**
   - Check `OLLAMA_BASE_URL` environment variable
   - Default is `http://localhost:11434`
   - For Docker on Windows, try: `http://host.docker.internal:11434`

   **Set environment variable:**

   ```bash
   # Create backend/.env file
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=qwen2.5-coder:7b
   ```

3. **Port conflict**

   ```bash
   # Check what's using port 11434
   netstat -ano | findstr "11434"

   # If Ollama is on different port, update:
   OLLAMA_BASE_URL=http://localhost:<YOUR_PORT>
   ```

4. **Firewall blocking**
   - Windows Firewall may block localhost connections
   - Try: `http://127.0.0.1:11434` or `http://host.docker.internal:11434`
5. **Backend can't reach Ollama (Docker issue)**
   - If backend is in Docker: Use `http://host.docker.internal:11434`
   - Set in `.env`: `OLLAMA_BASE_URL=http://host.docker.internal:11434`

6. **Ollama not loaded models**
   ```bash
   # Pull a model first
   ollama pull qwen2.5-coder:7b
   ```

---

## Testing Different Endpoints

Run this to find which endpoint works:

```bash
python test_ollama_connection.py
```

**Output Example:**

```
🧪 Testing: http://localhost:11434
   ✅ Connected (status: 200)
   📦 Models available: 2
      - qwen2.5-coder:7b
      - mistral:latest
```

---

## Configuration

### Option 1: Environment Variable (Recommended)

Create `backend/.env`:

```
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5-coder:7b
```

Then restart the backend:

```bash
python -m uvicorn app.main:app --reload
```

### Option 2: Docker (host.docker.internal)

If running backend in Docker:

```
OLLAMA_BASE_URL=http://host.docker.internal:11434
```

### Option 3: Remote Ollama

If Ollama is on different machine:

```
OLLAMA_BASE_URL=http://192.168.x.x:11434
```

---

## Debug Endpoints

Once backend is running, try these:

### Check Status (User-Friendly)

```bash
curl http://localhost:8000/api/games/chain-answer/status/ollama
```

Response if working:

```json
{
  "ollama_available": true,
  "endpoint": "http://localhost:11434",
  "available_models": ["qwen2.5-coder:7b", "mistral"],
  "default_model": "qwen2.5-coder:7b",
  "message": "Ollama service is running"
}
```

### Detailed Diagnostics

```bash
curl http://localhost:8000/api/games/chain-answer/debug/ollama
```

Response shows all attempted endpoints and connectivity for each.

---

## Verification Checklist

- [ ] Ollama process is running: `ollama serve`
- [ ] Ollama has models: `ollama list` shows at least one
- [ ] Endpoint is reachable: `curl http://localhost:11434/api/tags`
- [ ] Backend can reach it: Diagnostic test passes
- [ ] Correct URL in environment: `.env` has `OLLAMA_BASE_URL` set
- [ ] Backend restarted after `.env` change
- [ ] Frontend shows "AI Word Generation Available" (green indicator)

---

## Getting Help

Run this command and share output:

```bash
python test_ollama_connection.py
```

Also check backend logs for:

```
Ollama availability check
Ollama configured at
Error connecting to Ollama
```

---

## Expected Behavior

✅ **Working:**

- Frontend shows green "AI Word Generation Available" indicator
- Creating game with subject generates suggestions
- Suggestions are relevant to the subject

⚠️ **Degraded (using fallback):**

- Frontend shows yellow "Using fallback dictionary" indicator
- Games still work
- Word suggestions are from local dictionary (generic words)

❌ **Not working:**

- Frontend shows error or Ollama status failed
- Check troubleshooting steps above
