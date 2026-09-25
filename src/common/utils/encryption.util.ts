import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

function getKey(): Buffer {
    const keyHex = process.env.ENCRYPTION_KEY;
    if (!keyHex) {
        throw new Error('ENCRYPTION_KEY is not set in environment variables');
    }
    const key = Buffer.from(keyHex, 'hex');
    if (key.length !== 32) {
        throw new Error('ENCRYPTION_KEY must be a 32-byte (64 hex character) string');
    }
    return key;
}

/**
 * Encrypts a plaintext string. Output format: iv:authTag:ciphertext (all hex).
 */
export function encrypt(plaintext: string): string {
    const key = getKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts a string produced by encrypt().
 */
export function decrypt(ciphertext: string): string {
    const key = getKey();
    const [ivHex, authTagHex, encryptedHex] = ciphertext.split(':');
    if (!ivHex || !authTagHex || !encryptedHex) {
        throw new Error('Invalid encrypted payload format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
    ]);

    return decrypted.toString('utf8');
}

/**
 * Returns only the last 4 characters of a key, for safe display
 * (e.g. "sk-...ab12") without ever exposing the full secret.
 */
export function maskKey(plaintext: string): string {
    if (plaintext.length <= 4) return '****';
    return `****${plaintext.slice(-4)}`;
}