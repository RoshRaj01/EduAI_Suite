"""
Groq Service for Chain Answer Game
Handles word generation and validation using Groq Cloud API
"""
import logging
import os
from typing import List, Optional
from groq import Groq

logger = logging.getLogger(__name__)

# Get from environment at runtime
# List of models in fallback order (newer models first, older as fallback)
AVAILABLE_MODELS = [
    "llama-3.3-70b-versatile",  # Current working model
    "llama-3.1-70b-versatile",  # Alternative
    "llama-3.1-8b-instant",     # Faster alternative
]

DEFAULT_MODEL = "llama-3.3-70b-versatile"

logger.info(f"Groq service configured with default model: {DEFAULT_MODEL}")


class LocalWordValidator:
    """Local word validator for fallback when Groq is unavailable"""

    # Mock dictionary
    DICTIONARY = {
        "apple", "elephant", "train", "cat", "tiger", "rabbit", "dog", "goat",
        "tree", "giraffe", "egg", "table", "bat", "ant", "zebra", "astronaut",
        "ball", "car", "doll", "fan", "game", "hat", "ice", "jam", "king",
        "lion", "mouse", "nest", "orange", "pig", "quiz", "rat", "sun",
        "turtle", "umbrella", "violin", "whale", "xylophone", "yak", "zone",
        "zebra", "science", "history", "mathematics", "physics", "chemistry",
        "biology", "geography", "english", "hindi", "spanish", "french",
        "book", "pen", "desk", "chair", "window", "door", "house", "school",
        "college", "university", "doctor", "engineer", "teacher", "student",
        "water", "fire", "air", "earth", "sky", "cloud", "rain", "snow"
    }

    @staticmethod
    def validate(word: str, previous_word: str, chain_variation: str, used_words: List[str]) -> dict:
        """Basic local word validation"""
        word_lower = word.lower()

        # Check if word exists in dictionary
        if word_lower not in LocalWordValidator.DICTIONARY:
            return {"isValid": False, "message": "Word not in dictionary"}

        # Check if word is already used
        if word_lower in [w.lower() for w in used_words]:
            return {"isValid": False, "message": "Word already used"}

        # Chain variation rules
        if chain_variation == "standard":
            # Last letter of previous word must match first letter of current word
            if previous_word and previous_word[-1].lower() != word_lower[0]:
                return {"isValid": False, "message": f"Must start with '{previous_word[-1].lower()}'"}

        return {"isValid": True, "message": "Valid word", "suggestions": []}


class GroqService:
    """Service to interact with Groq Cloud API for word generation and validation"""

    _initialized = False
    _available = False
    _client = None

    @classmethod
    def initialize(cls):
        """Initialize Groq service - called on startup"""
        if cls._initialized:
            return

        cls._initialized = True
        logger.info("="*60)
        logger.info("Groq Service Initialization")
        logger.info("="*60)
        logger.info(f"Model: {DEFAULT_MODEL}")

        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            logger.error("❌ GROQ_API_KEY not set in environment")
            cls._available = False
        else:
            try:
                cls._client = Groq(api_key=groq_api_key)
                cls._available = cls.is_groq_available()
                if cls._available:
                    logger.info(f"✅ Groq Connected and Ready")
                else:
                    logger.warning(
                        "⚠️  Groq service check failed - using fallback validator")
            except Exception as e:
                logger.error(f"❌ Failed to initialize Groq: {e}")
                cls._available = False
        logger.info("="*60)

    @staticmethod
    def generate_word_suggestions(
        subject: str,
        difficulty: str,
        count: int = 5,
        chain_variation: str = "standard",
        starting_word: str = "apple"
    ) -> List[str]:
        """
        Generate word suggestions using Groq for a given subject and difficulty.

        Args:
            subject: Topic/subject for word generation (e.g., "Science", "Animals")
            difficulty: easy, medium, hard
            count: Number of suggestions to generate (default: 5)
            chain_variation: Type of chain game (standard, category, ladder, etc.)
            starting_word: Starting word for context

        Returns:
            List of suggested words, or empty list if generation fails
        """
        if not GroqService._client:
            logger.warning("Groq client not initialized")
            return []

        try:
            difficulty_hint = {
                "easy": "common, simple words",
                "medium": "moderate difficulty words",
                "hard": "challenging, uncommon words"
            }.get(difficulty, "common words")

            prompt = f"""Generate exactly {count} English words related to "{subject}" that are {difficulty_hint}.
These words will be used in a word chain game starting with "{starting_word}".
For a {chain_variation} chain game.
Return ONLY the words, one per line, no numbering, no explanations, no extra text."""

            try:
                message = GroqService._client.chat.completions.create(
                    messages=[
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    model=DEFAULT_MODEL,
                    temperature=0.7,
                    max_tokens=200,
                )
                generated_text = message.choices[0].message.content
            except Exception as e:
                if "decommissioned" in str(e).lower() or "model" in str(e).lower():
                    logger.warning(f"Model {DEFAULT_MODEL} not available, trying alternative models")
                    # Try alternative models
                    for alt_model in AVAILABLE_MODELS[1:]:
                        try:
                            message = GroqService._client.chat.completions.create(
                                messages=[{"role": "user", "content": prompt}],
                                model=alt_model,
                                temperature=0.7,
                                max_tokens=200,
                            )
                            generated_text = message.choices[0].message.content
                            logger.info(f"Successfully used alternative model: {alt_model}")
                            break
                        except Exception:
                            continue
                    else:
                        logger.error("All models failed")
                        return []
                else:
                    raise

            # Parse words from response
            words = [w.strip().lower()
                     for w in generated_text.split('\n') if w.strip()]
            # Filter valid words (alphabetic only, reasonable length)
            valid_words = [w for w in words if w.isalpha()
                           and 2 <= len(w) <= 15]

            logger.info(
                f"Generated {len(valid_words)} suggestions for subject: {subject}")
            return valid_words[:count]

        except Exception as e:
            logger.error(f"Error generating words with Groq: {e}")
            return []

    @staticmethod
    def validate_word_semantic(
        word: str,
        subject: str,
        previous_word: str,
        chain_context: List[str]
    ) -> tuple[bool, str]:
        """
        Validate if a word is semantically related to the subject using Groq.

        Args:
            word: Word to validate
            subject: Subject/topic context
            previous_word: Previous word in the chain
            chain_context: List of words already in the chain

        Returns:
            Tuple of (is_valid: bool, reason: str)
        """
        if not GroqService._client:
            logger.warning("Groq client not initialized")
            return False, "Service not available"

        try:
            chain_summary = ", ".join(
                chain_context[-3:]) if chain_context else previous_word

            prompt = f"""Is the word "{word}" semantically related to "{subject}"?
Context: This is part of a word chain about {subject}, following: {previous_word}
Chain so far: {chain_summary}

Answer with ONLY "yes" or "no", followed by a brief reason (max 10 words)."""

            try:
                message = GroqService._client.chat.completions.create(
                    messages=[
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    model=DEFAULT_MODEL,
                    temperature=0.3,
                    max_tokens=50,
                )
                generated_text = message.choices[0].message.content.lower().strip()
            except Exception as e:
                if "decommissioned" in str(e).lower() or "model" in str(e).lower():
                    logger.warning(f"Model {DEFAULT_MODEL} not available, trying alternative")
                    # Try alternative models
                    for alt_model in AVAILABLE_MODELS[1:]:
                        try:
                            message = GroqService._client.chat.completions.create(
                                messages=[{"role": "user", "content": prompt}],
                                model=alt_model,
                                temperature=0.3,
                                max_tokens=50,
                            )
                            generated_text = message.choices[0].message.content.lower().strip()
                            break
                        except Exception:
                            continue
                    else:
                        return False, "Service unavailable"
                else:
                    raise

            # Parse yes/no answer
            is_valid = generated_text.startswith("yes")
            reason = generated_text.split(
                '\n')[0] if '\n' in generated_text else generated_text

            logger.info(f"Word validation for '{word}': {is_valid}")
            return is_valid, reason

        except Exception as e:
            logger.error(f"Error validating word with Groq: {e}")
            return False, f"Validation error: {str(e)}"

    @staticmethod
    def is_groq_available() -> bool:
        """Check if Groq service is available"""
        if not GroqService._client:
            logger.warning("Groq client not initialized")
            return False

        try:
            # Test the API with a simple request
            message = GroqService._client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": "Say 'OK'"
                    }
                ],
                model=DEFAULT_MODEL,
                max_tokens=10,
            )
            logger.info("✅ Groq service is available and responding")
            return True
        except Exception as e:
            logger.warning(f"Groq availability check failed: {e}")
            return False


class WordValidationWithFallback:
    """Wrapper that uses Groq first, falls back to local validator"""

    def __init__(self):
        self.groq_available = GroqService.is_groq_available()
        self.local_validator = LocalWordValidator()

    def validate_word(
        self,
        word: str,
        previous_word: str,
        chain_variation: str,
        used_words: List[str],
        subject: Optional[str] = None,
        difficulty: str = "medium"
    ) -> dict:
        """
        Validate word using Groq (if available) or local validator as fallback

        Returns:
            {
                "is_valid": bool,
                "message": str,
                "validation_source": "groq" or "local",
                "suggestions": List[str]
            }
        """
        result = {
            "is_valid": False,
            "message": "",
            "validation_source": "local",
            "suggestions": []
        }

        # Try Groq validation if available and subject is provided
        if self.groq_available and subject:
            try:
                is_valid, reason = GroqService.validate_word_semantic(
                    word=word,
                    subject=subject,
                    previous_word=previous_word,
                    chain_context=[]
                )
                if is_valid:
                    result["is_valid"] = True
                    result["message"] = f"Valid word for subject: {subject}"
                    result["validation_source"] = "groq"
                    return result
                else:
                    result["message"] = f"Not related to subject: {subject}"
                    result["validation_source"] = "groq"
            except Exception as e:
                logger.error(f"Groq validation failed: {e}")
                # Fall through to local validator

        # Use local validator as fallback
        try:
            local_result = self.local_validator.validate(
                word=word,
                previous_word=previous_word,
                chain_variation=chain_variation,
                used_words=used_words
            )

            result["is_valid"] = local_result.get("isValid", False)
            result["message"] = local_result.get(
                "message", "Validation complete")
            result["validation_source"] = "local"
            result["suggestions"] = local_result.get("suggestions", [])

        except Exception as e:
            logger.error(f"Local validation failed: {e}")
            result["message"] = "Validation service unavailable"

        return result
