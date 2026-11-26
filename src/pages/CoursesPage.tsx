import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, CheckCircle2, Circle, ExternalLink } from 'lucide-react';
import { courseChapters, totalLessons } from '../data/chapters';
import { getField, setField } from '../services/storage';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import ProgressBar from '../components/common/ProgressBar';

type CourseChapter = (typeof courseChapters)[number];

function chapterLink(chapter: number, lesson?: string) {
  return '/learn?chapter=' + chapter + (lesson ? '&lesson=' + lesson : '');
}

export default function CoursesPage() {
  const [params] = useSearchParams();
  const [search, setSearch] = useState('');
  const [completed, setCompleted] = useState(() => new Set(getField('completedLessons')));
  const active = courseChapters.find(c => c.id === Number(params.get('chapter')));
  const lesson = params.get('lesson');

  useEffect(() => {
    if (!active || !lesson) return;
    document.getElementById('lesson-' + lesson)?.scrollIntoView({ block: 'start' });
  }, [active, lesson]);

  function toggleLesson(id: string) {
    const updated = new Set(completed);
    if (updated.has(id)) updated.delete(id);
    else updated.add(id);
    setField('completedLessons', [...updated]);
    setCompleted(updated);
  }

  if (active) {
    const count = active.notes.filter(n => completed.has(n.id)).length;
    return (
      <div className="max-w-5xl space-y-4">
        <Link to="/learn" className="text-sm text-primary-light hover:underline">返回课程目录</Link>
        <section className="card-glow rounded-2xl bg-bg-secondary p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="primary">第 {active.id} 章</Badge>
            <Badge variant="default">{active.weight === null ? '案例与回顾' : '考试权重 ' + active.weight + '%'}</Badge>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary">{active.title}</h2>
          <p className="mt-2 mb-4 leading-relaxed text-text-secondary">{active.summary}</p>
          <div className="max-w-md mb-4 space-y-2">
            <p className="text-sm text-text-secondary">{count} / {active.notes.length} 节已学</p>
            <ProgressBar value={count} max={active.notes.length} size="sm" color="primary" />
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link className="text-primary-light font-semibold hover:underline" to={'/practice?chapter=' + active.id}>练习本章</Link>
            <a className="inline-flex gap-1.5 items-center text-primary-light hover:underline" href={active.url} target="_blank" rel="noreferrer">
              <ExternalLink size={14} /> 官方课程
            </a>
          </div>
        </section>
        {active.notes.map(note => {
          const done = completed.has(note.id);
          const Icon = done ? CheckCircle2 : Circle;
          return (
            <article id={'lesson-' + note.id} key={note.id} className="card-glow rounded-xl bg-bg-secondary p-4 sm:p-5 scroll-mt-24">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                <h3 className="font-semibold text-text-primary"><span className="text-primary-light mr-2">{note.id}</span>{note.title}</h3>
                <Button variant={done ? 'ghost' : 'outline'} size="sm" onClick={() => toggleLesson(note.id)} aria-pressed={done}>
                  <Icon size={15} /> {done ? '已学完' : '标记学完'}
                </Button>
              </div>
              <p className="text-text-secondary leading-relaxed">{note.body}</p>
            </article>
          );
        })}
        <CourseNote key={active.id} chapter={active} />
      </div>
    );
  }

  const keyword = search.trim().toLowerCase();
  const filtered = courseChapters.map(c => ({
    chapter: c,
    matches: keyword ? c.notes.filter(n => [c.title, c.summary, n.id, n.title, n.body].join(' ').toLowerCase().includes(keyword)) : [],
  })).filter(({ matches }) => !keyword || matches.length > 0);
  const matched = filtered.reduce((sum, group) => sum + group.matches.length, 0);

  return (
    <div className="space-y-5">
      <section className="card-glow rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary p-4 sm:p-6">
        <h2 className="text-2xl font-bold gradient-text mb-2">FDE 课程笔记</h2>
        <p className="text-text-secondary leading-relaxed">{courseChapters.length} 章 · {totalLessons} 节 · {completed.size} 节已学</p>
        <div className="mt-4 max-w-md space-y-3">
          <ProgressBar value={completed.size} max={totalLessons} size="sm" color="primary" />
          <label className="block text-sm text-text-secondary">
            <span className="sr-only">搜索课程</span>
            <input type="search" value={search} onChange={event => setSearch(event.target.value)} maxLength={100}
              placeholder="搜索章节、考点或小节编号" className="w-full rounded-lg border border-white/10 bg-bg-primary p-2.5 text-text-primary" />
          </label>
        </div>
      </section>
      {keyword && <p className="text-sm text-text-secondary" aria-live="polite">{matched} 节匹配</p>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map(({ chapter, matches }) => (
          <article key={chapter.id} className="card-glow flex flex-col gap-3 rounded-xl bg-bg-secondary p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary">第 {chapter.id} 章</Badge>
              <Badge variant="default">{chapter.weight === null ? '拓展' : chapter.weight + '%'}</Badge>
            </div>
            <h3 className="font-semibold text-text-primary">{chapter.title}</h3>
            <p className="text-sm leading-relaxed text-text-secondary">{chapter.summary}</p>
            {matches.length > 0 && <ul className="space-y-1 text-sm text-primary-light">
              {matches.map(n => <li key={n.id}><Link to={chapterLink(chapter.id,n.id)} className="hover:underline">{n.id} {n.title}</Link></li>)}
            </ul>}
            <Link className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-primary-light hover:underline" to={chapterLink(chapter.id)}>
              <BookOpen size={15} /> 阅读本章
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}

function CourseNote({ chapter }: { chapter: CourseChapter }) {
  const [note, setNote] = useState(() => getField('courseNotes')[chapter.id] || '');
  const [saved, setSaved] = useState(false);

  return (
    <form className="card-glow rounded-xl bg-bg-secondary p-4 sm:p-5 space-y-3" onSubmit={event => {
      event.preventDefault();
      const entries = getField('courseNotes');
      if (note.trim()) entries[chapter.id] = note;
      else delete entries[chapter.id];
      setField('courseNotes', entries);
      setSaved(true);
    }}>
      <label htmlFor="chapter-note" className="block font-semibold text-text-primary">我的章节笔记</label>
      <textarea id="chapter-note" maxLength={16000} value={note} onChange={event => {
        setNote(event.target.value);
        setSaved(false);
      }} rows={4} className="block w-full resize-y rounded-lg border border-white/10 bg-bg-primary p-3 text-text-primary"
        placeholder="记录容易混淆的术语或项目做法" />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" variant="primary">保存笔记</Button>
        {saved && <span role="status" className="text-sm text-success">已保存</span>}
      </div>
    </form>
  );
}
