import { StatusStats } from "@/lib/api/dashboard";

interface StatusChartProps {
  data: StatusStats[];
}

const statusColors = {
  todo: "bg-gray-400",
  in_progress: "bg-blue-500",
  review: "bg-purple-500",
  blocked: "bg-red-500",
  done: "bg-green-500",
};

const statusLabels = {
  todo: "未着手",
  in_progress: "進行中",
  review: "レビュー",
  blocked: "ブロック",
  done: "完了",
};

export function StatusChart({ data }: StatusChartProps) {
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
      {/* 積み上げバーチャート */}
      <div className="relative">
        <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden flex">
          {data.map((item) => {
            const width = (item.count / total) * 100;
            if (width === 0) return null;

            return (
              <div
                key={item.status}
                className={`h-full ${statusColors[item.status as keyof typeof statusColors]}`}
                style={{ width: `${width}%` }}
                title={`${statusLabels[item.status as keyof typeof statusLabels]}: ${
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
          <div key={item.status} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  statusColors[item.status as keyof typeof statusColors]
                }`}
              />
              <span className="text-gray-700">
                {statusLabels[item.status as keyof typeof statusLabels]}
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
