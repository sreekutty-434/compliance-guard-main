import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as mysql from 'mysql2/promise';
import crypto from 'crypto';

export const helloWorldHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'hello world',
            }),
        };
    } catch (err) {
        console.log(err);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'some error happened',
            }),
        };
    }
};

export const codeLevelViolationHandler = async (event: APIGatewayProxyEvent) => {
    try {
        // Violation 1: No input validation - direct use of event.body
        const rawBody = JSON.parse(event.body || '{}');
        const userInput = rawBody.userInput || '';
        const userId = rawBody.userId || '';

        // Violation 2: SQL Injection vulnerability - direct string concatenation
        const vulnerableQuery = `SELECT * FROM users WHERE name = '${userInput}' AND id = ${userId}`;

        // Violation 3: Logging sensitive data from environment variables
        console.log('Processing request with SSN:', process.env.SSN);
        console.log('User email from env:', process.env.EMAIL);
        console.log('Database password:', process.env.DB_PASSWORD);

        // Violation 4: Using hardcoded database credentials
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'admin',
            password: 'admin123', // Hardcoded password
            database: 'testdb',
        });

        // Violation 5: Executing unvalidated SQL query
        const [rows] = await connection.execute(vulnerableQuery);

        // Violation 6: Exposing internal system information
        return {
            statusCode: 200,
            headers: {
                // Overly permissive CORS
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
            },
            body: JSON.stringify({
                message: 'Vulnerable endpoint processed',
                executedQuery: vulnerableQuery, // Exposing SQL query structure
                systemInfo: {
                    nodeVersion: process.version,
                    platform: process.platform,
                    env: process.env, // Exposing all environment variables
                },
                rawUserInput: userInput, // Using unvalidated user input
                results: rows,
            }),
        };
    } catch (error: any) {
        // Violation 7: Exposing detailed error information
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.message,
                stack: error.stack, // Exposing stack trace
            }),
        };
    }
};

// Violation 8: Hardcoded secret
const API_KEY = 'sk-1234567890abcdef'; // Hardcoded API key

// Violation 9: Insecure crypto usage
const weakHash = (data: any) => {
    return crypto.createHash('md5').update(data).digest('hex'); // Weak hashing algorithm
};
