"use client";

import { useState } from "react";
// UI コンポーネント（シンプル版）
const Button = ({ children, onClick, disabled, className }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 ${className}`}
  >
    {children}
  </button>
);

const Card = ({ children, className }: any) => (
  <div className={`border rounded-lg shadow-sm bg-white ${className}`}>{children}</div>
);

const CardHeader = ({ children }: any) => <div className="p-6 pb-4">{children}</div>;

const CardTitle = ({ children, className }: any) => (
  <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
);

const CardDescription = ({ children, className }: any) => (
  <p className={`text-sm text-gray-600 mt-2 ${className}`}>{children}</p>
);

const CardContent = ({ children, className }: any) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);
import { useAuth } from "@/lib/auth-context";
import { initializeUserData } from "@/lib/api/setup";

export function SetupButton() {
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSetup = async () => {
    if (!user) return;

    setIsLoading(true);
    setSuccess(false);

    try {
      await initializeUserData(user.id, user.email!, user.user_metadata?.name);
      setSuccess(true);
      // ページを再読み込みして最新データを取得
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("初期化エラー:", error);
      alert("初期化に失敗しました。コンソールを確認してください。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">データベース初期設定</CardTitle>
        <CardDescription className="text-center">
          制作状況やプロファイルが見つからない場合は、こちらから初期データを作成できます。
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        {success ? (
          <div className="text-green-600 font-medium">✅ 初期設定完了！ページを再読み込み中...</div>
        ) : (
          <Button onClick={handleSetup} disabled={isLoading} className="w-full">
            {isLoading ? "初期化中..." : "初期データを作成"}
          </Button>
        )}

        <div className="text-sm text-gray-500 space-y-1">
          <p>作成されるデータ:</p>
          <ul className="text-left space-y-1">
            <li>• プロファイル情報</li>
            <li>• デフォルト制作状況（未着手、制作中、確認待ち、完了）</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
