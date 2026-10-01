"""Reproducible, curated practice based on PEP Starting Line grade 1 volume 1."""
import json, uuid, hashlib
from pathlib import Path
NS=uuid.UUID('9276d95b-d711-46d1-82c0-03bdb7daafee')
OUT=Path('content/english-starting-line')
lessons=[]
sources=[]
def lesson(key,title,unit,pages,category,topic,rows):
    lid=str(uuid.uuid5(NS,key)); qs=[]
    for i,row in enumerate(rows):
        prompt,correct,wrong,hint,explanation,*extra=row
        context=extra[0] if extra else ''
        opts=[correct]+wrong
        pos=(len(sources)+i)%4
        opts=opts[-pos:]+opts[:-pos] if pos else opts
        qid=str(uuid.uuid5(NS,f'{key}/{i+1}'))
        qs.append(dict(id=qid,prompt=prompt,context=context,options=opts,answer=pos,hint=hint,explanation=explanation))
    assert len(qs)==10,(key,len(qs))
    lessons.append(dict(id=lid,title=f'新起点一上·{title}',description=f'{unit}：{topic}。根据教材知识点编写，含中文提示与解析。',subject='english',grade=1,topic=topic,category=category,tags=['新起点一年级上册',unit,topic],minutes=6,status='published',questions=qs))
    for q in qs:
        sources.append(dict(questionId=q['id'],lessonId=lid,unit=unit,printedPages=pages,pdfPages=[p+5 for p in pages],kind='original-practice-based-on-textbook',correctAnswer=q['options'][q['answer']]))
def rows(s):
    result=[]
    for line in s.strip().splitlines():
        p,a,b,c,d,h,e,*ctx=line.split('|')
        result.append((p,a,[b,c,d],h,e,*ctx))
    return result
lesson('starter','Starter 见面打招呼','Starter',[2,3,62],'english-conversation','问候与自我介绍',rows('''
早上到学校，想向吴老师说“早上好”，选哪一句？|Good morning, Miss Wu!|Good afternoon, Miss Wu!|Goodbye, Miss Wu!|Thank you, Miss Wu!|想想早上和下午的问候有什么不同。|morning 是早上；Good morning! 用于早上问好。
下午见到 Bill，哪句问候最符合这个时间？|Good afternoon, Bill!|Good morning, Bill!|Goodbye, Bill!|Thank you, Bill!|找出表示“下午”的词。|afternoon 是下午，下午问好可以说 Good afternoon!
放学准备离开，你会对 Joy 说哪一句？|Goodbye, Joy!|Good morning, Joy!|My name is Joy.|I have a book.|这是告别的时候。|Goodbye! 表示“再见”，适合离开时说。
新朋友问你叫什么名字，你叫 Lily，选哪句回答？|My name is Lily.|Goodbye, Lily!|This is my nose.|I have a ruler.|回答时要介绍自己的名字。|My name is Lily. 表示“我叫莉莉”。
想知道新同学的名字，应该怎样问？|What's your name?|What's this?|What colour is it?|How many birds are there?|name 和名字有关。|What's your name? 是询问对方姓名的常用句。
读到“I'm Bill.”，这里的说话人叫什么？|Bill|Lily|Joy|Andy|看 I'm 后面的名字。|I'm Bill. 表示“我是比尔”，说话人是 Bill。
见面时 Andy 说“Hello!”。这里 Hello 表示什么？|你好|再见|谢谢|请坐下|想想见面时通常会说什么。|Hello! 是见面问候语，意思是“你好”。
Lily 挥手说“Bye!”后离开。Bye 的意思是什么？|再见|早上好|你好|我是莉莉|注意她正在离开。|Bye! 是“再见”，用于告别。
吴老师说“I'm Miss Wu.”，她正在做什么？|介绍自己|询问颜色|数小鸟|说自己有一本书|I'm 后面可以接自己的称呼。|I'm Miss Wu. 意思是“我是吴老师”，是在介绍自己。
同学问“What's your name?”，下面哪句是在回答名字？|My name is Andy.|It's a dog.|It's red.|I have a pencil.|找出 My name is 开头的句子。|My name is Andy. 表示“我叫安迪”，回答了名字是什么。
'''))
# Vocabulary lessons include recognition in both directions, using only core vocabulary.
vocab={
 1:('School','学校词汇',6,[('book','书本'),('ruler','尺子'),('pencil','铅笔'),('schoolbag','书包'),('teacher','老师')]),
 2:('Face','五官词汇',14,[('face','脸'),('ear','耳朵'),('eye','眼睛'),('nose','鼻子'),('mouth','嘴巴')]),
 3:('Animals','动物词汇',22,[('dog','狗'),('bird','鸟'),('tiger','老虎'),('monkey','猴子'),('cat','猫')]),
 5:('Colours','颜色词汇',40,[('black','黑色'),('yellow','黄色'),('blue','蓝色'),('red','红色'),('green','绿色')]),
 6:('Fruit','水果词汇',48,[('apple','苹果'),('pear','梨'),('banana','香蕉'),('orange','橙子')])}
for n,(en,cn,page,words) in vocab.items():
    rr=[]
    for i,(w,z) in enumerate(words):
        others=[pair for pair in words if pair[0]!=w][:3]
        rr.append((f'{en} 单词卡写着“{w}”，应配上哪个中文标签？',z,[a[1] for a in others],f'回想{cn}中这个单词的意思。',f'{w} 表示“{z}”。'))
    for i,(w,z) in enumerate(words):
        others=[pair for pair in words if pair[0]!=w][:3]
        rr.append((f'制作{cn}卡片时，“{z}”下面应该写哪个英语单词？',w,[a[0] for a in others],f'把“{z}”与学过的英语单词连起来想一想。',f'“{z}”对应的英语单词是 {w}。'))
    if n==6:
        rr+=rows('''
整理单词卡时，哪一组全部是水果？|apple、pear|apple、ruler|pear、cat|banana、book|逐个看看这些词表示水果还是其他东西。|apple 是苹果，pear 是梨，这一组都是水果。
水果篮标签是“banana”，应把什么放进去？|香蕉|尺子|书本|铅笔|想想 banana 属于哪种水果。|banana 表示香蕉，所以应放入香蕉。
''')
    lesson(f'u{n}-words',f'U{n} {cn}',f'Unit {n} {en}',[page,58 if n<5 else 59],'english-vocabulary',cn,rr)
nums=['one','two','three','four','five','six','seven','eight','nine','ten']
rr=[]
for i,w in enumerate(nums):
    wrong=[nums[(i+j)%10] for j in [1,3,5]]
    rr.append((f'数字卡片上写着 {i+1}，请给它选择英语标签。',w,wrong,'从 one 开始按顺序数一数。',f'数字 {i+1} 的英语是 {w}。'))
lesson('u4-words','U4 认识数字一到十','Unit 4 Numbers',[32,58],'english-vocabulary','数字一到十',rr)
lesson('u1-talk','U1 我的书包与课堂指令','Unit 1 School',[6,7,8,62],'english-conversation','学习用品与课堂指令',rows('''
你拿着一把尺子，想说“我有一把尺子”，选哪一句？|I have a ruler.|I have a book.|I have a schoolbag.|I have a pencil.|找出表示尺子的单词。|ruler 是尺子，I have a ruler. 表示“我有一把尺子”。
Bill 说“I have a pencil.”，他有哪样文具？|铅笔|尺子|书包|书本|注意 have 后面提到的东西。|pencil 是铅笔，因此他说自己有一支铅笔。
你想告诉朋友自己有一本书，应该选哪句？|I have a book.|This is my ear.|It's a cat.|It's yellow.|“我有……”可以用 I have ... 表达。|book 是书，I have a book. 表示“我有一本书”。
老师说“Show me your schoolbag.”，应该给老师看什么？|自己的书包|自己的尺子|自己的铅笔|自己的书本|听指令时要注意 schoolbag。|Show me your schoolbag. 是让你出示自己的书包。
听到“Stand up!”这条课堂指令，应该怎样做？|站起来|坐下|闭上眼睛|打开书本|up 在这里表示向上。|Stand up! 表示“起立”，所以应该站起来。
老师指着座位说“Sit down, please.”，你应该怎样做？|坐下|站起来|摸鼻子|出示铅笔|想想 sit down 是什么动作。|Sit down, please. 表示“请坐下”。
游戏开始，老师说“Close your eyes.”，应该怎样做？|闭上眼睛|睁开眼睛|拿出书包|摸耳朵|close 表示合上、关闭。|Close your eyes. 表示“闭上眼睛”。
猜物游戏结束，听到“Open your eyes.”应做什么？|睁开眼睛|闭上眼睛|站起来|收起尺子|open 和 close 表示相反的动作。|Open your eyes. 表示“睁开眼睛”。
老师说“Show me your pencil.”，下面哪样东西符合要求？|铅笔|书包|尺子|书本|留意指令末尾的 pencil。|pencil 表示铅笔，老师让你出示自己的铅笔。
桌上原有 book、ruler、pencil，现在只剩 book、pencil。What's missing?|ruler|book|pencil|schoolbag|比较原来的清单和现在的清单。|原来有 ruler，现在的清单中没有它，所以不见的是尺子 ruler。
'''))
lesson('u2-talk','U2 介绍五官与动作','Unit 2 Face',[14,15,16,62],'english-conversation','介绍五官',rows('''
你指着自己的鼻子，应该怎样介绍？|This is my nose.|This is my ear.|This is my eye.|This is my mouth.|先找出“鼻子”的英语。|nose 是鼻子，This is my nose. 表示“这是我的鼻子”。
Joy 说“This is my mouth.”，她在介绍自己的哪里？|嘴巴|鼻子|耳朵|眼睛|mouth 是本单元的五官词。|This is my mouth. 表示“这是我的嘴巴”。
老师发出“Touch your ear.”的指令，应摸哪里？|耳朵|鼻子|嘴巴|脸|先认出 ear 的意思。|Touch your ear. 表示“摸你的耳朵”。
游戏中听到“Touch your nose.”，应选择哪个动作？|摸鼻子|摸耳朵|摸嘴巴|摸脸|nose 指脸上的哪个部位？|nose 是鼻子，指令要求摸鼻子。
你想说“这是我的眼睛”，应选择哪句？|This is my eye.|This is my nose.|This is my face.|This is my ear.|眼睛的单词和耳朵的单词容易混淆，仔细看。|eye 是眼睛，ear 是耳朵；这里应选 This is my eye.
Bill 说“This is my face.”，face 指什么？|脸|尺子|书本|小鸟|这句话在介绍身体部位。|face 表示脸，整句是“这是我的脸”。
哪句指令让你摸自己的嘴巴？|Touch your mouth.|Touch your nose.|Touch your ear.|Touch your face.|找出表示嘴巴的词。|mouth 是嘴巴，Touch your mouth. 就是“摸你的嘴巴”。
“This is my ear.”中的 my 表示什么意思？|我的|你的|什么|有|这句话在介绍自己的耳朵。|my 表示“我的”，my ear 就是“我的耳朵”。
你指着自己的耳朵，补全句子：This is my ___.|ear|ruler|book|pencil|句子最后需要一个身体部位的词。|ear 是耳朵，This is my ear. 表示“这是我的耳朵”。
游戏要求“Touch your face.”，下面哪个动作正确？|摸自己的脸|拿出自己的书|指一只鸟|拿出自己的尺子|face 是脸，touch 表示摸、触碰。|Touch your face. 表示“摸你的脸”。
'''))
lesson('u3-talk','U3 动物猜猜看','Unit 3 Animals',[22,23,24,62],'english-conversation','询问与介绍动物',rows('''
看到一个动物玩偶，想问“这是什么”，选哪一句？|What's this?|What's your name?|What colour is it?|Goodbye!|这是在询问东西是什么。|What's this? 表示“这是什么？”。
朋友指着一只狗问“What's this?”，你该怎样回答？|It's a dog.|It's a cat.|It's a bird.|It's a tiger.|回答时要用表示狗的单词。|dog 是狗，因此回答 It's a dog.
你指着一只猫说“它是一只猫”，选哪句？|It's a cat.|It's a dog.|It's a monkey.|It's a bird.|猫的英语是 cat。|It's a cat. 表示“它是一只猫”。
猜谜卡的答案是老虎，应选哪个英语回答？|It's a tiger.|It's a bird.|It's a dog.|It's a monkey.|找出表示老虎的单词。|tiger 表示老虎，It's a tiger. 是正确回答。
Lily 回答“It's a monkey.”，她说的是什么动物？|猴子|小鸟|老虎|小狗|注意 monkey 这个词。|monkey 是猴子，整句意思是“它是一只猴子”。
卡片上写着“It's a bird.”，这张卡应该放入哪一栏？|鸟|猫|狗|老虎|找出 bird 的中文意思。|bird 表示鸟，所以这张卡应放入“鸟”这一栏。
听到“Act like a monkey.”，游戏要求模仿什么？|猴子|小狗|小鸟|老虎|Act like ... 表示模仿……的动作。|monkey 是猴子，这条指令要求模仿猴子的动作。
问句是“What's this?”，哪个选项完整地回答“它是一只鸟”？|It's a bird.|I have a book.|My name is Bill.|It's blue.|找出说出动物名称的回答。|It's a bird. 意思是“它是一只鸟”，回答了这是什么。
玩偶盒里装的是一只小狗。补全介绍：It's a ___.|dog|ruler|pencil|schoolbag|空格里要填“小狗”的英语。|dog 表示狗，It's a dog. 与盒里的玩偶相符。
动物清单原有 cat、dog、bird，拿走猫后应留下哪组？|dog、bird|cat、dog|cat、bird|cat、tiger|先找出表示猫的词，再把它去掉。|cat 是猫，去掉后剩下 dog（狗）和 bird（鸟）。
'''))
lesson('u4-talk','U4 用英语数一数','Unit 4 Numbers',[32,33,34,62],'english-conversation','询问数量',rows('''
玩具架有三只小鸟。How many birds are there? 应怎样回答？|Three.|Two.|Five.|Eight.|用英语说出数量三。|three 表示三，所以有三只鸟时回答 Three.
盒子里有六只小狗玩偶。How many dogs are there? 应选哪项？|Six.|Seven.|Nine.|Four.|先确定中文数量，再找英语。|six 是六，盒子里的小狗玩偶共有六只。
图画说明写着“老虎共五只”。回答 How many tigers are there? 应选哪项？|Five.|One.|Ten.|Two.|问题问的是老虎的数量。|five 表示五，所以应回答 Five.
想知道小鸟有多少只，应该选哪个问题？|How many birds are there?|What colour is it?|What's your name?|Do you like apples?|询问数量时可以用 How many ...。|How many birds are there? 表示“有多少只鸟？”。
老师说“Show me five.”，应该举起哪张数字卡？|5|3|7|9|想想 five 对应的数字。|five 是五，所以应举起数字 5 的卡片。
听到“Show me eight.”，应该选择哪个数字？|8|6|4|10|从 one 数到 eight。|eight 表示八，对应数字 8。
桌上有九支铅笔，用一个英语单词回答数量，应选哪个？|Nine.|Six.|Ten.|Two.|这里需要表示九的英语单词。|nine 表示九，回答数量时可以说 Nine.
从小到大数数：one、two、___、four。空格应填哪个词？|three|five|seven|ten|想想二后面、四前面是什么数。|one、two、three、four 分别是一、二、三、四。
从小到大读数字：six、seven、eight、___、ten。缺少哪个词？|nine|five|two|four|八和十中间是几？|nine 是九，在 eight（八）和 ten（十）之间。
小组里有十个小鸟贴纸，想用英语说出“十”，应选哪个？|ten|one|four|seven|十是本单元数数练习的最后一个数。|ten 表示十，十个贴纸的数量可用 ten 表达。
'''))
lesson('u5-talk','U5 问一问颜色','Unit 5 Colours',[40,41,42,62],'english-conversation','询问颜色',rows('''
想问一支铅笔是什么颜色，应该选哪句？|What colour is it?|What's your name?|How many dogs are there?|Do you like pears?|colour 表示颜色。|What colour is it? 表示“它是什么颜色？”。
这支铅笔是红色的。别人问 What colour is it?，应怎样回答？|It's red.|It's blue.|It's green.|It's black.|根据题目给出的红色选择。|red 表示红色，It's red. 表示“它是红色的”。
题目说明这本书是蓝色的，应选哪个颜色词？|blue|yellow|red|green|蓝色的英语以 b 开头。|blue 是蓝色，与题目中的书的颜色相符。
你拿到一张黄色卡片，应怎样介绍它的颜色？|It's yellow.|It's green.|It's blue.|It's black.|先回想 yellow 的意思。|yellow 是黄色，It's yellow. 表示“它是黄色的”。
“It's green.”说的是哪种颜色？|绿色|蓝色|黑色|红色|留意 green 这个词。|green 表示绿色，整句是“它是绿色的”。
一只玩具狗涂成黑色。What colour is it? 应回答哪句？|It's black.|It's red.|It's yellow.|It's blue.|颜色已经在题目中给出。|black 表示黑色，玩具狗是黑色的，应回答 It's black.
老师说“Show me red.”，应该出示什么颜色的卡片？|红色|蓝色|绿色|黄色|这条指令要求找一种颜色。|red 是红色，Show me red. 要求出示红色的东西。
你指着一只绿色玩具鸟。哪句话介绍的是它的颜色？|It's green.|It's a bird.|I have a book.|My name is Joy.|注意区分“是什么”与“什么颜色”。|It's green. 说明它是绿色的；It's a bird. 说明它是一只鸟。
回答“It's yellow.”是在告诉别人什么？|它的颜色|它的数量|自己的名字|它是不是书包|yellow 属于颜色词。|yellow 表示黄色，这个回答是在说明颜色。
彩笔盒里有 red、blue、green，取走蓝色后剩下哪组颜色词？|red、green|blue、green|red、blue|yellow、black|先把表示蓝色的词找出来。|blue 是蓝色，取走后剩下 red（红色）和 green（绿色）。
'''))
lesson('u6-talk','U6 我喜欢的水果','Unit 6 Fruit',[48,49,50,62],'english-conversation','询问水果喜好',rows('''
想问朋友喜不喜欢香蕉，应该选哪句？|Do you like bananas?|What colour is it?|What's your name?|How many birds are there?|询问“喜欢……吗”可用 Do you like ...?。|Do you like bananas? 表示“你喜欢香蕉吗？”。
你很喜欢苹果，朋友问“Do you like apples?”，应怎样回答？|Yes, I do.|No, I don't.|It's a dog.|My name is Bill.|题目已经说明你喜欢苹果。|喜欢时可以回答 Yes, I do.，表示“是的，我喜欢”。
你不喜欢梨，别人问“Do you like pears?”，应怎样回答？|No, I don't.|Yes, I do.|It's green.|I have a ruler.|不喜欢时用否定回答。|No, I don't. 表示“不，我不喜欢”，符合题意。
“Do you like oranges?”问的是喜不喜欢什么？|橙子|梨|苹果|香蕉|找出 oranges 对应的水果。|orange 是橙子，oranges 在这里表示橙子这类水果。
老师说“Show me an apple.”，应该拿起哪种水果？|苹果|香蕉|梨|橙子|看清 apple 这个词。|apple 表示苹果，这条指令要求出示一个苹果。
你喜欢香蕉，想说出自己的喜好，应该选哪句？|I like bananas.|I like pears.|I like apples.|I like oranges.|找到表示香蕉的单词。|I like bananas. 表示“我喜欢香蕉”。
你不喜欢橙子。对“Do you like oranges?”应选择哪句回答？|No, I don't.|Yes, I do.|It's a cat.|Good morning!|先根据题目判断是喜欢还是不喜欢。|不喜欢橙子时，要回答 No, I don't.
Joy 说“I like pears.”，她喜欢哪种水果？|梨|苹果|香蕉|橙子|注意 pears 这个词。|pear 是梨，I like pears. 表示“我喜欢梨”。
要询问朋友是否喜欢苹果，应选哪句话？|Do you like apples?|Do you like bananas?|Do you like pears?|Do you like oranges?|四句都在询问喜好，仔细找苹果这个词。|apples 表示苹果，Do you like apples? 是询问是否喜欢苹果。
选数字游戏中听到“Choose a number, please.”，应该做什么？|选一个数字|摸摸耳朵|站起来|闭上眼睛|number 表示数字。|Choose a number, please. 表示“请选一个数字”。
'''))
lesson('revision1','Revision 1 学校与动物复习','Revision 1',[28,29,6,7,14,15,22,23],'english-reading','学校五官动物综合',rows('''
读小介绍，Bill 有什么？|尺子|书包|铅笔|苹果|找到 I have 后面的物品名称。|I have a ruler. 表示“我有一把尺子”。|Hello! I'm Bill. I have a ruler.
读 Joy 的介绍，她说的是自己的哪个部位？|耳朵|鼻子|嘴巴|脸|找到 This is my 后面的词。|ear 是耳朵，Joy 在介绍自己的耳朵。|Hi! I'm Joy. This is my ear.
读这段对话，回答中提到了什么动物？|猴子|猫|狗|老虎|注意回答里 a 后面的动物名称。|monkey 表示猴子，回答说“它是一只猴子”。|A: What's this? B: It's a monkey.
读这两句介绍，Lily 有哪样东西？|书包|书本|尺子|铅笔|区分 Lily 和 Andy 各自说的话。|Lily 说 I have a schoolbag.，所以她有一个书包。|Lily: I have a schoolbag. Andy: I have a book.
读 Andy 的话，他介绍了哪两个身体部位？|眼睛和鼻子|耳朵和嘴巴|脸和耳朵|嘴巴和鼻子|分别找出 eye 和 nose 的意思。|eye 是眼睛，nose 是鼻子，所以是眼睛和鼻子。|This is my eye. This is my nose.
读对话，Joy 按要求应拿出什么？|铅笔|书本|书包|尺子|先读懂老师让她出示什么。|Show me your pencil. 要求出示铅笔，Joy 的回答也说她有铅笔。|Teacher: Show me your pencil. Joy: I have a pencil.
读物品清单，哪一项是动物？|bird|book|ruler|schoolbag|其余三项都是学习用品。|bird 是鸟，属于动物；book、ruler、schoolbag 是学习用品。|book / bird / ruler / schoolbag
看词卡清单，哪个词表示身体部位？|mouth|cat|pencil|teacher|回想 Face 单元的单词。|mouth 是嘴巴，是身体部位；其他三个词分别是猫、铅笔、老师。|cat / mouth / pencil / teacher
读这段对话，被问到的东西是什么？|一只猫|一只鸟|一把尺子|一本书|第二个人的回答给出了答案。|It's a cat. 表示“它是一只猫”。|Bill: What's this? Lily: It's a cat.
按顺序执行这两条指令，最后一个动作是什么？|坐下|站起来|摸鼻子|闭上眼睛|题目问的是第二条指令。|第二条 Sit down, please. 是“请坐下”，所以最后要坐下。|① Stand up! ② Sit down, please.
'''))
lesson('revision2','Revision 2 数字颜色水果复习','Revision 2',[54,55,32,33,40,41,48,49],'english-reading','数字颜色水果综合',rows('''
读这段对话，小鸟有几只？|7只|3只|5只|9只|问题问数量，答案是 Seven。|seven 是七，说明小鸟有七只。|A: How many birds are there? B: Seven.
读两句介绍，这支铅笔是什么颜色？|黑色|绿色|蓝色|红色|第二句介绍了颜色。|black 表示黑色，所以这支铅笔是黑色的。|It's a pencil. It's black.
读 Lily 的回答，她喜欢梨吗？|喜欢|不喜欢|只说了名字，无法知道|只说了颜色，无法知道|看她回答的是 Yes 还是 No。|Yes, I do. 是肯定回答，表示 Lily 喜欢梨。|Bill: Do you like pears? Lily: Yes, I do.
读 Andy 的回答，他喜欢香蕉吗？|不喜欢|喜欢|只说了数量，无法知道|只说了名字，无法知道|No, I don't. 是否定回答。|Andy 回答 No, I don't.，说明他不喜欢香蕉。|Joy: Do you like bananas? Andy: No, I don't.
读两次问答，玩具鸟的颜色和数量分别是什么？|蓝色，4只|蓝色，8只|绿色，4只|绿色，8只|分别读懂 Blue 和 Four。|blue 是蓝色，four 是四，所以是蓝色、四只。|玩具鸟都涂成同一种颜色。问颜色，回答 Blue.；问数量，回答 Four.
读水果喜好记录，谁喜欢橙子？|Bill|Joy|Lily|Andy|找到 oranges，再看对应的名字。|Bill 说 I like oranges.，表示他喜欢橙子。|Bill: I like oranges. Joy: I like apples. Lily: I like pears. Andy: I like bananas.
按清单整理卡片，哪张是数字卡？|eight|yellow|pear|dog|找出表示数量的单词。|eight 是八，是数字；yellow 是颜色，pear 是水果，dog 是动物。|yellow / pear / eight / dog
读这段问答，回答描述的是书的哪方面？|颜色|数量|价格|大小|green 属于哪一类词？|green 是绿色，回答描述的是这本书的颜色。|指着一本书。A: What colour is it? B: It's green.
读两张标签，哪张标签写着“十”？|卡片乙|卡片甲|两张都是|两张都不是|区分 two 和 ten。|two 是二，ten 是十，所以卡片乙写着“十”。|卡片甲：two。卡片乙：ten。
读这两条指令，第二次应拿起什么？|苹果|红色卡片|梨|蓝色卡片|只看第二条指令里的物品。|第二条 Show me an apple. 要求出示一个苹果。|① Show me red. ② Show me an apple.
'''))
# Present lessons in textbook order.
order=['Starter','Unit 1 School','Unit 2 Face','Unit 3 Animals','Revision 1','Unit 4 Numbers','Unit 5 Colours','Unit 6 Fruit','Revision 2']
lessons.sort(key=lambda l:(order.index(l['tags'][1]),0 if l['category']=='english-vocabulary' else 1))
assert len(lessons)==15 and len(sources)==150
assert len({q['prompt'] for l in lessons for q in l['questions']})==150
OUT.mkdir(exist_ok=True)
(OUT/'lessons.json').write_text(json.dumps(lessons,ensure_ascii=False,indent=2)+'\n')
source=Path('/Users/wuyuanyuan/Downloads/义务教育教科书·英语（一年级起点）一年级上册.pdf')
manifest=dict(batch='grade1-english-starting-line-v1',sourceFile=source.name,sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),textbook='人教版新起点英语（一年级起点）一年级上册',pageMapping='PDF页码 = 书内印刷页码 + 5',questionCount=150,lessonCount=15,scope='Starter、Unit 1–6、Revision 1–2；仅文字可独立作答的原创练习，不含原版听力、歌曲或看图题。',questions=sources)
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'lessons':len(lessons),'questions':len(sources)},ensure_ascii=False))
