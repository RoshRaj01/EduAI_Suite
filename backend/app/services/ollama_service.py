"""
Ollama Service for Chain Answer Game
Handles word generation and validation using local Ollama instance
"""
import httpx
import json
import logging
import os
from typing import List, Optional

logger = logging.getLogger(__name__)

# Load from environment or use defaults
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
DEFAULT_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5-coder:7b")

logger.info(f"Ollama configured at: {OLLAMA_BASE_URL}")
logger.info(f"Default model: {DEFAULT_MODEL}")


class LocalWordValidator:
    """Local word validator for fallback when Ollama is unavailable"""

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


class OllamaService:
    """Service to interact with local Ollama instance for word generation and validation"""

    _initialized = False
    _available = False

    @classmethod
    def initialize(cls):
        """Initialize Ollama service - called on startup"""
        if cls._initialized:
            return
        
        cls._initialized = True
        logger.info("="*60)
        logger.info("Ollama Service Initialization")
        logger.info("="*60)
        logger.info(f"Endpoint: {OLLAMA_BASE_URL}")
        logger.info(f"Default Model: {DEFAULT_MODEL}")
        
        cls._available = cls.is_ollama_available()
        if cls._available:
            models = cls.get_available_models()
            logger.info(f"✅ Ollama Connected - {len(models)} models available")
            logger.info(f"   Models: {', '.join(models[:3])}")
        else:
            logger.warning("⚠️  Ollama not available - using fallback validator")
        logger.info("="*60)
    def generate_word_suggestions(
        subject: str,
        difficulty: str,
        count: int = 5,
        chain_variation: str = "standard",
        starting_word: str = "apple"
    ) -> List[str]:
        """
        Generate word suggestions using Ollama for a given subject and difficulty.

        Args:
            subject: Topic/subject for word generation (e.g., "Science", "Animals")
            difficulty: easy, medium, hard
            count: Number of suggestions to generate (default: 5)
            chain_variation: Type of chain game (standard, category, ladder, etc.)
            starting_word: Starting word for context

        Returns:
            List of suggested words, or empty list if generation fails
        """
        try:
            difficulty_hint = {
                "easy": "common, simple words",
                "medium": "moderate difficulty words",
                "hard": "challenging, uncommon words"
            }.get(difficulty, "common words")

            prompt = f"""Generate exactly {count} English words related to "{subject}" that are {difficulty_hint}.
These words will be used in a word chain game starting with "{starting_word}".
For a {chain_variation} chain game.
Return ONLY the words, one per line, no numbering, no explanations."""

            response = httpx.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": DEFAULT_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "temperature": 0.7,
                },
                timeout=30.0
            )

            if response.status_code == 200:
                result = response.json()
                generated_text = result.get("response", "")

                # Parse words from response
                words = [w.strip().lower()
                         for w in generated_text.split('\n') if w.strip()]
                # Filter valid words (alphabetic only, reasonable length)
                valid_words = [w for w in words if w.isalpha()
                               and 2 <= len(w) <= 15]

                logger.info(
                    f"Generated {len(valid_words)} suggestions for subject: {subject}")
                return valid_words[:count]
            else:
                logger.warning(f"Ollama API error: {response.status_code}")
                return []

        except httpx.ConnectError:
            logger.warning(
                f"Cannot connect to Ollama at {OLLAMA_BASE_URL}. Using fallback.")
            return []
        except Exception as e:
            logger.error(f"Error generating words with Ollama: {e}")
            return []

    @staticmethod
    def validate_word_semantic(
        word: str,
        subject: str,
        previous_word: str,
        chain_context: List[str]
    ) -> tuple[bool, str]:
        """
        Validate if a word is semantically related to the subject using Ollama.

        Args:
            word: Word to validate
            subject: Subject/topic context
            previous_word: Previous word in the chain
            chain_context: List of words already in the chain

        Returns:
            Tuple of (is_valid: bool, reason: str)
        """
        try:
            chain_summary = ", ".join(
                chain_context[-3:]) if chain_context else previous_word

            prompt = f"""Is the word "{word}" semantically related to "{subject}"?
Context: This is part of a word chain about {subject}, following: {previous_word}
Chain so far: {chain_summary}

Answer with ONLY "yes" or "no", followed by a brief reason (max 10 words)."""

            response = httpx.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": DEFAULT_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "temperature": 0.3,
                },
                timeout=15.0
            )

            if response.status_code == 200:
                result = response.json()
                generated_text = result.get("response", "").lower().strip()

                # Parse yes/no answer
                is_valid = generated_text.startswith("yes")
                reason = generated_text.split(
                    '\n')[0] if '\n' in generated_text else generated_text

                logger.info(f"Word validation for '{word}': {is_valid}")
                return is_valid, reason
            else:
                logger.warning(
                    f"Ollama validation API error: {response.status_code}")
                return False, "Validation service unavailable"

        except httpx.ConnectError:
            logger.warning(
                "Cannot connect to Ollama for validation. Using fallback.")
            return False, "Service unavailable"
        except Exception as e:
            logger.error(f"Error validating word with Ollama: {e}")
            return False, f"Validation error: {str(e)}"

    @staticmethod
    def is_ollama_available() -> bool:
        """Check if Ollama service is running and accessible"""
        try:
            response = httpx.get(
                f"{OLLAMA_BASE_URL}/api/tags",
                timeout=10.0  # Increased timeout
            )
            is_available = response.status_code == 200
            logger.info(f"Ollama availability check: {is_available} (status: {response.status_code})")
            return is_available
        except httpx.ConnectError as e:
            logger.warning(f"Cannot connect to Ollama at {OLLAMA_BASE_URL}: {e}")
            return False
        except httpx.TimeoutException as e:
            logger.warning(f"Ollama connection timeout at {OLLAMA_BASE_URL}: {e}")
            return False
        except Exception as e:
            logger.error(f"Ollama availability check failed: {e}")
            return False

    @staticmethod
    def get_available_models() -> List[str]:
        """Get list of available models in Ollama"""
        try:
            response = httpx.get(
                f"{OLLAMA_BASE_URL}/api/tags",
                timeout=10.0  # Increased timeout
            )
            if response.status_code == 200:
                data = response.json()
                models = [model.get("name", "") for model in data.get("models", [])]
                logger.info(f"Found {len(models)} Ollama models: {models}")
                return models
            logger.warning(f"Ollama API returned status {response.status_code}")
            return []
        except httpx.ConnectError as e:
            logger.warning(f"Cannot connect to Ollama for model list: {e}")
            return []
        except Exception as e:
            logger.error(f"Error fetching Ollama models: {e}")
            return []


class WordValidationWithFallback:
    """Wrapper that uses Ollama first, falls back to local validator"""

    def __init__(self):
        self.ollama_available = OllamaService.is_ollama_available()
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
        Validate word using Ollama (if available) or local validator as fallback

        Returns:
            {
                "is_valid": bool,
                "message": str,
                "validation_source": "ollama" or "local",
                "suggestions": List[str]
            }
        """
        result = {
            "is_valid": False,
            "message": "",
            "validation_source": "local",
            "suggestions": []
        }

        # Try Ollama validation if available and subject is provided
        if self.ollama_available and subject:
            try:
                is_valid, reason = OllamaService.validate_word_semantic(
                    word=word,
                    subject=subject,
                    previous_word=previous_word,
                    chain_context=[]
                )
                if is_valid:
                    result["is_valid"] = True
                    result["message"] = f"Valid word for subject: {subject}"
                    result["validation_source"] = "ollama"
                    return result
                else:
                    result["message"] = f"Not related to subject: {subject}"
                    result["validation_source"] = "ollama"
            except Exception as e:
                logger.error(f"Ollama validation failed: {e}")
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
