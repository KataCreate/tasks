"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ProjectWithStatus } from "@/lib/database.types";

interface ProjectCardProps {
  project: ProjectWithStatus;
  isDragging?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onTasks: () => void;
}

export function ProjectCard({
  project,
  isDragging = false,
  onEdit,
  onDelete,
  onTasks,
}: ProjectCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
    setActivatorNodeRef,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragging = isDragging || isSortableDragging;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-50 rotate-2 scale-105 shadow-lg" : ""
      }`}
    >
      {/* ドラッグハンドル */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
        </div>
        <div className="flex items-center space-x-1 ml-2">
          <button
            ref={setActivatorNodeRef}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="ドラッグして移動"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 2zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 14zm6-8a2 2 0 1 1-.001-4.001A2 2 0 0 1 13 6zm0 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 14z" />
            </svg>
          </button>
          <button
            onClick={onEdit}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="編集"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="削除"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* プロジェクト詳細 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">納期:</span>
          <span className="font-medium text-gray-900">
            {project.delivery_date
              ? new Date(project.delivery_date).toLocaleDateString("ja-JP")
              : "未設定"}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">作成日:</span>
          <span className="font-medium text-gray-900">
            {new Date(project.created_at).toLocaleDateString("ja-JP")}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">更新日:</span>
          <span className="font-medium text-gray-900">
            {new Date(project.updated_at).toLocaleDateString("ja-JP")}
          </span>
        </div>

        {project.description && (
          <div className="mt-3">
            <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
          </div>
        )}

        {/* タスク管理ボタン */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={onTasks}
            className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium py-2 px-3 rounded-md transition-colors"
          >
            タスク管理
          </button>
        </div>
      </div>
    </div>
  );
}
