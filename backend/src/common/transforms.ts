type TransformInput = { value: unknown };

export const trim = ({ value }: TransformInput): unknown =>
  typeof value === 'string' ? value.trim() : value;

export const normalizeEmail = ({ value }: TransformInput): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export const toBoolean = ({ value }: TransformInput): unknown => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};
