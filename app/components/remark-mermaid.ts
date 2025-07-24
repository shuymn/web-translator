import type { Code, Html, Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

export const remarkMermaid: Plugin<[], Root> = () => {
  return (tree: Root) => {
    visit(tree, "code", (node: Code, index, parent) => {
      if (node.lang === "mermaid" && parent && typeof index === "number") {
        // Replace the code node with a custom HTML node
        const mermaidNode: Html = {
          type: "html",
          value: `<div data-mermaid="${encodeURIComponent(node.value)}"></div>`,
        };
        parent.children[index] = mermaidNode;
      }
    });
  };
};
