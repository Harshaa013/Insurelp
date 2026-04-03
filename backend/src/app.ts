import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorMiddleware';
import uploadRoutes from './routes/uploadRoutes';
import analysisRoutes from './routes/analysisRoutes';
import groRoutes from './routes/groRoutes';

const app = express();

// Security Headers
app.use(helmet());

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Middleware
app.use(cors());
app.use(express.json());

// Routes - Versioning
// Mounting on /api/v1
app.use('/api/v1/upload', uploadRoutes); // POST /api/v1/upload/rejection-letter
app.use('/api/v1', analysisRoutes);      // POST /api/v1/analyze-claim
app.use('/api/v1', groRoutes);           // GET /api/v1/gro-email

// Also expose at /api/gro-email to match user request exactly
app.use('/api', groRoutes);

// Backward Compatibility / Default Routes (Optional, but useful if frontend expects root)
// User asked for API versioning. If I remove root routes, frontend MIGHT break if it uses root.
// However, typically "Add API Versioning" implies moving them.
// I will keep root routes for now to be safe, OR I can redirect.
// Given "Do not change API contracts", if the contract was "POST /upload/...", moving it IS changing it.
// So I must keep the old ones OR assume the user handles the URL change.
// I'll keep strictly to what I built: I built it on root. Now I add /api/v1.
// I will ALSO keep the root routes to ensure "Backend supports this frontend" (which uses mocked logic currently, but if it used real API, it would expect root).
// Actually, since frontend IS mocked, it doesn't matter.
// But valid architecture suggests cleaning up.
// I will expose both for now to be safe.
app.use('/upload', uploadRoutes);
app.use('/', analysisRoutes);

// Error Handling
app.use(errorHandler);

export default app;
