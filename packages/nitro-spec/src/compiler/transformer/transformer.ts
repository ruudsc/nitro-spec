import recast from "recast";
import tsParser from "recast/parsers/typescript";
import { Meta } from "./scanPathMeta";

type ObjectProperty = recast.types.namedTypes.ObjectProperty;

export const transformer = (code: string, meta: Meta) => {
  const ast = recast.parse(code, {
    parser: tsParser,
    sourceFileName: meta.id,
    sourceMapName: meta.id + ".map",
  });

  recast.visit(ast, {
    visitCallExpression: function (path) {
      const isDefineMeta =
        "name" in path.node.callee && path.node.callee.name === "defineMeta";

      if (!isDefineMeta) {
        return false;
      }

      const argsNode = path.node.arguments.find(
        (node) => node.type === "ObjectExpression",
      );

      if (!argsNode) {
        return false;
      }

      const additionalProperties = generateProperties(meta);

      for (const item of additionalProperties) {
        argsNode.properties.push(item);
      }

      this.traverse(path);
    },
  });

  const printed = recast.print(ast, {
    sourceFileName: meta.id,
    sourceMapName: meta.id + ".map",
  });

  return {
    code: printed.code,
    sourcemap: printed.map,
  };
};

const generateProperties = (meta: Meta) => {
  const pathProperty: ObjectProperty = {
    type: "ObjectProperty",
    key: {
      type: "Literal",
      value: "__path",
    },
    value: {
      type: "Literal",
      value: meta.urlRoute,
    },
  };

  const methodProperty: ObjectProperty = {
    type: "ObjectProperty",
    key: {
      type: "Literal",
      value: "__method",
    },
    value: {
      type: "Literal",
      value: meta.method,
    },
  };
  return [pathProperty, methodProperty];
};
