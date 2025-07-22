import { useCompletion } from "@ai-sdk/react";
import { ArrowRightLeft, Check, Copy, FileText, Languages, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { MarkdownPreview } from "../components/markdown-preview";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
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

export default function TranslatorPage() {
  const [sourceLang, setSourceLang] = useState<"en" | "ja">("en");
  const [targetLang, setTargetLang] = useState<"en" | "ja">("ja");
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

  const { completion, input, setInput, handleSubmit, isLoading, error } = useCompletion({
    api: "/api/completion",
    body: {
      sourceLang,
      targetLang,
    },
  });

  const handleSwapLanguages = () => {
    setIsSwapping(true);
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setInput(completion);
    setTimeout(() => setIsSwapping(false), 300);
  };

  const handleTranslate = (e: React.FormEvent<HTMLFormElement>) => {
    setShowPreview(false);
    handleSubmit(e);
  };

  const hasCompletion = useMemo(() => !!completion && completion.length > 0, [completion]);

  return (
    <div className="flex flex-col h-screen bg-slate-900 font-sans">
      <form onSubmit={handleTranslate} className="flex-1 flex flex-col min-h-0">
        <main className="flex-1 flex flex-col md:flex-row gap-4 p-4 md:p-6 relative min-h-0">
          {/* Input Card */}
          <Card className="w-full flex flex-col border-blue-800 min-h-0">
            <CardHeader className="flex flex-row items-center justify-between p-3 border-b border-slate-700">
              <Select value={sourceLang} onValueChange={(value) => setSourceLang(value as "en" | "ja")}>
                <SelectTrigger className="w-[150px] text-sm font-semibold border-0 focus:ring-0 mb-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="min-w-[150px] bg-slate-800 border border-slate-700">
                  <SelectItem value="en" className="cursor-pointer hover:bg-slate-700">
                    英語
                  </SelectItem>
                  <SelectItem value="ja" className="cursor-pointer hover:bg-slate-700">
                    日本語
                  </SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  disabled={isLoading || !input.trim()}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Languages className="w-4 h-4 mr-2" />
                  )}
                  {isLoading ? "翻訳中..." : "翻訳する"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-0">
              <Textarea
                placeholder="翻訳したいテキストを入力してください"
                className="w-full h-full resize-none border-0 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-0 p-4 text-base"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </CardContent>
            <CardFooter className="p-3 border-t border-slate-700 text-xs text-slate-500">
              文字数: {input.length}
            </CardFooter>
          </Card>

          {/* Swap Button */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <Button
              type="button"
              size="icon"
              onClick={handleSwapLanguages}
              className={`bg-slate-800 rounded-full border-2 border-slate-600 hover:bg-slate-700 transition-all duration-150 shadow-md hover:shadow-lg disabled:opacity-50 disabled:hover:bg-slate-800 ${
                isSwapping ? "scale-95 shadow-sm" : "scale-100"
              }`}
              disabled={isLoading || !hasCompletion}
            >
              <ArrowRightLeft className="w-5 h-5 text-slate-300" />
            </Button>
          </div>

          {/* Output Card */}
          <Card className="w-full flex flex-col border-purple-800 min-h-0">
            <CardHeader className="flex flex-row items-center justify-between p-3 border-b border-slate-700">
              <Select value={targetLang} onValueChange={(value) => setTargetLang(value as "en" | "ja")}>
                <SelectTrigger className="w-[150px] text-sm font-semibold border-0 focus:ring-0 mb-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="min-w-[150px] bg-slate-800 border border-slate-700">
                  <SelectItem value="ja" className="cursor-pointer hover:bg-slate-700">
                    日本語
                  </SelectItem>
                  <SelectItem value="en" className="cursor-pointer hover:bg-slate-700">
                    英語
                  </SelectItem>
                </SelectContent>
              </Select>
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
                  disabled={!hasCompletion}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white transition-opacity duration-200"
                >
                  {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? "コピーしました" : "コピーする"}
                </Button>
                <Button
                  key="preview-button"
                  type="button"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  disabled={!hasCompletion}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white transition-opacity duration-200"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {showPreview ? "プレビューを隠す" : "Markdownプレビュー"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 flex-1 bg-purple-900/10 overflow-y-auto min-h-0">
              {hasCompletion ? (
                showPreview ? (
                  <MarkdownPreview content={completion} />
                ) : (
                  <div className="w-full whitespace-pre-wrap text-base text-slate-100">{completion}</div>
                )
              ) : (
                <span className="text-slate-400">翻訳結果がここに表示されます</span>
              )}
            </CardContent>
            <CardFooter className="p-3 border-t border-slate-700 text-xs text-slate-500">
              文字数: {completion.length}
            </CardFooter>
          </Card>
        </main>
      </form>

      {error && (
        <div className="fixed bottom-4 right-4 max-w-md">
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
