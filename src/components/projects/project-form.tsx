"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { createProject, updateProject } from "@/lib/api/projects";
import { ProjectWithStatus, ProjectStatus } from "@/lib/database.types";

interface ProjectFormProps {
  statuses: ProjectStatus[];
  project?: ProjectWithStatus | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProjectForm({ statuses, project, onClose, onSuccess }: ProjectFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    delivery_date: "",
    memo: "",
    status_id: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || "",
        delivery_date: project.delivery_date ? project.delivery_date.split("T")[0] : "",
        memo: project.memo || "",
        status_id: project.status_id || "",
      });
    } else if (statuses.length > 0) {
      setFormData((prev) => ({
        ...prev,
        status_id: statuses[0].id,
      }));
    }
  }, [project, statuses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setLoading(true);
    try {
      const projectData = {
        ...formData,
        user_id: user.id,
      };

      if (project) {
        await updateProject(project.id, projectData);
      } else {
        await createProject(projectData);
      }

      onSuccess();
    } catch (error) {
      console.error("案件保存エラー:", error);
      alert("案件の保存に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {project ? "案件を編集" : "新規案件を作成"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">案件名 *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="案件名を入力"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">説明</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="案件の説明を入力"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">制作状況 *</label>
              <select
                name="status_id"
                value={formData.status_id}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">制作状況を選択</option>
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">納期</label>
              <input
                type="date"
                name="delivery_date"
                value={formData.delivery_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">メモ</label>
              <textarea
                name="memo"
                value={formData.memo}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="メモを入力"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-900 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? "保存中..." : project ? "更新" : "作成"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
