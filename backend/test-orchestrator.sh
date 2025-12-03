#!/bin/bash

echo "Testing /api/orchestrate endpoint..."
echo "Request: Generate a simple VR scene with a rotating cube"
echo ""

curl -X POST http://localhost:3001/api/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Generate a simple VR scene with a rotating cube that users can grab"
  }' | jq '.'

echo -e "\n\nDone!"
