"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

export default function DebugPage() {
  const { user, loading: authLoading } = useAuth();
  const [envVars, setEnvVars] = useState<any>({});
  const [supabaseHealth, setSupabaseHealth] = useState<any>({});
  const [testEmail, setTestEmail] = useState("");
  const [testPassword, setTestPassword] = useState("");
  const [loginResult, setLoginResult] = useState<any>(null);

  useEffect(() => {
    // 環境変数の確認
    setEnvVars({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "未設定",
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "設定済み (非表示)" : "未設定",
      nodeEnv: process.env.NODE_ENV || "未設定",
      vercelEnv: process.env.VERCEL_ENV || "未設定",
    });

    // Supabase接続テスト
    testSupabaseConnection();
  }, []);

  const testSupabaseConnection = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("count", { count: "exact", head: true });
      setSupabaseHealth({
        status: error ? "エラー" : "正常",
        error: error?.message || null,
        details: error?.details || null,
        hint: error?.hint || null,
        code: error?.code || null,
      });
    } catch (err) {
      setSupabaseHealth({
        status: "接続エラー",
        error: err instanceof Error ? err.message : "不明なエラー",
      });
    }
  };

  const testLogin = async () => {
    if (!testEmail || !testPassword) return;

    try {
      setLoginResult({ status: "実行中..." });
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      setLoginResult({
        status: error ? "失敗" : "成功",
        error: error?.message || null,
        data: data.user ? { id: data.user.id, email: data.user.email } : null,
        session: data.session ? "セッション作成済み" : "セッションなし",
      });
    } catch (err) {
      setLoginResult({
        status: "例外エラー",
        error: err instanceof Error ? err.message : "不明なエラー",
      });
    }
  };

  const clearSession = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">デバッグ診断ページ</h1>

        {/* 環境変数 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">環境変数</h2>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(envVars).map(([key, value]) => (
              <div key={key} className="border rounded p-3">
                <div className="font-medium text-gray-900">{key}</div>
                <div className="text-sm text-gray-900">{String(value)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Supabase接続状態 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Supabase接続状態</h2>
          <div className="space-y-2">
            <div>
              <span className="font-medium">ステータス: </span>
              <span
                className={`px-2 py-1 rounded text-sm ${
                  supabaseHealth.status === "正常"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {supabaseHealth.status}
              </span>
            </div>
            {supabaseHealth.error && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <div className="font-medium text-red-800">エラー:</div>
                <div className="text-red-600">{supabaseHealth.error}</div>
                {supabaseHealth.details && (
                  <div className="text-red-600 mt-1">詳細: {supabaseHealth.details}</div>
                )}
                {supabaseHealth.hint && (
                  <div className="text-red-600 mt-1">ヒント: {supabaseHealth.hint}</div>
                )}
                {supabaseHealth.code && (
                  <div className="text-red-600 mt-1">コード: {supabaseHealth.code}</div>
                )}
              </div>
            )}
          </div>
          <button
            onClick={testSupabaseConnection}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            再テスト
          </button>
        </div>

        {/* 現在の認証状態 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">現在の認証状態</h2>
          <div className="space-y-2">
            <div>
              <span className="font-medium">認証状態: </span>
              <span
                className={`px-2 py-1 rounded text-sm ${
                  authLoading
                    ? "bg-yellow-100 text-yellow-800"
                    : user
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {authLoading ? "読み込み中" : user ? "ログイン中" : "未ログイン"}
              </span>
            </div>
            {user && (
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <div>
                  <strong>ユーザーID:</strong> {user.id}
                </div>
                <div>
                  <strong>メール:</strong> {user.email}
                </div>
                <div>
                  <strong>作成日:</strong> {user.created_at}
                </div>
              </div>
            )}
          </div>
          {user && (
            <button
              onClick={clearSession}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              セッションをクリア
            </button>
          )}
        </div>

        {/* ログインテスト */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">ログインテスト</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">メールアドレス</label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="test@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">パスワード</label>
              <input
                type="password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="パスワード"
              />
            </div>
            <button
              onClick={testLogin}
              disabled={!testEmail || !testPassword}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded"
            >
              ログインテスト実行
            </button>

            {loginResult && (
              <div className="mt-4">
                <div className="font-medium mb-2">テスト結果:</div>
                <div
                  className={`p-3 rounded border ${
                    loginResult.status === "成功"
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div>
                    <strong>ステータス:</strong> {loginResult.status}
                  </div>
                  {loginResult.error && (
                    <div>
                      <strong>エラー:</strong> {loginResult.error}
                    </div>
                  )}
                  {loginResult.data && (
                    <div>
                      <strong>ユーザーデータ:</strong> {JSON.stringify(loginResult.data, null, 2)}
                    </div>
                  )}
                  {loginResult.session && (
                    <div>
                      <strong>セッション:</strong> {loginResult.session}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <a href="/" className="text-indigo-600 hover:text-indigo-500">
            メインページに戻る
          </a>
        </div>
      </div>
    </div>
  );
}
