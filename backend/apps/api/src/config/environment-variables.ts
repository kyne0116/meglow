import * as Joi from 'joi';

export interface EnvironmentVariables {
  DATABASE_URL?: string;
  JWT_SECRET?: string;
  PORT?: number | string;
}

export const validationSchemaForEnv = Joi.object<EnvironmentVariables, true>({
  DATABASE_URL: Joi.string().trim().empty('').optional(),
  JWT_SECRET: Joi.string().trim().empty('').min(16).optional(),
  PORT: Joi.alternatives()
    .try(Joi.number().port(), Joi.string().trim().empty(''))
    .optional(),
});
