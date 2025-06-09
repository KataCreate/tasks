"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ProjectWithStatus, ProjectStatus } from "@/lib/database.types";
import { ProjectCard } from "./project-card";

interface KanbanColumnProps {
  status: ProjectStatus;
  projects: ProjectWithStatus[];
  onRefresh: () => void;
  onEdit: (project: ProjectWithStatus) => void;
  onManageTasks?: (project: ProjectWithStatus) => void;
}

export function KanbanColumn({
  status,
  projects,
  onRefresh,
  onEdit,
  onManageTasks,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status.id,
    data: {
      type: "column",
      status,
    },
  });

  return (
    <div className="flex-shrink-0 w-80">
      <div className="bg-gray-50 rounded-lg p-4 h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center">
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: status.color }}
            ></div>
            {status.name}
          </h3>
          <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
            {projects.length}
          </span>
        </div>

        <div
          ref={setNodeRef}
          className={`min-h-[200px] space-y-3 transition-colors ${
            isOver ? "bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-2" : ""
          }`}
        >
          <SortableContext items={projects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onRefresh={onRefresh}
                onEdit={onEdit}
                onManageTasks={onManageTasks}
              />
            ))}
          </SortableContext>

          {projects.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <svg
                className="w-8 h-8 mx-auto mb-2 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <p className="text-sm">プロジェクトをここにドロップ</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
