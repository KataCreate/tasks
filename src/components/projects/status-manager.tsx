"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getProjectStatuses,
  createProjectStatus,
  updateProjectStatus,
  deleteProjectStatus,
} from "@/lib/api/projects";
import { ProjectStatus } from "@/lib/database.types";

interface StatusManagerProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function StatusManager({ onClose, onSuccess }: StatusManagerProps) {
  const { user } = useAuth();
  const [statuses, setStatuses] = useState<ProjectStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingStatus, setEditingStatus] = useState<ProjectStatus | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    color: "#3B82F6",
  });

  useEffect(() => {
    if (user?.id) {
      loadStatuses();
    }
  }, [user?.id]);

  const loadStatuses = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await getProjectStatuses(user.id);
      setStatuses(data);
    } catch (error) {
      console.error("制作状況取得エラー:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      if (editingStatus) {
        await updateProjectStatus(editingStatus.id, formData);
      } else {
        await createProjectStatus(user.id, formData.name, formData.color);
      }

      setShowCreateForm(false);
      setEditingStatus(null);
      setFormData({ name: "", color: "#3B82F6" });
      loadStatuses();
    } catch (error) {
      console.error("制作状況保存エラー:", error);
      alert("制作状況の保存に失敗しました。");
    }
  };

  const handleDelete = async (statusId: string) => {
    if (confirm("この制作状況を削除しますか？関連する案件の制作状況がリセットされます。")) {
      try {
        await deleteProjectStatus(statusId);
        loadStatuses();
      } catch (error) {
        console.error("制作状況削除エラー:", error);
        alert("制作状況の削除に失敗しました。");
      }
    }
  };

  const handleEdit = (status: ProjectStatus) => {
    setEditingStatus(status);
    setFormData({
      name: status.name,
      color: status.color,
    });
    setShowCreateForm(true);
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingStatus(null);
    setFormData({ name: "", color: "#3B82F6" });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">制作状況管理</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
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

        {showCreateForm ? (
          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">制作状況名 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="制作状況名を入力"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">色 *</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                  className="w-12 h-10 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="#3B82F6"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
              >
                {editingStatus ? "更新" : "作成"}
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-6">
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              新規制作状況を作成
            </button>
          </div>
        )}

        <div className="space-y-2">
          {statuses.map((status) => (
            <div
              key={status.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: status.color }}
                ></div>
                <span className="font-medium text-gray-900">{status.name}</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(status)}
                  className="text-blue-600 hover:text-blue-900 text-sm"
                >
                  編集
                </button>
                <button
                  onClick={() => handleDelete(status.id)}
                  className="text-red-600 hover:text-red-900 text-sm"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>

        {statuses.length === 0 && !showCreateForm && (
          <div className="text-center py-8 text-gray-500">
            制作状況がありません。新規作成してください。
          </div>
        )}
      </div>
    </div>
  );
}
