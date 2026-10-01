from pathlib import Path
import json,urllib.parse,urllib.request,concurrent.futures,hashlib,subprocess
root=Path('/tmp/learn-chinese');q=json.loads((root/'directory.json').read_text())['payload']['codeViewTreeRoute'];commit=q['refInfo']['currentOid'];items=q['tree']['items']
def fetch(x):
 name=x['name'];grade='一二三四五六'.index(name.split('语文')[1][0])+1;term='上册' if '上册' in name else '下册';bid=f'g{grade}'+('a' if term=='上册' else 'b');url='https://raw.githubusercontent.com/TapXWorld/ChinaTextbook/'+commit+'/'+urllib.parse.quote(x['path']);p=root/name
 if not p.exists():
  with urllib.request.urlopen(url,timeout=180) as r, open(str(p)+'.part','wb') as f:
   while chunk:=r.read(1024*1024):f.write(chunk)
  Path(str(p)+'.part').rename(p)
 info=subprocess.check_output(['pdfinfo',str(p)],text=True,stderr=subprocess.DEVNULL);pages=int(next(l.split(':')[1] for l in info.splitlines() if l.startswith('Pages:')))
 subprocess.run(['pdftotext','-layout',str(p),str(root/(bid+'.txt'))],check=True,stderr=subprocess.DEVNULL)
 text=(root/(bid+'.txt')).read_text();print(bid,pages,p.stat().st_size,'text chars',len(text),flush=True)
 return dict(id=bid,grade=grade,term=term,name=name,path=x['path'],url=url,sha256=hashlib.sha256(p.read_bytes()).hexdigest(),pages=pages,bytes=p.stat().st_size)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:books=list(pool.map(fetch,items))
books.sort(key=lambda x:x['id']);Path('content/tongbian-chinese/sources.json').write_text(json.dumps(dict(repository='https://github.com/TapXWorld/ChinaTextbook',commit=commit,books=books),ensure_ascii=False,indent=2)+'\n')
print('COMPLETE',sum(b['pages'] for b in books),flush=True)
