import { AppError } from './AppError';

export class RefusalError extends AppError {
    constructor(message: string) {
        super(message, 200); // 200 because Refusal is a successful "outcome" of the API logic, not a 400/500
        Object.setPrototypeOf(this, RefusalError.prototype);
    }
}
