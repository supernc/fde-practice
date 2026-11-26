import { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface ExamTimerProps {
  deadline: number;
  onTimeUp: () => void;
}

export default function ExamTimer({ deadline, onTimeUp }: ExamTimerProps) {
  const [now, setNow] = useState(Date.now);
  const seconds = Math.max(0, Math.ceil((deadline - now) / 1000));

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (seconds === 0) onTimeUp();
  }, [seconds, onTimeUp]);

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const isWarning = seconds <= 600; // 最后10分钟
  const isCritical = seconds <= 120; // 最后2分钟

  const formatNum = (n: number) => n.toString().padStart(2, '0');

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
        isCritical
          ? 'bg-danger/15 border-danger/30 animate-pulse'
          : isWarning
          ? 'bg-warning/10 border-warning/20'
          : 'bg-bg-card border-white/10'
      }`}
    >
      {isCritical ? (
        <AlertTriangle size={18} className="text-danger" />
      ) : (
        <Clock size={18} className={isWarning ? 'text-warning' : 'text-primary-light'} />
      )}
      <span aria-label="剩余时间"
        className={`text-xl font-mono font-bold tracking-wider ${
          isCritical ? 'text-danger' : isWarning ? 'text-warning' : 'text-text-primary'
        }`}
      >
        {hours > 0 ? `${formatNum(hours)}:` : ''}{formatNum(mins)}:{formatNum(secs)}
      </span>
    </div>
  );
}
