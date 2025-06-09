"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ProjectWithStatus } from "@/lib/database.types";
import { deleteProject } from "@/lib/api/projects";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";

interface ProjectCardProps {
  project: ProjectWithStatus;
  onRefresh: () => void;
  onManageTasks?: (project: ProjectWithStatus) => void;
  onEdit: (project: ProjectWithStatus) => void;
}

export function ProjectCard({ project, onRefresh, onManageTasks, onEdit }: ProjectCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
    data: {
      type: "project",
      project,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleDeleteConfirm = async () => {
    await deleteProject(project.id);
    onRefresh();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("ja-JP");
  };

  const completedTasksCount = project.tasks.filter((task) => task.is_completed).length;
  const totalTasksCount = project.tasks.length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all group cursor-grab active:cursor-grabbing ${
        isDragging ? "shadow-lg scale-105 rotate-3" : ""
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-900 flex-1 pr-2">{project.name}</h4>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
          {onManageTasks && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onManageTasks(project);
              }}
              className="text-gray-400 hover:text-green-600 p-1"
              title="タスク管理"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(project);
            }}
            className="text-gray-400 hover:text-blue-600 p-1"
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
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteDialog(true);
            }}
            className="text-gray-400 hover:text-red-600 p-1"
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

      {project.delivery_date && (
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <svg
            className="w-4 h-4 mr-1 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          納期: {formatDate(project.delivery_date)}
        </div>
      )}

      {project.description && (
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{project.description}</p>
      )}

      {project.memo && (
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded mb-2">
          <span className="font-medium">メモ: </span>
          <span className="line-clamp-2">{project.memo}</span>
        </div>
      )}

      {project.tasks && project.tasks.length > 0 && (
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center text-xs text-gray-500">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            タスク {completedTasksCount}/{totalTasksCount}
          </div>

          {/* 進捗バー */}
          <div className="flex-1 mx-2">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>

          <span className="text-xs text-gray-500">
            {totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0}%
          </span>
        </div>
      )}

      <DeleteConfirmationDialog
        project={project}
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
