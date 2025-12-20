import * as dotenv from 'dotenv';

console.log('Loading environment variables from setup-env.ts...');
const result = dotenv.config({ path: '.env' });

if (result.error) {
    console.error('Error loading .env file:', result.error);
} else {
    console.log('Environment variables loaded successfully.');
    // Optional: Log DATABASE_URL to verify (be careful with secrets in production)
    console.log('DATABASE_URL is set:', !!process.env.DATABASE_URL);
}
