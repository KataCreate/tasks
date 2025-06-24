"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getDashboardStats, DashboardStats } from "@/lib/api/dashboard";
import { StatsCard } from "@/components/dashboard/stats-card";

export default function DashboardPage() {
  const { user, loading: authLoading, signOut, profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // マウント状態の管理
  useEffect(() => {
    setMounted(true);
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("📊 ダッシュボードデータ読み込み開始");
      const data = await getDashboardStats();
      console.log("✅ ダッシュボードデータ取得成功:", data);
      setStats(data);
    } catch (err) {
      console.error("❌ ダッシュボードデータ取得エラー:", err);
      setError(err instanceof Error ? err.message : "データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && mounted) {
      loadDashboardData();
    }
  }, [user, mounted, loadDashboardData]);

  // サーバーサイドレンダリング中は何も表示しない
  if (!mounted) {
    return null;
  }

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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">データが見つかりません</h1>
          <button
            onClick={loadDashboardData}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            データを再読み込み
          </button>
        </div>
      </div>
    );
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
              subtitle={`今週: ${stats.thisWeekTasks}件`}
              icon="🎯"
              color="orange"
            />
            <StatsCard
              title="期限切れタスク"
              value={stats.overdueTasks}
              subtitle={`緊急度: ${stats.overdueTasks > 0 ? "高" : "低"}`}
              icon="⚠️"
              color="red"
            />
          </div>

          {/* チャートセクション */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 優先度別タスク分布 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">優先度別タスク分布</h3>
              <div className="space-y-3">
                {stats.priorityDistribution.map((item) => (
                  <div key={item.priority} className="flex justify-between items-center">
                    <span className="text-sm text-gray-900">
                      {item.priority === "urgent"
                        ? "緊急"
                        : item.priority === "high"
                        ? "高"
                        : item.priority === "medium"
                        ? "中"
                        : "低"}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            item.priority === "urgent"
                              ? "bg-red-600"
                              : item.priority === "high"
                              ? "bg-orange-600"
                              : item.priority === "medium"
                              ? "bg-yellow-600"
                              : "bg-green-600"
                          }`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 週間進捗 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">週間進捗</h3>
              <div className="space-y-3">
                {stats.weeklyProgress.map((day, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-900">{day.week}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${
                              day.created > 0 ? Math.round((day.completed / day.created) * 100) : 0
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {day.created > 0 ? Math.round((day.completed / day.created) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 最近のアクティビティ */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">最近のアクティビティ</h3>
            <div className="space-y-3">
              {stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 text-sm font-medium">
                          {activity.type === "task_completed" ? "✅" : "📝"}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-500">{activity.project_name}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="text-sm text-gray-500">
                        {new Date(activity.created_at).toLocaleDateString("ja-JP")}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">最近のアクティビティはありません</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
