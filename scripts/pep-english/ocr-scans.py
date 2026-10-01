from pathlib import Path
import json,subprocess,concurrent.futures
root=Path('/tmp/learn-pep-english');books=json.loads(Path('content/pep-english/sources.json').read_text())['books'];targets=[b for b in books if len((root/(b['id']+'.txt')).read_text())<1000]
def process(b):
 out=root/('ocr-'+b['id'])
 with open(root/(b['id']+'-ocr.log'),'w') as log:subprocess.run(['/tmp/learn-bnu/ocr-math',str(root/b['name']),str(out)],stdout=log,stderr=log,check=True)
 pages=[json.loads(p.read_text()) for p in sorted(out.glob('*.json'))];assert len(pages)==b['pages']
 (root/(b['id']+'.txt')).write_text('\f'.join('\n'.join(l['text'] for l in p['lines']) for p in pages)+'\f');print(b['id'],'OCR complete',len(pages),flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as ex:list(ex.map(process,targets))
print('ALL OCR COMPLETE',flush=True)
