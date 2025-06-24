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
      {...attributes}
      {...listeners}
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-grab
        hover:shadow-md transition-shadow duration-200
        ${dragging ? "opacity-50 shadow-lg" : ""}
        ${dragging ? "cursor-grabbing" : "cursor-grab"}
      `}
    >
      {/* プロジェクトヘッダー */}
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-medium text-gray-900 text-sm line-clamp-2 flex-1">{project.name}</h4>
        <div className="flex space-x-1 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="text-gray-400 hover:text-gray-600 p-1"
            title="編集"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-gray-400 hover:text-red-600 p-1"
            title="削除"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* プロジェクト説明 */}
      {project.description && (
        <p className="text-gray-600 text-xs mb-3 line-clamp-2">{project.description}</p>
      )}

      {/* プロジェクト情報 */}
      <div className="space-y-2 mb-3">
        {/* 作成日 */}
        <div className="text-xs text-gray-500">
          作成: {new Date(project.created_at).toLocaleDateString("ja-JP")}
        </div>

        {/* 更新日（作成日と異なる場合のみ表示） */}
        {project.updated_at &&
          new Date(project.updated_at).getTime() !== new Date(project.created_at).getTime() && (
            <div className="text-xs text-gray-500">
              更新: {new Date(project.updated_at).toLocaleDateString("ja-JP")}
            </div>
          )}
      </div>

      {/* アクションボタン */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onTasks();
        }}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-md font-medium transition-colors"
      >
        タスク管理
      </button>
    </div>
  );
}
