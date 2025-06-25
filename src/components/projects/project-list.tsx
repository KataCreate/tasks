"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getProjects,
  getProjectStatuses,
  deleteProject,
  moveProject,
  updateProject,
} from "@/lib/api/projects";
import { ProjectWithStatus, ProjectStatus } from "@/lib/database.types";
import { ProjectForm } from "./project-form";
import { TaskManager } from "../tasks/task-manager";
import { StatusManager } from "./status-manager";
import { KanbanBoard } from "../kanban/kanban-board";

export function ProjectList() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectWithStatus[]>([]);
  const [statuses, setStatuses] = useState<ProjectStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectWithStatus | null>(null);
  const [managingTasksProject, setManagingTasksProject] = useState<ProjectWithStatus | null>(null);
  const [showStatusManager, setShowStatusManager] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  const loadingRef = useRef(false);
  const userIdRef = useRef<string | null>(null);
  const lastLoadTimeRef = useRef<number>(0);

  // データ読み込み関数
  const loadData = useCallback(
    async (forceReload = false) => {
      if (!user?.id) return;

      // 強制リロードでない場合、前回の読み込みから10秒以内ならスキップ
      const now = Date.now();
      if (!forceReload && now - lastLoadTimeRef.current < 10000) {
        console.log("⏭️ データ読み込みをスキップ（前回から10秒以内）");
        return;
      }

      if (loadingRef.current) {
        console.log("⏭️ 既に読み込み中のためスキップ");
        return;
      }

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

        setProjects(projectsData);
        setStatuses(statusesData);
        lastLoadTimeRef.current = now;
      } catch (error) {
        console.error("❌ データ読み込みエラー:", error);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [user?.id]
  );

  // ユーザー変更時のデータ読み込み
  useEffect(() => {
    if (user?.id && user.id !== userIdRef.current) {
      console.log("👤 ユーザー変更検出:", user.id);
      userIdRef.current = user.id;
      loadData(true);
    } else if (!user?.id) {
      userIdRef.current = null;
      setProjects([]);
      setStatuses([]);
      setLoading(false);
    }
  }, [user?.id, loadData]);

  // 初回マウント時のデータ読み込み
  useEffect(() => {
    if (user?.id && projects.length === 0 && statuses.length === 0) {
      console.log("🚀 初回マウント - データ読み込み");
      loadData(true);
    }
  }, [user?.id, projects.length, statuses.length, loadData]);

  const handleProjectEdit = (project: ProjectWithStatus) => {
    setEditingProject(project);
    setShowCreateForm(true);
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

  const handleDeleteProject = async (projectId: string) => {
    if (confirm("この案件を削除しますか？関連するタスクも削除されます。")) {
      try {
        await deleteProject(projectId);
        loadData();
      } catch (error) {
        console.error("案件削除エラー:", error);
        alert("案件の削除に失敗しました。");
      }
    }
  };

  const handleProjectReorder = async (projectId: string, newSortOrder: number) => {
    try {
      console.log(`🔄 プロジェクト順番変更: ${projectId} → ${newSortOrder}`);
      await updateProject(projectId, { sort_order: newSortOrder });

      // ローカル状態を更新
      setProjects((prev) =>
        prev
          .map((project) =>
            project.id === projectId ? { ...project, sort_order: newSortOrder } : project
          )
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      );

      console.log(`✅ 順番変更完了: ${projectId}`);
    } catch (error) {
      console.error("プロジェクト順番変更エラー:", error);
      // エラーが発生した場合はデータを再読み込み
      loadData(true);
    }
  };

  const handleProjectUpdate = async (projectId: string, statusId: string) => {
    try {
      // 新しいステータスでの最大sort_orderを取得
      const projectsInNewStatus = projects.filter((p) => p.project_statuses?.id === statusId);
      const maxSortOrder = Math.max(...projectsInNewStatus.map((p) => p.sort_order || 0), -1);

      await moveProject(projectId, statusId, maxSortOrder + 1);

      // ローカル状態を更新
      setProjects((prev) =>
        prev.map((project) =>
          project.id === projectId
            ? {
                ...project,
                status_id: statusId,
                project_statuses: statuses.find((s) => s.id === statusId) || null,
                sort_order: maxSortOrder + 1,
              }
            : project
        )
      );
    } catch (error) {
      console.error("プロジェクトステータス更新エラー:", error);
      // エラーが発生した場合はデータを再読み込み
      loadData(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-900">データを読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">案件一覧</h2>
          <p className="text-gray-900">{projects.length}件の案件</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {/* ビューモード切り替え */}
          <div className="flex bg-gray-100 rounded-md p-1">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === "kanban"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              カンバン
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              リスト
            </button>
          </div>
          <button
            onClick={() => setShowStatusManager(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            制作状況管理
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            新規案件作成
          </button>
        </div>
      </div>

      {/* カンバンボードビュー */}
      {viewMode === "kanban" ? (
        <div className="h-[calc(100vh-200px)]">
          <KanbanBoard
            projects={projects}
            statuses={statuses}
            onProjectUpdate={handleProjectUpdate}
            onProjectReorder={handleProjectReorder}
            onProjectEdit={handleProjectEdit}
            onProjectDelete={handleDeleteProject}
            onProjectTasks={setManagingTasksProject}
          />
        </div>
      ) : (
        /* リストビュー（既存の実装） */
        <div className="space-y-4">
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-900 text-lg font-medium mb-2">案件がありません</div>
              <p className="text-gray-900 mb-4">最初の案件を作成して始めましょう</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md font-medium"
              >
                最初の案件を作成
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">
                        {project.name}
                      </h3>
                      <div className="flex space-x-2 ml-2">
                        <button
                          onClick={() => handleProjectEdit(project)}
                          className="text-gray-400 hover:text-gray-600"
                          title="編集"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="text-gray-400 hover:text-red-600"
                          title="削除"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
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

                    {project.description && (
                      <p className="text-gray-900 text-sm mb-4 line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        {project.project_statuses ? (
                          <span
                            className="px-2 py-1 text-xs font-medium rounded-full"
                            style={{
                              backgroundColor: `${project.project_statuses.color}20`,
                              color: project.project_statuses.color,
                            }}
                          >
                            {project.project_statuses.name}
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                            状況未設定
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-900">
                        {new Date(project.created_at).toLocaleDateString("ja-JP")}
                      </span>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => setManagingTasksProject(project)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                      >
                        タスク管理
                      </button>
                      <button
                        onClick={() => handleProjectEdit(project)}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                      >
                        編集
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* モーダル */}
      {showCreateForm && (
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
