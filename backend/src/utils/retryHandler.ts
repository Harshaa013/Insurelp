import logger from './logger';

interface RetryOptions {
    retries: number;
    timeoutMs: number;
    delayMs: number;
}

export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = { retries: 3, timeoutMs: 5000, delayMs: 1000 }
): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= options.retries; attempt++) {
        try {
            // Create a promise that rejects after timeout
            const timeoutPromise = new Promise<never>((_, reject) => {
                const id = setTimeout(() => {
                    clearTimeout(id);
                    reject(new Error(`Request timed out after ${options.timeoutMs}ms`));
                }, options.timeoutMs);
            });

            // Race the function against the timeout
            const result = await Promise.race([fn(), timeoutPromise]);
            return result;

        } catch (error) {
            lastError = error as Error;
            logger.warn(`Attempt ${attempt}/${options.retries} failed: ${lastError.message}`);

            if (attempt < options.retries) {
                // Exponential backoff
                const delay = options.delayMs * Math.pow(2, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw new Error(`All ${options.retries} attempts failed. Last error: ${lastError!.message}`);
}
