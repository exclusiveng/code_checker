export type RuleInput = {
  id?: string;
  type: string;
  payload: any;
  severity: string;
  message: string;
};

export function validateRulesArray(input: unknown): {
  valid: boolean;
  errors?: string[];
} {
  if (!Array.isArray(input))
    return { valid: false, errors: ['rules must be an array'] };

  const errors: string[] = [];
  input.forEach((r: any, idx: number) => {
    if (typeof r !== 'object' || r === null)
      return errors.push(`rule at index ${idx} must be an object`);
    if (!r.type || typeof r.type !== 'string')
      errors.push(`rule[${idx}].type is required and must be a string`);
    // payload must be present and not an empty string/null
    if (typeof r.payload === 'undefined' || r.payload === null || (typeof r.payload === 'string' && r.payload.trim() === ''))
      errors.push(`rule[${idx}].payload is required and must not be empty`);
    if (!r.severity || typeof r.severity !== 'string')
      errors.push(`rule[${idx}].severity is required and must be a string`);
    if (!r.message || typeof r.message !== 'string')
      errors.push(`rule[${idx}].message is required and must be a string`);
  });

  return {
    valid: errors.length === 0,
    errors: errors.length ? errors : undefined,
  };
}
