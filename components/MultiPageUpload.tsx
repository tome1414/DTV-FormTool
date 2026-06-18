"use client";

import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";

interface PageFile {
  id: string;
  file: File | null;
  preview?: string;
  storagePath?: string;
  isUploading?: boolean;
}

interface MultiPageUploadProps {
  pages: PageFile[];
  onAddPage: () => void;
  onRemovePage: (pageId: string) => void;
  onUploadPage: (pageId: string, file: File) => void;
  maxPages?: number;
  disabled?: boolean;
  documentKey: string;
  t: (key: string) => string;
}

export default function MultiPageUpload({
  pages,
  onAddPage,
  onRemovePage,
  onUploadPage,
  maxPages = 30,
  disabled = false,
  documentKey,
  t,
}: MultiPageUploadProps) {
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  // ローカル選択済みファイル（未提出）
  const [localFiles, setLocalFiles] = useState<Record<string, { file: File; preview: string | null }>>({});
  const [previewModal, setPreviewModal] = useState<{ src: string; name: string } | null>(null);

  const canAddMore = pages.length < maxPages;

  const handleFileSelect = (pageId: string, file: File) => {
    const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    setLocalFiles((prev) => ({ ...prev, [pageId]: { file, preview } }));
  };

  const handleSubmit = (pageId: string) => {
    const local = localFiles[pageId];
    if (!local) return;
    onUploadPage(pageId, local.file);
    // 提出後にローカルから削除
    setLocalFiles((prev) => { const n = { ...prev }; delete n[pageId]; return n; });
  };

  const handleRemoveLocal = (pageId: string) => {
    setLocalFiles((prev) => { const n = { ...prev }; delete n[pageId]; return n; });
  };

  return (
    <div className="space-y-3">
      {pages.map((page, idx) => {
        const isSubmitted = !!page.storagePath;
        const local = localFiles[page.id];
        const isLocalOnly = !isSubmitted && !!local;

        return (
          <div key={page.id} className="rounded-xl border border-gray-200 overflow-hidden">
            {/* ページヘッダー */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  isSubmitted ? "bg-green-500 text-white" : isLocalOnly ? "bg-amber-400 text-white" : "bg-gray-200 text-gray-600"
                }`}>
                  {isSubmitted ? "✓" : isLocalOnly ? "!" : idx + 1}
                </span>
                <span className="text-sm font-medium text-gray-700">{idx + 1}ページ目</span>
                {isSubmitted && <span className="text-xs text-green-600 font-medium">提出済み</span>}
                {isLocalOnly && <span className="text-xs text-amber-600 font-medium">未提出</span>}
              </div>
              {/* 提出済みのプレビュー・削除 */}
              {isSubmitted && (
                <div className="flex items-center gap-1">
                  {page.file && page.file.type.startsWith("image/") && page.preview && (
                    <button
                      onClick={() => setPreviewModal({ src: page.preview!, name: `${idx + 1}ページ目` })}
                      className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1"
                    >
                      プレビュー
                    </button>
                  )}
                  <button
                    onClick={() => onRemovePage(page.id)}
                    disabled={disabled}
                    className="text-gray-400 hover:text-red-500 disabled:text-gray-200 transition-colors p-1"
                    title="削除"
                  >
                    <X size={15} />
                  </button>
                </div>
              )}
            </div>

            {/* 状態1: 未選択 */}
            {!isSubmitted && !isLocalOnly && !page.isUploading && (
              <div
                className="px-4 py-5 text-center cursor-pointer hover:bg-blue-50 transition-colors"
                onClick={() => fileRefs.current[page.id]?.click()}
              >
                <p className="text-sm text-gray-500">📎 タップしてファイルを選ぶ</p>
                <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, PDF 対応</p>
              </div>
            )}

            {/* 状態2: 選択済み・未提出 */}
            {isLocalOnly && (
              <div className="p-3 space-y-2.5">
                {/* ファイル情報 */}
                {local.preview ? (
                  <img src={local.preview} alt="preview" className="w-full max-h-40 object-contain rounded-lg border border-gray-200" />
                ) : (
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                    <span className="text-2xl">📄</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{local.file.name}</p>
                      <p className="text-xs text-gray-400">{(local.file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                )}
                {/* 警告 */}
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <span className="text-amber-500 flex-shrink-0 mt-0.5">⚠️</span>
                  <p className="text-xs text-amber-800">まだ提出されていません。「提出する」を押してください。</p>
                </div>
                {/* ボタン */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRemoveLocal(page.id)}
                    className="flex-1 py-2 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={() => handleSubmit(page.id)}
                    disabled={disabled}
                    className="flex-1 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg transition-colors"
                  >
                    📤 提出する
                  </button>
                </div>
              </div>
            )}

            {/* アップロード中 */}
            {page.isUploading && (
              <div className="px-4 py-4 flex items-center gap-3">
                <span className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin flex-shrink-0" />
                <p className="text-sm text-gray-500">提出中...</p>
              </div>
            )}

            <input
              ref={(el) => { if (el) fileRefs.current[page.id] = el; }}
              type="file"
              className="hidden"
              accept="image/*,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(page.id, file);
                e.target.value = "";
              }}
            />
          </div>
        );
      })}

      {/* ページ追加ボタン */}
      {canAddMore && (
        <button
          onClick={onAddPage}
          disabled={disabled}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 disabled:border-gray-300 disabled:text-gray-400 rounded-xl transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          {pages.length + 1}ページを追加 ({pages.length}/{maxPages})
        </button>
      )}

      {pages.length === maxPages && (
        <p className="text-xs text-gray-400 text-center">最大 {maxPages} ページまで登録できます</p>
      )}

      {/* プレビューモーダル */}
      {previewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPreviewModal(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-semibold text-gray-800">{previewModal.name}</h3>
              <button onClick={() => setPreviewModal(null)} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
            </div>
            <div className="p-5 flex justify-center">
              <img src={previewModal.src} alt="preview" className="max-w-full max-h-[70vh] object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
