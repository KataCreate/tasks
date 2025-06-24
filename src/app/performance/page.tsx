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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      measurePerformance();
      testConnections();
      getNetworkInfo();
    }
  }, [mounted]);

  const measurePerformance = () => {
    if (typeof window === "undefined") return;

    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType("paint");

    const newMetrics: PerformanceMetric[] = [];

    // ページ読み込み時間
    if (navigation) {
      const loadTime = navigation.loadEventEnd - navigation.fetchStart;
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
      const domTime = navigation.domContentLoadedEventEnd - navigation.fetchStart;
      newMetrics.push({
        name: "DOM構築時間",
        value: Math.round(domTime),
        unit: "ms",
        status: domTime < 1000 ? "good" : domTime < 2000 ? "needs-improvement" : "poor",
      });
    }

    // ペイント時間
    if (paint && paint.length > 0) {
      const firstPaint = paint.find((entry) => entry.name === "first-paint");
      const firstContentfulPaint = paint.find((entry) => entry.name === "first-contentful-paint");

      if (firstPaint) {
        newMetrics.push({
          name: "First Paint",
          value: Math.round(firstPaint.startTime),
          unit: "ms",
          status:
            firstPaint.startTime < 1000
              ? "good"
              : firstPaint.startTime < 2000
              ? "needs-improvement"
              : "poor",
        });
      }

      if (firstContentfulPaint) {
        newMetrics.push({
          name: "First Contentful Paint",
          value: Math.round(firstContentfulPaint.startTime),
          unit: "ms",
          status:
            firstContentfulPaint.startTime < 1500
              ? "good"
              : firstContentfulPaint.startTime < 2500
              ? "needs-improvement"
              : "poor",
        });
      }
    }

    setMetrics(newMetrics);
  };

  const testConnections = async () => {
    if (typeof window === "undefined") return;

    const results = {
      supabase: null as any,
      network: null as any,
    };

    // Supabase接続テスト
    try {
      const start = performance.now();
      const response = await fetch("/api/health");
      const end = performance.now();
      results.supabase = {
        status: response.ok ? "success" : "error",
        time: Math.round(end - start),
        statusCode: response.status,
      };
    } catch (error) {
      results.supabase = {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    // ネットワーク接続テスト
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;
      results.network = {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      };
    }

    setConnectionTest(results);
  };

  const getNetworkInfo = () => {
    if (typeof window === "undefined") return;

    const info = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      platform: navigator.platform,
      vendor: navigator.vendor,
    };

    setNetworkInfo(info);
  };

  // サーバーサイドレンダリング中は何も表示しない
  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">パフォーマンス監視</h1>

        {/* パフォーマンスメトリクス */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">パフォーマンスメトリクス</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((metric, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  metric.status === "good"
                    ? "border-green-200 bg-green-50"
                    : metric.status === "needs-improvement"
                    ? "border-yellow-200 bg-yellow-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{metric.name}</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {metric.value} {metric.unit}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      metric.status === "good"
                        ? "bg-green-100 text-green-800"
                        : metric.status === "needs-improvement"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {metric.status === "good"
                      ? "良好"
                      : metric.status === "needs-improvement"
                      ? "改善必要"
                      : "不良"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 接続テスト結果 */}
        {connectionTest && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">接続テスト結果</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Supabase接続</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ステータス:</span>
                    <span
                      className={`font-medium ${
                        connectionTest.supabase?.status === "success"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {connectionTest.supabase?.status === "success" ? "成功" : "失敗"}
                    </span>
                  </div>
                  {connectionTest.supabase?.time && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">応答時間:</span>
                      <span className="font-medium text-gray-900">
                        {connectionTest.supabase.time}ms
                      </span>
                    </div>
                  )}
                  {connectionTest.supabase?.statusCode && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">ステータスコード:</span>
                      <span className="font-medium text-gray-900">
                        {connectionTest.supabase.statusCode}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {connectionTest.network && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">ネットワーク情報</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">接続タイプ:</span>
                      <span className="font-medium text-gray-900">
                        {connectionTest.network.effectiveType}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ダウンリンク:</span>
                      <span className="font-medium text-gray-900">
                        {connectionTest.network.downlink} Mbps
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">RTT:</span>
                      <span className="font-medium text-gray-900">
                        {connectionTest.network.rtt}ms
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ネットワーク情報 */}
        {networkInfo && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">ブラウザ情報</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">基本情報</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">プラットフォーム:</span>
                    <span className="font-medium text-gray-900">{networkInfo.platform}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">言語:</span>
                    <span className="font-medium text-gray-900">{networkInfo.language}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">オンライン:</span>
                    <span
                      className={`font-medium ${
                        networkInfo.onLine ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {networkInfo.onLine ? "はい" : "いいえ"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cookie有効:</span>
                    <span
                      className={`font-medium ${
                        networkInfo.cookieEnabled ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {networkInfo.cookieEnabled ? "はい" : "いいえ"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">User Agent</h3>
                <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 break-all">
                  {networkInfo.userAgent}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
