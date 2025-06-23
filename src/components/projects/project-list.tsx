"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { getProjects, getProjectStatuses, deleteProject } from "@/lib/api/projects";
import { ProjectWithStatus, ProjectStatus } from "@/lib/database.types";
import { ProjectForm } from "./project-form";
import { TaskManager } from "../tasks/task-manager";
import { StatusManager } from "./status-manager";

export function ProjectList() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectWithStatus[]>([]);
  const [statuses, setStatuses] = useState<ProjectStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectWithStatus | null>(null);
  const [managingTasksProject, setManagingTasksProject] = useState<ProjectWithStatus | null>(null);
  const [showStatusManager, setShowStatusManager] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const loadingRef = useRef(false);
  const userIdRef = useRef<string | null>(null);

  // ユーザー変更時のみデータを読み込み
  useEffect(() => {
    if (user?.id && user.id !== userIdRef.current) {
      console.log("👤 ユーザー変更検出:", user.id);
      userIdRef.current = user.id;
      loadData();
    } else if (!user?.id) {
      userIdRef.current = null;
      setProjects([]);
      setStatuses([]);
      setLoading(false);
    }
  }, [user?.id]);

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

      setProjects(projectsData);
      setStatuses(statusesData);
    } catch (error) {
      console.error("❌ データ読み込みエラー:", error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [user?.id]);

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

  const filteredProjects = projects.filter((project) => {
    const matchesStatus = filterStatus === "all" || project.status_id === filterStatus;
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (statusId: string | null) => {
    if (!statusId) return "#6B7280";
    const status = statuses.find((s) => s.id === statusId);
    return status?.color || "#6B7280";
  };

  const getStatusName = (statusId: string | null) => {
    if (!statusId) return "不明";
    const status = statuses.find((s) => s.id === statusId);
    return status?.name || "不明";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("ja-JP");
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
        <>
          {/* フィルターと検索 */}
          <div className="mb-6 flex gap-4 items-center">
            <div className="flex-1">
              <input
                type="text"
                placeholder="案件名または説明で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">すべての制作状況</option>
              {statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </div>

          {/* 案件一覧テーブル */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      案件名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      制作状況
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      納期
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      タスク進捗
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        案件が見つかりません
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((project) => {
                      const completedTasksCount = project.tasks.filter(
                        (task) => task.is_completed
                      ).length;
                      const totalTasksCount = project.tasks.length;
                      const progressPercentage =
                        totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0;

                      return (
                        <tr key={project.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {project.name}
                              </div>
                              {project.description && (
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {project.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: `${getStatusColor(project.status_id)}20`,
                                color: getStatusColor(project.status_id),
                              }}
                            >
                              <div
                                className="w-2 h-2 rounded-full mr-1"
                                style={{ backgroundColor: getStatusColor(project.status_id) }}
                              ></div>
                              {getStatusName(project.status_id)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(project.delivery_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-1 mr-2">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progressPercentage}%` }}
                                  ></div>
                                </div>
                              </div>
                              <span className="text-sm text-gray-500">
                                {completedTasksCount}/{totalTasksCount}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setManagingTasksProject(project)}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="タスク管理"
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
                                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() => setEditingProject(project)}
                                className="text-blue-600 hover:text-blue-900"
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
                                className="text-red-600 hover:text-red-900"
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
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 統計情報 */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">総案件数</div>
              <div className="text-2xl font-bold text-gray-900">{projects.length}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">制作状況数</div>
              <div className="text-2xl font-bold text-gray-900">{statuses.length}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">総タスク数</div>
              <div className="text-2xl font-bold text-gray-900">
                {projects.reduce((total, project) => total + project.tasks.length, 0)}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">完了タスク数</div>
              <div className="text-2xl font-bold text-gray-900">
                {projects.reduce(
                  (total, project) =>
                    total + project.tasks.filter((task) => task.is_completed).length,
                  0
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* モーダル */}
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
