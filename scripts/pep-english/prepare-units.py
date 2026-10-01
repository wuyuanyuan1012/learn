import json
from pathlib import Path
spec={
'g1a':('School|Face|Animals|Numbers|Colours|Fruit',[4,12,20,30,38,46]),
'g1b':('Classroom|Room|Toys|Food|Drink|Clothes',[2,10,18,28,36,44]),
'g2a':('My Family|Boys and Girls|My Friends|In the Community|In the Park|Happy Holidays',[2,10,18,28,36,44]),
'g2b':('Playtime|Weather|Seasons|Time|My Day|My Week',[2,10,18,28,36,44]),
'g3a':('Myself|My Body|Food|Pets|Clothes|Birthdays',[2,12,22,38,48,58]),
'g3b':('School Subjects|My School|After School Activities|My Family|Family Activities|My Home',[2,12,22,38,48,58]),
'g4a':('Sports and Games|On the Weekend|Transportation|Asking for Help|Safety|Jobs',[2,12,22,38,48,58]),
'g4b':('My Neighbourhood|Cities|Travel Plans|Hobbies|Free Time|Countries',[2,12,22,38,48,58]),
'g5a':('Classmates|Teachers|Animals|Shopping Day|TV Shows|Chores',[2,14,26,44,56,68]),
'g5b':('Keeping Healthy|Special Days|Making Contact|Last Weekend|Have a Great Trip|Growing Up',[2,14,26,44,56,68]),
'g6a':('In China|Around the World|Animal World|Feelings|Famous People|Winter Vacation',[2,14,26,44,56,68]),
'g6b':('Visiting Canada|All Around Me|Daily Life|Free Time|Nature and Culture|Summer Vacation',[2,12,22,32,42,52])}
p=Path('content/pep-english/sources.json');s=json.loads(p.read_text())
for b in s['books']:
 titles,starts=spec[b['id']];offset=5 if b['id'].endswith('a') else 4
 b.update(printedPageOffset=offset,tocPdfPage=offset+1,tocVisuallyVerified=True)
 b['units']=[dict(number=i+1,title=t,printedStart=pg,pdfStart=pg+offset,printedEnd=(starts[i+1]-1 if i<5 else (61 if b['id']=='g6b' else 79 if b['grade']>=5 else 67 if b['grade']>=3 else 53 if b['id']=='g1a' else 51))) for i,(t,pg) in enumerate(zip(titles.split('|'),starts))]
 # Exclude revision pages at the ends of units 3 and 6.
 if b['id']!='g6b':b['units'][2]['printedEnd']=27 if b['id']=='g1a' else 25 if b['grade']<3 else 31 if b['grade']<5 else 37
 for u in b['units']:u['pdfEnd']=u['printedEnd']+offset
p.write_text(json.dumps(s,ensure_ascii=False,indent=2)+'\n')
for b in s['books']:
 pages=Path('/tmp/learn-pep-english/'+b['id']+'.txt').read_text().split('\f');print('\nBOOK',b['id'])
 for u in b['units']:
  print('UNIT',u['number'],u['title'])
  start=u['pdfStart']-1
  # Upper/lower grades introduce language at different page offsets.
  print('\n'.join(pages[start:start+4])[:2400])
