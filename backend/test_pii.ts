import { PIISanitizer } from './src/utils/piiSanitizer';

const text = `
    Patient: John Doe
    Email: john.doe@example.com
    Phone: +919876543210
    Emergency Contact: 9876543210
    UID: 1234 5678 9012
    PAN: ABCDE1234F
    Diagnosis: Fever
`;

const masked = PIISanitizer.mask(text);
console.log('Original Length:', text.length);
console.log('Masked Length:', masked.length);
console.log('--- Masked Output ---');
console.log(masked);

if (masked.includes('john.doe@example.com')) throw new Error('Email leaked');
if (masked.includes('9876543210')) throw new Error('Phone leaked');
if (masked.includes('1234 5678 9012')) throw new Error('UID leaked');
if (masked.includes('ABCDE1234F')) throw new Error('PAN leaked');

console.log('PII Test Passed');
