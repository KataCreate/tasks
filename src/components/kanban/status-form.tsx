"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { createProjectStatus, updateProjectStatus } from "@/lib/api/projects";
import { ProjectStatus } from "@/lib/database.types";

interface StatusFormProps {
  status?: ProjectStatus | null;
  onClose: () => void;
  onSuccess: () => void;
}

const PRESET_COLORS = [
  "#EF4444", // 赤
  "#F59E0B", // オレンジ
  "#EAB308", // 黄色
  "#10B981", // 緑
  "#3B82F6", // 青
  "#8B5CF6", // 紫
  "#EC4899", // ピンク
  "#6B7280", // グレー
];

export function StatusForm({ status, onClose, onSuccess }: StatusFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: status?.name || "",
    color: status?.color || PRESET_COLORS[0],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.name.trim()) {
      setError("制作状況名を入力してください。");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      if (status) {
        // 更新
        await updateProjectStatus(status.id, {
          name: formData.name.trim(),
          color: formData.color,
        });
      } else {
        // 新規作成
        await createProjectStatus(user.id, formData.name.trim(), formData.color);
      }

      onSuccess();
    } catch (error: any) {
      console.error("制作状況保存エラー:", error);
      setError(error.message || "保存に失敗しました。もう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {status ? "制作状況を編集" : "制作状況を追加"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-1">
              制作状況名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="例：進行中、レビュー待ち"
              maxLength={50}
              required
            />
            <p className="text-xs text-gray-700 mt-1">{formData.name.length}/50文字</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">カラー</label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-12 h-12 rounded-lg border-2 transition-all ${
                    formData.color === color
                      ? "border-gray-800 scale-110"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <div className="mt-2">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                title="カスタムカラーを選択"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.name.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "保存中..." : status ? "更新" : "作成"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
