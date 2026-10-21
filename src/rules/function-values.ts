type ExpressionValue = {
  readonly type: string;

  readonly expression?: unknown;
};

const transparentWrappers = new Set([
  "TSAsExpression",
  "TSInstantiationExpression",
  "TSNonNullExpression",
  "TSSatisfiesExpression",
  "TSTypeAssertion",
]);

const isExpressionValue = (node: unknown): node is ExpressionValue => {
  if (typeof node !== "object" || node === null) {
    return false;
  }
  const hasType = "type" in node;
  return hasType && typeof node.type === "string";
};

const isFunctionValue = (node: ExpressionValue | null | undefined): boolean => {
  if (node === null || typeof node === "undefined") {
    return false;
  }
  if (
    node.type === "ArrowFunctionExpression" ||
    node.type === "FunctionExpression"
  ) {
    return true;
  }
  if (!transparentWrappers.has(node.type)) {
    return false;
  }
  const inner = node.expression;
  return isExpressionValue(inner) && isFunctionValue(inner);
};

export { isFunctionValue, transparentWrappers };
