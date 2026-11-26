import fs from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const read = path => fs.readFileSync(path, 'utf8');
const course = JSON.parse(read('src/data/course.json'));
const target = 'src/data/questions.json';
const bank = JSON.parse(read(target)).filter(q => !q.id.startsWith('case-'));
const rows = read('scripts/data/lesson-cases.txt').trim().split('\n').map(row => row.split('|'));
const lessons = course.chapters.flatMap(chapter => chapter.notes.map(note => ({chapter,note})));
assert.equal(rows.length, lessons.length);
const cases = lessons.map(({chapter,note}, i) => {
  assert.equal(rows[i].length, 6, note.id);
  const [scene, action, ...rest] = rows[i];
  return {chapter,note,scene,action,wrong:rest.slice(0,3),evidence:rest[3]};
});
const hash = text => createHash('sha256').update(text).digest('hex');
const ordered = (array,seed) => [...array].sort((a,b)=>hash(seed+a.text).localeCompare(hash(seed+b.text)));
const labels = 'ABCD';
const choice = (text,valid=false,reason='') => ({text,valid,reason});
function add(c,id,stem,items,analysis,category,related=[]) {
  const options = ordered(items,id);
  const answers = options.flatMap((item,i)=>item.valid?[labels[i]]:[]);
  bank.push({id,stem,options:options.map((item,i)=>({label:labels[i],text:item.text})),answer:answers,
    type:answers.length===1?'single':'multiple',chapter:c.chapter.id,subChapter:c.note.id,tags:[c.note.title,category],
    analysis:[analysis,...options.map((item,i)=>item.reason ? labels[i]+'．'+item.reason:'')].filter(Boolean).join('\n'),
    wikiUrl:c.chapter.url,difficulty:category==='综合辨析'?3:2,
    relatedLessons:related.map(k=>k.note.id)});
}
for (const c of cases) {
  const id='case-'+c.note.id;
  add(c,id+'-action',c.scene+'。此时最合适的做法是哪一项？',
    [choice(c.action,true),...c.wrong.map(x=>choice(x))],c.note.body+' 可据此检查：'+c.evidence+'。','现场决策');
  const otherEvidence = cases.filter(k => k.chapter.id===c.chapter.id && k!==c)
    .sort((a,b)=>hash(id+a.note.id).localeCompare(hash(id+b.note.id))).slice(0,3);
  add(c,id+'-evidence',c.scene+'。针对「'+c.note.title+'」，哪项是最直接的核验依据？',
    [choice(c.evidence,true),...otherEvidence.map(k=>choice(k.evidence,false,'该证据主要验证「'+k.note.title+'」。'))],
    '本题检验「'+c.note.title+'」。应核对实际效果：'+c.evidence+'。'+c.note.body,'验收证据');
}
// Four different reviews per lead lesson. Each combines four distinct cases.
// Nearby chapters supply supporting judgments. No four-case set repeats.
const used = new Set();
for (const c of cases) {
  const candidates=cases.filter(other=>other!==c&&Math.abs(other.chapter.id-c.chapter.id)<=2);
  for(let variant=0;variant<4;variant++){
    const id='case-'+c.note.id+'-review-'+(variant+1);
    let group;
    for(let trial=0;trial<1000;trial++){
      const sorted=[...candidates].sort((a,b)=>hash(id+trial+a.note.id).localeCompare(hash(id+trial+b.note.id)));
      group=[c,...sorted.slice(0,3)];
      const key=group.map(k=>k.note.id).sort().join('/');
      if(!used.has(key)){used.add(key);break;}
      group=null;
    }
    assert.ok(group);
    const order=[0,1,2,3].sort((a,b)=>hash(id+'truth'+a).localeCompare(hash(id+'truth'+b)));
    const valid=new Set(order.slice(0,variant%2===0?2:3));
    const items=group.map((k,i)=>{
      const yes=valid.has(i);
      const proposed=yes?k.action:k.wrong[(variant+i)%3];
      return choice(k.scene+'。团队决定：'+proposed+'。',yes,
        '第 '+k.note.id+' 节「'+k.note.title+'」：'+(yes?'符合该场景要求。':'此处理不合适。应'+k.action+'。')+'核查依据为'+k.evidence+'。');
    });
    add(c,id,'综合复盘（'+group.map(k=>k.note.title).join('、')+'）。以下四个独立场景中，哪些处理符合课程要求？',
      items,'逐项对照各自的业务约束与验收依据。','综合辨析',group);
  }
}
assert.equal(bank.length,524);
assert.equal(new Set(bank.map(q=>q.stem)).size,bank.length);
assert.equal(used.size,304);
fs.writeFileSync(target,JSON.stringify(bank,null,2)+'\n');
const archive='public/fde-study-notes.md';
const intro=read(archive).split('## 原创练习题与解析')[0];
const entries=bank.map(q=>['### '+q.id+' '+(q.type==='single'?'单选':'多选'),'',
  q.stem,'',...q.options.map(o=>'- '+o.label+'. '+o.text),'','答案 '+q.answer.join('、')+'。',q.analysis,'',
  '[官方课程]('+q.wikiUrl+')'].join('\n'));
fs.writeFileSync(archive,intro+'## 原创练习题与解析\n\n共 524 道。每套模考按十章权重抽取 60 题。\n\n'+entries.join('\n\n')+'\n');
