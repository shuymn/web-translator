import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect, useState } from "react";

export function MarkdownPreview({ content }: { content: string }) {
  const [rehypePlugins, setRehypePlugins] = useState<any[]>([]);

  return (
    <div className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-100">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={rehypePlugins}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
