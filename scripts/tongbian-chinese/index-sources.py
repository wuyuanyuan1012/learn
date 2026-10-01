from pathlib import Path
import json,re,subprocess
p=Path('content/tongbian-chinese/sources.json');s=json.loads(p.read_text());early={'g1a':[6,20,40,54,67,80,93,104],'g1b':[2,17,29,43,54,67,82,102],'g2a':[1,16,28,43,58,71,85,99],'g2b':[1,16,29,42,57,71,86,102]}
for b in s['books']:
 pages=Path('/tmp/learn-chinese/'+b['id']+'.txt').read_text().split('\f');off=5;b['printedPageOffset']=off;b['textPages']=len(pages)-1
 if b['id'] in early:units=[dict(number=i+1,name='第'+'一二三四五六七八'[i]+'单元',startPrintedPage=n,startPdfPage=n+off) for i,n in enumerate(early[b['id']])]
 else:
  units=[]
  for m in re.finditer(r'第([一二三四五六七八])单元[^\d\n]{0,100}(\d+)', '\n'.join(pages[3:5])):
   n=int(m[2]);units.append(dict(number='一二三四五六七八'.index(m[1])+1,name='第'+m[1]+'单元',startPrintedPage=n,startPdfPage=n+off))
  units.sort(key=lambda x:x['number'])
  assert len(units)==(6 if b['id']=='g6b' else 8),(b['id'],units)
 b['units']=units
 for u in units:
  n=u['startPdfPage'];u['objectives']=[line.strip().lstrip('◎').strip() for line in pages[n-1].splitlines() if '◎' in line]
 # Render all TOC pages and first unit page, enough to verify extraction quality and offsets.
 for pg in ([4,5,6] if b['grade']==1 else [4,5]):
  if Path(f'/tmp/learn-chinese/{b["id"]}-toc{pg}.png').exists():continue
  subprocess.run(['pdftoppm','-f',str(pg),'-l',str(pg),'-scale-to','1400','-singlefile','-png','/tmp/learn-chinese/'+b['name'],f'/tmp/learn-chinese/{b["id"]}-toc{pg}'],stderr=subprocess.DEVNULL,check=True)
 print(b['id'],[(u['number'],u['startPrintedPage']) for u in units])
p.write_text(json.dumps(s,ensure_ascii=False,indent=2)+'\n')
