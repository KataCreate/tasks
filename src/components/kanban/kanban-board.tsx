"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { KanbanColumn } from "./kanban-column";
import { ProjectCard } from "./project-card";
import { ProjectWithStatus, ProjectStatus } from "@/lib/database.types";

interface KanbanBoardProps {
  projects: ProjectWithStatus[];
  statuses: ProjectStatus[];
  onProjectUpdate: (projectId: string, statusId: string) => Promise<void>;
  onProjectReorder?: (projectId: string, newSortOrder: number) => Promise<void>;
  onProjectEdit: (project: ProjectWithStatus) => void;
  onProjectDelete: (projectId: string) => void;
  onProjectTasks: (project: ProjectWithStatus) => void;
}

export function KanbanBoard({
  projects,
  statuses,
  onProjectUpdate,
  onProjectReorder,
  onProjectEdit,
  onProjectDelete,
  onProjectTasks,
}: KanbanBoardProps) {
  const [activeProject, setActiveProject] = useState<ProjectWithStatus | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // プロジェクトをステータス別にグループ化
  const projectsByStatus = useCallback(() => {
    const grouped: { [key: string]: ProjectWithStatus[] } = {};

    // 各ステータスでグループを初期化
    statuses.forEach((status) => {
      grouped[status.id] = [];
    });

    // プロジェクトをステータス別に分類
    projects.forEach((project) => {
      if (project.project_statuses?.id && grouped[project.project_statuses.id]) {
        grouped[project.project_statuses.id].push(project);
      } else {
        // 未分類のプロジェクトは最初のステータスに配置
        if (statuses.length > 0) {
          grouped[statuses[0].id].push(project);
        }
      }
    });

    return grouped;
  }, [projects, statuses]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const project = projects.find((p) => p.id === active.id);
    if (project) {
      setActiveProject(project);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeProject = projects.find((p) => p.id === active.id);
    if (!activeProject) return;

    const overStatusId = over.id as string;

    // ステータスが変更された場合の処理
    if (statuses.some((s) => s.id === overStatusId)) {
      // ドラッグ中の視覚的フィードバックはカラムコンポーネントで処理
      console.log(
        `🔄 ドラッグ中: ${activeProject.name} → ${
          statuses.find((s) => s.id === overStatusId)?.name
        }`
      );
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveProject(null);
      return;
    }

    const activeProject = projects.find((p) => p.id === active.id);
    if (!activeProject) {
      setActiveProject(null);
      return;
    }

    const overStatusId = over.id as string;

    // ステータスが変更された場合
    if (
      statuses.some((s) => s.id === overStatusId) &&
      activeProject.project_statuses?.id !== overStatusId
    ) {
      try {
        console.log(
          `✅ プロジェクト移動: ${activeProject.name} → ${
            statuses.find((s) => s.id === overStatusId)?.name
          }`
        );
        await onProjectUpdate(activeProject.id, overStatusId);
      } catch (error) {
        console.error("プロジェクトステータス更新エラー:", error);
      }
    } else if (activeProject.project_statuses?.id === overStatusId) {
      // 同じステータス内での順番変更
      try {
        console.log(`🔄 同じステータス内での順番変更: ${activeProject.name}`);

        // 同じステータス内のプロジェクトを取得
        const sameStatusProjects = projects.filter((p) => p.project_statuses?.id === overStatusId);

        // ドロップ位置を計算
        const activeIndex = sameStatusProjects.findIndex((p) => p.id === activeProject.id);
        const overIndex = sameStatusProjects.findIndex((p) => p.id === over.id);

        if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
          // arrayMoveを使用して新しい順番を計算
          const reorderedProjects = arrayMove(sameStatusProjects, activeIndex, overIndex);

          // 新しい順番を計算（10刻みで設定）
          const newSortOrder = overIndex * 10;
          console.log(`📊 順番変更: ${activeIndex} → ${overIndex} (sort_order: ${newSortOrder})`);
          console.log(
            `📋 再ソート後のプロジェクト:`,
            reorderedProjects.map((p) => ({ id: p.id, name: p.name, sort_order: p.sort_order }))
          );

          if (onProjectReorder) {
            await onProjectReorder(activeProject.id, newSortOrder);
          }
        } else {
          console.log(`⚠️ 順番変更不要: activeIndex=${activeIndex}, overIndex=${overIndex}`);
        }
      } catch (error) {
        console.error("プロジェクト順番変更エラー:", error);
      }
    }

    setActiveProject(null);
  };

  const groupedProjects = projectsByStatus();

  return (
    <div className="h-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {/* ステータス別カラム */}
          {statuses.map((status) => (
            <KanbanColumn
              key={status.id}
              id={status.id}
              title={status.name}
              projects={groupedProjects[status.id] || []}
              color={status.color}
              onProjectEdit={onProjectEdit}
              onProjectDelete={onProjectDelete}
              onProjectTasks={onProjectTasks}
            />
          ))}
        </div>

        <DragOverlay>
          {activeProject ? (
            <ProjectCard
              project={activeProject}
              onEdit={() => {}}
              onDelete={() => {}}
              onTasks={() => {}}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
