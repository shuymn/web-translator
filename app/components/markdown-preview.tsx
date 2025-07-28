import css from "@shikijs/langs/css";
import go from "@shikijs/langs/go";
import js from "@shikijs/langs/javascript";
import json from "@shikijs/langs/json";
import jsx from "@shikijs/langs/jsx";
import markdown from "@shikijs/langs/markdown";
import python from "@shikijs/langs/python";
import shell from "@shikijs/langs/shellscript";
import tsx from "@shikijs/langs/tsx";
import ts from "@shikijs/langs/typescript";
import yaml from "@shikijs/langs/yaml";
import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import githubDark from "@shikijs/themes/github-dark";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { createHighlighterCoreSync } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import { MermaidDiagram } from "./mermaid-diagram";
import { remarkMermaid } from "./remark-mermaid";

const highlighter = createHighlighterCoreSync({
  themes: [githubDark],
  langs: [css, go, js, json, markdown, python, shell, tsx, ts, yaml, jsx],
  engine: createJavaScriptRegexEngine(),
});

export function MarkdownPreview({ content }: { content: string }) {
  return (
    <div className="prose prose-invert max-w-none text-slate-100">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMermaid]}
        rehypePlugins={[rehypeRaw, [rehypeShikiFromHighlighter, highlighter, { theme: "github-dark" }]]}
        components={{
          div: ({ children, ...props }) => {
            if ("data-mermaid" in props && typeof props["data-mermaid"] === "string") {
              const diagram = decodeURIComponent(props["data-mermaid"]);
              return <MermaidDiagram chart={diagram} />;
            }

            return <div {...props}>{children}</div>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
