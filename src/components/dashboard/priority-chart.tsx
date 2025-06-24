import { PriorityStats } from "@/lib/api/dashboard";

interface PriorityChartProps {
  data: PriorityStats[];
}

const priorityColors = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-gray-400",
};

const priorityLabels = {
  urgent: "緊急",
  high: "高",
  medium: "中",
  low: "低",
};

export function PriorityChart({ data }: PriorityChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  if (total === 0) {
    return (
      <div className="text-center text-gray-900 py-8">
        <p>データがありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 円グラフ風の積み上げバー */}
      <div className="relative">
        <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden flex">
          {data.map((item) => {
            const width = (item.count / total) * 100;
            if (width === 0) return null;

            return (
              <div
                key={item.priority}
                className={`h-full ${priorityColors[item.priority as keyof typeof priorityColors]}`}
                style={{ width: `${width}%` }}
                title={`${priorityLabels[item.priority as keyof typeof priorityLabels]}: ${
                  item.count
                }件 (${item.percentage}%)`}
              />
            );
          })}
        </div>
      </div>

      {/* 凡例 */}
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.priority} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  priorityColors[item.priority as keyof typeof priorityColors]
                }`}
              />
              <span className="text-gray-700">
                {priorityLabels[item.priority as keyof typeof priorityLabels]}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium text-gray-900">{item.count}</span>
              <span className="text-gray-900">({item.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
