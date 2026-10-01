"""Conservative arithmetic extraction. Ambiguous/vertical/image tasks stay pending."""
from pathlib import Path
import json,re,unicodedata,ast
from fractions import Fraction
ROOT=Path('/tmp/learn-bnu');OUT=Path('content/bnu-math')
books=json.loads((OUT/'sources.json').read_text())['books']
def norm(s):
 return re.sub(r'\s+','',unicodedata.normalize('NFKC',s)).translate(str.maketrans({'×':'*','x':'*','X':'*','÷':'/','−':'-','—':'-','–':'-','﹣':'-','＋':'+','（':'(', '）':')'}))
def parse(s):
 s=norm(s)
 # A complete horizontal expression only; never infer missing operators/digits.
 m=re.fullmatch(r'([0-9.()+*/-]+)(?:=([0-9.]+|[\[\]〇○口□OOC()]*))?',s)
 if not m:return None
 expr=m[1]
 if not re.search(r'[+*/-]',expr) or re.search(r'(^|[+*/(-])0\d',expr):return None
 if '/' in expr and not '÷' in unicodedata.normalize('NFKC',s): pass
 # Slashes in OCR are fraction bars/long division too: accept only true division glyph source.
 if '/' in expr and '÷' not in unicodedata.normalize('NFKC',original[0]):return None
 if re.search(r'\d\.\d',expr) and re.search(r'\.\D|\.$',expr):return None
 try:
  t=ast.parse(expr,mode='eval')
  def calc(n):
   if isinstance(n,ast.Constant) and isinstance(n.value,(int,float)):return Fraction(str(n.value))
   if isinstance(n,ast.BinOp) and isinstance(n.op,(ast.Add,ast.Sub,ast.Mult,ast.Div)):
    a,b=calc(n.left),calc(n.right)
    return a+b if isinstance(n.op,ast.Add) else a-b if isinstance(n.op,ast.Sub) else a*b if isinstance(n.op,ast.Mult) else a/b
   raise ValueError()
  value=calc(t.body)
  if value<0 or value>100000000:return None
  if len(re.findall(r'\d+(?:\.\d+)?',expr))>6:return None
  if not 2<=len(re.findall(r'\d+(?:\.\d+)?',expr)):return None
  if m[2] and re.fullmatch(r'\d+(?:\.\d+)?',m[2]) and Fraction(m[2])!=value:return None
  if value.denominator!=1:
   # Fractions are handled separately, avoid accidental nonterminating decimal questions.
   d=value.denominator
   for f in [2,5]:
    while d%f==0:d//=f
   if d!=1:return None
  return expr,str(value)
 except (SyntaxError,ValueError,ZeroDivisionError,RecursionError):return None
candidates=[];rejected=[]
for b in books:
 for p in sorted((ROOT/('math-'+b['id'])).glob('*.json')):
  d=json.loads(p.read_text());page=d['page'];printed=page-4
  if printed<2 or printed>b['pages']-12:continue
  unit=next((u['name'] for u in reversed(b['units']) if printed>=u['startPrintedPage']),'校园数学')
  zhpath=ROOT/('ocr-'+b['id'])/p.name
  zh=json.loads(zhpath.read_text())['lines'] if zhpath.exists() else []
  for i,l in enumerate(d['lines']):
   original=[l['text']];parsed=parse(l['text'])
   if not parsed:continue
   expr,value=parsed
   # Reject boxes mistaken for zero in early learning materials, except explicit 0 exercises reviewed later.
   if re.search(r'(^|[+*/(-])0($|[+*/)])',expr):continue
   nums=re.findall(r'\d+(?:\.\d+)?',expr)
   if b['grade']==1 and any(Fraction(n)>100 for n in nums):continue
   if b['grade']==1 and any(op in expr for op in '*/'):continue
   if l['box'][1]<.03 or l['box'][1]>.95:continue
   same=[]
   for z in zh:
    if abs(z['box'][0]-l['box'][0])<.03 and abs(z['box'][1]-l['box'][1])<.015:
     same.append(z['text'])
   candidates.append(dict(key=f'{b["id"]}-p{page}-{i}',book=b['id'],grade=b['grade'],term=b['term'],unit=unit,pdfPage=page,printedPage=printed,expression=expr,value=value,raw=l['text'],box=l['box'],chineseOCR=same))
# Keep one occurrence per book/expression and record provenance of duplicates.
seen={};unique=[];duplicates=[]
for c in candidates:
 k=(c['book'],c['expression'])
 if k in seen:duplicates.append(dict(key=c['key'],sameAs=seen[k]));continue
 seen[k]=c['key'];unique.append(c)
(OUT/'arithmetic-candidates.json').write_text(json.dumps(unique,ensure_ascii=False,indent=2)+'\n')
(OUT/'arithmetic-duplicates.json').write_text(json.dumps(duplicates,ensure_ascii=False,indent=2)+'\n')
from collections import Counter
print('candidates',len(unique),dict(Counter(c['book'] for c in unique)),'duplicate occurrences',len(duplicates))
