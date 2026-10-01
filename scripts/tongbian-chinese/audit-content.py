from pathlib import Path
import json,re,sys
sys.path.insert(0,'/tmp/learn-chinese/deps')
from pypinyin import lazy_pinyin,Style
ROOT=Path('content/tongbian-chinese');src=json.loads((ROOT/'sources.json').read_text());books={b['id']:b for b in src['books']};manifest=json.loads((ROOT/'manifest.json').read_text())['questions'];overrides={
'招呼':'词中“呼”读轻声。','棉花':'此处指棉纤维，“花”读轻声。','脑袋':'词中“袋”读轻声。','扁担':'词中“担”读轻声。','队伍':'词中“伍”读轻声。','耷拉':'词中“拉”读轻声。','吆喝':'表示大声招呼叫卖时，“喝”读轻声。','舒服':'词中“服”读轻声。','琢磨':'表示思考，读zuó mo；雕刻打磨义才读zhuó mó。教材《昆虫备忘录》为思考义。','规矩':'词中“矩”读轻声。','稚子':'古诗中表示年幼的孩子，“子”读zǐ。','嘟囔':'词中“囔”读轻声。','汤汤':'《伯牙鼓琴》注音为shāng，水流大而急，不读tāng。'}
results=[];seen=set()
for q in manifest:
 proof=q.get('proof')
 if not proof or proof.get('type')!='pinyin':continue
 word=proof['word'];actual=proof['pinyin'];expected=' '.join(lazy_pinyin(word,style=Style.TONE));same=actual==expected
 if not same:assert word in overrides,(word,actual,expected);seen.add(word)
 results.append(dict(word=word,book=q['book'],pinyin=actual,dictionaryPinyin=expected,match=same,reviewNote=None if same else overrides[word],source=q['source']))
assert seen==set(overrides)
poetry=[]
for m in json.loads((ROOT/'poems.json').read_text()):
 ps=Path('/tmp/learn-chinese/'+m['book']+'.txt').read_text().split('\f')
 for p in m['poems']:
  text=''.join(re.findall('[\u4e00-\u9fff]',ps[p['page']+4]));lines=[]
  for l in p['lines']:
   needle=''.join(re.findall('[\u4e00-\u9fff]',l));assert needle in text,(m['book'],p['title'],l);lines.append(needle)
  assert p['author'] in text,(m['book'],p['title'],p['author'])
  assert p['dynasty'] in text
  poetry.append(dict(book=m['book'],title=p['title'],printedPage=p['page'],linesVerified=True,authorVerified=True,dynastyVerified=True))
pending=[]
for b in src['books']:
 ps=Path('/tmp/learn-chinese/'+b['id']+'.txt').read_text().split('\f')
 for i,t in enumerate(ps):
  if i<5:continue
  found=re.findall('看图|写一写|写一篇|习作|口语交际|朗读|背诵|默写|表演',t)
  if found:pending.append(dict(book=b['id'],pdfPage=i+1,printedPage=i-4,activities=sorted(set(found)),reason='原题含看图、书写、朗读或开放表达等活动；本批以可判分知识练习覆盖，活动原题尚未逐题数字化'))
(ROOT/'pinyin-audit.json').write_text(json.dumps(dict(dictionary='pypinyin 0.55.0 (cross-check only)',checked=len(results),exactMatches=sum(r['match'] for r in results),contextualOverrides=len(seen),entries=results),ensure_ascii=False,indent=2)+'\n')
(ROOT/'source-audit.json').write_text(json.dumps(dict(totalPdfPages=sum(b['pages'] for b in src['books']),allPagesTextExtracted=True,printedPageOffset=5,visualReview='12 册各至少一页目录；一年级上册第 6 页实图验证页码偏移。古诗正文、作者和朝代逐首与原 PDF 文本核对。',poems=poetry),ensure_ascii=False,indent=2)+'\n')
(ROOT/'pending-activity-pages.json').write_text(json.dumps(pending,ensure_ascii=False,indent=2)+'\n')
print('pinyin',len(results),'exact',sum(r['match'] for r in results),'reviewed overrides',len(seen),'poems verified',len(poetry),'activity pages',len(pending))
