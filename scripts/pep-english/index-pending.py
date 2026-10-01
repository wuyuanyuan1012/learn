"""Index source activities needing audio, free-form work or further expansion."""
import json,re
from pathlib import Path
root=Path('content/pep-english');s=json.loads((root/'sources.json').read_text());rows=[]
patterns={
 'listening':'listen',
 'oral-or-role-play':r'role.?play|let.s talk|ask and answer|do a survey|let.s survey|chant|sing again|retell|let.s act',
 'open-writing-or-drawing':r'let.s write|think and write|draw and|let.s make|let.s share|project time|write about|make a postcard',
}
for b in s['books']:
 pages=Path('/tmp/learn-pep-english/'+b['id']+'.txt').read_text().split('\f')
 for i,p in enumerate(pages):
  u=next((u for u in b['units'] if u['pdfStart']<=i+1<=u['pdfEnd']),None)
  # Only body pages. Include revision and starter, exclude appendices/credits.
  if i+1<=b['tocPdfPage'] or i+1>b['units'][-1]['pdfEnd']+(0 if b['id']=='g6b' else 6):continue
  for kind,pattern in patterns.items():
   excerpts=[line.strip() for line in p.splitlines() if re.search(pattern,line,re.I)]
   if excerpts:rows.append(dict(book=b['id'],unit=u['number'] if u else None,pdfPage=i+1,printedPage=i+1-b['printedPageOffset'],kind=kind,activityHeadings=list(dict.fromkeys(excerpts))[:8],status='not-imported-as-original-activity'))
out=dict(scope='按原页活动标题自动检索的待处理索引，OCR可能漏项。已导入的是知识点改编题，未宣称完成这些原始听说、制作或开放写作活动。',activities=rows)
(root/'pending-activities.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print('Indexed',len(rows),'page/activity-type entries')
