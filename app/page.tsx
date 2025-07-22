"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { ArrowRightLeft, Copy, Languages, FileText } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export default function TranslatorPage() {
  const [inputText, setInputText] = useState(
    "Perfect! The refactoring is complete and addresses all the points from Gemini's review:\n\nSummary of Improvements Made:\n\n1. Fixed the type casting issue - Imported and used the LogLevel type from @ril/shared in the web-sync Config interface, eliminating the need for type assertion\n2. All code is now properly typed - No any types or unnecessary type assertions\n3. Tests pass - All functionality preserved\n4. Lint clean - No lint errors\n\nThe refactoring successfully:\n- Eliminated code duplication (no duplicates found with 0.8+ similarity threshold)\n- Improved maintainability through centralized utilities\n- Enhanced type safety\n- Followed monorepo best practices\n- Maintained backward compatibility\n\nThe Gemini review confirmed this is \"a high-quality refactoring that significantly improves the project's structure and maintainability.\"",
  )
  const [translatedText, setTranslatedText] = useState("")
  const [sourceLang, setSourceLang] = useState("en")
  const [targetLang, setTargetLang] = useState("ja")
  const [showPreview, setShowPreview] = useState(false)

  const handleTranslate = () => {
    // This is a mock translation. Replace with actual translation API call.
    if (inputText.trim() === "") {
      setTranslatedText("")
      return
    }
    setTranslatedText(
      "完璧です！リファクタリング作業は完了し、ジェミニによるレビューで指摘されたすべてのポイントに対応しています:\n\n実施した改善点の概要:\n\n1. 型キャストの問題を解決 - ウェブ同期用Configインターフェースにおいて、@ril/sharedパッケージのLogLevel型をインポートして使用することで、型の明示的な指定が不要になりました\n2. コード全体の型付けが適切に完了 - 任意型や不要な型アサーションは一切使用していません\n3. テストがすべて通過 - すべての機能が維持されていることを確認\n4. リンターチェックがクリーン - リンターエラーは検出されませんでした\n\nこのリファクタリングにより以下の成果が得られました:\n- コードの重複を完全に排除（類似度0.8以上の重複コードは検出されませんでした）\n- ユーティリティ関数の集中管理による保守性の向上\n- 型安全性の強化\n- モノレポ環境におけるベストプラクティスの遵守\n- 後方互換性の維持\n\nジェミニによるレビューでは、このリファクタリングが「プロジェクトの構造と保守性を大幅に改善する高品質なリファクタリングである」との評価を得ています。",
    )
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText)
  }

  const handleSwapLanguages = () => {
    const tempLang = sourceLang
    setSourceLang(targetLang)
    setTargetLang(tempLang)
    const tempText = inputText
    setInputText(translatedText)
    setTranslatedText(tempText)
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 font-sans">
      <main className="flex-1 flex flex-col md:flex-row gap-4 p-4 md:p-6 relative">
        {/* Input Card */}
        <Card className="w-full flex flex-col border-blue-300 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
            <Select value={sourceLang} onValueChange={setSourceLang}>
              <SelectTrigger className="w-auto text-sm font-semibold border-0 focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">英語</SelectItem>
                <SelectItem value="ja">日本語</SelectItem>
                <SelectItem value="auto">言語を検出する</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Button onClick={handleTranslate} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Languages className="w-4 h-4 mr-2" />
                翻訳する
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <Textarea
              placeholder="翻訳したいテキストを入力してください"
              className="w-full h-full resize-none border-0 focus-visible:ring-0 p-4 text-base"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </CardContent>
          <CardFooter className="p-3 border-t text-xs text-slate-500">文字数: {inputText.length}</CardFooter>
        </Card>

        {/* Swap Button */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <Button
            variant="outline"
            size="icon"
            onClick={handleSwapLanguages}
            className="bg-white dark:bg-slate-800 rounded-full border-2"
          >
            <ArrowRightLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </Button>
        </div>

        {/* Output Card */}
        <Card className="w-full flex flex-col border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
            <Select value={targetLang} onValueChange={setTargetLang}>
              <SelectTrigger className="w-auto text-sm font-semibold border-0 focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ja">日本語</SelectItem>
                <SelectItem value="en">英語</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy} disabled={!translatedText}>
                <Copy className="w-4 h-4 mr-2" />
                コピーする
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                disabled={!translatedText}
              >
                <FileText className="w-4 h-4 mr-2" />
                {showPreview ? "プレビューを隠す" : "Markdownプレビュー"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-1 bg-purple-50/30 dark:bg-purple-900/10">
            {translatedText ? (
              showPreview ? (
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{translatedText}</ReactMarkdown>
                </div>
              ) : (
                <div className="w-full h-full whitespace-pre-wrap text-base text-slate-800 dark:text-slate-100">
                  {translatedText}
                </div>
              )
            ) : (
              <span className="text-slate-400">翻訳結果がここに表示されます</span>
            )}
          </CardContent>
          <CardFooter className="p-3 border-t text-xs text-slate-500">文字数: {translatedText.length}</CardFooter>
        </Card>
      </main>
    </div>
  )
}
