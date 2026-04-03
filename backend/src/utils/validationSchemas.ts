import Joi from 'joi';

export const analyzeClaimSchema = Joi.object({
    rejectionFileId: Joi.string().required(),
    billFileId: Joi.string().required(),
    admissionDate: Joi.string().optional(),
    dischargeDate: Joi.string().optional(),
    submissionDate: Joi.string().optional(),
});
