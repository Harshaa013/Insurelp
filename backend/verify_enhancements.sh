#!/bin/bash

BASE_URL="http://localhost:3000/api/v1"
echo "dummy content" > dummy.pdf

echo "1. Uploads (Versioned API)..."
REJECTION_ID=$(curl -s -X POST -F "file=@dummy.pdf" $BASE_URL/upload/rejection-letter | grep -o '"fileId":"[^"]*"' | cut -d'"' -f4)
BILL_ID=$(curl -s -X POST -F "file=@dummy.pdf" $BASE_URL/upload/hospital-bill | grep -o '"fileId":"[^"]*"' | cut -d'"' -f4)

echo "Rejection: $REJECTION_ID"

echo -e "\n2. Analysis POST (Versioned API)..."
ANALYZE_RES=$(curl -s -X POST $BASE_URL/analyze-claim \
  -H "Content-Type: application/json" \
  -d "{ \"rejectionFileId\": \"$REJECTION_ID\", \"billFileId\": \"$BILL_ID\" }")
echo "Analyzed: $ANALYZE_RES"
ANALYSIS_ID=$(echo $ANALYZE_RES | grep -o '"analysisId":"[^"]*"' | cut -d'"' -f4)

echo -e "\n3. Testing Validation (Missing Files)..."
INVALID_RES=$(curl -s -X POST $BASE_URL/analyze-claim \
  -H "Content-Type: application/json" \
  -d "{}") 
echo "Invalid Request Response: $INVALID_RES"

if [[ $INVALID_RES == *"rejectionFileId"* ]]; then
    echo "✅ Validation working."
else
    echo "❌ Validation failed or message changed."
fi

# Cleanup
rm dummy.pdf
