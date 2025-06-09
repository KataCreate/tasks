-- タスク管理詳細機能用のカラム追加
ALTER TABLE tasks
ADD COLUMN priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
ADD COLUMN status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'blocked', 'done')),
ADD COLUMN due_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN estimated_hours INTEGER,
ADD COLUMN actual_hours INTEGER,
ADD COLUMN progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
ADD COLUMN tags TEXT[],
ADD COLUMN assignee_id UUID REFERENCES profiles(id);

-- 既存のis_completedカラムの代わりにstatusを使用するが、互換性のため両方保持
-- statusが'done'の場合はis_completedをtrueに、それ以外はfalseにする関数
CREATE OR REPLACE FUNCTION sync_task_completion_status()
RETURNS TRIGGER AS $$
BEGIN
  -- statusが変更された場合、is_completedも同期
  IF NEW.status = 'done' THEN
    NEW.is_completed = true;
  ELSE
    NEW.is_completed = false;
  END IF;

  -- is_completedが変更された場合、statusも同期
  IF NEW.is_completed = true AND OLD.is_completed = false THEN
    NEW.status = 'done';
  ELSIF NEW.is_completed = false AND OLD.is_completed = true THEN
    NEW.status = 'todo';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーを作成
CREATE TRIGGER sync_task_completion_status_trigger
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION sync_task_completion_status();

-- インデックスを追加してパフォーマンスを向上
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);

-- タスクに関するコメント追加
COMMENT ON COLUMN tasks.priority IS 'タスクの優先度: low, medium, high, urgent';
COMMENT ON COLUMN tasks.status IS 'タスクのステータス: todo, in_progress, review, blocked, done';
COMMENT ON COLUMN tasks.due_date IS 'タスクの期限';
COMMENT ON COLUMN tasks.estimated_hours IS '予定作業時間（時間）';
COMMENT ON COLUMN tasks.actual_hours IS '実際の作業時間（時間）';
COMMENT ON COLUMN tasks.progress_percentage IS '進捗率（0-100%）';
COMMENT ON COLUMN tasks.tags IS 'タスクのタグ（配列）';
COMMENT ON COLUMN tasks.assignee_id IS '担当者のプロファイルID';