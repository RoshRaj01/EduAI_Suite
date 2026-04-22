"""
Quick test to verify Groq service is working
"""
from app.services.groq_service import GroqService
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


print("=" * 60)
print("Testing Groq Service Connection")
print("=" * 60)

# Initialize the service
GroqService.initialize()

# Check if available
print("\n1. Checking Groq availability...")
is_available = GroqService.is_groq_available()
print(f"   Groq Available: {is_available}")

if is_available:
    # Test word generation
    print("\n2. Testing word generation...")
    suggestions = GroqService.generate_word_suggestions(
        subject="Animals",
        difficulty="medium",
        count=5,
        chain_variation="standard",
        starting_word="apple"
    )
    print(f"   Generated words: {suggestions}")

    # Test word validation
    print("\n3. Testing word validation...")
    is_valid, reason = GroqService.validate_word_semantic(
        word="lion",
        subject="Animals",
        previous_word="apple",
        chain_context=[]
    )
    print(f"   Word 'lion' for subject 'Animals': {is_valid}")
    print(f"   Reason: {reason}")
else:
    print("   ❌ Groq service is not available")

print("\n" + "=" * 60)
print("Test Complete")
print("=" * 60)
