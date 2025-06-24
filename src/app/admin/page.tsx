"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [authConfig, setAuthConfig] = useState<any>({});
  const [testResult, setTestResult] = useState<any>(null);
  const [testEmail, setTestEmail] = useState("");
  const [testPassword, setTestPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // プロファイルの取得（RLSを無視してSUPABASE_SERVICE_ROLEで実行する必要がある）
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .limit(10);

      if (profileError) {
        console.error("プロファイル取得エラー:", profileError);
        setProfiles([{ error: profileError.message }]);
      } else {
        setProfiles(profileData || []);
      }

      // 現在の認証状態
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      setAuthConfig({
        hasSession: !!session,
        sessionError: sessionError?.message,
        currentUser: session?.user,
      });
    } catch (error) {
      console.error("データ取得エラー:", error);
    }
  };

  const testSignUp = async () => {
    if (!testEmail || !testPassword) return;

    setLoading(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            name: "Test User",
          },
        },
      });

      setTestResult({
        type: "signup",
        success: !error,
        error: error?.message,
        user: data.user,
        session: data.session,
        needsConfirmation: !data.session && !error,
      });

      console.log("サインアップ結果:", { data, error });
    } catch (err) {
      setTestResult({
        type: "signup",
        success: false,
        error: err instanceof Error ? err.message : "不明なエラー",
      });
    } finally {
      setLoading(false);
    }
  };

  const testSignIn = async () => {
    if (!testEmail || !testPassword) return;

    setLoading(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      setTestResult({
        type: "signin",
        success: !error,
        error: error?.message,
        user: data.user,
        session: data.session,
      });

      console.log("サインイン結果:", { data, error });
    } catch (err) {
      setTestResult({
        type: "signin",
        success: false,
        error: err instanceof Error ? err.message : "不明なエラー",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!testEmail) return;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(testEmail, {
        redirectTo: window.location.origin + "/auth/reset-password",
      });

      if (error) {
        setTestResult({
          type: "reset",
          success: false,
          error: error.message,
        });
      } else {
        setTestResult({
          type: "reset",
          success: true,
          message: "パスワードリセットメールを送信しました",
        });
      }
    } catch (err) {
      setTestResult({
        type: "reset",
        success: false,
        error: err instanceof Error ? err.message : "不明なエラー",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">管理者診断ページ</h1>

        {/* 認証状態 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">現在の認証状態</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(authConfig, null, 2)}
          </pre>
        </div>

        {/* プロファイル一覧 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">プロファイル一覧</h2>
          <div className="max-h-60 overflow-auto">
            <pre className="bg-gray-100 p-4 rounded text-sm">
              {JSON.stringify(profiles, null, 2)}
            </pre>
          </div>
        </div>

        {/* テスト機能 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">認証テスト</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                テスト用メールアドレス
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="test@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                テスト用パスワード
              </label>
              <input
                type="password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="パスワード（6文字以上）"
              />
            </div>
          </div>

          <div className="flex gap-4 mb-4">
            <button
              onClick={testSignUp}
              disabled={loading || !testEmail || !testPassword}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded"
            >
              新規登録テスト
            </button>

            <button
              onClick={testSignIn}
              disabled={loading || !testEmail || !testPassword}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded"
            >
              ログインテスト
            </button>

            <button
              onClick={resetPassword}
              disabled={loading || !testEmail}
              className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white px-4 py-2 rounded"
            >
              パスワードリセット
            </button>

            <button
              onClick={loadData}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
            >
              データ再読込
            </button>
          </div>

          {testResult && (
            <div className="mt-4">
              <div className="font-medium mb-2">テスト結果（{testResult.type}）:</div>
              <div
                className={`p-4 rounded border ${
                  testResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                }`}
              >
                <pre className="text-sm whitespace-pre-wrap">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <a href="/" className="text-indigo-600 hover:text-indigo-500">
            メインページに戻る
          </a>
        </div>
      </div>
    </div>
  );
}
