import { DEFAULT_JWT_SECRET } from '../auth/auth.constants';
import {
  getRuntimeDatabaseUrl,
  getRuntimeJwtSecret,
  getRuntimePort,
} from './runtime-config';

describe('runtime-config', () => {
  test('getRuntimeJwtSecret falls back to the development secret', () => {
    const previous = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;

    try {
      expect(getRuntimeJwtSecret()).toBe(DEFAULT_JWT_SECRET);
    } finally {
      if (previous === undefined) {
        delete process.env.JWT_SECRET;
      } else {
        process.env.JWT_SECRET = previous;
      }
    }
  });

  test('getRuntimeJwtSecret treats blank values as missing', () => {
    const previous = process.env.JWT_SECRET;
    process.env.JWT_SECRET = '   ';

    try {
      expect(getRuntimeJwtSecret()).toBe(DEFAULT_JWT_SECRET);
    } finally {
      if (previous === undefined) {
        delete process.env.JWT_SECRET;
      } else {
        process.env.JWT_SECRET = previous;
      }
    }
  });

  test('getRuntimePort falls back to 5002 and parses explicit values', () => {
    const previous = process.env.PORT;
    delete process.env.PORT;

    try {
      expect(getRuntimePort()).toBe(5002);
      process.env.PORT = '5010';
      expect(getRuntimePort()).toBe(5010);
    } finally {
      if (previous === undefined) {
        delete process.env.PORT;
      } else {
        process.env.PORT = previous;
      }
    }
  });

  test('getRuntimePort treats blank values as missing', () => {
    const previous = process.env.PORT;
    process.env.PORT = '   ';

    try {
      expect(getRuntimePort()).toBe(5002);
    } finally {
      if (previous === undefined) {
        delete process.env.PORT;
      } else {
        process.env.PORT = previous;
      }
    }
  });

  test('getRuntimePort falls back to 5002 for invalid explicit values', () => {
    const previous = process.env.PORT;

    try {
      process.env.PORT = 'abc';
      expect(getRuntimePort()).toBe(5002);

      process.env.PORT = '0';
      expect(getRuntimePort()).toBe(5002);

      process.env.PORT = '70000';
      expect(getRuntimePort()).toBe(5002);
    } finally {
      if (previous === undefined) {
        delete process.env.PORT;
      } else {
        process.env.PORT = previous;
      }
    }
  });

  test('getRuntimeDatabaseUrl returns null when missing and the configured url when present', () => {
    const previous = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    try {
      expect(getRuntimeDatabaseUrl()).toBeNull();
      process.env.DATABASE_URL = 'postgresql://meglow:test@localhost:5432/meglow';
      expect(getRuntimeDatabaseUrl()).toBe(
        'postgresql://meglow:test@localhost:5432/meglow',
      );
    } finally {
      if (previous === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = previous;
      }
    }
  });

  test('getRuntimeDatabaseUrl treats blank values as missing', () => {
    const previous = process.env.DATABASE_URL;
    process.env.DATABASE_URL = '   ';

    try {
      expect(getRuntimeDatabaseUrl()).toBeNull();
    } finally {
      if (previous === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = previous;
      }
    }
  });
});
