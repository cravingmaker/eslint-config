import type { Rule, Scope, SourceCode } from "eslint";

import { transparentWrappers } from "./function-values.js";

type FunctionNode = Readonly<
  Extract<
    Rule.Node,
    { readonly type: "FunctionDeclaration" | "FunctionExpression" }
  >
>;
type MemberNode = Readonly<
  Extract<Rule.Node, { readonly type: "MemberExpression" }>
>;
type SyntaxNode = Readonly<Rule.Node>;

/**
 * Follow only transparent expression wrappers, preserving the runtime value.
 */
const outerExpression = (node: SyntaxNode): SyntaxNode => {
  return node.parent !== null && transparentWrappers.has(node.parent.type)
    ? outerExpression(node.parent)
    : node;
};

const propertyName = (
  node: Readonly<Pick<MemberNode, "computed" | "property">>,
): string | undefined => {
  if (!node.computed && node.property.type === "Identifier") {
    return node.property.name;
  }
  if (
    node.property.type === "Literal" &&
    typeof node.property.value === "string"
  ) {
    return node.property.value;
  }
  return;
};

const isReflectConstruction = (
  node: Readonly<Extract<Rule.Node, { readonly type: "CallExpression" }>>,
): boolean => {
  const { callee } = node;
  return (
    callee.type === "MemberExpression" &&
    callee.object.type === "Identifier" &&
    callee.object.name === "Reflect" &&
    propertyName(callee) === "construct"
  );
};

const isConstructorUse = (node: SyntaxNode): boolean => {
  const expression = outerExpression(node);
  const { parent } = expression;
  if (parent === null) {
    return false;
  }
  if (parent.type === "NewExpression") {
    return parent.callee === expression;
  }
  if (parent.type === "ClassDeclaration" || parent.type === "ClassExpression") {
    return parent.superClass === expression;
  }
  if (parent.type === "MemberExpression") {
    return parent.object === expression && propertyName(parent) === "prototype";
  }
  const isReflectionCall =
    parent.type === "CallExpression" && isReflectConstruction(parent);
  return (
    isReflectionCall &&
    (parent.arguments[0] === expression || parent.arguments[2] === expression)
  );
};

const findVariable = (
  name: string,
  scope: Readonly<Scope.Scope>,
): Scope.Variable | undefined => {
  const variable = scope.set.get(name);
  return typeof variable !== "undefined" || scope.upper === null
    ? variable
    : findVariable(name, scope.upper);
};

const expressionBinding = (
  node: SyntaxNode,
  sourceCode: Readonly<SourceCode>,
): Scope.Variable | undefined => {
  const expression = outerExpression(node);
  const { parent } = expression;
  if (parent?.type === "VariableDeclarator" && parent.init === expression) {
    return sourceCode.getDeclaredVariables(parent)[0];
  }
  if (
    parent?.type === "AssignmentExpression" &&
    parent.right === expression &&
    parent.left.type === "Identifier"
  ) {
    return findVariable(parent.left.name, sourceCode.getScope(parent));
  }
  return;
};

/**
 * Follow local identifier aliases, stopping cycles and preserving constructor identities.
 */
const hasConstructorReferences = (
  variable: Readonly<Scope.Variable>,
  sourceCode: Readonly<SourceCode>,
  seen: ReadonlySet<Scope.Variable>,
): boolean => {
  if (seen.has(variable)) {
    return false;
  }
  const visited = new Set([...seen, variable]);
  return variable.references.some(({ identifier }) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Scope references retain the parser nodes and parent links.
    const reference = identifier as Rule.Node;
    if (isConstructorUse(reference)) {
      return true;
    }
    const alias = expressionBinding(reference, sourceCode);
    return (
      typeof alias !== "undefined" &&
      hasConstructorReferences(alias, sourceCode, visited)
    );
  });
};

/**
 * Preserve constructors and signature overloads rather than suggesting a different API.
 */
const hasSemanticBinding = (
  node: FunctionNode,
  sourceCode: Readonly<SourceCode>,
): boolean => {
  const binding = expressionBinding(node, sourceCode);
  // Parameters can be constructors without making their enclosing function a constructor.
  const names = sourceCode.getDeclaredVariables(node).filter((variable) => {
    return variable.defs.some(({ type }) => {
      return type === "FunctionName";
    });
  });
  const variables = [
    ...names,
    ...(typeof binding === "undefined" ? [] : [binding]),
  ];
  return (
    isConstructorUse(node) ||
    variables.some((variable) => {
      return (
        variable.defs.some((definition) => {
          return ["TSDeclareFunction"].includes(definition.node.type);
        }) || hasConstructorReferences(variable, sourceCode, new Set())
      );
    })
  );
};

const hasOwnArguments = (
  node: FunctionNode,
  sourceCode: Readonly<SourceCode>,
): boolean => {
  return sourceCode.getScope(node).variables.some((variable) => {
    return (
      variable.name === "arguments" &&
      variable.identifiers.length === 0 &&
      variable.references.length > 0
    );
  });
};

const hasRecursiveName = (
  node: FunctionNode,
  sourceCode: Readonly<SourceCode>,
): boolean => {
  return (
    node.type === "FunctionExpression" &&
    sourceCode.getDeclaredVariables(node).some((variable) => {
      return (
        variable.defs.some(({ type }) => {
          return type === "FunctionName";
        }) && variable.references.length > 0
      );
    })
  );
};

const isMethod = (node: FunctionNode): boolean => {
  const { parent } = node;
  return (
    parent.type === "MethodDefinition" ||
    (parent.type === "Property" && (parent.method || parent.kind !== "init"))
  );
};

const hasFunctionSemantics = (
  node: FunctionNode,
  sourceCode: Readonly<SourceCode>,
): boolean => {
  if (node.generator === true || isMethod(node)) {
    return true;
  }
  return (
    hasOwnArguments(node, sourceCode) ||
    hasRecursiveName(node, sourceCode) ||
    hasSemanticBinding(node, sourceCode) ||
    node.params.some((parameter) => {
      return parameter.type === "Identifier" && parameter.name === "this";
    })
  );
};

const preferArrowFunctions: Rule.RuleModule = {
  create: (context) => {
    const { sourceCode } = context;
    const lexicalOwners = new WeakSet<object>();
    // eslint-disable-next-line functional/no-return-void -- ESLint lexical-reference visitors return no value.
    const markLexicalOwner = (node: SyntaxNode): void => {
      const ancestors = sourceCode.getAncestors(node).toReversed();
      const owner = ancestors.find((ancestor, index) => {
        // Field initializers and static blocks bind this; computed field keys retain the enclosing receiver.
        return (
          ["FunctionDeclaration", "FunctionExpression", "StaticBlock"].includes(
            ancestor.type,
          ) ||
          (ancestor.type === "PropertyDefinition" &&
            ancestor.value === (index === 0 ? node : ancestors[index - 1]))
        );
      });
      if (typeof owner === "undefined") {
        return;
      }
      // eslint-disable-next-line functional/no-expression-statements -- Record the lexical owner for this file only.
      lexicalOwners.add(owner);
    };

    // eslint-disable-next-line functional/no-return-void -- ESLint function visitors report through the rule context.
    const checkFunction = (node: FunctionNode): void => {
      if (lexicalOwners.has(node) || hasFunctionSemantics(node, sourceCode)) {
        return;
      }
      context.report({ messageId: "preferArrow", node });
    };

    return {
      "FunctionDeclaration:exit": checkFunction,
      "FunctionExpression:exit": checkFunction,
      "ThisExpression, Super, MetaProperty[meta.name='new'][property.name='target']":
        markLexicalOwner,
    };
  },
  meta: {
    docs: {
      description:
        "Require arrow expressions for functions with compatible semantics",
    },
    messages: {
      preferArrow:
        "Use an arrow function with a block body; review hoisting and function identity before converting.",
    },
    schema: [],
    type: "suggestion",
  },
};

export { preferArrowFunctions };
