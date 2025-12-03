#!/bin/bash

echo "Testing file tools with orchestrator..."
echo "Request: Create a simple AR scene with a floating sphere and save it to a file"
echo ""

curl -X POST http://localhost:3001/api/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Create a simple AR scene with a floating blue sphere that users can grab. Save it to src/ar-sphere-scene.ts"
  }' | jq '.'

echo -e "\n\nDone! Check if file was created:"
ls -la src/ar-sphere-scene.ts 2>/dev/null && echo "✓ File created!" || echo "✗ File not found"
