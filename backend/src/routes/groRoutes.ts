import express from 'express';
import { groqClient } from '../services/llm/groqClient';
import logger from '../utils/logger';

const router = express.Router();

// GET /api/v1/gro-email?company=Name
router.get('/gro-email', async (req, res) => {
    try {
        const company = req.query.company as string;

        if (!company) {
            res.status(400).json({ error: 'Company name required' });
            return;
        }

        logger.info(`[GRO Lookup] Request for company: ${company}`);

        if (!groqClient.isAvailable()) {
            res.status(503).json({ error: 'Search service unavailable' });
            return;
        }

        const email = await groqClient.getGroEmail(company);

        // Always return 200 with object, even if email is null (as per spec)
        res.json({ email });

    } catch (error) {
        logger.error('[GRO Lookup] Route error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
