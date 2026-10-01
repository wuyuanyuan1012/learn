"""Build a reviewed, deterministic bank; source PDFs/text remain in /tmp."""
import json,re,uuid,unicodedata
from collections import Counter
from pathlib import Path
OUT=Path('content/pep-english');ROOT=Path('/tmp/learn-pep-english')
sources=json.loads((OUT/'sources.json').read_text());books={b['id']:b for b in sources['books']}
NS=uuid.UUID('a854783a-817a-44f2-906f-114a7bd947f0');batch='pep-starting-line-english-v1'
def ident(s):return str(uuid.uuid5(NS,s))
def norm(s):return re.sub(r'\s+','',unicodedata.normalize('NFKC',s)).lower()
def dump(name,obj): (OUT/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
def blocks(name):
 text=(OUT/name).read_text();return [b.strip().splitlines() for b in re.split(r'^@',text,flags=re.M)[1:]]
units={};manifest=[];lessons=[];audit=[]
for block in blocks('units.txt'):
 bid,num=block[0].split();num=int(num);book=books[bid];u=book['units'][num-1]
 vocab=[p.split('=') for p in block[1].split(';')];assert len(vocab)==5
 assert len(block[2:])==5,(bid,num,len(block))
 pages=(ROOT/(bid+'.txt')).read_text().split('\f')
 for word,meaning in vocab:
  hits=[i+1 for i in range(u['pdfStart']-1,u['pdfEnd']) if norm(word) in norm(pages[i])]
  audit.append(dict(book=bid,unit=num,word=word,meaning=meaning,pdfPages=hits))
 units[bid,num]=dict(vocab=vocab,applications=[line.split('|') for line in block[2:]])
assert len(units)==72
missing=[a for a in audit if not a['pdfPages']]
dump('vocabulary-source-audit.json',dict(entries=audit,unmatched=missing))
if missing: raise ValueError('Unmatched source vocabulary: '+json.dumps(missing,ensure_ascii=False))
# Application questions are original adaptations; a source range is a unit reference,
# not a claim that the original question or answer appears verbatim in the PDF.
def qmake(key,prompt,correct,wrong,explanation,context,source,kind,proof):
 assert len(wrong)==3 and len(set([correct]+wrong))==4,(key,correct,wrong)
 n=len(manifest);pos=n%4;options=wrong.copy();options.insert(pos,correct)
 q=dict(id=ident(key),prompt=prompt,context=context,options=options,answer=pos,
  hint=('在短文中找到与问题有关的句子，留意人物、时间和地点。' if context else '先读懂题意，留意关键词；句型题还要检查时间和主语。' if kind=='unit-language-adaptation' else '结合单词或短语的整体意思，排除不相符的中文释义。'),explanation=explanation)
 manifest.append(dict(questionId=q['id'],book=source['book'],unit=source['unit'],kind=kind,correctAnswer=correct,source=source,proof=proof))
 return q
def source(bid,num):
 b=books[bid];u=b['units'][num-1]
 return dict(book=bid,unit=num,unitTitle=u['title'],pdfStart=u['pdfStart'],pdfEnd=u['pdfEnd'],referenceType='unit-knowledge-reference')
def lesson(bid,key,title,category,nums,questions):
 b=books[bid];label=f"{b['grade']}年级{b['term']}";short=f"{b['grade']}{b['term'][0]}"
 tags=['人教新起点',label]+[f'第{n}单元' for n in nums]+['教材知识点改编']
 lessons.append(dict(id=ident(bid+'/'+key),title=f'人教新起点{short}·{title}',description=f"依据人教版（一年级起点）{label}相关单元知识点编写，10题配有提示和解析。",subject='english',grade=b['grade'],topic=title,category=category,tags=tags,minutes=7 if b['grade']<3 else 10,status='published',questions=questions))
for bid,b in books.items():
 for start in [1,3,5]:
  nums=[start,start+1];vq=[];aq=[]
  for num in nums:
   data=units[bid,num];s=source(bid,num)
   for idx,(word,meaning) in enumerate(data['vocab']):
    wrong=[data['vocab'][(idx+j)%5][1] for j in [1,2,3]]
    entry=next(a for a in audit if a['book']==bid and a['unit']==num and a['word']==word)
    vs={**s,'referenceType':'word-occurrence','pdfPages':entry['pdfPages']}
    vq.append(qmake(f'{bid}/u{num}/v{idx}',f'单词与短语：{word} 的中文意思是哪一项？',meaning,wrong,f'{word} 在本单元中表示“{meaning}”。','',vs,'source-vocabulary',dict(word=word,meaning=meaning)))
   for idx,row in enumerate(data['applications']):
    assert len(row)==6,(bid,num,row)
    prompt,correct,*tail=row;wrong=tail[:3];explanation=tail[3]
    aq.append(qmake(f'{bid}/u{num}/a{idx}',prompt,correct,wrong,explanation,'',s,'unit-language-adaptation',dict(rationale=explanation)))
  lesson(bid,f'v{start}',f'第{start}-{start+1}单元词汇','english-vocabulary',nums,vq)
  # Pair 3-4 focuses on form; pairs 1-2 and 5-6 on use in situations.
  cat='english-grammar' if start==3 else 'english-conversation'
  label='句型练习' if start==3 else '情景运用'
  lesson(bid,f'a{start}',f'第{start}-{start+1}单元{label}',cat,nums,aq)
reading_bybook={}
for block in blocks('readings.txt'):
 bid,num,title=block[0].split(' ',2);num=int(num);context=block[1].replace('\\n','\n')
 assert len(context)<=200,(bid,title,len(context))
 assert len(block[2:])==5,(bid,title,len(block[2:]))
 rq=[]
 for idx,row in enumerate(block[2:]):
  prompt,correct,w1,w2,w3,evidence=row.split('|');assert evidence in context,(title,evidence)
  rq.append(qmake(f'{bid}/r{title}/{idx}',f'阅读《{title}》：{prompt}',correct,[w1,w2,w3],f'短文中写道：“{evidence}” 因此应选“{correct}”。',context,source(bid,num),'original-reading-for-unit',dict(evidence=evidence)))
 reading_bybook.setdefault(bid,[]).append((num,rq,title,context))
for bid,rows in reading_bybook.items():
 assert len(rows)==2
 lesson(bid,'reading','主题短文阅读','english-reading',[r[0] for r in rows],rows[0][1]+rows[1][1])
allq=[q for l in lessons for q in l['questions']];assert len(allq)==840 and len(lessons)==84
prompts=[norm(q['prompt']) for q in allq];dupes=[p for p,n in Counter(prompts).items() if n>1]
assert not dupes,dupes
for q in allq:
 assert len(q['prompt'])<=300 and len(q['context'])<=200
for l in lessons:assert len(l['questions'])==10
lessonmap={q['id']:l for l in lessons for q in l['questions']}
for row in manifest:row.update(lessonId=lessonmap[row['questionId']]['id'],category=lessonmap[row['questionId']]['category'])
dump('lessons.json',lessons);dump('question-manifest.json',dict(batch=batch,questions=manifest))
coverage=dict(batch=batch,books=12,units=72,lessons=len(lessons),questions=len(allq),byGrade=[dict(grade=g,lessons=sum(l['grade']==g for l in lessons),questions=sum(len(l['questions']) for l in lessons if l['grade']==g)) for g in range(1,7)],byCategory=dict(Counter(l['category'] for l in lessons)),byBook=[dict(book=bid,units=[u['title'] for u in b['units']],lessons=7,questions=70) for bid,b in books.items()],scope='每个核心单元5道词汇题和5道语言运用题；每册10道原创阅读题。覆盖单元主题，不宣称逐题搬运或覆盖全部知识点。')
dump('coverage.json',coverage)
print(json.dumps(coverage,ensure_ascii=False))
