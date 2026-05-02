export type PolicyValidation = {
  valid: boolean;
  failed: string[];
};

export function validateRequiredFields(input: Record<string, unknown>, fields: string[]): PolicyValidation {
  const failed = fields.filter((field) => !(field in input));
  return { valid: failed.length === 0, failed };
}
