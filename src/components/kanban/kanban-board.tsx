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
      console.log("❌ ドロップ先が見つかりません");
      setActiveProject(null);
      return;
    }

    const activeProject = projects.find((p) => p.id === active.id);
    if (!activeProject) {
      console.log("❌ アクティブプロジェクトが見つかりません");
      setActiveProject(null);
      return;
    }

    const overId = over.id as string;
    console.log(`🎯 ドラッグ終了: active=${active.id} (${activeProject.name}), over=${overId}`);

    // プロジェクト間のドラッグ&ドロップ（同じステータス内での順番変更）
    const overProject = projects.find((p) => p.id === overId);
    if (overProject) {
      console.log(`📋 プロジェクト間ドラッグ: ${activeProject.name} → ${overProject.name}`);

      if (activeProject.project_statuses?.id === overProject.project_statuses?.id) {
        try {
          console.log(
            `🔄 同じステータス内での順番変更: ${activeProject.name} → ${overProject.name}`
          );

          // 同じステータス内のプロジェクトを取得
          const sameStatusProjects = projects.filter(
            (p) => p.project_statuses?.id === activeProject.project_statuses?.id
          );

          // ドロップ位置を計算
          const activeIndex = sameStatusProjects.findIndex((p) => p.id === activeProject.id);
          const overIndex = sameStatusProjects.findIndex((p) => p.id === overProject.id);

          console.log(`📊 インデックス: activeIndex=${activeIndex}, overIndex=${overIndex}`);

          if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
            // 新しい順番を計算（10刻みで設定）
            const newSortOrder = overIndex * 10;
            console.log(`📊 順番変更: ${activeIndex} → ${overIndex} (sort_order: ${newSortOrder})`);

            if (onProjectReorder) {
              await onProjectReorder(activeProject.id, newSortOrder);
            }
          } else {
            console.log(`⚠️ 順番変更不要: activeIndex=${activeIndex}, overIndex=${overIndex}`);
          }
        } catch (error) {
          console.error("プロジェクト順番変更エラー:", error);
        }
      } else {
        console.log(
          `⚠️ 異なるステータス間のドラッグ: ${activeProject.project_statuses?.name} → ${overProject.project_statuses?.name}`
        );
      }
    }
    // ステータス間のドラッグ&ドロップ
    else if (statuses.some((s) => s.id === overId)) {
      const overStatusId = overId;
      const overStatus = statuses.find((s) => s.id === overStatusId);
      console.log(
        `📋 ステータス間ドラッグ: ${activeProject.project_statuses?.name} → ${overStatus?.name}`
      );

      if (activeProject.project_statuses?.id !== overStatusId) {
        try {
          console.log(`✅ プロジェクト移動: ${activeProject.name} → ${overStatus?.name}`);

          // 新しいステータス内のプロジェクト数を取得して最後尾に配置
          const targetStatusProjects = projects.filter(
            (p) => p.project_statuses?.id === overStatusId
          );
          const newSortOrder = targetStatusProjects.length * 10;
          console.log(`📊 新しいステータス内で最後尾に配置: sort_order=${newSortOrder}`);
          console.log(
            `📋 ターゲットステータス内のプロジェクト:`,
            targetStatusProjects.map((p) => p.name)
          );

          await onProjectUpdate(activeProject.id, overStatusId);

          // 順番も更新
          if (onProjectReorder) {
            await onProjectReorder(activeProject.id, newSortOrder);
          }
        } catch (error) {
          console.error("プロジェクトステータス更新エラー:", error);
        }
      } else {
        console.log(`⚠️ 同じステータスへのドラッグ: ${activeProject.project_statuses?.name}`);
        // 同じステータスへのドロップの場合、最後尾に追加
        try {
          const sameStatusProjects = projects.filter(
            (p) => p.project_statuses?.id === overStatusId
          );
          const newSortOrder = sameStatusProjects.length * 10;
          console.log(`📊 同じステータス内で最後尾に追加: sort_order=${newSortOrder}`);
          console.log(
            `📋 同じステータス内のプロジェクト:`,
            sameStatusProjects.map((p) => p.name)
          );

          if (onProjectReorder) {
            await onProjectReorder(activeProject.id, newSortOrder);
          }
        } catch (error) {
          console.error("プロジェクト順番変更エラー:", error);
        }
      }
    } else {
      console.log(`❓ 不明なドロップ先: ${overId}`);
      console.log(
        `🔍 利用可能なステータス:`,
        statuses.map((s) => ({ id: s.id, name: s.name }))
      );
      console.log(
        `🔍 利用可能なプロジェクト:`,
        projects.map((p) => ({ id: p.id, name: p.name, status: p.project_statuses?.name }))
      );
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
