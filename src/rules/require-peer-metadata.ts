import type { Rule } from "eslint";
import type { AST, RuleListener } from "jsonc-eslint-parser";

const propertiesOf = (
  node: Readonly<AST.JSONObjectExpression>,
): ReadonlyMap<string, AST.JSONProperty> => {
  return new Map(
    node.properties.flatMap(
      (property): ReadonlyArray<readonly [string, AST.JSONProperty]> => {
        return property.key.type === "JSONLiteral" &&
          typeof property.key.value === "string"
          ? [[property.key.value, property]]
          : [];
      },
    ),
  );
};

const requirePeerMetadata: Rule.RuleModule = {
  create: (context) => {
    // ESLint visitors report through context and return no value.
    /* eslint-disable functional/no-return-void -- JSON AST visitors emit diagnostics rather than return values. */
    const listeners: RuleListener = {
      // eslint-disable-next-line @typescript-eslint/naming-convention -- jsonc-eslint-parser names the root manifest AST selector.
      "Program > JSONExpressionStatement > JSONObjectExpression": (
        node: Readonly<AST.JSONObjectExpression>,
      ) => {
        const properties = propertiesOf(node);
        const peers = properties.get("peerDependencies");
        if (
          peers?.value.type !== "JSONObjectExpression" ||
          peers.value.properties.length === 0
        ) {
          return;
        }
        const metadata = properties.get("peerDependenciesMeta");
        if (typeof metadata === "undefined") {
          context.report({ loc: peers.key.loc, messageId: "missingMetadata" });
          return;
        }
        // Existing Package JSON rules own malformed/empty metadata and require each
        // entry's explicit boolean `optional`; this owner checks conditional completeness only.
        if (
          metadata.value.type !== "JSONObjectExpression" ||
          metadata.value.properties.length === 0
        ) {
          return;
        }
        const entries = propertiesOf(metadata.value);
        propertiesOf(peers.value).forEach((peer, name) => {
          if (entries.has(name)) {
            return;
          }
          context.report({
            data: { name },
            loc: peer.key.loc,
            messageId: "missingPeer",
          });
        });
      },
    };
    /* eslint-enable functional/no-return-void -- Restore the value-return policy outside visitor callbacks. */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- This feature registers jsonc-eslint-parser; ESLint's listener type describes only ESTree nodes.
    return listeners as unknown as Rule.RuleListener;
  },
  meta: {
    docs: {
      description:
        "Require metadata for every declared peer without requiring peers on applications",
    },
    messages: {
      missingMetadata:
        "Declare nonempty peerDependenciesMeta with an explicit optional boolean for every peer dependency.",
      missingPeer:
        "Declare peerDependenciesMeta for '{{name}}' with an explicit optional boolean.",
    },
    schema: [],
    type: "problem",
  },
};

export { requirePeerMetadata };
