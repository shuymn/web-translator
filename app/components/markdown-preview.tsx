import awk from "@shikijs/langs/awk";
import css from "@shikijs/langs/css";
import csv from "@shikijs/langs/csv";
import cue from "@shikijs/langs/cue";
import diff from "@shikijs/langs/diff";
import docker from "@shikijs/langs/docker";
import dotenv from "@shikijs/langs/dotenv";
import gitCommit from "@shikijs/langs/git-commit";
import gitRebase from "@shikijs/langs/git-rebase";
import go from "@shikijs/langs/go";
import html from "@shikijs/langs/html";
import js from "@shikijs/langs/javascript";
import json from "@shikijs/langs/json";
import json5 from "@shikijs/langs/json5";
import jsonc from "@shikijs/langs/jsonc";
import jsonl from "@shikijs/langs/jsonl";
import jsonnet from "@shikijs/langs/jsonnet";
import kotlin from "@shikijs/langs/kotlin";
import make from "@shikijs/langs/make";
import markdown from "@shikijs/langs/markdown";
import mermaid from "@shikijs/langs/mermaid";
import nginx from "@shikijs/langs/nginx";
import perl from "@shikijs/langs/perl";
import php from "@shikijs/langs/php";
import proto from "@shikijs/langs/proto";
import python from "@shikijs/langs/python";
import regexp from "@shikijs/langs/regexp";
import ruby from "@shikijs/langs/ruby";
import rust from "@shikijs/langs/rust";
import sass from "@shikijs/langs/sass";
import scss from "@shikijs/langs/scss";
import shell from "@shikijs/langs/shellscript";
import sql from "@shikijs/langs/sql";
import toml from "@shikijs/langs/toml";
import tsx from "@shikijs/langs/tsx";
import ts from "@shikijs/langs/typescript";
import vue from "@shikijs/langs/vue";
import xml from "@shikijs/langs/xml";
import yaml from "@shikijs/langs/yaml";
import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import githubDark from "@shikijs/themes/github-dark";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createHighlighterCoreSync } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

const highlighter = createHighlighterCoreSync({
  themes: [githubDark],
  langs: [
    js,
    ts,
    tsx,
    json,
    json5,
    jsonc,
    jsonl,
    jsonnet,
    markdown,
    python,
    php,
    css,
    html,
    shell,
    sass,
    scss,
    sql,
    awk,
    yaml,
    toml,
    csv,
    cue,
    diff,
    docker,
    dotenv,
    gitCommit,
    gitRebase,
    go,
    kotlin,
    make,
    mermaid,
    nginx,
    perl,
    proto,
    regexp,
    ruby,
    rust,
    vue,
    xml,
  ],
  engine: createJavaScriptRegexEngine(),
});

export function MarkdownPreview({ content }: { content: string }) {
  return (
    <div className="prose prose-invert max-w-none text-slate-100">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeShikiFromHighlighter, highlighter, { theme: "github-dark" }]]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
