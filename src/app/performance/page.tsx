"use client";

import { useState, useEffect } from "react";

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: "good" | "needs-improvement" | "poor";
}

export default function PerformancePage() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [connectionTest, setConnectionTest] = useState<any>(null);

  useEffect(() => {
    measurePerformance();
    testConnections();
    getNetworkInfo();
  }, []);

  const measurePerformance = () => {
    if (typeof window === "undefined") return;

    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType("paint");

    const newMetrics: PerformanceMetric[] = [];

    // ページ読み込み時間
    if (navigation) {
      const loadTime = navigation.loadEventEnd - navigation.navigationStart;
      newMetrics.push({
        name: "ページ読み込み時間",
        value: Math.round(loadTime),
        unit: "ms",
        status: loadTime < 1500 ? "good" : loadTime < 3000 ? "needs-improvement" : "poor",
      });

      // DNS解決時間
      const dnsTime = navigation.domainLookupEnd - navigation.domainLookupStart;
      newMetrics.push({
        name: "DNS解決時間",
        value: Math.round(dnsTime),
        unit: "ms",
        status: dnsTime < 100 ? "good" : dnsTime < 300 ? "needs-improvement" : "poor",
      });

      // サーバー応答時間
      const serverTime = navigation.responseStart - navigation.requestStart;
      newMetrics.push({
        name: "サーバー応答時間",
        value: Math.round(serverTime),
        unit: "ms",
        status: serverTime < 200 ? "good" : serverTime < 500 ? "needs-improvement" : "poor",
      });

      // DOM構築時間
      const domTime = navigation.domContentLoadedEventEnd - navigation.navigationStart;
      newMetrics.push({
        name: "DOM構築時間",
        value: Math.round(domTime),
        unit: "ms",
        status: domTime < 1000 ? "good" : domTime < 2000 ? "needs-improvement" : "poor",
      });
    }

    // First Paint
    const fp = paint.find((entry) => entry.name === "first-paint");
    if (fp) {
      newMetrics.push({
        name: "First Paint",
        value: Math.round(fp.startTime),
        unit: "ms",
        status: fp.startTime < 1000 ? "good" : fp.startTime < 2000 ? "needs-improvement" : "poor",
      });
    }

    // First Contentful Paint
    const fcp = paint.find((entry) => entry.name === "first-contentful-paint");
    if (fcp) {
      newMetrics.push({
        name: "First Contentful Paint",
        value: Math.round(fcp.startTime),
        unit: "ms",
        status: fcp.startTime < 1500 ? "good" : fcp.startTime < 2500 ? "needs-improvement" : "poor",
      });
    }

    setMetrics(newMetrics);
  };

  const testConnections = async () => {
    const tests = [];

    // Supabase接続テスト
    const supabaseStart = performance.now();
    try {
      const response = await fetch("/api/health/supabase", {
        method: "GET",
        cache: "no-cache",
      });
      const supabaseTime = performance.now() - supabaseStart;
      tests.push({
        name: "Supabase接続",
        time: Math.round(supabaseTime),
        status: response.ok ? "success" : "error",
        details: response.ok ? "正常" : `エラー: ${response.status}`,
      });
    } catch (error) {
      tests.push({
        name: "Supabase接続",
        time: 0,
        status: "error",
        details: "接続失敗",
      });
    }

    // Vercel エッジ関数テスト
    const vercelStart = performance.now();
    try {
      const response = await fetch("/api/health/edge", {
        method: "GET",
        cache: "no-cache",
      });
      const vercelTime = performance.now() - vercelStart;
      tests.push({
        name: "Vercel Edge",
        time: Math.round(vercelTime),
        status: response.ok ? "success" : "error",
        details: response.ok ? "正常" : `エラー: ${response.status}`,
      });
    } catch (error) {
      tests.push({
        name: "Vercel Edge",
        time: 0,
        status: "error",
        details: "接続失敗",
      });
    }

    setConnectionTest(tests);
  };

  const getNetworkInfo = () => {
    if (typeof window === "undefined") return;

    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    if (connection) {
      setNetworkInfo({
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
      case "success":
        return "text-green-600 bg-green-100";
      case "needs-improvement":
        return "text-yellow-600 bg-yellow-100";
      case "poor":
      case "error":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const reloadPage = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">パフォーマンス監視</h1>
          <button
            onClick={reloadPage}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            再測定
          </button>
        </div>

        {/* ページパフォーマンス */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">ページパフォーマンス</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((metric, index) => (
              <div key={index} className="border rounded p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{metric.name}</span>
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(metric.status)}`}>
                    {metric.status === "good"
                      ? "良好"
                      : metric.status === "needs-improvement"
                      ? "改善要"
                      : "要対応"}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-2">
                  {metric.value}
                  {metric.unit}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 接続テスト */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">接続テスト</h2>
          {connectionTest ? (
            <div className="space-y-4">
              {connectionTest.map((test: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-4 border rounded">
                  <div>
                    <div className="font-medium">{test.name}</div>
                    <div className="text-sm text-gray-600">{test.details}</div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-lg font-semibold">{test.time}ms</span>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(test.status)}`}>
                      {test.status === "success" ? "成功" : "エラー"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">接続テスト実行中...</p>
            </div>
          )}
        </div>

        {/* ネットワーク情報 */}
        {networkInfo && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">ネットワーク情報</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{networkInfo.effectiveType}</div>
                <div className="text-sm text-gray-600">接続タイプ</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{networkInfo.downlink} Mbps</div>
                <div className="text-sm text-gray-600">ダウンロード速度</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{networkInfo.rtt}ms</div>
                <div className="text-sm text-gray-600">レイテンシ</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {networkInfo.saveData ? "ON" : "OFF"}
                </div>
                <div className="text-sm text-gray-600">データセーバー</div>
              </div>
            </div>
          </div>
        )}

        {/* 推奨事項 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">パフォーマンス改善の推奨事項</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></span>
              <span>ページの初回読み込み後、データはキャッシュされます</span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></span>
              <span>
                低速な接続環境では、画像と大きなコンポーネントの読み込みに時間がかかります
              </span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></span>
              <span>Vercelのエッジキャッシュにより、2回目以降のアクセスは高速化されます</span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></span>
              <span>ブラウザキャッシュをクリアすると、再度読み込み時間がかかる場合があります</span>
            </li>
          </ul>
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
