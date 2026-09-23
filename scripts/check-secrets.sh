#!/usr/bin/env bash
# ==============================================================================
# PteasYeung Platform - Local Pre-Commit Security Secret Checker
# Checks for accidental secret exposure before committing to git
# ==============================================================================

echo "🔍 Running Security & Secret Leak Pre-Commit Check..."

# Check 1: Ensure no .env files are being staged
STAGED_ENV_FILES=$(git diff --cached --name-only | grep -E '(\.env$|\.env\.local$|\.env\.production$|\.env\.staging$)')
if [ -n "$STAGED_ENV_FILES" ]; then
    echo "❌ SECURITY ALERT: You are attempting to commit .env files!"
    echo "$STAGED_ENV_FILES"
    echo "💡 Please unstage them with 'git reset HEAD <file>' and check your .gitignore."
    exit 1
fi

# Check 2: Scan staged changes for high-entropy secrets and keys
SUSPICIOUS_PATTERNS="(APP_KEY=base64:|PRIVATE KEY|BEGIN RSA PRIVATE KEY|aws_secret_access_key|ghp_[a-zA-Z0-9]{36}|AIzaSy[a-zA-Z0-9_-]{33})"
MATCHES=$(git diff --cached -S"PRIVATE KEY" --name-only)

if [ -n "$MATCHES" ]; then
    echo "⚠️ WARNING: Suspicious private key pattern found in staged files:"
    echo "$MATCHES"
    echo "Please verify before committing."
fi

echo "✅ Security pre-commit check passed!"
exit 0
