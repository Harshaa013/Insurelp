#!/bin/bash
# Test OCR directly with a sample image

# Use an existing uploaded image
TEST_IMAGE="/Users/ashishsachinas/Desktop/project-n/backend/src/uploads/00c1b473-fda4-46ef-a235-aaf753ccf4a1.png"

echo "Testing OCR with image: $TEST_IMAGE"
echo "File size: $(stat -f%z "$TEST_IMAGE") bytes"
echo ""

# Make API call
curl -X POST http://localhost:3000/api/v1/analyze-claim \
  -F "rejection_document=@$TEST_IMAGE" \
  -F "hospital_bill=@$TEST_IMAGE" \
  -F "admission_date=2025-01-01" \
  -F "discharge_date=2025-01-05" \
  -F "claim_submission_date=2025-01-10" \
  -v 2>&1 | tail -20
