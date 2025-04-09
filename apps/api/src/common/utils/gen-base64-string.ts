import { randomUUID } from 'crypto';

export function generateRandomBase64String(): string {
  const uuid = randomUUID();
  const buffer = Buffer.from(uuid);
  return buffer.toString('base64');
}
