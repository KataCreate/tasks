"use client";

import { useState } from "react";
import { TaskWithChildren } from "@/lib/database.types";
import { toggleTaskCompletion, deleteTask } from "@/lib/api/tasks";

interface TaskItemProps {
  task: TaskWithChildren;
  onToggleComplete: () => void;
  onAddSubTask: (task: TaskWithChildren) => void;
  onEdit: (task: TaskWithChildren) => void;
  onDelete: () => void;
  level: number;
}

export function TaskItem({
  task,
  onToggleComplete,
  onAddSubTask,
  onEdit,
  onDelete,
  level,
}: TaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggleComplete = async () => {
    try {
      const newCompletedState = !task.is_completed;
      await toggleTaskCompletion(task.id, newCompletedState);
      onToggleComplete();
    } catch (error: any) {
      console.error("❌ タスク完了状態の変更エラー:", error);
      alert(`タスクの完了状態を変更できませんでした: ${error.message || "不明なエラー"}`);
    }
  };

  const handleDelete = async () => {
    if (!confirm("このタスクを削除しますか？サブタスクも全て削除されます。")) return;

    try {
      setIsDeleting(true);
      await deleteTask(task.id);
      onDelete();
    } catch (error) {
      console.error("タスク削除エラー:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const hasChildren = task.children.length > 0;
  const indentLevel = level * 24;

  return (
    <div style={{ marginLeft: `${indentLevel}px` }}>
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
        <div className="flex items-center gap-3">
          {/* 展開/折りたたみボタン */}
          {hasChildren && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}

          {/* チェックボックス */}
          <button
            onClick={handleToggleComplete}
            className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              task.is_completed || task.status === "done"
                ? "bg-green-500 border-green-500 text-white"
                : "border-gray-300 hover:border-green-400"
            }`}
          >
            {(task.is_completed || task.status === "done") && (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>

          {/* タスクタイトルと詳細情報 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4
                className={`text-sm font-medium text-gray-900 ${
                  task.is_completed || task.status === "done" ? "line-through text-gray-500" : ""
                }`}
              >
                {task.title}
              </h4>

              {/* 優先度バッジ */}
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  task.priority === "urgent"
                    ? "bg-red-100 text-red-800"
                    : task.priority === "high"
                    ? "bg-orange-100 text-orange-800"
                    : task.priority === "medium"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {task.priority === "urgent"
                  ? "緊急"
                  : task.priority === "high"
                  ? "高"
                  : task.priority === "medium"
                  ? "中"
                  : "低"}
              </span>

              {/* ステータスバッジ */}
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  task.status === "done"
                    ? "bg-green-100 text-green-800"
                    : task.status === "in_progress"
                    ? "bg-blue-100 text-blue-800"
                    : task.status === "review"
                    ? "bg-purple-100 text-purple-800"
                    : task.status === "blocked"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {task.status === "todo"
                  ? "未着手"
                  : task.status === "in_progress"
                  ? "進行中"
                  : task.status === "review"
                  ? "レビュー"
                  : task.status === "blocked"
                  ? "ブロック"
                  : "完了"}
              </span>
            </div>

            {task.description && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{task.description}</p>
            )}

            {/* 詳細情報 */}
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              {task.due_date && (
                <div
                  className={`flex items-center gap-1 ${
                    new Date(task.due_date) < new Date() && task.status !== "done"
                      ? "text-red-600"
                      : ""
                  }`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {new Date(task.due_date).toLocaleDateString("ja-JP")}
                </div>
              )}

              {task.estimated_hours && (
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {task.estimated_hours}h
                </div>
              )}

              {task.actual_hours && (
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  実績: {task.actual_hours}h
                </div>
              )}
            </div>
          </div>

          {/* アクションメニュー */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="py-1">
                  <button
                    onClick={() => {
                      onAddSubTask(task);
                      setShowMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    サブタスクを追加
                  </button>
                  <button
                    onClick={() => {
                      onEdit(task);
                      setShowMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => {
                      handleDelete();
                      setShowMenu(false);
                    }}
                    disabled={isDeleting}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 disabled:opacity-50"
                  >
                    {isDeleting ? "削除中..." : "削除"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* サブタスク */}
      {hasChildren && isExpanded && (
        <div className="mt-2 space-y-2">
          {task.children.map((child) => (
            <TaskItem
              key={child.id}
              task={child}
              onToggleComplete={onToggleComplete}
              onAddSubTask={onAddSubTask}
              onEdit={onEdit}
              onDelete={onDelete}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
