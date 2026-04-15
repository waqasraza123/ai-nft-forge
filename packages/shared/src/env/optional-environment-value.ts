import { z } from "zod";

function normalizeOptionalEnvironmentValue(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const normalizedValue = value.trim();

  return normalizedValue === "" ? undefined : normalizedValue;
}

export const optionalTrimmedStringSchema = z.preprocess(
  normalizeOptionalEnvironmentValue,
  z.string().trim().min(1).optional()
);

export const optionalUrlSchema = z.preprocess(
  normalizeOptionalEnvironmentValue,
  z.string().url().optional()
);
