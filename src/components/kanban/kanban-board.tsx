"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useAuth } from "@/lib/auth-context";
import { getProjects, getProjectStatuses, moveProject } from "@/lib/api/projects";
import { ProjectWithStatus, ProjectStatus } from "@/lib/database.types";
import { KanbanColumn } from "./kanban-column";
import { ProjectCard } from "./project-card";
import { ProjectForm } from "./project-form";
import { TaskManager } from "../tasks/task-manager";
import { StatusManager } from "./status-manager";

export function KanbanBoard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectWithStatus[]>([]);
  const [statuses, setStatuses] = useState<ProjectStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectWithStatus | null>(null);
  const [activeProject, setActiveProject] = useState<ProjectWithStatus | null>(null);
  const [managingTasksProject, setManagingTasksProject] = useState<ProjectWithStatus | null>(null);
  const [showStatusManager, setShowStatusManager] = useState(false);

  // タブの表示状態を追跡
  const [isPageVisible, setIsPageVisible] = useState(true);
  const loadingRef = useRef(false);
  const userIdRef = useRef<string | null>(null);
  const loadDataRef = useRef<(() => Promise<void>) | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const loadData = useCallback(async () => {
    if (!user?.id || loadingRef.current) return;

    try {
      loadingRef.current = true;
      setLoading(true);
      console.log("📊 データ読み込み開始 - ユーザーID:", user.id);

      const [projectsData, statusesData] = await Promise.all([
        getProjects(user.id),
        getProjectStatuses(user.id),
      ]);

      console.log("📈 取得した案件数:", projectsData.length);
      console.log("🎯 取得した制作状況数:", statusesData.length);
      console.log("📋 制作状況リスト:", statusesData);

      setProjects(projectsData);
      setStatuses(statusesData);
    } catch (error) {
      console.error("❌ データ読み込みエラー:", error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [user?.id]);

  // loadDataの最新版をrefに保存
  loadDataRef.current = loadData;

  // Page Visibility APIでタブの表示状態を監視
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      console.log("📱 タブ表示状態変更:", visible ? "アクティブ" : "非アクティブ");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // ユーザー変更時のみデータを読み込み
  useEffect(() => {
    if (user?.id && user.id !== userIdRef.current) {
      console.log("👤 ユーザー変更検出:", user.id);
      userIdRef.current = user.id;
      loadDataRef.current?.();
    } else if (!user?.id) {
      userIdRef.current = null;
      setProjects([]);
      setStatuses([]);
      setLoading(false);
    }
  }, [user?.id]);

  const handleDragStart = (event: DragStartEvent) => {
    const project = projects.find((p) => p.id === event.active.id);
    setActiveProject(project || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveProject(null);
      return;
    }

    const projectId = active.id as string;
    const overId = over.id as string;

    // 元のプロジェクトを取得
    const project = projects.find((p) => p.id === projectId);
    if (!project) {
      setActiveProject(null);
      return;
    }

    // 同じ場所にドロップした場合は何もしない
    if (project.status_id === overId) {
      setActiveProject(null);
      return;
    }

    // カラム間での移動
    if (statuses.some((status) => status.id === overId)) {
      try {
        console.log(
          `📦 プロジェクト移動: ${project.name} → ${statuses.find((s) => s.id === overId)?.name}`
        );

        // 新しいステータスの既存プロジェクト数を取得して sort_order を決定
        const projectsInNewStatus = projects.filter((p) => p.status_id === overId);
        const newSortOrder = projectsInNewStatus.length;

        // 移動実行
        await moveProject(projectId, overId, newSortOrder);

        // UIの即座更新（オプティミスティック更新）
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId ? { ...p, status_id: overId, sort_order: newSortOrder } : p
          )
        );

        // データを再読み込み（整合性確保）
        setTimeout(() => {
          loadData();
        }, 100);
      } catch (error) {
        console.error("❌ プロジェクト移動エラー:", error);
        // エラー時はデータを再読み込みして元に戻す
        loadData();
      }
    }

    setActiveProject(null);
  };

  const handleProjectCreated = () => {
    setShowCreateForm(false);
    setEditingProject(null);
    loadData();
  };

  const handleStatusManagerSuccess = () => {
    setShowStatusManager(false);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">案件一覧</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowStatusManager(true)}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium flex items-center hover:bg-gray-50 transition-colors"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            制作状況管理
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            新規案件
          </button>
        </div>
      </div>

      {statuses.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-md mx-auto">
            <div className="flex flex-col items-center">
              <svg
                className="w-12 h-12 text-yellow-600 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <h3 className="text-lg font-medium text-yellow-800 mb-2">制作状況が見つかりません</h3>
              <p className="text-yellow-700 mb-4 text-center">
                右上の「初期設定」ボタンから初期データを作成してください。
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                ページを再読み込み
              </button>
            </div>
          </div>
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-6 overflow-x-auto pb-6">
            {statuses.map((status) => {
              const statusProjects = projects.filter((project) => project.status_id === status.id);

              return (
                <KanbanColumn
                  key={status.id}
                  status={status}
                  projects={statusProjects}
                  onRefresh={loadData}
                  onEdit={setEditingProject}
                  onManageTasks={setManagingTasksProject}
                />
              );
            })}
          </div>

          <DragOverlay>
            {activeProject && (
              <div className="bg-white rounded-lg p-4 shadow-lg border border-gray-200 opacity-90 rotate-3 scale-105">
                <h4 className="font-medium text-gray-900">{activeProject.name}</h4>
                {activeProject.delivery_date && (
                  <p className="text-sm text-gray-600 mt-1">
                    納期: {new Date(activeProject.delivery_date).toLocaleDateString("ja-JP")}
                  </p>
                )}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {(showCreateForm || editingProject) && (
        <ProjectForm
          statuses={statuses}
          project={editingProject}
          onClose={() => {
            setShowCreateForm(false);
            setEditingProject(null);
          }}
          onSuccess={handleProjectCreated}
        />
      )}

      {managingTasksProject && (
        <TaskManager project={managingTasksProject} onClose={() => setManagingTasksProject(null)} />
      )}

      {showStatusManager && (
        <StatusManager
          onClose={() => setShowStatusManager(false)}
          onSuccess={handleStatusManagerSuccess}
        />
      )}
    </div>
  );
}
