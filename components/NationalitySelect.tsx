"use client";

import { useState, useRef, useEffect } from "react";
import { COUNTRIES } from "@/lib/countryData";

interface Props {
  value: string; // Japanese name of selected country
  onChange: (ja: string) => void;
  placeholder?: string;
  className?: string;
}

export default function NationalitySelect({ value, onChange, placeholder = "国名をアルファベットで入力（例: Japan）", className = "" }: Props) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim().length >= 1
    ? COUNTRIES.filter(
        (c) =>
          c.en.toLowerCase().includes(query.toLowerCase()) ||
          c.ja.includes(query)
      ).slice(0, 8)
    : [];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (ja: string) => {
    onChange(ja);
    setQuery("");
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {value && !isOpen ? (
        // Selected state: show Japanese name with edit/clear option
        <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 bg-white">
          <span className="text-sm text-gray-800 flex-1">{value}</span>
          <button
            type="button"
            onClick={() => { setIsOpen(true); setQuery(""); }}
            className="text-xs text-blue-500 hover:text-blue-700 shrink-0"
          >
            変更
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 shrink-0 text-xs leading-none"
            aria-label="クリア"
          >
            ✕
          </button>
        </div>
      ) : (
        // Search state
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          autoFocus={isOpen && !value}
          className="w-full border border-blue-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}

      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {filtered.map((c) => (
            <li key={c.en}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(c.ja)}
                className="w-full text-left px-4 py-2.5 hover:bg-blue-50 flex items-center justify-between gap-3"
              >
                <span className="text-sm font-medium text-gray-800">{c.ja}</span>
                <span className="text-xs text-gray-400">{c.en}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {isOpen && query.trim().length >= 1 && filtered.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-sm text-gray-400">
          一致する国が見つかりません
        </div>
      )}
    </div>
  );
}
