"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ProjectCard } from "./project-card";
import { ProjectWithStatus } from "@/lib/database.types";

interface KanbanColumnProps {
  id: string;
  title: string;
  projects: ProjectWithStatus[];
  color: string;
  onProjectEdit: (project: ProjectWithStatus) => void;
  onProjectDelete: (projectId: string) => void;
  onProjectTasks: (project: ProjectWithStatus) => void;
}

export function KanbanColumn({
  id,
  title,
  projects,
  color,
  onProjectEdit,
  onProjectDelete,
  onProjectTasks,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div className="flex-shrink-0 w-80">
      <div
        className={`bg-gray-50 rounded-lg p-4 h-full transition-colors ${
          isOver ? "bg-blue-50 border-2 border-blue-200" : ""
        }`}
      >
        {/* カラムヘッダー */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <h3 className="font-semibold text-gray-900">{title}</h3>
          </div>
          <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded-full">
            {projects.length}
          </span>
        </div>

        {/* ドロップエリア */}
        <div
          ref={setNodeRef}
          className={`min-h-[calc(100vh-200px)] transition-colors relative ${
            isOver ? "bg-blue-100 rounded-lg" : ""
          }`}
        >
          <SortableContext
            items={projects.map((project) => project.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={() => onProjectEdit(project)}
                  onDelete={() => onProjectDelete(project.id)}
                  onTasks={() => onProjectTasks(project)}
                />
              ))}
            </div>
          </SortableContext>

          {/* 空の状態またはドロップインジケーター */}
          {projects.length === 0 && (
            <div
              className={`flex items-center justify-center h-32 border-2 border-dashed rounded-lg transition-colors ${
                isOver ? "border-blue-400 bg-blue-50" : "border-gray-300"
              }`}
            >
              <p
                className={`text-sm transition-colors ${
                  isOver ? "text-blue-600" : "text-gray-500"
                }`}
              >
                {isOver ? "ここにドロップ" : "プロジェクトをドラッグしてください"}
              </p>
            </div>
          )}

          {/* プロジェクトがある場合のドロップインジケーター */}
          {projects.length > 0 && isOver && (
            <div className="mt-3 p-2 border-2 border-dashed border-blue-400 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 text-center">
                {projects.length === 1
                  ? "ここにドロップ"
                  : `${projects.length}件のプロジェクトがあります`}
              </p>
            </div>
          )}

          {/* 常に表示されるドロップエリア（透明） */}
          <div className="h-4 w-full"></div>

          {/* ドロップ可能エリアのオーバーレイ（デバッグ用） */}
          {isOver && (
            <div className="absolute inset-0 border-2 border-blue-400 border-dashed rounded-lg pointer-events-none"></div>
          )}
        </div>
      </div>
    </div>
  );
}
