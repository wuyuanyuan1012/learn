from pathlib import Path
import json,re,uuid,hashlib,unicodedata
from collections import Counter,defaultdict
ROOT=Path('content/tongbian-chinese');NS=uuid.UUID('ed01ab2e-f922-4c26-8ddb-fbe2c4bb5621')
sources=json.loads((ROOT/'sources.json').read_text());books={b['id']:b for b in sources['books']};lessons=[];manifest=[];seen=set()
pages={b:Path('/tmp/learn-chinese/'+b+'.txt').read_text().split('\f') for b in books}
plain={b:[''.join(re.findall('[\u4e00-\u9fff]',p)) for p in ps] for b,ps in pages.items()}
def ref(book,unit,word=None,printed=None):
 b=books[book];u=b['units'][unit-1];start=u['startPdfPage'];end=b['units'][unit]['startPdfPage'] if unit<len(b['units']) else b['pages']
 match=next((i+1 for i in range(start-1,end-1) if word and word in plain[book][i]),None)
 pdf=printed+5 if printed is not None else match or start
 return dict(unit=unit,pdfPage=pdf,printedPage=pdf-5,referenceType='specified-page' if printed is not None else 'word-occurrence' if match else 'unit-knowledge-reference',sourceWord=word)
def q(prompt,correct,wrong,explanation,context='',hint='结合题目和所给材料，逐项比较四个选项。',proof=None,source=None):
 assert len(wrong)==3 and len(set([correct]+wrong))==4,(prompt,correct,wrong)
 return dict(prompt=prompt,correct=correct,wrong=wrong,hint=hint,explanation=explanation,context=context,proof=proof,source=source)
def emit(book,units,category,topic,rows,kind='adapted'):
 assert len(rows)==10,(book,topic,len(rows));b=books[book];lid=str(uuid.uuid5(NS,book+'/'+category+'/'+topic));qs=[]
 for row in rows:
  k=unicodedata.normalize('NFKC',row['prompt']);k=re.sub(r'\s+','',k)
  assert k not in seen,('duplicate',book,row['prompt']);seen.add(k)
  qid=str(uuid.uuid5(NS,lid+'/'+row['prompt']));answer=len(manifest)%4;opts=[row['correct']]+row['wrong'];opts=opts[-answer:]+opts[:-answer] if answer else opts
  qs.append(dict(id=qid,prompt=row['prompt'],context=row['context'],options=opts,answer=answer,hint=row['hint'],explanation=row['explanation']))
  manifest.append(dict(questionId=qid,lessonId=lid,book=book,grade=b['grade'],term=b['term'],category=category,kind=kind,source=row['source'] or ref(book,units[0]),correctAnswer=row['correct'],proof=row['proof']))
 label=f'{b["grade"]}{"上" if b["term"]=="上册" else "下"}'
 lessons.append(dict(id=lid,title=f'统编{label}·{topic}',description=f'统编版{b["grade"]}年级{b["term"]}，练习{topic}。每题含提示和解析。',subject='chinese',grade=b['grade'],topic=topic,category=category,tags=['统编版',f'{b["grade"]}年级{b["term"]}']+['第'+str(u)+'单元' for u in units]+[topic],minutes=7,status='published',questions=qs))
vocab=[]
for line in (ROOT/'vocabulary.txt').read_text().splitlines():
 if not line.strip() or line.lstrip().startswith('#'):continue
 book,unit,items=line.strip().split('|')
 for item in items.split(';'):
  word,pinyin,meaning=item.split('~');vocab.append(dict(book=book,unit=int(unit),word=word,pinyin=pinyin,meaning=meaning))
assert len({v['word'] for v in vocab})==len(vocab)
tones=['āáǎà','ōóǒò','ēéěè','īíǐì','ūúǔù','ǖǘǚǜ']
def distract_pinyin(pin):
 for i,c in enumerate(pin):
  for series in tones:
   if c in series:return [pin[:i]+other+pin[i+1:] for other in series if other!=c]
 raise ValueError(pin)
for book in books:
 vv=[v for v in vocab if v['book']==book]
 for offset in range(0,len(vv),10):
  group=vv[offset:offset+10];assert len(group)==10
  units=sorted({v['unit'] for v in group});rows_pin=[];rows_word=[]
  for v in group:
   w,p,m=v['word'],v['pinyin'],v['meaning'];r=ref(book,v['unit'],w)
   rows_pin.append(q(f'字音辨析：表示“{m}”的“{w}”应怎样读？',p,distract_pinyin(p),f'本题中“{w}”读作{p}。注意声调和轻声。',hint='结合词义确认读音，再看选项中声调的差别。',proof=dict(type='pinyin',word=w,pinyin=p),source=r))
   # Different semantic fields from the same book form plausible but unambiguously wrong meanings.
   wrong=[]
   for other in vv[vv.index(v)+1:]+vv[:vv.index(v)]:
    if other['meaning']!=m and other['meaning'] not in wrong:wrong.append(other['meaning'])
    if len(wrong)==3:break
   rows_word.append(q(f'词义理解：下面哪项可以解释“{w}”？',m,wrong,f'“{w}”在本题中的意思是：{m}。',hint='想想这个词通常用来说明什么事物或状态。',proof=dict(type='meaning',word=w,meaning=m),source=r))
  tag='、'.join(str(u) for u in units)+'单元'
  emit(book,units,'chinese-pinyin',tag+'字音辨析',rows_pin)
  emit(book,units,'chinese-words',tag+'词义理解',rows_word)
# Hand-reviewed phonics, character, sentence, writing and comprehension modules.
for module in json.loads((ROOT/'modules.json').read_text()):
 rows=[]
 for item in module['questions']:
  rows.append(q(item['prompt'],item['correct'],item['wrong'],item['explanation'],context=item.get('context',module.get('context','')),hint=item.get('hint','先读清题目，再结合学过的知识或所给材料判断。'),proof=item.get('proof'),source=ref(module['book'],item.get('unit',module['unit']),printed=item.get('printedPage',module.get('printedPage')))))
 emit(module['book'],module.get('units',[module['unit']]),module['category'],module['topic'],rows,kind=module.get('kind','adapted'))
# Public-domain classical verse: full context is provided, so no textbook lookup is required.
for module in json.loads((ROOT/'poems.json').read_text()):
 rows=[]
 for p in module['poems']:
  r=ref(module['book'],p['unit'],printed=p['page']);context=f'《{p["title"]}》：'+''.join(p['lines'])
  rows.append(q(f'《{p["title"]}》的作者是谁？',p['author'],p['otherAuthors'],f'这首诗的作者是{p["dynasty"]}代的{p["author"]}。',context,proof=dict(type='poem-author',title=p['title'],author=p['author']),source=r))
  rows.append(q(f'《{p["title"]}》的作者生活在哪个朝代？',p['dynasty'],[d for d in ['唐','宋','清','元','明','汉'] if d!=p['dynasty']][:3],f'{p["author"]}是{p["dynasty"]}代诗人。',context,source=r))
  rows.append(q(f'《{p["title"]}》中，“{p["lines"][0].rstrip("，。？！") }”的下一句是什么？',p['lines'][1].rstrip('，。？！'),p['nextWrong'],f'原诗前两句是：{p["lines"][0]}{p["lines"][1]}',context,proof=dict(type='poem-line',line=p['lines'][1]),source=r))
  rows.append(q(f'理解《{p["title"]}》：“{p["word"]}”在诗中是什么意思？',p['meaning'],p['meaningWrong'],p['meaningExplanation'],context,source=r))
  rows.append(q(f'阅读《{p["title"]}》，下面哪项理解符合诗意？',p['idea'],p['ideaWrong'],p['ideaExplanation'],context,source=r))
 emit(module['book'],sorted({p['unit'] for p in module['poems']}),'chinese-classics',module['topic'],rows,kind='public-domain-poem-adaptation')
# Vocabulary is the minimum core-unit coverage; other modules build comprehension and expression.
units=[]
for book,b in books.items():
 for u in b['units']:
  count=sum(q['book']==book and q['source']['unit']==u['number'] for q in manifest)
  assert count>=10,(book,u['name'],count);units.append(dict(book=book,unit=u['number'],questions=count))
for name,data in [('lessons',lessons),('manifest',dict(batch='tongbian-primary-chinese-v1',sourceCommit=sources['commit'],lessonCount=len(lessons),questionCount=len(manifest),questions=manifest)),('coverage',dict(lessons=len(lessons),questions=len(manifest),books=len(books),coreUnits=len(units),byGrade=dict(Counter(q['grade'] for q in manifest)),byBook=dict(Counter(q['book'] for q in manifest)),byCategory=dict(Counter(q['category'] for q in manifest)),byKind=dict(Counter(q['kind'] for q in manifest)),units=units))]:
 (ROOT/(name+'.json')).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(dict(lessons=len(lessons),questions=len(manifest),byGrade=dict(Counter(q['grade'] for q in manifest)),byCategory=dict(Counter(q['category'] for q in manifest))),ensure_ascii=False,indent=2))
