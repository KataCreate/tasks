"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getDashboardStats, DashboardStats } from "@/lib/api/dashboard";
import { StatsCard } from "@/components/dashboard/stats-card";

export default function DashboardPage() {
  const { user, loading: authLoading, signOut, profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error("ダッシュボードデータ取得エラー:", err);
      setError(err instanceof Error ? err.message : "データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // 認証チェック
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">認証が必要です</h1>
          <a href="/" className="text-indigo-600 hover:text-indigo-500">
            ログインページに戻る
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-gray-200 rounded-lg"></div>
            <div className="h-80 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">エラーが発生しました</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 flex items-center justify-center rounded bg-indigo-600">
                  <svg
                    className="h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">案件管理システム</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">こんにちは、{profile?.name || user.email}さん</span>
              <nav className="flex space-x-2">
                <Link
                  href="/dashboard"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  ダッシュボード
                </Link>
                <Link
                  href="/"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  カンバン
                </Link>
              </nav>
              <button
                onClick={signOut}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {/* ページヘッダー */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
              <p className="text-gray-900 mt-1">案件とタスクの進捗状況を確認できます</p>
            </div>
            <button
              onClick={loadDashboardData}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              更新
            </button>
          </div>

          {/* 統計カード */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="総案件数"
              value={stats.totalProjects}
              subtitle={`アクティブ: ${stats.activeProjects}件`}
              icon="📊"
              color="blue"
            />
            <StatsCard
              title="総タスク数"
              value={stats.totalTasks}
              subtitle={`完了: ${stats.completedTasks}件 (${
                stats.totalTasks > 0
                  ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
                  : 0
              }%)`}
              icon="✅"
              color="green"
            />
            <StatsCard
              title="今日期限"
              value={stats.todayTasks}
              subtitle="今日が期限のタスク"
              icon="🎯"
              color="orange"
            />
            <StatsCard
              title="期限切れ"
              value={stats.overdueTasks}
              subtitle="対応が必要です"
              icon="⚠️"
              color="red"
            />
          </div>

          {/* 詳細情報 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 優先度分布 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">優先度分布</h3>
              <div className="space-y-2">
                {stats.priorityDistribution.map((item) => (
                  <div key={item.priority} className="flex items-center justify-between">
                    <span className="text-sm text-gray-900">
                      {item.priority === "urgent"
                        ? "緊急"
                        : item.priority === "high"
                        ? "高"
                        : item.priority === "medium"
                        ? "中"
                        : "低"}
                    </span>
                    <span className="text-sm font-medium">
                      {item.count}件 ({item.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ステータス分布 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ステータス分布</h3>
              <div className="space-y-2">
                {stats.statusDistribution.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <span className="text-sm text-gray-900">
                      {item.status === "todo"
                        ? "未着手"
                        : item.status === "in_progress"
                        ? "進行中"
                        : item.status === "review"
                        ? "レビュー"
                        : item.status === "blocked"
                        ? "ブロック"
                        : "完了"}
                    </span>
                    <span className="text-sm font-medium">
                      {item.count}件 ({item.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 期限が近いタスクと最近のアクティビティ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 期限が近いタスク */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">期限が近いタスク</h3>
              {stats.upcomingDeadlines.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {stats.upcomingDeadlines.map((task) => (
                    <div key={task.id} className="p-3 border border-gray-200 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                      <p className="text-xs text-gray-900 mt-1">{task.project_name}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-900">
                          期限: {new Date(task.due_date).toLocaleDateString("ja-JP")}
                        </span>
                        <span className="text-xs text-gray-900">
                          {task.days_until_due === 0 ? "今日" : `${task.days_until_due}日後`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-900 py-8">期限が近いタスクはありません</p>
              )}
            </div>

            {/* 最近のアクティビティ */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">最近のアクティビティ</h3>
              {stats.recentActivity.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {stats.recentActivity.map((activity) => (
                    <div key={activity.id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {activity.type === "task_created"
                            ? "タスク作成"
                            : activity.type === "task_completed"
                            ? "タスク完了"
                            : "案件作成"}
                        </span>
                        <span className="text-xs text-gray-900">
                          {new Date(activity.created_at).toLocaleDateString("ja-JP")}
                        </span>
                      </div>
                      <h4 className="text-sm text-gray-900">{activity.title}</h4>
                      {activity.project_name && (
                        <p className="text-xs text-gray-900 mt-1">{activity.project_name}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-900 py-8">最近のアクティビティはありません</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
