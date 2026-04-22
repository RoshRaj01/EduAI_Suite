"""
Quick test to verify Groq service is working
"""
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables BEFORE importing service
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

# Now import after env is loaded
from app.services.groq_service import GroqService, WordValidationWithFallback

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
    print("   Note: Groq service not available - using local fallback")

print("\n4. Testing fallback word validation...")
validator = WordValidationWithFallback()
result = validator.validate_word(
    word="elephant",
    previous_word="apple",
    chain_variation="standard",
    used_words=[],
    subject="Animals"
)
print(f"   Validation result: {result}")
print(f"   Source: {result.get('validation_source', 'unknown')}")

print("\n" + "=" * 60)
print("Test Complete - Service is ready to use!")
print("=" * 60)
