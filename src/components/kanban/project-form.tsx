"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { createProject, updateProject } from "@/lib/api/projects";
import { ProjectStatus, Project, ProjectInsert } from "@/lib/database.types";

interface ProjectFormProps {
  statuses: ProjectStatus[];
  project?: Project | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProjectForm({ statuses, project, onClose, onSuccess }: ProjectFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: project?.name || "",
    description: project?.description || "",
    memo: project?.memo || "",
    delivery_date: project?.delivery_date ? project.delivery_date.split("T")[0] : "",
    status_id: project?.status_id || statuses[0]?.id || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setError("");

    try {
      const projectData: ProjectInsert = {
        user_id: user.id,
        name: formData.name,
        description: formData.description || null,
        memo: formData.memo || null,
        delivery_date: formData.delivery_date || null,
        status_id: formData.status_id || null,
      };

      if (project) {
        // 更新
        await updateProject(project.id, projectData);
      } else {
        // 新規作成
        await createProject(projectData);
      }

      onSuccess();
    } catch (error) {
      console.error("プロジェクト保存エラー:", error);
      setError("保存に失敗しました。もう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold">
            {project ? "プロジェクト編集" : "新規プロジェクト作成"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            ×
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-md">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* プロジェクト名 */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              プロジェクト名 <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
              placeholder="プロジェクト名を入力してください"
            />
          </div>

          {/* 制作状況 */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">制作状況</label>
            <select
              value={formData.status_id}
              onChange={(e) => handleInputChange("status_id", e.target.value)}
              className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            >
              {statuses.map((status) => (
                <option key={status.id} value={status.id} className="text-gray-900">
                  {status.name}
                </option>
              ))}
            </select>
          </div>

          {/* 納期 */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">納期</label>
            <input
              type="date"
              value={formData.delivery_date}
              onChange={(e) => handleInputChange("delivery_date", e.target.value)}
              className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            />
          </div>

          {/* 説明 */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">説明</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 bg-white resize-vertical"
              placeholder="プロジェクトの説明を入力してください"
            />
          </div>

          {/* メモ */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">メモ</label>
            <textarea
              value={formData.memo}
              onChange={(e) => handleInputChange("memo", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 bg-white resize-vertical"
              placeholder="メモや備考を入力してください"
            />
          </div>

          {/* ボタン */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 border border-gray-400 rounded-md hover:bg-gray-50 hover:border-gray-500 font-medium"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.name}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
            >
              {isLoading ? (project ? "更新中..." : "作成中...") : project ? "更新" : "作成"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
