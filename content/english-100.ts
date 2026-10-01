import { facts, type DraftLesson, type DraftQuestion } from './bank-types';
const bank:DraftLesson[]=[];
function vocabulary(grade:number,title:string,topic:string,words:[string,string,string,string][]) {
 const questions:DraftQuestion[]=words.map(([en,zh,hint,example],i)=>({prompt:`英语单词“${en}”的中文意思是什么？`,correct:zh,distractors:[1,2,3].map(offset=>words[(i+offset)%words.length][1]) as [string,string,string],hint,explanation:`${en} 表示“${zh}”。${example}`}));
 bank.push({subject:'english',grade,title,topic,questions});
}
vocabulary(3,'动物英文游乐园','动物词汇',[
 ['cat','猫','这种小动物会发出“喵”的叫声。','a cat 是“一只猫”。'],
 ['dog','狗','这种动物常被人们称为忠实的朋友。','a dog 是“一只狗”。'],
 ['rabbit','兔子','它常有长耳朵，喜欢蹦跳。','a rabbit 是“一只兔子”。'],
 ['bird','鸟','这种动物有羽毛。','a bird 是“一只鸟”。'],
 ['fish','鱼','这种动物通常生活在水中，用鳃呼吸。','a fish 是“一条鱼”。'],
]);
vocabulary(3,'水果英文篮子','水果词汇',[
 ['apple','苹果','这种水果常见的颜色有红色和绿色。','an apple 是“一个苹果”。'],
 ['banana','香蕉','它通常长而弯，成熟时外皮常为黄色。','a banana 是“一根香蕉”。'],
 ['pear','梨','这种水果常被描述为上窄下宽的形状。','a pear 是“一个梨”。'],
 ['grape','葡萄','这种水果常常一串串生长。','a grape 是“一颗葡萄”。'],
 ['watermelon','西瓜','夏季常见的大型瓜果，果肉通常呈红色。','a watermelon 是“一个西瓜”。'],
]);
vocabulary(3,'文具盒里的英语','学习用品',[
 ['pencil','铅笔','它的书写痕迹通常能用橡皮擦掉。','a pencil 是“一支铅笔”。'],
 ['ruler','尺子','它可以帮助测量长度和画直线。','a ruler 是“一把尺子”。'],
 ['eraser','橡皮','它常与铅笔配合使用，用来擦除痕迹。','an eraser 是“一块橡皮”。'],
 ['book','书','它有书页，可以阅读。','a book 是“一本书”。'],
 ['schoolbag','书包','上学时常用它装书和文具。','a schoolbag 是“一个书包”。'],
]);
vocabulary(3,'认识身体小伙伴','身体部位',[
 ['eye','眼睛','我们用它来看东西。','an eye 是“一只眼睛”。'],
 ['ear','耳朵','我们用它来听声音。','an ear 是“一只耳朵”。'],
 ['nose','鼻子','我们用它来闻气味。','a nose 是“一个鼻子”。'],
 ['mouth','嘴巴','我们用它吃东西和说话。','a mouth 是“一张嘴”。'],
 ['hand','手','我们用它拿东西、写字。','a hand 是“一只手”。'],
]);
vocabulary(3,'我的英文家庭树','家庭成员',[
 ['father','爸爸','这个词指家里的男性家长。','my father 表示“我的爸爸”。'],
 ['mother','妈妈','这个词指家里的女性家长。','my mother 表示“我的妈妈”。'],
 ['brother','兄弟','这个词用于男性的同胞。','my brother 可表示“我的哥哥”或“我的弟弟”。'],
 ['sister','姐妹','这个词用于女性的同胞。','my sister 可表示“我的姐姐”或“我的妹妹”。'],
 ['grandfather','爷爷或外公','这是父亲或母亲的父亲。','grandfather 可指祖父，也可指外祖父。'],
]);
vocabulary(3,'英文数字开火车','数字1至5',[
 ['one','一','它表示单个的数量。','one book 表示“一本书”。'],
 ['two','二','它是one后面的一个数。','two pens 表示“两支钢笔”。'],
 ['three','三','它比two多一。','three cats 表示“三只猫”。'],
 ['four','四','正方形的边数正好是这个数。','four birds 表示“四只鸟”。'],
 ['five','五','一只手通常有这么多根手指。','five apples 表示“五个苹果”。'],
]);
bank.push(facts('english',3,'礼貌表达小剧场','日常问候',[
 ['早上见到老师，可以用哪句英语问候？','Good morning!','Good night!','Goodbye!','Sorry!','注意表示“早上”的词morning。','Good morning!表示“早上好！”，适合早晨问候。'],
 ['别人帮助了你，英语中可以怎样感谢？','Thank you!','Good night!','Stand up!','See you!','感谢时常用thank这个词。','Thank you!表示“谢谢你！”。'],
 ['不小心碰到别人，哪句英语适合表达歉意？','Sorry!','Hello!','Thank you!','Good morning!','选择表示道歉的说法。','Sorry!表示“对不起！”，可用于表达歉意。'],
 ['朋友说“How are you?”，哪句回答最合适？',"I'm fine, thank you.",'My name is Tom.','It is a pencil.','Good night.','对方在询问你的状况。',"How are you?表示“你好吗？”，可回答I'm fine, thank you.。"],
 ['朋友问“What is your name?”，哪句回答最合适？','My name is Lily.','I am fine.','It is blue.','Thank you.','对方想知道你的名字。','My name is Lily.表示“我的名字是莉莉。”，直接回答了姓名。'],
]));
vocabulary(4,'职业英文体验馆','常见职业',[
 ['teacher','教师','这种职业常在学校教学生。','a teacher 是“一位教师”。'],
 ['doctor','医生','这种职业负责诊断疾病并治疗病人。','a doctor 是“一位医生”。'],
 ['nurse','护士','这种职业在医疗场所护理病人。','a nurse 是“一位护士”。'],
 ['farmer','农民','这种职业常与种植庄稼、养殖有关。','a farmer 是“一位农民”。'],
 ['driver','司机','这种职业需要驾驶车辆。','a driver 是“一位司机”。'],
]);
vocabulary(4,'英文城市小地图','地点词汇',[
 ['school','学校','学生在这里上课。','at school 表示“在学校”。'],
 ['hospital','医院','生病时可以去这里就医。','a hospital 是“一家医院”。'],
 ['library','图书馆','在这里可以阅读和借阅书籍。','a library 是“一座图书馆”。'],
 ['park','公园','人们常在这里散步、休闲。','in the park 表示“在公园里”。'],
 ['supermarket','超市','这里出售食品和各种日用品。','a supermarket 是“一家超市”。'],
]);
vocabulary(4,'英文衣柜整理日','衣物词汇',[
 ['shirt','衬衫','它是一种上衣，常有领子和纽扣。','a shirt 是“一件衬衫”。'],
 ['skirt','裙子','它是常见的下装之一。','a skirt 是“一条裙子”。'],
 ['coat','外套','天气较冷时，可以把它穿在其他衣服外面。','a coat 是“一件外套”。'],
 ['shoes','鞋子','外出时穿在脚上的物品。','a pair of shoes 表示“一双鞋”。'],
 ['hat','帽子','它通常戴在头上。','a hat 是“一顶帽子”。'],
]);
vocabulary(4,'英文天气播报','天气描述',[
 ['sunny','晴朗的','这个词与太阳sun有关。','a sunny day 表示“晴朗的一天”。'],
 ['rainy','下雨的','这个词与雨rain有关。','a rainy day 表示“下雨的一天”。'],
 ['windy','有风的','这个词与风wind有关。','It is windy.表示“天气有风。”。'],
 ['snowy','下雪的','这个词与雪snow有关。','a snowy day 表示“下雪的一天”。'],
 ['cloudy','多云的','这个词与云cloud有关。','It is cloudy.表示“天气多云。”。'],
]);
bank.push(facts('english',4,'物品藏在哪里','方位介词',[
 ['The cat is under the desk. 猫在哪里？','桌子下面','桌子上面','桌子里面','桌子前面','关注介词under。','under表示“在……下面”，所以猫在桌子下面。'],
 ['The book is on the table. 书在哪里？','桌子上面','桌子下面','桌子后面','桌子里面','关注介词on。','on表示“在……上面”，此处书在桌子上面。'],
 ['The ball is in the box. 球在哪里？','盒子里面','盒子上面','盒子下面','盒子旁边','关注介词in。','in表示“在……里面”，所以球在盒子里面。'],
 ['The dog is behind the door. 狗在哪里？','门后面','门前面','门上面','门下面','behind表示一个物体后方的位置。','behind the door表示“在门后面”。'],
 ['The chair is next to the bed. 椅子在哪里？','床旁边','床下面','床上面','床里面','next to表示紧挨着。','next to the bed表示“在床旁边”。'],
]));
vocabulary(5,'一周的英文安排','星期词汇',[
 ['Monday','星期一','它是星期日之后的一天。','on Monday 表示“在星期一”。'],
 ['Tuesday','星期二','它在Monday之后、Wednesday之前。','on Tuesday 表示“在星期二”。'],
 ['Wednesday','星期三','它在Tuesday之后、Thursday之前。','on Wednesday 表示“在星期三”。'],
 ['Thursday','星期四','它在Wednesday之后、Friday之前。','on Thursday 表示“在星期四”。'],
 ['Friday','星期五','它在Thursday之后、Saturday之前。','on Friday 表示“在星期五”。'],
]);
vocabulary(5,'英文月份日历','月份词汇',[
 ['January','一月','它是一年中的第一个月。','in January 表示“在一月”。'],
 ['February','二月','它在January之后，是天数最少的月份。','in February 表示“在二月”。'],
 ['March','三月','它是一年中的第三个月。','in March 表示“在三月”。'],
 ['April','四月','它在March之后、May之前。','in April 表示“在四月”。'],
 ['May','五月','它是一年中的第五个月。','in May 表示“在五月”。'],
]);
vocabulary(5,'动起来的英语','日常动词',[
 ['swim','游泳','这项活动在水中进行。','I can swim.表示“我会游泳。”。'],
 ['run','跑步','它是比走路更快的移动动作。','I can run.表示“我会跑步。”。'],
 ['dance','跳舞','这个动作常配合音乐进行。','I can dance.表示“我会跳舞。”。'],
 ['read','阅读','这个动作常常与书籍有关。','read a book 表示“读一本书”。'],
 ['write','书写','它常需要用笔记录文字。','write a letter 表示“写一封信”。'],
]);
bank.push(facts('english',5,'是谁的物品','物主代词',[
 ['I have a pen. This is ___ pen. 应填什么？','my','his','her','their','物品属于“I”，选“我的”。','I对应的形容词性物主代词是my，my pen表示“我的钢笔”。'],
 ['Tom is a boy. This is ___ bag. 这个包是汤姆的，应填什么？','his','her','my','our','Tom是男孩，选择“他的”。','his表示“他的”，his bag指汤姆的包。'],
 ['Lily is a girl. This is ___ book. 这本书是莉莉的，应填什么？','her','his','our','their','Lily是女孩，选择“她的”。','her表示“她的”，her book指莉莉的书。'],
 ['We have a classroom. This is ___ classroom. 应填什么？','our','my','his','her','物品属于“we”，选“我们的”。','we对应our，our classroom表示“我们的教室”。'],
 ['They have a dog. That is ___ dog. 应填什么？','their','our','his','my','物品属于“they”，选“他们的”。','they对应their，their dog表示“他们的狗”。'],
]));
bank.push(facts('english',6,'英文比较小擂台','形容词比较级',[
 ['tall的比较级是哪一个？','taller','tallest','more taller','tally','多数单音节形容词加-er构成比较级。','tall加-er成为taller，表示“更高的”；tallest是最高级。'],
 ['long的比较级是哪一个？','longer','longest','more longer','longly','比较两者长度时，常在long后加-er。','longer是long的比较级，表示“更长的”。'],
 ['big的比较级是哪一个？','bigger','biger','biggest','more bigger','末尾是重读闭音节，需双写最后的辅音字母。','big双写g再加-er，成为bigger。'],
 ['heavy的比较级是哪一个？','heavier','heavyer','heaviest','more heavier','辅音字母加y结尾，先把y改为i。','heavy变y为i再加-er，得到heavier，表示“更重的”。'],
 ['small的比较级是哪一个？','smaller','smallest','more smaller','smally','它是规则变化的单音节形容词。','small加-er得到smaller，表示“更小的”。'],
]));
bank.push(facts('english',6,'昨天发生的故事','一般过去时',[
 ['I ___ to the park yesterday. 应填go的哪种过去式？','went','goes','going','goed','go的过去式是不规则变化。','yesterday表示昨天，go的过去式是went。'],
 ['She ___ a bird yesterday. 应填see的哪种过去式？','saw','sees','seeing','seed','see的过去式与原形拼写不同。','see的过去式是saw，表示过去看见。'],
 ['He ___ an apple yesterday. 应填eat的哪种过去式？','ate','eats','eating','eated','eat的过去式是不规则变化。','eat的过去式是ate，表示过去吃过。'],
 ['We ___ a new bag last week. 应填buy的哪种过去式？','bought','buys','buying','buyed','buy的过去式不是直接加-ed。','buy的过去式是bought，last week提示过去发生的动作。'],
 ['They ___ football yesterday. 应填play的哪种过去式？','played','plays','playing','playen','play是规则动词，过去式加-ed。','play的过去式是played，表示过去踢过足球。'],
]));
bank.push(facts('english',6,'明天的小计划','将来表达',[
 ['We ___ visit the museum tomorrow. 哪个词最合适？','will','was','does','did','tomorrow提示尚未发生的计划。','will后接动词原形，will visit表示将要参观。'],
 ['I am going to ___ a book tonight. 应填什么？','read','reads','reading','readed','be going to后面使用动词原形。','am going to后接动词原形read，表示打算读书。'],
 ['She ___ going to draw a picture tomorrow. 应填什么？','is','am','are','be','主语she要与be动词搭配。','she是第三人称单数，应用is：She is going to...。'],
 ['They ___ going to play basketball next Sunday. 应填什么？','are','am','is','be','主语they是复数。','they搭配are，They are going to...表示他们打算……。'],
 ['哪一个时间短语表示将来的时间？','next week','yesterday','last year','two days ago','next常表示接下来的时间。','next week表示“下周”，其余三个短语表示过去。'],
]));
bank.push(facts('english',6,'读懂英文小故事','短文信息提取',[
 ['Amy has a red bike. She rides it to school. What color is her bike?','Red.','Blue.','Green.','Black.','在第一句话中寻找颜色词。','第一句a red bike说明自行车是红色的，应选Red.。'],
 ['Ben gets up at seven. He has breakfast at eight. When does Ben get up?','At seven.','At eight.','At six.','At nine.','问题问的是起床时间，不是早餐时间。','gets up at seven明确说明本七点起床。'],
 ['Lucy likes cats. Her brother likes dogs. What does Lucy like?','Cats.','Dogs.','Birds.','Fish.','分清Lucy和her brother两个人的喜好。','第一句Lucy likes cats.说明露西喜欢猫。'],
 ['Sam has two pens and three books. How many books does Sam have?','Three.','Two.','Five.','One.','问题问books的数量。','three books表示三本书，所以选Three.。'],
 ['It is rainy today. Tom stays at home and reads. Where is Tom?','At home.','At school.','In the park.','In a shop.','寻找stays后面表示地点的短语。','stays at home表示待在家里，所以汤姆在家。'],
]));
export const englishLessons=bank;
