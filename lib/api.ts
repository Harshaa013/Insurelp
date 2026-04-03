import axios from 'axios';

const api = axios.create({
    baseURL: '/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

// REFACTOR: Single-step upload & analysis
export const analyzeClaim = async (
    rejectionFile: File,
    billFile: File,
    dates: { admissionDate: string; dischargeDate: string; submissionDate: string }
) => {
    const formData = new FormData();
    formData.append('rejection_document', rejectionFile);
    formData.append('hospital_bill', billFile);

    // Append dates if they exist (handling empty strings common in controlled inputs)
    if (dates.admissionDate) formData.append('admission_date', dates.admissionDate);
    if (dates.dischargeDate) formData.append('discharge_date', dates.dischargeDate);
    if (dates.submissionDate) formData.append('claim_submission_date', dates.submissionDate);

    const response = await api.post('/analyze-claim', formData, {
        // IMPORTANT: DO NOT set Content-Type manually
        // Axios will set multipart/form-data with boundary
    });
    return response.data.data; // Result contains analysisId
};

export const getAnalysisResult = async (analysisId: string) => {
    const response = await api.get(`/analysis/${analysisId}`);
    return response.data.data; // Result contains analysis fields
};
