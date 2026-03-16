import { hashPassword, verifyPassword } from './password-hash';

describe('password-hash', () => {
  test('hashPassword and verifyPassword support a valid round trip', () => {
    const password = 'Admin@123456';
    const encodedHash = hashPassword(password);

    expect(verifyPassword(password, encodedHash)).toBe(true);
    expect(verifyPassword('wrong-password', encodedHash)).toBe(false);
  });

  test('verifyPassword returns false for malformed hash payloads', () => {
    expect(verifyPassword('x', 'scrypt$salt$zz')).toBe(false);
    expect(verifyPassword('x', 'scrypt$salt$0')).toBe(false);
  });

  test('verifyPassword rejects hash payloads with extra segments', () => {
    const encodedHash = hashPassword('Admin@123456');

    expect(verifyPassword('Admin@123456', `${encodedHash}$extra`)).toBe(false);
  });

  test('verifyPassword rejects hash payloads with unexpected derived-key length', () => {
    const oversizedHex = 'aa'.repeat(65);

    expect(verifyPassword('x', `scrypt$salt$${oversizedHex}`)).toBe(false);
  });

  test('verifyPassword rejects hash payloads with salts outside the generated format', () => {
    expect(
      verifyPassword(
        'Admin@123456',
        'scrypt$salt!$48c62e35c1d086780fcf021dcd0beb5ee99bf3f09897395f070edb8eae7cb29476f3f6acd347140a8557f0eaf998e0483b801d407347f044e4726b1904a86ce9',
      ),
    ).toBe(false);
  });
});
