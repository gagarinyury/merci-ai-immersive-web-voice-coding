#!/bin/bash

echo "Testing /health endpoint..."
curl http://localhost:3001/health
echo -e "\n"

echo "Testing /api/test-claude endpoint..."
curl -X POST http://localhost:3001/api/test-claude \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello Claude! Reply with just: Hi from Claude"}'
echo -e "\n"
