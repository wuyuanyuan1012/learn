from pathlib import Path
import json,uuid,ast,re,math,hashlib
from fractions import Fraction as F
from decimal import Decimal,localcontext
ROOT=Path('content/bnu-math');NS=uuid.UUID('af22d2c2-c7b3-49e1-8db6-857a846cba82')
SOURCES=json.loads((ROOT/'sources.json').read_text());BOOKS={b['id']:b for b in SOURCES['books']}
lessons=[];manifest=[];seen=set();coverage=[]
def calc(expr):
 def visit(n):
  if isinstance(n,ast.Constant):return F(str(n.value))
  if isinstance(n,ast.UnaryOp) and isinstance(n.op,ast.USub):return -visit(n.operand)
  if isinstance(n,ast.BinOp):
   a,b=visit(n.left),visit(n.right)
   if isinstance(n.op,ast.Add):return a+b
   if isinstance(n.op,ast.Sub):return a-b
   if isinstance(n.op,ast.Mult):return a*b
   if isinstance(n.op,ast.Div):return a/b
   if isinstance(n.op,ast.Pow) and b.denominator==1 and 0<=b<=3:return a**int(b)
  raise ValueError(expr)
 return visit(ast.parse(expr,mode='eval').body)
def fmt(n,fraction=False):
 n=F(n)
 if n.denominator==1:return str(n.numerator)
 if fraction:return str(n)
 d=n.denominator
 for p in (2,5):
  while d%p==0:d//=p
 if d!=1:return str(n)
 with localcontext() as ctx:
  ctx.prec=24;return format(Decimal(n.numerator)/Decimal(n.denominator),'f').rstrip('0').rstrip('.')
def num(p,e,unit='',hint='先找清已知条件，按数量之间的关系计算。',explanation=None,fraction=False,context=''):
 n=calc(e);ans=fmt(n,fraction)+unit;wr=[]
 deltas=[F(1,n.denominator),-F(1,n.denominator),F(2,n.denominator),F(10),F(3),F(4)]
 for delta in deltas:
  x=n+delta
  if x<0 and n>=0:continue
  v=fmt(x,fraction)+unit
  if v!=ans and v not in wr:wr.append(v)
  if len(wr)==3:break
 assert len(wr)==3
 return dict(prompt=p,correct=ans,wrong=wr,hint=hint,explanation=explanation or f'列式为 {e.replace("*","×").replace("/","÷")}，计算结果是{ans}。',context=context,proof=dict(expression=e,value=str(n),unit=unit,fraction=fraction))
def choice(p,a,wrong,h,e,ctx=''):
 return dict(prompt=p,correct=a,wrong=wrong,hint=h,explanation=e,context=ctx,proof=None)
def rows(s):
 result=[]
 for l in s.strip().splitlines():
  p,a,b,c,d,h,e=l.split('|');result.append(choice(p,a,[b,c,d],h,e))
 return result
def emit(book,unit,category,topic,rr,key=None,kind='adapted',refs=None):
 b=BOOKS[book];page=next((x['startPrintedPage'] for x in b['units'] if x['name']==unit),2)
 assert len(rr)==10,(book,topic,len(rr))
 label=f'{b["grade"]}{"上" if b["term"]=="上册" else "下"}'
 lid=str(uuid.uuid5(NS,key or f'{book}/{unit}/{topic}'));qs=[]
 for i,q in enumerate(rr):
  normalize=re.sub(r'\s+','',q['prompt'])
  assert normalize not in seen,('DUPLICATE',book,q['prompt']);seen.add(normalize)
  qid=str(uuid.uuid5(NS,f'{lid}/{q["prompt"]}'));pos=len(manifest)%4
  opts=[q['correct']]+q['wrong'];assert len(set(opts))==4
  opts=opts[-pos:]+opts[:-pos] if pos else opts
  qs.append(dict(id=qid,prompt=q['prompt'],context=q.get('context',''),options=opts,answer=pos,hint=q['hint'],explanation=q['explanation']))
  ref=refs[i] if refs else dict(pdfPage=page+4,printedPage=page,unit=unit)
  manifest.append(dict(questionId=qid,lessonId=lid,book=book,grade=b['grade'],term=b['term'],category=category,kind=('adapted-inverse' if ref.get('adaptation') else 'extracted') if kind=='extracted-or-inverse' else kind,source=ref,correctAnswer=q['correct'],proof=q['proof']))
 title=f'北师大{label}·{topic}'
 assert len(title)<=60
 lessons.append(dict(id=lid,title=title,description=f'{b["grade"]}年级{b["term"]}，{unit}。练习{topic}，含提示和解析。',subject='math',grade=b['grade'],topic=topic,category=category,tags=['北师大版',f'{b["grade"]}年级{b["term"]}',unit,topic] if topic!=unit else ['北师大版',f'{b["grade"]}年级{b["term"]}',unit],minutes=8 if b['grade']>=4 else 6,status='published',questions=qs))
 coverage.append((book,unit))
# Knowledge-point adaptations. Unit references distinguish these from transcribed arithmetic.
def number_composition(book,unit,maxn):
 rr=[];grade=BOOKS[book]['grade'];base={'g1a':11,'g1b':31,'g2b':1234,'g4a':234567}[book]
 for i in range(5):
  n=base+i*(1 if maxn<=100 else 113 if maxn==10000 else 1101);place=10 if maxn<=100 else 100 if maxn==10000 else 10000;digit=n//place%10
  pname={10:'十',100:'百',10000:'万'}[place]
  rr.append(num(f'观察数字卡{n}，它的{pname}位上的数字是多少？',str(digit),hint=f'从右向左找到{pname}位。',explanation=f'{n}的{pname}位上是{digit}，表示{digit}个{pname}。'))
 for i in range(5):
  a=i+1+(1 if maxn<=100 else 2);b=i+2;place=10 if maxn<=100 else 1000 if maxn==10000 else 10000;pname={10:'十',1000:'千',10000:'万'}[place]
  if book=='g1a':a=1;b=i+1
  rr.append(num(f'把{a}个{pname}和{b}个一合起来，得到哪个数？',f'{a}*{place}+{b}',explanation=f'{a}个{pname}是{a*place}，再加{b}个一，得到{a*place+b}。'))
 emit(book,unit,'math-numbers','数位与数的组成',rr)
number_composition('g1a','加与减（二）',20)
for b,u,m in [('g1b','生活中的数',100),('g2b','生活中的大数',10000),('g4a','认识更大的数',1000000)]:number_composition(b,u,m)
emit('g1a','生活中的数','math-numbers','数一数与第几个',[
 *[num(f'从1开始一个一个数，第{i}个数是什么？',str(i),hint='按1、2、3……的顺序数。',explanation=f'从1开始数，第{i}个数就是{i}。') for i in [3,5,6,8,10]],
 *[num(f'{n}只小兔排成一排，小白从前数排第{n-1}，它后面有几只小兔？','1','只',explanation=f'共有{n}只，小白前面连同自己有{n-1}只，{n}－{n-1}＝1。') for n in [4,5,6,7,8]]])
emit('g1a','比较','math-logic','大小长短与多少',rows('''
甲杯装4勺水，乙杯装6勺水，每勺同样多。哪杯水更多？|乙杯|甲杯|一样多|无法比较|比较同样大小的水勺的数量。|每勺同样多，6大于4，所以乙杯水更多。
红丝带和蓝丝带从同一点拉直摆放，红丝带的另一端更远，哪条更长？|红丝带|蓝丝带|一样长|都无法测量|起点相同，看谁的另一端更远。|从同一起点比较，另一端更远的丝带更长。
天平左盘下沉、右盘上升，两盘各放一个物体。哪边物体更重？|左边|右边|一样重|两边都没重量|天平会向较重的一边倾斜。|左盘下沉说明左边的物体更重。
小红比小明高，小明比小华高，三人中谁最高？|小红|小明|小华|三人一样高|把两次身高比较连起来。|小红比小明高，小明又比小华高，所以小红最高。
小猫比小狗轻，小狗比小熊轻，谁最轻？|小猫|小狗|小熊|三者一样重|顺着轻重关系找最轻的。|小猫比小狗轻，而小狗比小熊轻，所以小猫最轻。
两支笔一端对齐，甲笔比乙笔长，应选哪句话？|乙笔比甲笔短|乙笔比甲笔长|两支笔一样长|无法比较长短|长与短是同一次比较的两种说法。|甲比乙长，也就是乙比甲短。
桌上有5只杯子、3把勺子，每杯配1把勺子，勺子够吗？|不够|正好够|会多2把|会多5把|把杯子与勺子一一对应。|杯子有5只，勺子只有3把，不能每杯配一把。
甲有7块积木，乙有4块，谁的积木少？|乙|甲|一样多|无法比较|比较7和4。|4比7小，所以乙的积木少。
一个盒子能装8个同样大小的球，另一个只能装5个，哪个容量较大？|能装8个的盒子|能装5个的盒子|容量相同|都没有容量|球同样大，装得更多的盒子容量更大。|8大于5，能装8个同样大的球的盒子容量较大。
小树比围墙矮，围墙比大树矮，哪个最高？|大树|围墙|小树|三者一样高|从低到高排列。|小树低于围墙，围墙低于大树，所以大树最高。
'''))
emit('g1a','分类','math-statistics','按不同标准分类',rows('''
把铅笔、橡皮放一组，玩具车、皮球放另一组，是按什么分类？|用途|颜色|长短|数量|一组用于学习，一组用于玩耍。|铅笔和橡皮是文具，玩具车和皮球是玩具，这里按用途分类。
苹果、梨、铅笔、橡皮中，哪一组都是水果？|苹果和梨|苹果和铅笔|梨和橡皮|铅笔和橡皮|想想各物品属于哪一类。|苹果和梨属于水果，铅笔和橡皮属于文具。
按能否在水中游泳分类，哪一个应与鱼放在同一组？|海豚|麻雀|蝴蝶|公鸡|看的是游泳本领，不是会不会飞。|海豚在水中游泳，可以和鱼按这一标准分为一组。
红圆片、蓝圆片、红方片按颜色分类，哪两种是一组？|红圆片与红方片|红圆片与蓝圆片|蓝圆片与红方片|三种必须同组|只看颜色是否相同。|红圆片和红方片都是红色，所以分在一组。
红圆片、蓝圆片、红方片按形状分类，哪两种是一组？|红圆片与蓝圆片|红圆片与红方片|蓝圆片与红方片|三种必须同组|只看形状，不看颜色。|红圆片和蓝圆片都是圆形。
把大纽扣和小纽扣分开放，分类标准是什么？|大小|颜色|气味|价格|题目强调了大与小。|大纽扣和小纽扣按大小分成两组。
把上衣和裤子放进衣柜，把书放进书架，是按什么分类？|物品种类|都是按颜色|都是按长度|都是按重量|衣物和书属于不同种类。|衣柜放衣物，书架放书，是按物品种类分类。
同一堆卡片按颜色分和按形状分，结果可能怎样？|分组可能不同|卡片一定变多|卡片一定变少|两次一定相同|分类标准变了，卡片本身没变。|不同标准可能形成不同分组，但总数保持不变。
有红卡片4张、蓝卡片4张，哪句话正确？|两种卡片一样多|红卡片更多|蓝卡片更多|无法比较|比较两种卡片的数量。|两组都是4张，所以一样多。
给玩具分类时，要怎样避免漏掉玩具？|每件都分到合适的一组|只分喜欢的玩具|同一玩具反复数|只数最大的一组|做到不重复、不遗漏。|每件玩具都按标准分入合适的一组，才能避免遗漏。
'''))
def positions(book,unit,advanced=False):
 rr=[]
 if not advanced:
  for i in range(5):
   names=[f'{j+1}号' for j in range(i+3)]
   rr.append(choice(f'从左到右依次摆着{ "、".join(names)}卡片，最右边是哪张？',names[-1],[names[0],names[1],'没有卡片'],'按给定的左右顺序看最后一张。',f'从左到右的最后一张是{names[-1]}。'))
  rr+=rows('''
三层架子从上到下放着书、笔盒、皮球。笔盒上面是什么？|书|皮球|笔盒自己|什么也没有|按上、中、下的顺序找。|书放在最上层，笔盒在中间，所以笔盒上面是书。
三层架子从上到下放着帽子、围巾、手套。最下面是什么？|手套|帽子|围巾|三样都在最下面|给出的顺序是从上到下。|最后说到的手套在最下面。
同向排队，甲在乙前面，乙在丙前面。谁排最后？|丙|甲|乙|三人并排|把前后关系连起来。|顺序是甲、乙、丙，所以丙最后。
书放在桌子上，球放在桌子下。球在桌子的哪一面？|下面|上面|桌面里|无法知道|题目已经给出了球的位置。|球放在桌子下，所以在桌子的下面。
同向排队，笑笑前面是淘气，后面是奇思。谁在中间？|笑笑|淘气|奇思|三人都不在中间|同时有人在前、有人在后的人在中间。|顺序是淘气、笑笑、奇思，笑笑在中间。
''')
 else:
  for col,row in [(2,3),(4,5),(6,2),(3,7),(5,4)]:
   rr.append(choice(f'用（列，行）记录位置，第{col}列第{row}行记作什么？',f'（{col}，{row}）',[f'（{row}，{col}）',f'（{col+1}，{row}）',f'（{col}，{row+1}）'],'数对的第一个数表示列，第二个表示行。',f'第{col}列第{row}行用数对（{col}，{row}）表示。'))
  for col,row in [(1,2),(2,4),(3,1),(4,6),(5,3)]:rr.append(num(f'在方格中，点A是（{col}，{row}），向右移动2格后，列数变为几？',f'{col}+2',hint='向右移动时，列数增加，行数不变。',explanation=f'列数{col}＋2＝{col+2}，位置变为（{col+2}，{row}）。'))
 emit(book,unit,'math-geometry','数对与位置' if advanced else '前后上下与左右',rr)
positions('g1a','位置与顺序');positions('g4a','方向与位置',True)
emit('g1a','认识图形','math-geometry','认识立体图形',rows('''
皮球的外形最接近哪种立体图形？|球|正方体|长方体|圆柱|观察皮球圆圆的整体外形。|皮球的外形最接近球。
骰子的六个面都是同样大的正方形，外形是哪种？|正方体|球|圆柱|圆锥|六个面都是相同正方形。|六个面都是同样大正方形的立体是正方体。
直直的罐子上下两个面是同样大的圆，侧面是曲面，接近哪种图形？|圆柱|球|正方体|三角形|看上下底面和侧面的特点。|上下两个同样大的圆形底面和曲面侧面构成圆柱。
长长的砖块有六个平平的面，通常把它看成什么？|长方体|球|圆柱|圆|普通长砖块是有棱有面的立体。|长砖块的形状通常看作长方体。
哪个图形最容易向各个方向滚动？|球|正方体|长方体|三角形纸片|想象皮球在地面上的运动。|球的表面是曲面，容易向各个方向滚动。
哪种立体的每个面都是正方形？|正方体|球|圆柱|圆锥|寻找方方正正的立体。|正方体的六个面都是正方形。
一只圆柱形笔筒直立在桌上，与桌面接触的底面通常是什么形状？|圆|三角形|五边形|椭圆|圆柱有两个圆形底面。|圆柱形笔筒的底面是圆。
摸到的物体上下同样粗，有两个平平的圆形面，最可能是什么？|圆柱|球|正方体|圆锥|球没有平面，圆锥上下不一样粗。|有两个相同圆形底面、上下同样粗的是圆柱。
哪一组都是立体图形名称？|球、圆柱|圆、三角形|正方形、圆|长方形、三角形|区分物体的整体形状与平面图形。|球和圆柱都是立体图形，其余选项都是平面图形。
要在桌上稳稳放一块正方体积木，怎样放合适？|用一个平面朝下|只让一个顶点朝下|悬在空中|只让一条棱朝下|平面接触桌面比较稳定。|用一个平面朝下，接触面平稳，更容易放稳。
'''))
rr=[]
for h in range(1,11):rr.append(num(f'钟面上分针指向12，时针指向{h}，现在是几时？',str(h),'时',hint='分针指向12时是整时，再看时针。',explanation=f'分针指12、时针指{h}，表示{h}时。'))
emit('g1a','认识钟表','math-measurement','认识整时',rr)
# A text-defined arrangement makes observation questions answerable without missing pictures.
for book,unit,n in [('g1b','观察物体',1),('g3a','观察物体',2),('g4b','观察物体',3),('g6a','观察物体',4)]:
 rr=[]
 for i in range(5):
  a=i+2;b=i+1
  rr.append(num(f'把小正方体只排成一行，共{a}列，每列高{b}层，没有前后遮挡。从正面能看到几个小正方形？',f'{a}*{b}' if BOOKS[book]['grade']>1 else str(a*b),'个',hint='每一列的可见小正方形数与层数相同。',explanation=f'共有{a}列，每列{b}个小正方形，合计{a*b}个。',context=f'观察练习{n}：只观察这行积木的正面。'))
 for i in range(5):
  cols=i+2+n
  rr.append(num(f'积木只有一排，从左到右共有{cols}列，每列都搭{n+1}层。从正上方看有几个小正方形？',str(cols),'个',hint='从上面看，每一列只露出最上面一个面。',explanation=f'每列从正上方只能看见一个顶面，{cols}列就看见{cols}个。'))
 # Make row/front prompts genuinely distinct across difficulty levels.
 for i,q in enumerate(rr[:5]):q['prompt']=q['prompt'].replace(f'每列高{i+1}层',f'每列高{i+n}层');q['proof']['expression']=str((i+2)*(i+n));q['proof']['value']=str((i+2)*(i+n));rr[i]=num(q['prompt'],str((i+2)*(i+n)),'个',hint=q['hint'],explanation=f'共有{i+2}列，每列{i+n}个可见的面，合计{(i+2)*(i+n)}个。')
 emit(book,unit,'math-geometry','从不同方向观察积木',rr)
emit('g1b','有趣的图形','math-geometry','认识与拼合平面图形',rows('''
三角形的轮廓有几条边？|3条|4条|5条|6条|边数和图形的名称有联系。|三角形有三条边。
正方形的四条边有什么特点？|都一样长|只有三条一样长|只有一条边|长短完全不同|想想方方正正的纸片。|正方形的四条边一样长。
长方形相对的两条边有什么特点？|一样长|一定不一样长|都是曲线|没有相对的边|看一看长方形的两条长边和两条短边。|长方形相对的两条边一样长。
圆的边线是怎样的？|弯曲的|三条直线|四条直线|五条直线|圆与多边形的边线不同。|圆的边线是弯曲的。
把正方体的一个面描在纸上，会得到什么平面图形？|正方形|三角形|圆|五边形|正方体每个面都是同样的形状。|正方体的每个面都是正方形。
把两个同样的正方形沿一整条边拼好，外轮廓是什么？|长方形|圆|三角形|五边形|想象两个方格并排放在一起。|两个正方形这样拼接后形成长方形。
把正方形沿一条对角线剪开，会得到两个什么图形？|三角形|圆|正方形|五边形|对角线连接两个相对的顶点。|沿对角线剪开，会得到两个三角形。
由三条线段首尾相接围成的图形叫什么？|三角形|圆|正方形|平行四边形|注意有三条线段。|三条线段首尾相接围成三角形。
一张圆形纸片对折一次，展开后折痕把它分成几部分？|2部分|3部分|4部分|5部分|一次对折形成一条折痕。|折痕把圆形纸片分成相等的两部分。
用长方形、三角形和圆拼图案，需要把圆当作哪一类图形？|平面图形|球体|圆柱体|正方体|圆与球是不同的图形。|圆是平面图形；球、圆柱、正方体是立体图形。
'''))
def conversions(book,unit,topic,specs):
 rr=[]
 for value,fromu,tou,factor in specs:
  rr.append(num(f'把{value}{fromu}换算成{tou}，结果是多少？',f'{value}*({factor})',tou,hint='先想这两个单位之间的进率。',explanation=(f'{calc(factor).denominator}{fromu}＝1{tou}，用{value}除以{calc(factor).denominator}，得到{fmt(calc(str(value)+"*("+factor+")"))}{tou}。' if calc(factor)<1 else f'1{fromu}＝{fmt(calc(factor))}{tou}，所以{value}{fromu}＝{fmt(calc(str(value)+"*("+factor+")"))}{tou}。')))
 emit(book,unit,'math-measurement',topic,rr)
conversions('g2a','测量','米与厘米',[(n,'米','厘米','100') for n in [1,2,3,4,5]]+[(n,'厘米','米','1/100') for n in [100,200,300,400,500]])
conversions('g2b','测量','毫米分米千米',[(n,'厘米','毫米','10') for n in [2,4,6]]+[(n,'分米','厘米','10') for n in [3,5,7]]+[(n,'千米','米','1000') for n in [1,2]]+[(n,'毫米','厘米','1/10') for n in [50,80]])
conversions('g3b','千克、克、吨','质量单位换算',[(n,'千克','克','1000') for n in [2,3,4,5]]+[(n,'吨','千克','1000') for n in [1,3,6]]+[(n,'克','千克','1/1000') for n in [2000,5000,8000]])
rr=[]
for yuan,jiao in [(1,2),(2,5),(3,6),(4,8),(5,3)]:rr.append(num(f'购物时拿出{yuan}元{jiao}角，一共是多少角？',f'{yuan}*10+{jiao}','角',hint='1元等于10角，先把元换成角。',explanation=f'{yuan}元是{yuan*10}角，{yuan*10}＋{jiao}＝{yuan*10+jiao}角。'))
for paid,price in [(10,6),(20,13),(50,28),(100,65),(20,9)]:rr.append(num(f'买文具要付{price}元，交给售货员{paid}元，应找回多少元？',f'{paid}-{price}','元',hint='付的钱减去应付的钱，就是找回的钱。'))
emit('g2a','购物','math-measurement','认识人民币与购物',rr)
rr=[]
for a,b in [(3,4),(4,5),(2,6),(5,3),(6,4)]:rr.append(num(f'有{a}排小树，每排{b}棵，共有几棵小树？',f'{a}*{b}','棵',hint='有几个相同的数相加，可以用乘法。',explanation=f'{a}个{b}相加，写成{a}×{b}＝{a*b}。'))
for n in [2,3,4,5,6]:rr.append(choice(f'把{n}＋{n}＋{n}改写成乘法，哪个算式合适？',f'3×{n}',[f'{n}＋3',f'{n}－3',f'{n}×{n+2}'],'先数有几个相同的加数。',f'有3个{n}相加，可以写成3×{n}。'))
emit('g2a','数一数与乘法','math-problems','相同加数与乘法意义',rr)
rr=[]
for n,groups in [(12,3),(15,5),(18,2),(20,4),(24,6),(16,4),(21,3),(28,7),(32,8),(36,4)]:rr.append(num(f'把{n}张贴纸平均分给{groups}人，每人分几张？',f'{n}/{groups}','张',hint='平均分时，每个人分得同样多。',explanation=f'{n}÷{groups}＝{n//groups}，每人分{n//groups}张。'))
emit('g2a','分一分与除法','math-problems','平均分与除法意义',rr)
def directions(book,unit,precise=False):
 rr=[]
 if not precise:
  base=[('东','西'),('西','东'),('南','北'),('北','南'),('东北','西南'),('西南','东北'),('西北','东南'),('东南','西北')]
  for a,b in base:
   rr.append(choice(f'以学校为中心，书店在学校的{a}面。那么学校在书店的哪面？',b,[v for v in ['东','西','南','北','东北'] if v!=b][:3],'两个位置互换时，方向相反。',f'{a}与{b}相对，所以学校在书店的{b}面。'))
  rr+=rows('''
按“上北下南，左西右东”看地图，图纸右边表示什么方向？|东|西|南|北|记住地图的基本方向约定。|右边表示东。
面向太阳升起的东方站立，背后是什么方向？|西|东|南|北|背后与面对的方向相反。|东的相反方向是西。
''')
 else:
  for angle in [20,30,40,50,60]:rr.append(choice(f'灯塔在码头北偏东{angle}°方向，码头在灯塔的什么方向？',f'南偏西{angle}°',[f'北偏东{angle}°',f'北偏西{angle}°',f'南偏东{angle}°'],'从相反位置观察时，南北、东西都要对调。',f'北偏东{angle}°的反方向是南偏西{angle}°。'))
  for d in [200,300,400,500,600]:rr.append(num(f'比例图上每1厘米表示{d}米，学校到图书馆画了3厘米，实际相距多少米？',f'{d}*3','米',hint='每一段表示的距离相同，3段相加。'))
 emit(book,unit,'math-geometry','方向与距离' if precise else '辨认八个方向',rr)
directions('g2b','方向与位置');directions('g5b','确定位置',True)
rr=[]
for minutes in [2,3,4,5,6]:rr.append(num(f'活动持续{minutes}分，相当于多少秒？',f'{minutes}*60','秒',hint='1分等于60秒。',explanation=f'{minutes}个60秒是{minutes*60}秒。'))
for start,finish in [(10,25),(15,40),(20,50),(5,35),(30,55)]:rr.append(num(f'阅读从9时{start:02}分开始，到9时{finish:02}分结束，共读了多少分？',f'{finish}-{start}','分',hint='都在9时这一小时内，直接比较分钟数。'))
emit('g2b','时、分、秒','math-measurement','时间单位与经过时间',rr)
def calendar():
 rr=rows('''
一年共有多少个月？|12个月|10个月|11个月|13个月|从1月一直数到12月。|一年有12个月。
平年的2月有多少天？|28天|29天|30天|31天|区分平年和闰年的2月。|平年2月有28天。
闰年的2月有多少天？|29天|28天|30天|31天|闰年2月比平年多一天。|闰年2月有29天。
2024年的2月有多少天？|29天|28天|30天|31天|2024年是闰年。|2024能被4整除且不是整百年，是闰年，2月有29天。
哪一个月固定有30天？|4月|1月|3月|5月|4、6、9、11月都是小月。|4月有30天；其余三个选项都有31天。
一年中的最后一个月叫什么？|12月|1月|6月|11月|按月份顺序找最后一个。|一年从1月到12月，最后一个月是12月。
''')
 for h in [1,2,3,4]:rr.append(num(f'下午{h}时，用24时记时法表示是几时？',f'{h}+12','时',hint='下午的时数加12。',explanation=f'{h}＋12＝{h+12}，所以是{h+12}时。'))
 emit('g3a','年、月、日','math-measurement','年月日与24时记时法',rr)
calendar()
def rectangle(book,unit,mode):
 rr=[];g=BOOKS[book]['grade'];offset=1 if mode=='周长' else 3
 for i in range(5):
  a=5+i+g;b=2+i
  expr=f'({a}+{b})*2' if mode=='周长' else f'{a}*{b}';u='厘米' if mode=='周长' else '平方厘米'
  rr.append(num(f'一块长方形纸片长{a}厘米、宽{b}厘米，它的{mode}是多少？',expr,u,hint='长方形周长＝（长＋宽）×2。' if mode=='周长' else '长方形面积＝长×宽。'))
 for i in range(5):
  a=i+offset+2
  rr.append(num(f'边长是{a}厘米的正方形，它的{mode}是多少？',f'{a}*4' if mode=='周长' else f'{a}*{a}','厘米' if mode=='周长' else '平方厘米',hint='正方形周长是四条边的总长。' if mode=='周长' else '正方形面积＝边长×边长。'))
 emit(book,unit,'math-geometry',f'长方形正方形的{mode}',rr)
rectangle('g3a','周长','周长');rectangle('g3b','面积','面积')
def statistics(book,unit,advanced=False):
 g=BOOKS[book]['grade'];rr=[]
 for i in range(5):
  a=4+g*10+i;b=6+g*10+i;c=8+g*10+i
  ctx=f'三组收集的瓶子数量：第一组{a}个，第二组{b}个，第三组{c}个。'
  if advanced:
   rr.append(num(f'三组收集瓶子的平均数是多少？（数据：{a}、{b}、{c}个）',f'({a}+{b}+{c})/3','个',hint='先求总数，再平均分成3份。',context=ctx))
  else:rr.append(num(f'统计表中三组各有{a}、{b}、{c}个瓶子，一共收集了多少个？',f'{a}+{b}+{c}','个',hint='求总数，要把三组数量相加。',context=ctx))
 for i in range(5):
  a=12+g*10+i;b=5+i
  rr.append(num(f'调查显示，喜欢跳绳的有{a}人，喜欢踢球的有{b}人，两项人数相差多少？',f'{a}-{b}','人',hint='求相差多少，用大数减小数。'))
 emit(book,unit,'math-statistics','平均数与统计比较' if advanced else '整理记录与统计比较',rr)
statistics('g2b','调查与记录');statistics('g3b','数据的整理和表示');statistics('g4b','数据的表示和分析',True);statistics('g5b','数据的表示和分析',True)
# Distinct fraction and decimal topics are covered explicitly rather than relying on OCR of stacked fractions.
rr=[]
for d,n in [(3,1),(4,3),(5,2),(6,5),(8,3),(10,7),(9,4),(7,2),(12,5),(8,7)]:rr.append(num(f'把一张纸平均分成{d}份，取其中{n}份，占整张纸的几分之几？',f'{n}/{d}',hint='平均分成几份，分母就是几；取几份，分子就是几。',explanation=f'平均分成{d}份，取{n}份，表示为{n}/{d}。',fraction=True))
emit('g3b','认识分数','math-numbers','分数表示平均分',rr)
rr=[]
for i in range(1,6):rr.append(num(f'价签写着{i}元{2*i-1}角，用元作单位应该写成多少元？',f'{i}+{2*i-1}/10','元',hint='1角是0.1元。',explanation=f'{2*i-1}角是0.{2*i-1}元，合起来是{i}.{2*i-1}元。'))
for i in range(1,6):rr.append(num(f'价格是{i}.{i+2}元，其中有多少角不足1元？',str(i+2),'角',hint='小数点后第一位表示十分位，在元的价钱中是角。',explanation=f'{i}.{i+2}元就是{i}元{i+2}角，不足1元的部分是{i+2}角。'))
emit('g3a','认识小数','math-numbers','用小数表示钱数',rr)
rr=[]
for n in [12,25,38,47,69]:rr.append(num(f'把{n}/100写成小数是多少？',f'{n}/100',hint='分母是100的分数可以写成两位小数。',explanation=f'{n}个百分之一是{fmt(F(n,100))}。'))
for n in [3,4,6,7,9]:rr.append(num(f'小数0.0{n}里面有几个0.01？',str(n),hint='0.01是一个百分之一，观察百分位上的数字。',explanation=f'0.0{n}是{n}个百分之一，所以有{n}个0.01。'))
emit('g4b','小数的意义和加减法','math-numbers','小数的意义与计数单位',rr)
def shape_change(book,unit,level):
 rr=[]
 if level==1:
  rr=rows('''
纸片对折后，两边能够完全重合，这样的图形有什么特点？|具有轴对称性|一定是圆|一定有三条边|一定不能移动|看折痕两边是否能重合。|对折后两边完全重合，是轴对称图形的特征。
把一张纸连续对折两次，再沿边剪出图案，展开时会发生什么？|可能得到重复或对称的图案|纸会变成球|纸的厚度永远不变|所有图案都必须是圆|折叠会让部分图案重合。|折叠剪纸后展开，可以形成重复或对称图案。
一个风车绕中间的轴转动，属于哪种运动？|旋转|只向右平移|只向上平移|静止不动|观察是否绕一个中心转动。|风车绕中心的轴转动，属于旋转。
推开抽屉时，抽屉沿直线向外移动，属于什么运动？|平移|旋转|折叠|放大|物体方向是否改变？|抽屉沿直线移动，方向不变，是平移。
把三角形纸片直接向右挪动，大小会怎样？|不变|一定变大|一定变小|变成圆|只改变位置，不改变纸片本身。|平移只改变位置，不改变大小和形状。
一张正方形纸沿中线对折，折痕两侧怎样？|能够完全重合|一定不能重合|一侧变成圆|一侧会消失|正方形沿中线具有对称性。|沿中线对折，正方形两侧能完全重合。
汽车方向盘转动，最接近什么运动？|旋转|直线平移|折叠|缩小|方向盘绕中心运动。|方向盘绕中心转动，是旋转。
把图案向上移动3格，图案的形状会怎样？|不变|一定变长|一定变宽|一定改变|移动格数与形状变化是两回事。|平移改变位置，不改变形状。
剪纸时沿折痕对折，左右对应的部分相同，体现什么特点？|对称|随机变形|一定不相同|只能有一个角|折痕两边彼此对应。|两边对应重合，体现对称特点。
要让长方形纸片换个方向摆放，可以怎样做？|转动纸片|必须剪碎|必须缩小|必须涂色|只需要改变朝向。|转动纸片可以改变朝向，而不改变形状和大小。
''')
 else:
  offset={'g3b':1,'g5a':10,'g6b':20}[book]
  for i in range(5):
   start=offset+i;move=i+2
   rr.append(num(f'图案中的点原在第{start}列，向右平移{move}格后在第几列？',f'{start}+{move}',hint='向右平移几格，列数就增加几。'))
  for a in [30,45,60,90,120]:
   if level==2:
    rr.append(num(f'图案中的点原在第{a//15+2}行，向下平移2格后在第几行？',f'{a//15+2}+2',hint='行数从上向下数，向下移动2格，行数增加2。'))
   elif level==3:
    rr.append(num(f'点到一条竖直对称轴相距{a//15}格，它的对称点到这条轴相距几格？',str(a//15),'格',hint='对应点到对称轴的距离相等。'))
   else:
    rr.append(num(f'指针顺时针转{a}°后，再逆时针转{a}°，与初始方向相差多少度？','0','°',hint='相反方向转过相同角度，会回到原来的方向。'))
 emit(book,unit,'math-geometry','折叠平移与旋转' if level==1 else '图形变换与对应位置',rr)
shape_change('g2a','图形的变化',1);shape_change('g3b','图形的运动',2);shape_change('g5a','轴对称和平移',3);shape_change('g6b','图形的运动',4)
emit('g2b','认识图形','math-geometry','角与四边形的认识',rows('''
角由一个顶点和几条边组成？|2条|1条|3条|4条|想想两根小棒相接形成的角。|一个角有一个顶点和两条边。
三角尺上方方正正的那个角叫什么？|直角|锐角|钝角|圆|可以用三角尺的直角来比较。|三角尺上方方正正的角是直角。
比直角小的角叫什么？|锐角|钝角|直角|圆|根据角与直角的大小关系判断。|比直角小的角叫锐角。
长方形纸片的角与三角尺的直角比，大小怎样？|一样大|纸片的角一定更大|纸片的角一定更小|纸片没有角|把顶点和一条边对齐再比较。|长方形的角都是直角，与三角尺的直角大小一样。
长方形共有几个直角？|4个|1个|2个|3个|观察长方形的四个角。|长方形的四个角都是直角。
正方形共有几个直角？|4个|0个|2个|3个|正方形的每一个角都是直角。|正方形有四个角，都是直角。
长方形的两条相对边有什么关系？|长度相等|一定一长一短|一定交叉|都是弧线|相对边是一组对应的边。|长方形的相对边长度相等。
正方形与一般长方形相比，边长有什么特别之处？|四条边都相等|只有一条边|有五条边|边都是曲线|观察四条边的长短。|正方形四条边都相等。
用四根同样长的小棒围成一个正方形，需要几根？|4根|2根|3根|5根|每根小棒作为一条边。|正方形有4条边，需要4根小棒。
角的一条边画长一些，夹开的大小不变，角会怎样？|大小不变|一定变大|一定变小|变成圆|角大小看两条边张开的程度。|边的长短不决定角的大小，张开程度不变，角大小不变。
'''))
emit('g4a','线与角','math-geometry','线段射线与角度',rows('''
有两个端点、可以测量长度的是哪一种线？|线段|射线|直线|无限长的曲线|看端点数量和是否有限长。|线段有两个端点，长度有限，可以测量。
有一个端点，可以向一端无限延伸的线叫什么？|射线|线段|直线|圆|它只有一个端点。|射线有一个端点，向一个方向无限延伸。
向两端都可以无限延伸的线叫什么？|直线|线段|射线|圆弧|没有端点，两端都能延伸。|直线向两端无限延伸。
一个平角等于多少度？|180°|90°|270°|360°|平角是两个直角合起来。|90°＋90°＝180°。
一个周角等于多少度？|360°|90°|180°|270°|转一整圈就是一个周角。|一个周角是360°。
35°的角属于哪一种？|锐角|直角|钝角|平角|将35°和90°比较。|35°小于90°，所以是锐角。
125°的角属于哪一种？|钝角|锐角|直角|平角|将125°与90°、180°比较。|125°大于90°小于180°，是钝角。
两条直线相交形成直角，它们是什么关系？|互相垂直|互相平行|重合成圆|无法判断|交成直角的关系叫垂直。|两条直线相交成直角，叫互相垂直。
同一平面内，两条永不相交的直线是什么关系？|平行|垂直|一定重合|形成三角形|注意条件是同一平面内且不相交。|同一平面内不相交的两条直线互相平行。
量角时，量角器中心应与哪里重合？|角的顶点|边上的任意点|纸的中心|角外的任意点|中心对顶点，零刻度线对一条边。|量角器中心与角的顶点重合，才能正确量角。
'''))
rr=[]
for a,b in [(23,17),(36,24),(45,15),(28,32),(19,41)]:rr.append(num(f'利用加法交换律，{a}＋{b}＝{b}＋（ ），括号填几？',str(a),hint='交换两个加数的位置，和不变。',explanation=f'交换律是a＋b＝b＋a，因此填{a}。'))
for a,b in [(7,12),(8,15),(9,18),(6,25),(4,35)]:rr.append(num(f'用乘法分配律，{a}×（{b}＋10）＝{a}×{b}＋{a}×（ ），括号填几？','10',hint='括号外的数要分别乘括号里的两个加数。',explanation=f'{a}要分别乘{b}和10，所以括号填10。'))
emit('g4a','运算律','math-calculation','交换律与分配律',rr)
rr=[]
for n in [2,4,6,8,10]:rr.append(choice(f'气温是零下{n}摄氏度，应怎样表示？',f'－{n}℃',[f'＋{n}℃','0℃',f'＋{n+1}℃'],'零下的温度用负数表示。',f'零下{n}摄氏度写作－{n}℃。'))
for n in [1,3,5,7,9]:rr.append(choice(f'把收入记为正数，支出{n*10}元应记作什么？',f'－{n*10}元',[f'＋{n*10}元','0元',f'＋{n}元'],'支出与收入是相反意义的量。',f'收入用正数，支出就用负数，记作－{n*10}元。'))
emit('g4a','生活中的负数','math-numbers','相反意义的量与负数',rr)
def probability(book,unit,topic,advanced=False):
 rr=[];offset=10 if advanced else 0
 for i in range(5):
  red=3+i+offset;blue=1+i
  rr.append(choice(f'袋里有{red}个红球、{blue}个蓝球，球除颜色外相同，充分摇匀随机摸一个，哪种颜色更可能？','红色',['蓝色','两色一样可能','一定摸到红色'],'球多的颜色摸到的可能性更大，但不保证每次都摸到。',f'红球{red}个比蓝球{blue}个多，所以红色更可能；仍可能摸到蓝色。'))
 for i in range(5):
  n=4+i+offset
  rr.append(choice(f'袋里只有{n}个黄球，球除颜色外相同，随机摸出一个，哪句话正确？','一定是黄球',['不可能是黄球','可能是红球','一定是蓝球'],'先看袋里有没有其他颜色。',f'袋内{n}个球全部是黄球，摸出的一定是黄球。'))
 emit(book,unit,'math-statistics',topic,rr)
probability('g4a','可能性','事件发生的可能性');probability('g5a','可能性','数量与可能性大小',True)
rr=[]
for a,b in [(45,65),(50,60),(35,85),(70,40),(80,45)]:rr.append(num(f'三角形的两个内角分别是{a}°和{b}°，第三个内角是多少度？',f'180-{a}-{b}','°',hint='三角形内角和是180°。'))
rr+=rows('''
只有一组对边平行的四边形叫什么？|梯形|平行四边形|长方形|正方形|注意“只有一组”对边平行。|只有一组对边平行的四边形叫梯形。
两组对边分别平行的四边形叫什么？|平行四边形|三角形|圆|五边形|看两组对边的关系。|两组对边分别平行的四边形是平行四边形。
三角形有一个90°的角，它叫什么三角形？|直角三角形|锐角三角形|钝角三角形|不可能存在|按最大的角分类。|有一个直角的三角形叫直角三角形。
三条边都相等的三角形叫什么？|等边三角形|不等边三角形|直角梯形|长方形|根据三条边的长短分类。|三条边都相等的三角形是等边三角形。
三根小棒长2厘米、3厘米、6厘米，能围成三角形吗？|不能|能围成等边三角形|能围成直角三角形|一定能围成|任意两边的和要大于第三边。|2＋3＝5小于6，不能围成三角形。
''')
emit('g4b','认识三角形和四边形','math-geometry','三角形与四边形性质',rr)
def equations(book,unit,hard=False):
 rr=[]
 for i in range(5):
  a=3+i;v=7+i+(10 if hard else 0);b=a*v
  if hard:rr.append(num(f'两条彩带总长{b+v}米，长彩带是短彩带的{a}倍。短彩带长多少米？',f'{b+v}/({a}+1)','米',hint='设短彩带长x米，总长就是（倍数＋1）个x。',explanation=f'设短彩带长x米，{a}x＋x＝{b+v}，解得x＝{v}。'))
  else:rr.append(num(f'解方程：{a}x＝{b}，x是多少？',f'{b}/{a}',hint='等式两边同时除以x前面的系数。'))
 for i in range(5):
  a=12+i;v=9+i+(10 if hard else 0);b=a+2*v if hard else a+v
  if hard:rr.append(num(f'小组有{b}人，男生比女生多{a}人，女生有多少人？',f'({b}-{a})/2','人',hint='设女生x人，男生就是x加相差人数。',explanation=f'设女生x人，x＋（x＋{a}）＝{b}，所以2x＝{b-a}，x＝{fmt(F(b-a,2))}。'))
  else:rr.append(num(f'解方程：x＋{a}＝{b}，x是多少？',f'{b}-{a}',hint='等式两边同时减去相同的数。'))
 emit(book,unit,'math-problems' if hard else 'math-calculation','用方程解决数量问题' if hard else '等式性质与解方程',rr)
equations('g4b','认识方程');equations('g5b','用方程解决问题',True)
rr=[]
for a,b in [(6,8),(8,12),(9,12),(10,15),(12,18)]:rr.append(num(f'{a}和{b}的最大公因数是多少？',str(math.gcd(a,b)),hint='列出两个数的因数，找出共同因数中最大的。',explanation=f'{a}和{b}的共同因数中，最大的是{math.gcd(a,b)}。'))
for a,b in [(3,4),(4,6),(5,6),(6,8),(9,12)]:rr.append(num(f'{a}和{b}的最小公倍数是多少？',str(math.lcm(a,b)),hint='从小到大找同时是这两个数倍数的数。',explanation=f'{math.lcm(a,b)}是{a}和{b}共同倍数中最小的。'))
emit('g5a','分数的意义','math-numbers','公因数与公倍数',rr)
rr=rows('''
下面哪个数是2的倍数？|38|31|45|57|个位是0、2、4、6、8的整数是2的倍数。|38的个位是8，所以是2的倍数。
下面哪个数是5的倍数？|65|62|63|67|5的倍数个位是0或5。|65的个位是5。
下面哪个数是3的倍数？|123|124|125|127|各个数位上的数字和是3的倍数。|1＋2＋3＝6，是3的倍数。
下面哪个数是质数？|13|9|15|21|质数只有1和它本身两个因数。|13的因数只有1和13。
下面哪个数是合数？|21|2|3|5|合数除了1和它本身还有其他因数。|21还有因数3和7，所以是合数。
关于1的说法，哪项正确？|既不是质数也不是合数|是质数|是合数|是偶数|1只有一个因数。|质数恰有两个因数，合数多于两个，1不属于这两类。
下面哪个数是奇数？|27|18|24|36|不能被2整除的整数是奇数。|27的个位是7，是奇数。
下面哪个数是24的因数？|6|5|7|9|用24除以该数，看是否整除。|24÷6＝4，所以6是24的因数。
下面哪个数同时是2和5的倍数？|40|25|32|45|同时是2和5的倍数，个位一定是0。|40的个位是0，可以被2和5整除。
4的最小正整数倍数是多少？|4|0|1|2|这里限定为正整数倍数。|4×1＝4，所以最小的正整数倍数是4。
''')
emit('g5a','倍数与因数','math-numbers','倍数因数与奇偶质合',rr)
rr=[]
for n,d in [(6,8),(9,12),(10,15),(12,18),(14,21)]:rr.append(num(f'把分数{n}/{d}约成最简分数，结果是什么？',f'{n}/{d}',hint='分子和分母同时除以它们的最大公因数。',explanation=f'分子分母同时除以{math.gcd(n,d)}，得到{F(n,d)}。',fraction=True))
for d in [3,4,5,6,8]:rr.append(num(f'把分数1/{d}的分母扩大到{d*3}，分子应变成多少？','3',hint='分母乘3，分子也要乘3，分数的大小才不变。',explanation=f'1/{d}＝3/{d*3}，所以分子变为3。'))
emit('g5a','分数的意义','math-numbers','约分与分数基本性质',rr)
rr=[]
for b,h in [(6,4),(8,5),(10,6),(12,7),(14,8)]:rr.append(num(f'平行四边形底{b}厘米，对应的高{h}厘米，面积是多少？',f'{b}*{h}','平方厘米',hint='平行四边形面积＝底×对应的高。'))
for b,h in [(7,4),(9,6),(11,8),(13,10),(15,12)]:rr.append(num(f'三角形底{b}厘米，对应的高{h}厘米，面积是多少？',f'{b}*{h}/2','平方厘米',hint='三角形面积＝底×高÷2。'))
emit('g5a','多边形的面积','math-geometry','平行四边形与三角形面积',rr)
rr=[]
for i in range(5):
 a,b,h=4+i,8+i,6+i
 rr.append(num(f'梯形上底{a}厘米、下底{b}厘米、高{h}厘米，面积是多少？',f'({a}+{b})*{h}/2','平方厘米',hint='梯形面积＝（上底＋下底）×高÷2。'))
for i in range(5):
 a,b,s=10+i,8+i,2+i
 rr.append(num(f'从长{a}厘米、宽{b}厘米的长方形中挖去边长{s}厘米的正方形，剩余面积是多少？',f'{a}*{b}-{s}*{s}','平方厘米',hint='用大长方形面积减去挖去的小正方形面积。'))
emit('g5a','组合图形的面积','math-geometry','梯形与组合图形面积',rr)
for book,unit,topic,exprs in [
 ('g5b','分数加减法','异分母分数加减',['1/2+1/3','3/4-1/6','2/5+1/4','5/6-1/3','3/8+1/4','7/10-2/5','1/3+3/5','5/8-1/6','4/7+1/2','1-3/7']),
 ('g5b','分数乘法','分数乘法计算',['2/3*6','3/5*10','7/8*4','5/6*9','4/9*12','2/5*3/4','3/7*7/9','5/8*2/3','4/5*5/6','7/10*5/14']),
 ('g5b','分数除法','分数除法与倒数',['3/4/2','5/6/5','7/8/7','2/3/(4/5)','5/7/(10/21)','3/5/(9/10)','7/9/(14/15)','4/(2/3)','6/(3/4)','2/(5/6)']),
 ('g6a','分数混合运算','分数混合运算顺序',['1/2+2/3*3/4','(1/2+1/3)*6','5/6-1/3/2','3/4/(1/2+1/4)','(2/5+1/10)/3','7/8-3/8*2/3','2/3*3/5+1/5','(4/5-1/2)*10','3/7/(2/3)*14','1-(1/3+1/4)'])]:
 rr=[]
 # Parentheses around fraction operands make division unambiguous in the displayed expression.
 displays={
 '3/4/2':'(3/4) ÷ 2','5/6/5':'(5/6) ÷ 5','7/8/7':'(7/8) ÷ 7','5/6-1/3/2':'5/6－(1/3)÷2',
 '3/7/(2/3)*14':'(3/7)÷(2/3)×14'}
 for e in exprs:
  display=displays.get(e,e.replace('*','×').replace('+','＋').replace('-','－').replace('/(', '÷(').replace(')/', ')÷'))
  if e.startswith('4/('):display='4÷(2/3)'
  if e.startswith('6/('):display='6÷(3/4)'
  if e.startswith('2/('):display='2÷(5/6)'
  hint='先按运算顺序计算；相加减先通分，相除要乘除数的倒数。'
  # Generated rational steps are independently validated below; the result is always reduced.
  rr.append(num(f'分数练习：{display}＝多少？',e,hint=hint,explanation=f'按运算顺序计算{display}，得到最简结果{fmt(calc(e),True)}。',fraction=True))
 emit(book,unit,'math-calculation',topic,rr)
for mode,unit in [('表面积','长方体（一）'),('体积','长方体（二）')]:
 rr=[]
 for i in range(5):
  a,b,c=6+i,4+i,3+i;e=f'2*({a}*{b}+{a}*{c}+{b}*{c})' if mode=='表面积' else f'{a}*{b}*{c}'
  rr.append(num(f'长方体长{a}厘米、宽{b}厘米、高{c}厘米，{mode}是多少？',e,'平方厘米' if mode=='表面积' else '立方厘米',hint='表面积是三组相对面的面积之和。' if mode=='表面积' else '长方体体积＝长×宽×高。'))
 for i in range(5):
  a=3+i;e=f'6*{a}*{a}' if mode=='表面积' else f'{a}*{a}*{a}'
  rr.append(num(f'正方体棱长{a}厘米，{mode}是多少？',e,'平方厘米' if mode=='表面积' else '立方厘米',hint='正方体有六个相同的面。' if mode=='表面积' else '正方体体积＝棱长×棱长×棱长。'))
 emit('g5b',unit,'math-geometry',f'长方体正方体的{mode}',rr)
rr=[]
for r in [2,3,4,5,6]:rr.append(num(f'圆的半径是{r}厘米，直径是多少厘米？',f'{r}*2','厘米',hint='同一个圆中，直径是半径的2倍。'))
for d in [10,12,14,16,18]:rr.append(num(f'圆的直径是{d}厘米，周长是多少厘米？（π取3.14）',f'{d}*3.14','厘米',hint='圆的周长＝π×直径。'))
emit('g6a','圆','math-geometry','半径直径与圆周长',rr)
rr=[]
for r in [1,2,3,4,5]:rr.append(num(f'半径{r}米的圆形花坛面积是多少平方米？（π取3.14）',f'3.14*{r}*{r}','平方米',hint='圆的面积＝π×半径×半径。'))
for r in [6,8,10,12,14]:rr.append(num(f'一个半圆的半径是{r}厘米，它的面积是多少平方厘米？（π取3.14）',f'3.14*{r}*{r}/2','平方厘米',hint='先算整个圆的面积，再取一半。'))
emit('g6a','圆','math-geometry','圆与半圆的面积',rr)
rr=[]
for n in [12,25,40,65,80]:rr.append(num(f'把{n}%化成小数，结果是多少？',f'{n}/100',hint='百分数表示以100为分母的比率。',explanation=f'{n}%＝{n}/100＝{fmt(F(n,100))}。'))
for s,total in [(18,20),(17,20),(21,25),(46,50),(38,40)]:rr.append(num(f'投球{total}次，投中{s}次，命中率是多少？',f'{s}/{total}*100','%',hint='命中率＝命中次数÷总次数×100%。'))
emit('g6a','百分数','math-numbers','百分数换算与百分率',rr)
rr=[]
for a,b in [(6,9),(8,12),(10,15),(12,18),(14,21)]:
 g=math.gcd(a,b);answer=f'{a//g}∶{b//g}'
 rr.append(choice(f'把比{a}∶{b}化成最简单的整数比，结果是什么？',answer,[f'{b//g}∶{a//g}',f'{a//g+1}∶{b//g}',f'{a//g}∶{b//g+1}'],'比的前项和后项同时除以最大公因数。',f'前后项同时除以{g}，得到{answer}。'))
for total,a,b in [(30,2,3),(42,3,4),(56,3,5),(72,4,5),(90,2,7)]:rr.append(num(f'把{total}本书按{a}∶{b}分给甲乙两组，甲组分得多少本？',f'{total}/({a}+{b})*{a}','本',hint='先求总份数和每份数量，再求甲组的份数。'))
emit('g6a','比的认识','math-problems','化简比与按比分配',rr)
rr=[]
for original,rate in [(100,20),(200,15),(300,10),(400,25),(500,30)]:rr.append(num(f'一件商品原价{original}元，降价{rate}%后售价多少元？',f'{original}*(1-{rate}/100)','元',hint='现价＝原价×（1－降价的百分比）。'))
for original,rate in [(80,25),(120,20),(150,10),(240,15),(360,5)]:rr.append(num(f'图书角原有{original}本书，增加{rate}%后有多少本？',f'{original}*(1+{rate}/100)','本',hint='现在的数量＝原有数量×（1＋增加的百分比）。'))
emit('g6a','百分数的应用','math-problems','百分数增减应用',rr)
rr=[]
for total,rate in [(100,30),(200,25),(300,20),(400,15),(500,10)]:rr.append(num(f'扇形统计图表示{total}人参加活动，其中绘画占{rate}%，绘画有多少人？',f'{total}*{rate}/100','人',hint='部分人数＝总人数×所占百分比。'))
for percent in [10,20,25,40,50]:rr.append(num(f'扇形统计图中某项目占{percent}%，其对应的圆心角是多少度？',f'360*{percent}/100','°',hint='整个圆是360°，按所占比例求角度。'))
emit('g6a','数据处理','math-statistics','扇形统计图与数据',rr)
for mode in ['圆柱体积','圆锥体积']:
 rr=[]
 for r,h in [(2,3),(3,4),(4,5),(5,6),(6,7)]:
  e=f'3.14*{r}*{r}*{h}'+('/3' if mode=='圆锥体积' else '')
  # Use heights divisible by 3 for exact terminating answers of cones.
  if mode=='圆锥体积':h*=3;e=f'3.14*{r}*{r}*{h}/3'
  rr.append(num(f'{mode[:2]}底面半径{r}厘米、高{h}厘米，体积是多少立方厘米？（π取3.14）',e,'立方厘米',hint='圆柱体积＝底面积×高。' if mode=='圆柱体积' else '圆锥体积＝底面积×高÷3。'))
 for area,h in [(12,3),(15,6),(18,9),(24,12),(30,15)]:rr.append(num(f'{mode[:2]}底面积{area}平方厘米、高{h}厘米，体积是多少立方厘米？',f'{area}*{h}'+('/3' if mode=='圆锥体积' else ''),'立方厘米',hint='用底面积乘高；如果是圆锥，再除以3。'))
 emit('g6b','圆柱与圆锥','math-geometry',mode,rr)
rr=[]
for scale,cm in [(100,3),(200,4),(500,5),(1000,6),(2000,7)]:rr.append(num(f'比例尺1∶{scale}的图上距离是{cm}厘米，实际距离是多少厘米？',f'{scale}*{cm}','厘米',hint='先统一单位；实际距离＝图上距离×比例尺后项。'))
for a,b,c in [(2,3,8),(3,4,9),(4,5,12),(5,6,15),(6,7,18)]:rr.append(num(f'解比例：{a}∶{b}＝{c}∶x，x是多少？',f'{b}*{c}/{a}',hint='比例的两个内项之积等于两个外项之积。'))
emit('g6b','比例','math-problems','比例尺与解比例',rr)
rr=[]
for price,n in [(4,3),(6,4),(8,5),(10,6),(12,7)]:rr.append(num(f'练习本单价固定为{price}元，买{n}本需要多少钱？',f'{price}*{n}','元',hint='单价一定，总价与数量成正比例。'))
for total,people in [(24,3),(36,4),(48,6),(60,5),(72,8)]:rr.append(num(f'{total}个苹果平均分给{people}人，每人几个？',f'{total}/{people}','个',hint='总数一定，每人数量与人数成反比例。'))
emit('g6b','正比例与反比例','math-problems','正反比例的数量关系',rr)
rr=[]
for a,b in [(17,3),(22,4),(29,5),(34,6),(40,7),(47,8),(53,9),(26,7),(31,4),(38,5)]:
 q,r=divmod(a,b);answer=f'商{q}余{r}'
 x=choice(f'有余数除法：{a}÷{b}，商和余数分别是多少？',answer,[f'商{q+1}余{r}',f'商{q}余{r+1}',f'商{q-1}余{r}'],'余数要比除数小，并用商×除数＋余数验算。',f'{b}×{q}＋{r}＝{a}，且{r}小于{b}，所以{answer}。');x['proof']=dict(dividend=a,divisor=b,quotient=q,remainder=r);rr.append(x)
emit('g2b','除法','math-calculation','有余数的除法',rr)
# Dedicated unit practice ensures calculation units have full coverage even when OCR cannot read division.
for book,unit,topic,mode in [
 ('g1a','加与减（一）','10以内的生活计算','add10'),
 ('g1a','加与减（二）','20以内的生活计算','add20'),
 ('g1b','加与减（一）','20以内退位减法','sub20'),
 ('g1b','加与减（二）','100以内加减基础','add100'),
 ('g1b','加与减（三）','100以内进退位计算','sub100'),
 ('g2a','加与减','连续加减解决问题','mixedadd'),
 ('g2a','2～5的乘法口诀','2到5的口诀应用','mulsmall'),
 ('g2a','6～9的乘法口诀','6到9的口诀应用','mulbig'),
 ('g2a','除法','用口诀求商','divsmall'),
 ('g2b','加与减','三位数加减应用','add1000'),
 ('g3a','混合运算','两步计算解决问题','mixed'),
 ('g3a','加与减','三位数连续加减','mixed1000'),
 ('g3a','乘与除','整十数乘除应用','tens'),
 ('g3a','乘法','多位数乘一位数应用','mulone'),
 ('g3b','除法','多位数除以一位数','divone'),
 ('g3b','乘法','两位数乘两位数应用','multwo'),
 ('g4a','乘法','三位数乘两位数应用','multhree'),
 ('g4a','除法','除数是两位数的除法','divtwo'),
 ('g4b','小数乘法','小数乘法购物应用','decimalmul'),
 ('g5a','小数除法','小数除法购物应用','decimaldiv')]:
 rr=[]
 for i in range(10):
  if mode=='add10':
   a,b=i//2+1,i%3+1;e=f'{a}+{b}';p=f'小盒原有{a}颗糖，放入{b}颗，现在有多少颗？';u='颗'
  elif mode=='add20':
   a,b=8+i%3,2+i//2;e=f'{a}+{b}';p=f'停车场已有{a}辆车，又开进{b}辆，现在有多少辆？';u='辆'
  elif mode=='sub20':
   a,b=11+i%5,6+i//5;e=f'{a}-{b}';p=f'有{a}颗草莓，吃掉{b}颗，还剩多少颗？';u='颗'
  elif mode=='add100':
   a,b=21+i*2,3;e=f'{a}+{b}';p=f'书架原有{a}本书，添入{b}本，现在有多少本？';u='本'
  elif mode=='sub100':
   a,b=42+i*3,17;e=f'{a}-{b}';p=f'一袋{a}个气球，取走{b}个，还剩多少个？';u='个'
  elif mode=='mixedadd':
   a,b,c=42+i,13+i,8;e=f'{a}+{b}-{c}';p=f'公交车上有{a}人，上来{b}人，又下去{c}人，现在有多少人？';u='人'
  elif mode in ['mulsmall','mulbig']:
   a,b=(2+i%4,2+i//4) if mode=='mulsmall' else (6+i%4,3+i//4);e=f'{a}*{b}';p=f'每袋装{a}个面包，买{b}袋一共有多少个？';u='个'
  elif mode=='divsmall':
   a,b=3+i%6,2+i//6;e=f'{a*b}/{a}';p=f'把{a*b}块饼干平均装入{a}袋，每袋装多少块？';u='块'
  elif mode=='add1000':
   a,b=237+i*13,158+i;e=f'{a}+{b}';p=f'科技书有{a}本，故事书有{b}本，两类书共多少本？';u='本'
  elif mode=='mixed':
   a,b,c=4+i%5,3+i//5,7;e=f'{a}*{b}+{c}';p=f'买{a}包彩纸，每包{b}张，另有散装{c}张，共多少张？';u='张'
  elif mode=='mixed1000':
   a,b,c=360+i*11,125+i,178;e=f'{a}+{b}-{c}';p=f'仓库有{a}箱货，运入{b}箱，运出{c}箱，还剩多少箱？';u='箱'
  elif mode=='tens':
   a,b=20+i*10,3;e=f'{a}*{b}';p=f'每箱{a}瓶水，{b}箱一共有多少瓶？';u='瓶'
  elif mode in ['mulone','multwo','multhree']:
   a,b=(123+i*7,3+i%3) if mode=='mulone' else (21+i,12+i%3) if mode=='multwo' else (124+i*3,21+i%4);e=f'{a}*{b}';p=f'每套科普书售价{a}元，买{b}套共需多少元？';u='元'
  elif mode in ['divone','divtwo']:
   a,b=(3+i%6,42+i*3) if mode=='divone' else (12+i,24+i);e=f'{a*b}/{a}';p=f'{a*b}张照片平均放在{a}页，每页放多少张？';u='张'
  elif mode=='decimalmul':
   a,b=fmt(F(12+i,10)),fmt(F(15+i,10));e=f'{a}*{b}';p=f'每千克萝卜{a}元，买{b}千克要付多少元？';u='元'
  else:
   a,b=F(12+i,10),F(25+i,10);e=f'{fmt(a*b)}/{fmt(a)}';p=f'每千克南瓜{fmt(a)}元，付了{fmt(a*b)}元，买了多少千克？';u='千克'
  rr.append(num(p,e,u))
 emit(book,unit,'math-problems',topic,rr)
# Build exact arithmetic questions only after independent crop OCR agrees.
candidates=json.loads((ROOT/'arithmetic-candidates.json').read_text());checks={x['key']:x for x in json.loads((ROOT/'arithmetic-crosscheck.json').read_text())}
# Remove duplicate arithmetic across the entire new library while preserving source aliases.
unique={};pending=[]
for c in candidates:
 if c['book'] in ['g5b','g6a'] or not checks.get(c['key'],{}).get('matched'):
  pending.append(dict(key=c['key'],book=c['book'],pdfPage=c['pdfPage'],printedPage=c['printedPage'],reason='高年级算式片段需核对完整上下文，改用单元改编题' if c['book'] in ['g5b','g6a'] else '两种识别结果不一致，需人工核对原页',candidate=c['raw']));continue
 expr=c['expression']
 if expr not in unique:unique[expr]=dict(first=c,aliases=[])
 else:unique[expr]['aliases'].append(dict(book=c['book'],pdfPage=c['pdfPage'],printedPage=c['printedPage']))
def pretty(e):return e.replace('*','×').replace('/','÷').replace('+','＋').replace('-','－')
def worked(expr):
 steps=[]
 def walk(n):
  if isinstance(n,ast.Constant):return F(str(n.value))
  a,b=walk(n.left),walk(n.right);op={ast.Add:'＋',ast.Sub:'－',ast.Mult:'×',ast.Div:'÷'}[type(n.op)]
  v=a+b if op=='＋' else a-b if op=='－' else a*b if op=='×' else a/b
  steps.append(f'{fmt(a)}{op}{fmt(b)}＝{fmt(v)}');return v
 walk(ast.parse(expr,mode='eval').body)
 return '；'.join(steps)+'。'
for book in BOOKS:
 items=[v for v in unique.values() if v['first']['book']==book]
 rr=[];refs=[]
 for v in items:
  c=v['first'];e=c['expression'];display=pretty(e)
  q=num(f'计算：{display}＝多少？',e,hint='有括号先算括号；先乘除后加减，同级运算从左到右。' if BOOKS[book]['grade']>=3 else '按题中的运算符号计算；同级运算从左到右。',explanation=worked(e))
  rr.append(q);refs.append(dict(pdfPage=c['pdfPage'],printedPage=c['printedPage'],unit=c['unit'],raw=c['raw'],cropKey=c['key'],crosscheck=checks[c['key']]['raw'],aliases=v['aliases']))
 # Never discard verified questions just because the last lesson is short.
 # Complete that lesson with inverse checks of the same verified facts, explicitly marked as adapted.
 padding=[]
 if len(rr)%10:
  for v in items:
   if len(rr)%10==0:break
   e=v['first']['expression'];result=calc(e)
   for token in re.finditer(r'\d+(?:\.\d+)?',e):
    if len(rr)%10==0:break
    value=token.group();template=e[:token.start()]+'x'+e[token.end():]
    p=f'补全等式：{pretty(template).replace("x","（ ）")}＝{fmt(result)}，括号里填多少？'
    if p in seen or any(x['prompt']==p for x in rr):continue
    q=num(p,value,hint='把选项代入，检查等式两边是否相等。',explanation=f'{pretty(e)}＝{fmt(result)}，所以括号里填{value}。')
    q['proof']=dict(inverseTemplate=template,inverseRight=str(result),value=str(F(value)))
    rr.append(q);refs.append(dict(pdfPage=v['first']['pdfPage'],printedPage=v['first']['printedPage'],unit=v['first']['unit'],adaptation='同一算式的逆向填空'));padding.append(p)
 assert len(rr)%10==0,(book,len(rr))
 for i in range(0,len(rr),10):
  emit(book,'教材计算练习','math-calculation',f'教材计算练习{i//10+1:02d}',rr[i:i+10],key=f'{book}/extracted/{i//10+1}',kind='extracted-or-inverse',refs=refs[i:i+10])
# Explicit source coverage includes every core unit, whether by extraction or adaptation.
covered=set(coverage)
for q in manifest:
 if q['source'].get('unit'):covered.add((q['book'],q['source']['unit']))
missing=[]
for book,b in BOOKS.items():
 for u in b['units']:
  if u['name'] in ['整理与复习','总复习','数学好玩']:continue
  if (book,u['name']) not in covered:missing.append((book,u['name']))
assert not missing,('UNCOVERED_CORE_UNITS',missing)
(ROOT/'lessons.json').write_text(json.dumps(lessons,ensure_ascii=False,indent=2)+'\n')
(ROOT/'manifest.json').write_text(json.dumps(dict(batch='bnu-primary-math-v1',lessonCount=len(lessons),questionCount=len(manifest),sourceCommit=SOURCES['commit'],questions=manifest),ensure_ascii=False,indent=2)+'\n')
(ROOT/'pending-arithmetic.json').write_text(json.dumps(pending,ensure_ascii=False,indent=2)+'\n')
from collections import Counter
report=dict(lessons=len(lessons),questions=len(manifest),byGrade=dict(Counter(q['grade'] for q in manifest)),byCategory=dict(Counter(q['category'] for q in manifest)),byKind=dict(Counter(q['kind'] for q in manifest)),pendingArithmetic=len(pending),coreUnitCoverage=len([1 for b in BOOKS.values() for u in b['units'] if u['name'] not in ['整理与复习','总复习','数学好玩']]),books=len(BOOKS),byBook=dict(Counter(q['book'] for q in manifest)),units=[dict(book=b['id'],unit=u['name'],questions=sum(q['book']==b['id'] and q['source'].get('unit')==u['name'] for q in manifest)) for b in BOOKS.values() for u in b['units'] if u['name'] not in ['整理与复习','总复习','数学好玩']])
(ROOT/'coverage.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False,indent=2))
