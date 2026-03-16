import { validationSchemaForEnv } from './environment-variables';

describe('environment-variables', () => {
  test('accepts blank runtime config values as effectively missing', () => {
    const result = validationSchemaForEnv.validate({
      DATABASE_URL: '   ',
      JWT_SECRET: '   ',
      PORT: '   ',
    });

    expect(result.error).toBeUndefined();
  });

  test('accepts explicit valid runtime config values', () => {
    const result = validationSchemaForEnv.validate({
      DATABASE_URL: 'postgresql://meglow:test@localhost:5432/meglow',
      JWT_SECRET: 'development-secret-123',
      PORT: 5002,
    });

    expect(result.error).toBeUndefined();
  });
});
