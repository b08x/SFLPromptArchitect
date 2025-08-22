#!/bin/bash

# Test script for dynamic provider switching using curl

BASE_URL="http://localhost:5001/api"

echo "🧪 Testing Dynamic Provider Switching with curl"
echo "================================================"

# Test 1: Legacy endpoint (should work with existing Gemini setup)
echo "Test 1: Legacy Gemini endpoint"
echo "------------------------------"
curl -X POST "${BASE_URL}/gemini/test-prompt" \
     -H "Content-Type: application/json" \
     -d '{"promptText": "Say hello briefly"}' \
     -w "\nStatus: %{http_code}\n\n"

# Test 2: Dynamic provider - explicit Gemini
echo "Test 2: Explicit Gemini provider"
echo "--------------------------------"
curl -X POST "${BASE_URL}/gemini/test-prompt" \
     -H "Content-Type: application/json" \
     -d '{"promptText": "Say hello briefly", "provider": "google", "model": "gemini-2.5-flash", "parameters": {"temperature": 0.7}}' \
     -w "\nStatus: %{http_code}\n\n"

# Test 3: SFL Generation with provider switching
echo "Test 3: SFL Generation"
echo "----------------------"
curl -X POST "${BASE_URL}/gemini/generate-sfl" \
     -H "Content-Type: application/json" \
     -d '{"goal": "Write a formal business letter", "provider": "google", "model": "gemini-2.5-flash"}' \
     -w "\nStatus: %{http_code}\n\n"

# Test 4: Provider availability
echo "Test 4: Available providers"
echo "---------------------------"
curl -X GET "${BASE_URL}/providers/available" \
     -H "Content-Type: application/json" \
     -w "\nStatus: %{http_code}\n\n"

echo "🏁 Curl testing complete!"