import { ChevronLeft, ChevronRight, Flag, Send } from 'lucide-react';
import Button from '../common/Button';
import ExamTimer from './ExamTimer';

interface ExamToolbarProps {
  currentIndex: number;
  total: number;
  answeredCount: number;
  deadline: number;
  isMarked: boolean;
  onPrev: () => void;
  onNext: () => void;
  onMark: () => void;
  onSubmit: () => void;
  onTimeUp: () => void;
}

export default function ExamToolbar({
  currentIndex,
  total,
  answeredCount,
  deadline,
  isMarked,
  onPrev,
  onNext,
  onMark,
  onSubmit,
  onTimeUp,
}: ExamToolbarProps) {
  return (
    <div className="sticky top-16 z-30 bg-bg-primary/90 backdrop-blur-md border-b border-white/5 px-2 sm:px-6 py-3">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        {/* Left: Progress */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-secondary">
            进度：<span className="text-text-primary font-bold">{answeredCount}</span>
            <span className="text-text-muted">/{total}</span>
          </span>
          <div className="hidden lg:block w-32 h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary-cyan rounded-full transition-all duration-300"
              style={{ width: `${(answeredCount / total) * 100}%` }}
            />
          </div>
        </div>

        {/* Center: Timer */}
        <ExamTimer deadline={deadline} onTimeUp={onTimeUp} />

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="sm" onClick={onPrev} disabled={currentIndex === 0}>
            <ChevronLeft size={16} />
            上一题
          </Button>

          <Button
            variant={isMarked ? 'outline' : 'ghost'}
            size="sm"
            onClick={onMark}
            className={isMarked ? 'text-warning border-warning/30' : ''}
          >
            <Flag size={14} fill={isMarked ? 'currentColor' : 'none'} />
            {isMarked ? '已标记' : '标记'}
          </Button>

          <Button variant="secondary" size="sm" onClick={onNext} disabled={currentIndex === total - 1}>
            下一题 <ChevronRight size={16} />
          </Button>
          <Button variant="primary" size="sm" onClick={onSubmit}>
            <Send size={14} /> 交卷
          </Button>
        </div>
      </div>
    </div>
  );
}
