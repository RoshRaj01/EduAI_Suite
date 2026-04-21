#!/usr/bin/env python3
"""
Quick Ollama Status Check
Shows if Ollama is running and which models are available
"""
import subprocess
import sys


def check_ollama_process():
    """Check if ollama process is running"""
    try:
        # Try to find ollama process
        result = subprocess.run(
            ["tasklist"],
            capture_output=True,
            text=True
        )
        if "ollama" in result.stdout.lower():
            print("✅ Ollama process is running")
            return True
        else:
            print("❌ Ollama process NOT found")
            return False
    except Exception as e:
        print(f"Could not check process: {e}")
        return None


def get_ollama_models():
    """Get list of installed Ollama models"""
    try:
        result = subprocess.run(
            ["ollama", "list"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')
            models = []
            for line in lines[1:]:  # Skip header
                if line.strip():
                    model_name = line.split()[0]
                    models.append(model_name)
            return models
        else:
            print(f"Error running 'ollama list': {result.stderr}")
            return []
    except subprocess.TimeoutExpired:
        print("ollama list timed out")
        return []
    except FileNotFoundError:
        print("❌ 'ollama' command not found - is Ollama installed?")
        return []
    except Exception as e:
        print(f"Error getting models: {e}")
        return []


def main():
    print("\n" + "="*60)
    print("Ollama Status Check")
    print("="*60 + "\n")

    # Check process
    process_running = check_ollama_process()

    # Get models
    print("\nChecking installed models...")
    models = get_ollama_models()

    if models:
        print(f"📦 Found {len(models)} models:")
        for model in models:
            print(f"   ✓ {model}")
    else:
        print("❌ No models found")
        print("\n💡 To install a model, run:")
        print("   ollama pull qwen2.5-coder:7b")

    print("\n" + "="*60)

    if process_running and models:
        print("✅ Ollama is ready to use!")
        print("   - Start backend: python -m uvicorn app.main:app --reload")
        return 0
    elif process_running:
        print("⚠️  Ollama is running but no models installed")
        print("   - Install a model first: ollama pull qwen2.5-coder:7b")
        return 1
    else:
        print("❌ Ollama is not running")
        print("   - Start Ollama: ollama serve")
        return 1


if __name__ == "__main__":
    sys.exit(main())
