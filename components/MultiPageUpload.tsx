"use client";

import { useRef, useState } from "react";
import { Upload, Trash2, Plus, Eye, X } from "lucide-react";

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
  const [previewPageId, setPreviewPageId] = useState<string | null>(null);

  const canAddMore = pages.length < maxPages;

  return (
    <div className="space-y-3">
      {pages.map((page, idx) => {
        const isUploaded = !!page.storagePath;

        return (
          <div
            key={page.id}
            className="relative flex items-center justify-between py-3 px-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            {/* Left: Page label & status */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
                {idx + 1}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 font-medium">
                  {idx + 1}ページ目
                </p>
                <p className="text-xs mt-0.5">
                  {isUploaded ? (
                    <span className="text-green-600">✓ {t("mypage.uploaded")}</span>
                  ) : page.isUploading ? (
                    <span className="text-gray-400">アップロード中...</span>
                  ) : (
                    <span className="text-gray-400">未アップロード</span>
                  )}
                </p>
              </div>
            </div>

            {/* Right: Upload/Delete/Preview buttons */}
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              {!isUploaded && !page.isUploading ? (
                <button
                  onClick={() => fileRefs.current[page.id]?.click()}
                  disabled={disabled}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                >
                  <Upload size={12} />
                  {t("common.upload")}
                </button>
              ) : null}

              {isUploaded && (
                <>
                  <button
                    onClick={() => setPreviewPageId(page.id)}
                    title={t("common.preview")}
                    className="p-1.5 text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => onRemovePage(page.id)}
                    disabled={disabled}
                    title={t("common.delete")}
                    className="p-1.5 text-gray-500 hover:text-red-600 disabled:text-gray-300 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}

              <input
                ref={(el) => {
                  if (el) fileRefs.current[page.id] = el;
                }}
                type="file"
                className="hidden"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUploadPage(page.id, file);
                  e.target.value = "";
                }}
              />
            </div>
          </div>
        );
      })}

      {/* Add page button */}
      {canAddMore && (
        <button
          onClick={onAddPage}
          disabled={disabled}
          className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 disabled:border-gray-300 disabled:text-gray-400 rounded-lg transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          {t(`docs.${documentKey}`)} - {t("apply.add_page")} ({pages.length}/{maxPages})
        </button>
      )}

      {pages.length === maxPages && (
        <p className="text-xs text-gray-500 text-center">
          最大 {maxPages} ページまで登録できます
        </p>
      )}

      {/* Preview Modal */}
      {previewPageId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPreviewPageId(null)}>
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Page {pages.findIndex((p) => p.id === previewPageId) + 1} - {t(`docs.${documentKey}`)}
              </h3>
              <button
                onClick={() => setPreviewPageId(null)}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 flex justify-center">
              {pages.find((p) => p.id === previewPageId)?.file?.type.startsWith("image/") ? (
                <img
                  src={URL.createObjectURL(pages.find((p) => p.id === previewPageId)!.file!)}
                  alt="preview"
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              ) : (
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 flex flex-col items-center gap-4">
                  <span className="text-4xl">📄</span>
                  <div className="text-center">
                    <p className="font-medium text-gray-800">
                      {pages.find((p) => p.id === previewPageId)?.file?.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {pages.find((p) => p.id === previewPageId)?.file ?
                        `${(pages.find((p) => p.id === previewPageId)!.file!.size / 1024).toFixed(1)} KB`
                        : ""}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
