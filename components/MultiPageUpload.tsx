"use client";

import { useRef } from "react";
import { Upload, Trash2, Plus } from "lucide-react";

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
  t: (key: string) => string;
}

export default function MultiPageUpload({
  pages,
  onAddPage,
  onRemovePage,
  onUploadPage,
  maxPages = 30,
  disabled = false,
  t,
}: MultiPageUploadProps) {
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

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
                <p className="text-sm text-gray-700">
                  {isUploaded ? (
                    <>
                      <span className="font-medium">Page {idx + 1}</span>
                      <span className="text-xs text-gray-500 ml-2">✓ {t("common.uploaded")}</span>
                    </>
                  ) : page.isUploading ? (
                    <>
                      <span className="text-xs text-gray-500">アップロード中...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-gray-500">Page {idx + 1}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Right: Upload/Delete buttons */}
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
                <button
                  onClick={() => onRemovePage(page.id)}
                  disabled={disabled}
                  title={t("common.delete")}
                  className="p-1.5 text-gray-500 hover:text-red-600 disabled:text-gray-300 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
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
          {t("docs.bankStatementHistory")} - {t("apply.add_page")} ({pages.length}/{maxPages})
        </button>
      )}

      {pages.length === maxPages && (
        <p className="text-xs text-gray-500 text-center">
          最大 {maxPages} ページまで登録できます
        </p>
      )}
    </div>
  );
}
