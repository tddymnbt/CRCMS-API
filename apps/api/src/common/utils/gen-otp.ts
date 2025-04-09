export function generateOTP(length: number = 6): string {
  const digits = '1234567890';

  const otpLength = Math.max(1, length);

  return Array.from(
    { length: otpLength },
    () => digits[Math.floor(Math.random() * digits.length)],
  ).join('');
}
