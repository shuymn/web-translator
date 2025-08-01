import { useCompletion } from "@ai-sdk/react";
import { ArrowRightLeft, Check, Copy, FileText, Languages, Loader2 } from "lucide-react";
import { memo, useMemo, useState } from "react";
import { toast } from "sonner";
import { MarkdownPreview } from "../components/markdown-preview";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Toaster } from "../components/ui/sonner";
import { Textarea } from "../components/ui/textarea";

export function meta() {
  return [
    { title: "Web Translator" },
    {
      name: "description",
      content: "Translate text between English and Japanese with markdown support",
    },
  ];
}

const LANGUAGES = {
  English: "en",
  Japanese: "ja",
} as const;
type Language = (typeof LANGUAGES)[keyof typeof LANGUAGES];

// Memoized output content to prevent re-renders when input changes
const OutputContent = memo(({ completion, showPreview }: { completion: string; showPreview: boolean }) => {
  if (!completion) {
    return <span className="text-text-muted-alt">翻訳結果がここに表示されます</span>;
  }

  return showPreview ? (
    <MarkdownPreview content={completion} />
  ) : (
    <div className="w-full whitespace-pre-wrap text-base text-foreground">{completion}</div>
  );
});

OutputContent.displayName = "OutputContent";

// Pure utility function - moved outside component to avoid recreation on every render
const formatTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
};

export default function TranslatorPage() {
  const [sourceLang, setSourceLang] = useState<Language>(LANGUAGES.English);
  const targetLang = sourceLang === LANGUAGES.English ? LANGUAGES.Japanese : LANGUAGES.English; // automatically switch targetLang
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [lastTranslatedText, setLastTranslatedText] = useState("");

  // Common button styles for output actions
  const outputButtonClassName =
    "bg-primary hover:bg-primary/90 text-primary-foreground transition-opacity duration-200";

  const { completion, input, setInput, handleSubmit, isLoading, complete } = useCompletion({
    api: "/api/completion",
    body: {
      sourceLang,
      targetLang,
    },
    onFinish: () => {
      toast.success("翻訳が完了しました", {
        description: formatTimestamp(),
      });
    },
    onError: (error) => {
      toast.error(error.message || "翻訳中にエラーが発生しました", {
        description: formatTimestamp(),
        duration: 10 * 1000, // 10 seconds
      });
    },
  });

  const handleSwapLanguages = () => {
    setIsSwapping(true);
    setSourceLang(targetLang); // targetLang switches automatically
    setInput(completion);
    setLastTranslatedText(""); // Reset last translated text on swap
    // 300ms delay to allow the swap animation to complete smoothly
    setTimeout(() => setIsSwapping(false), 300);
  };

  const handleTranslate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const currentText = input.trim();

    // If same text as last translation, do nothing
    if (currentText === lastTranslatedText) {
      return;
    }

    // Update last translated text and proceed
    setLastTranslatedText(currentText);
    setShowPreview(false);
    handleSubmit(e);
  };

  const hasCompletion = useMemo(() => !!completion && completion.length > 0, [completion]);

  return (
    <div className="flex flex-col h-screen bg-background font-sans">
      <form onSubmit={handleTranslate} className="flex-1 flex flex-col min-h-0">
        <main className="flex-1 flex flex-col p-4 min-h-0 overflow-y-auto xl:overflow-visible">
          <div className="flex-1 flex flex-col xl:flex-row portrait:flex-col gap-4 min-h-0">
            {/* Input Card */}
            <Card className="w-full flex flex-col border-input-card-border min-h-0 flex-1">
              <CardHeader className="flex flex-row items-center justify-between p-3 border-b border-border">
                <div className="flex items-center gap-2 mb-0">
                  <span className="text-sm font-semibold text-muted-foreground">原文:</span>
                  <Select value={sourceLang} onValueChange={(value) => setSourceLang(value as Language)}>
                    <SelectTrigger className="w-[100px] text-sm font-semibold border border-border focus:ring-0 mb-0 bg-secondary hover:bg-accent">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="min-w-[100px] bg-secondary border border-border">
                      <SelectItem value="en" className="cursor-pointer hover:bg-accent">
                        英語
                      </SelectItem>
                      <SelectItem value="ja" className="cursor-pointer hover:bg-accent">
                        日本語
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={isLoading || !input.trim()}
                    aria-label={isLoading ? "翻訳中..." : "翻訳する"}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
                    ) : (
                      <Languages className="w-4 h-4 sm:mr-2" />
                    )}
                    <span className="hidden sm:inline">{isLoading ? "翻訳中..." : "翻訳する"}</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 min-h-0">
                <Textarea
                  placeholder="翻訳したいテキストを入力してください"
                  className="w-full h-full resize-none border-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 p-4 text-base placeholder:text-text-muted-alt"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onPaste={async (e) => {
                    // Don't trigger translation if a request is already in flight
                    if (isLoading) {
                      return;
                    }

                    // Prevent the browser's default paste behavior
                    e.preventDefault();

                    // Get the text from the clipboard
                    const pastedText = e.clipboardData.getData("text");
                    if (!pastedText || !pastedText.trim()) {
                      return;
                    }

                    // Manually construct the new value by inserting the pasted text
                    const target = e.currentTarget;
                    const newText =
                      target.value.substring(0, target.selectionStart) +
                      pastedText +
                      target.value.substring(target.selectionEnd);

                    // Update the input state in React
                    setInput(newText);

                    const currentText = newText.trim();

                    // If same text as last translation, do nothing
                    if (currentText === lastTranslatedText) {
                      return;
                    }

                    // Update last translated text and proceed
                    setLastTranslatedText(currentText);

                    // Turn off markdown preview before translation
                    setShowPreview(false);

                    // Directly trigger the translation with the new, complete text
                    await complete(newText);
                  }}
                />
              </CardContent>
              <CardFooter className="p-3 border-t border-border text-xs text-text-subtle">
                文字数: {input.length}
              </CardFooter>
            </Card>

            {/* Swap Button - Vertical Layout (default and portrait) */}
            <div className="xl:hidden portrait:flex relative flex items-center justify-center h-0 -my-2 z-10">
              <Button
                type="button"
                size="icon"
                onClick={handleSwapLanguages}
                className={`bg-secondary rounded-full border-2 border-input hover:bg-accent transition-all duration-150 shadow-md hover:shadow-lg disabled:opacity-50 disabled:hover:bg-secondary ${
                  isSwapping ? "scale-95 shadow-sm" : "scale-100"
                }`}
                disabled={isLoading || !hasCompletion}
              >
                <ArrowRightLeft className="w-5 h-5 text-muted-foreground rotate-90" />
              </Button>
            </div>

            {/* Swap Button Container - Horizontal Layout (xl and above, non-portrait) */}
            <div className="hidden xl:block portrait:hidden relative w-0 -mx-2 z-10">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <Button
                  type="button"
                  size="icon"
                  onClick={handleSwapLanguages}
                  className={`bg-secondary rounded-full border-2 border-input hover:bg-accent transition-all duration-150 shadow-md hover:shadow-lg disabled:opacity-50 disabled:hover:bg-secondary ${
                    isSwapping ? "scale-95 shadow-sm" : "scale-100"
                  }`}
                  disabled={isLoading || !hasCompletion}
                >
                  <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />
                </Button>
              </div>
            </div>

            {/* Output Card */}
            <Card className="w-full flex flex-col border-output-card-border min-h-0 flex-1">
              <CardHeader className="flex flex-row items-center justify-between p-3 border-b border-border">
                <div className="flex items-center gap-2 mb-0">
                  <span className="text-sm font-semibold text-muted-foreground">訳文:</span>
                  <div className="w-auto h-10 flex items-center px-3 text-sm font-semibold bg-secondary rounded-md border border-border">
                    {targetLang === LANGUAGES.Japanese ? "日本語" : "英語"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    key="copy-button"
                    type="button"
                    size="sm"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(completion);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      } catch (err) {
                        console.error("Failed to copy text:", err);
                      }
                    }}
                    disabled={!hasCompletion || isLoading}
                    className={outputButtonClassName}
                    aria-label={copied ? "コピーしました" : "コピーする"}
                  >
                    {copied ? <Check className="w-4 h-4 sm:mr-2" /> : <Copy className="w-4 h-4 sm:mr-2" />}
                    <span className="hidden sm:inline">{copied ? "コピーしました" : "コピーする"}</span>
                  </Button>
                  <Button
                    key="preview-button"
                    type="button"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    disabled={!hasCompletion || isLoading}
                    className={outputButtonClassName}
                    aria-label={showPreview ? "プレビューを隠す" : "Markdownプレビュー"}
                  >
                    <FileText className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">{showPreview ? "プレビューを隠す" : "Markdownプレビュー"}</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-1 bg-output-bg overflow-y-auto min-h-0">
                <OutputContent completion={completion} showPreview={showPreview} />
              </CardContent>
              <CardFooter className="p-3 border-t border-border text-xs text-text-subtle flex justify-between">
                <span>文字数: {completion.length}</span>
                {__COMMIT_HASH__ !== "unknown" ? (
                  <a
                    href={`https://github.com/${__GITHUB_REPO__}/commit/${__COMMIT_HASH__}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono hover:text-foreground transition-colors"
                  >
                    {__COMMIT_HASH__}
                  </a>
                ) : (
                  <span className="text-text-muted-alt">unknown</span>
                )}
              </CardFooter>
            </Card>
          </div>
        </main>
      </form>

      <Toaster richColors position="bottom-right" />
    </div>
  );
}
