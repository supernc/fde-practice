import { Download, ExternalLink } from 'lucide-react';
import course from '../data/course.json';

export default function ResourcesPage() {
  return (
    <div className="max-w-5xl space-y-5">
      <div className="card-glow rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary p-4 sm:p-6">
        <h2 className="text-2xl font-bold gradient-text">官方资料与存档</h2>
        <p className="mt-2 text-text-secondary leading-relaxed">考试与课程口径核对于 {course.reviewed}。存档包含逐节笔记、官方原页与原创练习解析。</p>
        <a href={import.meta.env.BASE_URL + 'fde-study-notes.md'} download="FDE-备考资料存档.md"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
          <Download size={16} /> 下载资料存档
        </a>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {course.sources.map(([title, url, description]) => (
          <article key={url} className="card-glow space-y-2 rounded-xl bg-bg-secondary p-5">
            <h3 className="font-semibold text-text-primary">{title}</h3>
            <p className="text-sm leading-relaxed text-text-secondary">{description}</p>
            <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary-light hover:underline">
              <ExternalLink size={14} /> 打开腾讯云原页
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}
