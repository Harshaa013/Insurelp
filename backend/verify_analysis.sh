#!/bin/bash

BASE_URL="http://localhost:3000"
BASE_URL="http://localhost:3000"
echo "
Apollo Hospital
Patient: John Doe
Bill Number: INV-2023-001
Admission Date: 2023-01-01
Discharge Date: 2023-01-05
Services:
- Room Charges: 2000
- Consultation: 1000
- Medicines: 1500
- Lab Tests: 500
Total Amount: 5000
" > dummy.pdf

echo "1. Uploads..."
REJECTION_ID=$(curl -s -X POST -F "file=@dummy.pdf" $BASE_URL/upload/rejection-letter | grep -o '"fileId":"[^"]*"' | cut -d'"' -f4)
BILL_ID=$(curl -s -X POST -F "file=@dummy.pdf" $BASE_URL/upload/hospital-bill | grep -o '"fileId":"[^"]*"' | cut -d'"' -f4)

echo "2. Analysis POST (Async)..."
ANALYSIS_RESPONSE=$(curl -s -X POST "$BASE_URL/analyze-claim" \
  -H "Content-Type: application/json" \
  -d '{
    "rejectionFileId": "'"$REJECTION_ID"'",
    "billFileId": "'"$BILL_ID"'",
    "admissionDate": "2023-01-01",
    "dischargeDate": "2023-01-05",
    "submissionDate": "2023-01-10"
  }')

echo "Analyzed Response: $ANALYSIS_RESPONSE"
# Parse ID using node for reliability or fixes grep
# grep match: "analysisId":"..." -> cut -d'"' -f4 gives the ID
ANALYSIS_ID=$(echo $ANALYSIS_RESPONSE | grep -o '"analysisId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ANALYSIS_ID" ]; then
  echo "Failed to get Analysis ID"
  exit 1
fi

echo "Analysis Started with ID: $ANALYSIS_ID"

echo "3. Polling for Results..."
STATUS="processing"
while [ "$STATUS" != "completed" ] && [ "$STATUS" != "failed" ]; do
  sleep 2
  RESULT_RESPONSE=$(curl -s "$BASE_URL/analysis/$ANALYSIS_ID")
  # Use head -n 1 to take the first match (status appears twice: root and in data)
  # Actually, simpler to just grep "stage" which is unique to data
  # And for status, we look for the one inside data? Or just rely on stage="completed" implies done.
  # Let's try to grab status by context or just check stage.
  STATUS=$(echo $RESULT_RESPONSE | sed 's/.*"status":"\([^"]*\)".*/\1/') # Poor man's json parse, often grabs last or first
  # Better:
  STATUS=$(echo $RESULT_RESPONSE | grep -o '"status":"[^"]*"' | tail -n 1 | cut -d'"' -f4) # Tail likely grabs data.status
  STAGE=$(echo $RESULT_RESPONSE | grep -o '"stage":"[^"]*"' | head -n 1 | cut -d'"' -f4)
  echo "Current Status: $STATUS | Stage: $STAGE"
done

echo "Final Result:"
echo $RESULT_RESPONSE


rm dummy.pdf

echo ""
echo "4. Testing Validation Failure (Bad Docs)..."
echo "irrelevant content" > bad.pdf
BAD_ID=$(curl -s -X POST -F "file=@bad.pdf" $BASE_URL/upload/rejection-letter | grep -o '"fileId":"[^"]*"' | cut -d'"' -f4)

BAD_ANALYSIS=$(curl -s -X POST "$BASE_URL/analyze-claim" \
  -H "Content-Type: application/json" \
  -d '{
    "rejectionFileId": "'"$BAD_ID"'",
    "billFileId": "'"$BILL_ID"'",
    "admissionDate": "2023-01-01"
  }')
  
BAD_ANALYSIS_ID=$(echo $BAD_ANALYSIS | grep -o '"analysisId":"[^"]*"' | cut -d'"' -f4)
echo "Bad Analysis ID: $BAD_ANALYSIS_ID"

sleep 3
BAD_RESULT=$(curl -s "$BASE_URL/analysis/$BAD_ANALYSIS_ID")
# Use sed to reliability parse json in shell without jq
BAD_STATUS=$(echo $BAD_RESULT | grep -o '"status":"[^"]*"' | tail -n 1 | cut -d'"' -f4)
BAD_OUTCOME=$(echo $BAD_RESULT | grep -o '"outcome":"[^"]*"' | tail -n 1 | cut -d'"' -f4)
BAD_MESSAGE=$(echo $BAD_RESULT | grep -o '"description":"[^"]*"' | cut -d'"' -f4)
echo "Bad Case Status: $BAD_STATUS (Expected: completed)"
echo "Bad Case Outcome: $BAD_OUTCOME (Expected: REFUSAL)"
echo "Bad Case Message: $BAD_MESSAGE"

rm bad.pdf

echo ""
echo "5. Testing Accuracy Refusal (Low Quality)..."
echo "unknown text with no data" > low_quality.pdf
LQ_ID=$(curl -s -X POST -F "file=@low_quality.pdf" $BASE_URL/upload/rejection-letter | grep -o '"fileId":"[^"]*"' | cut -d'"' -f4)

LQ_BILL_TXT="invoice for services unclear scan"
echo "$LQ_BILL_TXT" > low_quality_bill.pdf
LQ_BILL_ID=$(curl -s -X POST -F "file=@low_quality_bill.pdf" $BASE_URL/upload/hospital-bill | grep -o '"fileId":"[^"]*"' | cut -d'"' -f4)

LQ_ANALYSIS=$(curl -s -X POST "$BASE_URL/analyze-claim" \
  -H "Content-Type: application/json" \
  -d '{
    "rejectionFileId": "'"$REJECTION_ID"'",
    "billFileId": "'"$LQ_BILL_ID"'",
    "admissionDate": "2023-01-01"
  }')
  
LQ_ANALYSIS_ID=$(echo $LQ_ANALYSIS | grep -o '"analysisId":"[^"]*"' | cut -d'"' -f4)
echo "Low Quality Analysis ID: $LQ_ANALYSIS_ID"

sleep 3
LQ_RESULT=$(curl -s "$BASE_URL/analysis/$LQ_ANALYSIS_ID")
LQ_STATUS=$(echo $LQ_RESULT | grep -o '"status":"[^"]*"' | tail -n 1 | cut -d'"' -f4)
LQ_OUTCOME=$(echo $LQ_RESULT | grep -o '"outcome":"[^"]*"' | tail -n 1 | cut -d'"' -f4)
LQ_MESSAGE=$(echo $LQ_RESULT | grep -o '"description":"[^"]*"' | cut -d'"' -f4)
echo "Low Quality Status: $LQ_STATUS (Expected: completed)"
echo "Low Quality Outcome: $LQ_OUTCOME (Expected: REFUSAL)"
echo "Low Quality Message: $LQ_MESSAGE"

rm low_quality.pdf low_quality_bill.pdf


