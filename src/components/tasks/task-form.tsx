"use client";

import { useState } from "react";
import { TaskWithChildren } from "@/lib/database.types";
import { createTask, updateTask } from "@/lib/api/tasks";

interface TaskFormProps {
  projectId: string;
  task?: TaskWithChildren | null;
  parentTask?: TaskWithChildren | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function TaskForm({ projectId, task, parentTask, onClose, onSuccess }: TaskFormProps) {
  const [formData, setFormData] = useState({
    title: task?.title || "",
    description: task?.description || "",
    priority: task?.priority || ("medium" as const),
    status: task?.status || ("todo" as const),
    due_date: task?.due_date ? task.due_date.split("T")[0] : "",
    estimated_hours: task?.estimated_hours || "",
    progress_percentage: task?.progress_percentage || 0,
    tags: task?.tags ? task.tags.join(", ") : "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!task;
  const isSubTask = !!parentTask;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isEditing) {
        // 更新
        await updateTask(task!.id, {
          title: formData.title,
          description: formData.description || null,
          priority: formData.priority,
          status: formData.status,
          due_date: formData.due_date || null,
          estimated_hours: formData.estimated_hours ? Number(formData.estimated_hours) : null,
          progress_percentage: formData.progress_percentage,
          tags: formData.tags
            ? formData.tags
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag)
            : null,
        });
      } else {
        // 新規作成
        await createTask({
          project_id: projectId,
          parent_task_id: parentTask?.id || null,
          title: formData.title,
          description: formData.description || null,
          priority: formData.priority,
          status: formData.status,
          due_date: formData.due_date || null,
          estimated_hours: formData.estimated_hours ? Number(formData.estimated_hours) : null,
          progress_percentage: formData.progress_percentage,
          tags: formData.tags
            ? formData.tags
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag)
            : null,
        });
      }
      onSuccess();
    } catch (err: any) {
      console.error("❌ フォーム送信エラー:", err);
      const errorMessage =
        err.message || (isEditing ? "タスクの更新に失敗しました" : "タスクの作成に失敗しました");
      setError(`${errorMessage} (詳細: ${err.code || "不明"})`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {isEditing ? "タスク編集" : isSubTask ? "サブタスク作成" : "新規タスク作成"}
              </h3>
              {isSubTask && (
                <p className="text-sm text-gray-900 mt-1">親タスク: {parentTask!.title}</p>
              )}
            </div>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-900 mb-1">
                タスク名 *
              </label>
              <input
                type="text"
                id="title"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="タスク名を入力してください"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-1">
                説明
              </label>
              <textarea
                id="description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="タスクの詳細説明を入力してください"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-900 mb-1">
                  優先度
                </label>
                <select
                  id="priority"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: e.target.value as typeof formData.priority,
                    })
                  }
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                  <option value="urgent">緊急</option>
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-900 mb-1">
                  ステータス
                </label>
                <select
                  id="status"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as typeof formData.status })
                  }
                >
                  <option value="todo">未着手</option>
                  <option value="in_progress">進行中</option>
                  <option value="review">レビュー</option>
                  <option value="blocked">ブロック</option>
                  <option value="done">完了</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="due_date" className="block text-sm font-medium text-gray-900 mb-1">
                  期限
                </label>
                <input
                  type="date"
                  id="due_date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>

              <div>
                <label
                  htmlFor="estimated_hours"
                  className="block text-sm font-medium text-gray-900 mb-1"
                >
                  予定時間（時間）
                </label>
                <input
                  type="number"
                  id="estimated_hours"
                  min="0"
                  step="0.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  value={formData.estimated_hours}
                  onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                  placeholder="例: 2.5"
                />
              </div>
            </div>

            <div>
              <label htmlFor="progress" className="block text-sm font-medium text-gray-900 mb-1">
                進捗率: {formData.progress_percentage}%
              </label>
              <input
                type="range"
                id="progress"
                min="0"
                max="100"
                step="5"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                value={formData.progress_percentage}
                onChange={(e) =>
                  setFormData({ ...formData, progress_percentage: Number(e.target.value) })
                }
              />
              <div className="flex justify-between text-xs text-gray-900 mt-1">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-900 mb-1">
                タグ
              </label>
              <input
                type="text"
                id="tags"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="タグをカンマ区切りで入力 (例: デザイン, 重要, バグ修正)"
              />
              <p className="text-xs text-gray-900 mt-1">複数のタグはカンマで区切ってください</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? isEditing
                    ? "更新中..."
                    : "作成中..."
                  : isEditing
                  ? "更新"
                  : "作成"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
