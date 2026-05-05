import { Schema } from 'mongoose';

export function extractSchemaKeys(schema: unknown): string[] {
  const schemaPaths = (schema as Schema).paths;
  return Object.keys(schemaPaths).filter((key) => key !== '_id' && !key.startsWith('__'));
}
