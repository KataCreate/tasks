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
  const { setNodeRef } = useDroppable({
    id,
  });

  return (
    <div className="flex-shrink-0 w-80">
      <div className="bg-gray-50 rounded-lg p-4 h-full">
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
        <div ref={setNodeRef} className="min-h-[calc(100vh-200px)]">
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

          {/* 空の状態 */}
          {projects.length === 0 && (
            <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-500 text-sm">プロジェクトをドラッグしてください</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
