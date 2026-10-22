/**
 * Narrows an object whose properties can be inspected without treating arrays as records.
 */
const isRecord = (
  value: unknown,
): value is Readonly<Record<string, unknown>> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

export { isRecord };
