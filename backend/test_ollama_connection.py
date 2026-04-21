#!/usr/bin/env python3
"""
Test script to verify Ollama connectivity
"""
import httpx
import sys


def test_ollama_endpoint(url, timeout=10.0):
    """Test connection to Ollama endpoint"""
    print(f"\n🧪 Testing: {url}")
    try:
        response = httpx.get(f"{url}/api/tags", timeout=timeout)
        print(f"   ✅ Connected (status: {response.status_code})")
        if response.status_code == 200:
            models = response.json().get("models", [])
            print(f"   📦 Models available: {len(models)}")
            for model in models:
                print(f"      - {model.get('name', 'unknown')}")
            return True
        else:
            print(f"   ⚠️  Unexpected status code: {response.status_code}")
            return False
    except httpx.ConnectError as e:
        print(f"   ❌ Connection refused: {e}")
        return False
    except httpx.TimeoutException as e:
        print(f"   ⏱️  Timeout: {e}")
        return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False


def main():
    endpoints = [
        "http://localhost:11434",
        "http://127.0.0.1:11434",
        "http://host.docker.internal:11434",
    ]

    print("=" * 60)
    print("Ollama Connectivity Diagnostic Test")
    print("=" * 60)

    results = {}
    for endpoint in endpoints:
        results[endpoint] = test_ollama_endpoint(endpoint)

    print("\n" + "=" * 60)
    print("Summary:")
    print("=" * 60)

    available = [url for url, available in results.items() if available]
    if available:
        print(f"✅ Ollama is accessible at: {available[0]}")
        print(
            f"\n💡 Update OLLAMA_BASE_URL in ollama_service.py to: {available[0]}")
        return 0
    else:
        print("❌ Ollama is not accessible on any tested endpoint")
        print("\n🔧 Troubleshooting steps:")
        print("   1. Verify Ollama is running: 'ollama serve'")
        print("   2. Check firewall rules")
        print("   3. On Docker: Use 'http://host.docker.internal:11434'")
        print("   4. Run: 'ollama list' to verify models are installed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
