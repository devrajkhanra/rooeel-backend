import * as dotenv from 'dotenv';


const result = dotenv.config({ path: '.env' });

if (result.error) {
    console.error('Error loading .env file:', result.error);
} else {

}
