import * as Joi from 'joi';

export interface EnvironmentVariables {
  DATABASE_URL?: string;
  JWT_SECRET?: string;
  PORT?: number;
}

export const validationSchemaForEnv = Joi.object<EnvironmentVariables, true>({
  DATABASE_URL: Joi.string().optional(),
  JWT_SECRET: Joi.string().min(16).optional(),
  PORT: Joi.number().port().optional(),
});
