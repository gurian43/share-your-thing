import crypto from 'crypto';
import fs from 'fs';

const IV_LENGTH = 16;
const ALGORITHM = 'aes-256-cbc';

const getEncryptionKey = () => {
    if (!process.env.ENCRYPTION_KEY) {
        throw new Error('ENCRYPTION_KEY env variable is not set');
    }
    return Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
};

export const encryptFile = async (inputPath, outputPath) => {
    return new Promise((resolve, reject) => {
        try {
            const iv = crypto.randomBytes(IV_LENGTH);
            const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);

            const inputStream = fs.createReadStream(inputPath);
            const outputStream = fs.createWriteStream(outputPath);

            inputStream.pipe(cipher).pipe(outputStream);

            outputStream.on('finish', () => {
                resolve(iv.toString('hex'));
            });

            outputStream.on('error', reject);
            inputStream.on('error', reject);
            cipher.on('error', reject);
        } catch (err) {
            reject(err);
        }
    });
};

export const createDecipherStream = (ivHex) => {
    try {
        const iv = Buffer.from(ivHex, 'hex');
        return crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    } catch (err) {
        throw new Error(`Failed to create decipher stream: ${err.message}`);
    }
};