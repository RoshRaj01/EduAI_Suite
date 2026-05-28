"""
Role Detection Utility
Determines user role based on email domain patterns.

Rules:
  - Admin:   Pre-seeded emails (checked from DB or config)
  - Teacher: *@university.in  (direct subdomain)
  - Student: *@*.university.in (sub-subdomain, e.g. @cs.university.in)
"""

import re
import os
from typing import Optional

# Configurable via environment variables
TEACHER_DOMAIN = os.getenv("TEACHER_EMAIL_DOMAIN", "university.in")
ADMIN_EMAILS = set(
    e.strip()
    for e in os.getenv("ADMIN_EMAILS", "admin@eduai.suite").split(",")
    if e.strip()
)


def detect_role_from_email(email: str) -> str:
    """
    Detect intended role from an email address.
    """
    email = email.strip().lower()

    # Load from env dynamically
    teacher_domain = os.getenv("TEACHER_EMAIL_DOMAIN", "university.in")
    admin_emails = set(
        e.strip().lower()
        for e in os.getenv("ADMIN_EMAILS", "admin@eduai.suite").split(",")
        if e.strip()
    )

    # 1. Check admin list
    if email in admin_emails:
        return "admin"

    # 2. Extract domain part
    parts = email.split("@")
    if len(parts) != 2:
        return "student"  # malformed → default to student

    domain = parts[1]

    # 3. Exact match → teacher  (e.g. prof@university.in)
    if domain == teacher_domain:
        return "teacher"

    # 4. Sub-subdomain match → student  (e.g. jane@cs.university.in)
    if domain.endswith(f".{teacher_domain}"):
        return "student"

    # 5. Fallback for unauthorized domains (Allow 'student' fallback for easy local testing/registration)
    return "student"
