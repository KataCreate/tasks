import { WeeklyProgress } from "@/lib/api/dashboard";

interface WeeklyProgressChartProps {
  data: WeeklyProgress[];
}

export function WeeklyProgressChart({ data }: WeeklyProgressChartProps) {
  if (data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>データがありません</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((item) => Math.max(item.created, item.completed)));

  return (
    <div className="space-y-4">
      {/* チャート */}
      <div className="relative">
        <div className="flex items-end justify-between gap-2 h-40">
          {data.map((week) => {
            const createdHeight = maxValue > 0 ? (week.created / maxValue) * 100 : 0;
            const completedHeight = maxValue > 0 ? (week.completed / maxValue) * 100 : 0;

            return (
              <div key={week.week} className="flex flex-col items-center gap-2 flex-1">
                {/* バー */}
                <div className="relative w-full max-w-16 h-32 bg-gray-100 rounded-t-md overflow-hidden">
                  {/* 作成されたタスク（背景） */}
                  <div
                    className="absolute bottom-0 w-full bg-blue-200 transition-all duration-300"
                    style={{ height: `${createdHeight}%` }}
                  />
                  {/* 完了したタスク（前景） */}
                  <div
                    className="absolute bottom-0 w-full bg-blue-500 transition-all duration-300"
                    style={{ height: `${completedHeight}%` }}
                  />
                </div>

                {/* 週ラベル */}
                <div className="text-xs text-gray-600 text-center">
                  <div>{week.week}</div>
                </div>

                {/* 数値表示 */}
                <div className="text-xs text-gray-900 text-center">
                  <div>完了: {week.completed}</div>
                  <div>作成: {week.created}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 凡例 */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span className="text-gray-900">完了したタスク</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-200 rounded"></div>
          <span className="text-gray-900">作成されたタスク</span>
        </div>
      </div>
    </div>
  );
}
