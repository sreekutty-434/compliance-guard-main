import { APIGatewayProxyEvent, APIGatewayProxyResult } from '@aws-sdk/client-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({});

export const secureHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const timestamp = new Date().toISOString();
        console.log('test2')
        const result = await s3.send(
            new PutObjectCommand({
                Bucket: getEnv('BUCKET_NAME'),
                Key: `logs/${timestamp}.json`,
                Body: JSON.stringify({ event }),
                ServerSideEncryption: 'AES256',
            }),
        );

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Request processed securely',
                s3Result: result,
            }),
        };
    } catch (err) {
        console.error('Error in secure Handler:', err);

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Internal server error',
            }),
        };
    }
};

const getEnv = (key: string): string => {
    // eslint-disable-next-line security/detect-object-injection, no-restricted-properties
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing env var: ${key}`);
    }
    return value;
};
