#!/bin/bash

# Base URL
BASE_URL="http://localhost:3000"

# Create a dummy PDF file
echo "dummy content" > dummy.pdf

echo "1. Uploading Rejection Letter..."
REJECTION_RESPONSE=$(curl -s -X POST -F "file=@dummy.pdf" $BASE_URL/upload/rejection-letter)
echo "Response: $REJECTION_RESPONSE"
REJECTION_ID=$(echo $REJECTION_RESPONSE | grep -o '"fileId":"[^"]*"' | cut -d'"' -f4)
echo "Rejection ID: $REJECTION_ID"

echo -e "\n2. Uploading Hospital Bill..."
BILL_RESPONSE=$(curl -s -X POST -F "file=@dummy.pdf" $BASE_URL/upload/hospital-bill)
echo "Response: $BILL_RESPONSE"
BILL_ID=$(echo $BILL_RESPONSE | grep -o '"fileId":"[^"]*"' | cut -d'"' -f4)
echo "Bill ID: $BILL_ID"

if [ -z "$REJECTION_ID" ] || [ -z "$BILL_ID" ]; then
    echo "File upload failed, cannot proceed."
    exit 1
fi

echo -e "\n3. Analyzing Claim (Valid Dates)..."
ANALYZE_RESPONSE=$(curl -s -X POST $BASE_URL/analyze-claim \
  -H "Content-Type: application/json" \
  -d "{
    \"rejectionFileId\": \"$REJECTION_ID\",
    \"billFileId\": \"$BILL_ID\",
    \"admissionDate\": \"2023-01-01\",
    \"dischargeDate\": \"2023-01-05\",
    \"submissionDate\": \"2023-01-10\"
  }")
echo "Response: $ANALYZE_RESPONSE"
ANALYSIS_ID=$(echo $ANALYZE_RESPONSE | grep -o '"analysisId":"[^"]*"' | cut -d'"' -f4)
echo "Analysis ID: $ANALYSIS_ID"

echo -e "\n4. Analyzing Claim (Invalid Dates - Discharge before Admission)..."
INVALID_RESPONSE=$(curl -s -X POST $BASE_URL/analyze-claim \
  -H "Content-Type: application/json" \
  -d "{
    \"rejectionFileId\": \"$REJECTION_ID\",
    \"billFileId\": \"$BILL_ID\",
    \"admissionDate\": \"2023-01-05\",
    \"dischargeDate\": \"2023-01-01\",
    \"submissionDate\": \"2023-01-10\"
  }")
echo "Response: $INVALID_RESPONSE"

echo -e "\n5. Getting Analysis Results..."
RESULT_RESPONSE=$(curl -s $BASE_URL/analysis/$ANALYSIS_ID)
echo "Response: $RESULT_RESPONSE"

# Cleanup
rm dummy.pdf
