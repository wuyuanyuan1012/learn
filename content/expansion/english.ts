import { rows, type Additions } from './helpers';
export const englishAdditions:Additions={};
const put=(title:string,r:Parameters<typeof rows>[0])=>{englishAdditions[title]=rows(r);};
function vocab(title:string,words:[string,string,string][]) {englishAdditions[title]=words.map(([word,meaning,hint],i)=>({prompt:`词汇拓展：“${word}”表示什么？`,correct:meaning,distractors:[1,2,3].map(n=>words[(i+n)%words.length][1]) as [string,string,string],hint,explanation:`${word} 的中文意思是“${meaning}”。`}));}
vocab('动物英文游乐园',[
 ['tiger','老虎','它是有条纹的大型猫科动物。'],['elephant','大象','它有长鼻子。'],['monkey','猴子','它擅长攀爬，常生活在树林里。'],['panda','熊猫','常见的大熊猫黑白相间，主要吃竹子。'],['duck','鸭子','它有蹼，常在水中游动。'],
]);
vocab('水果英文篮子',[
 ['peach','桃子','它是一种常有细毛的核果。'],['strawberry','草莓','它常呈红色，表面有很多小点。'],['cherry','樱桃','小巧的核果，成熟时常为红色。'],['lemon','柠檬','味道通常较酸，果皮常为黄色。'],['pineapple','菠萝','果皮有格状纹路，顶端有一簇叶。'],
]);
vocab('文具盒里的英语',[
 ['pen','钢笔','它使用墨水书写，不是pencil。'],['notebook','笔记本','可在里面记录课堂笔记。'],['crayon','蜡笔','常用来涂色的一种画笔。'],['pencil case','铅笔盒','用来装铅笔等文具。'],['dictionary','词典','可以用来查词义。'],
]);
vocab('认识身体小伙伴',[
 ['head','头','它位于身体上方，脸是它的一部分。'],['arm','手臂','它连接肩部与手。'],['leg','腿','它帮助站立和行走。'],['foot','脚','鞋子穿在这个部位上。'],['hair','头发','通常长在头上。'],
]);
vocab('我的英文家庭树',[
 ['grandmother','奶奶或外婆','父亲或母亲的母亲。'],['uncle','叔叔、伯伯或舅舅等','用于父母兄弟等男性长辈，也可指姑父、姨父。'],['aunt','姑姑、姨妈或婶婶等','用于父母姐妹等女性长辈，也可指伯母、舅妈。'],['cousin','堂兄弟姐妹或表兄弟姐妹','叔伯姑舅姨的孩子，与自己属于同辈。'],['parents','父母','father和mother合称什么？'],
]);
put('英文数字开火车',[
 ['There is one apple. 句子中有几个苹果？','1个','2个|3个|5个','注意one。','one表示一，所以句子说有1个苹果。'],
 ['I have two pencils. 我有几支铅笔？','2支','1支|3支|4支','注意数量词two。','two pencils表示两支铅笔。'],
 ['Three birds are in the tree. 树上有几只鸟？','3只','1只|2只|5只','three是数量词。','three birds表示三只鸟。'],
 ['Four books are on the desk. 桌上有几本书？','4本','1本|2本|3本','观察books前的词。','four books表示四本书。'],
 ['I see five stars. 我看到了几颗星星？','5颗','1颗|3颗|4颗','five是数字单词。','five stars表示五颗星星。'],
]);
put('礼貌表达小剧场',[
 ['晚上临睡前，可以用哪句话道晚安？','Good night!','Good morning!|Stand up!|How old are you?','注意night表示夜晚。','Good night!常用于晚上告别或睡前道晚安。'],
 ['朋友说“Thank you!”时，哪句回答最合适？',"You're welcome.",'Goodbye.|I am ten.|It is red.','对方在表示感谢。',"You're welcome.表示“不客气”，可以回应感谢。"],
 ['想礼貌地引起陌生人的注意，可以先说什么？','Excuse me.','Go away.|Good night.|Sit down.','问路前常用的礼貌表达。','Excuse me.可表示“打扰一下”，用于礼貌引起注意。'],
 ['与朋友分别时，哪句话表示“再见”？','Goodbye!','Welcome!|Thank you!|Good morning!','这里是离别情境。','Goodbye!表示再见。'],
 ['第一次见面，对方说“Nice to meet you.”，可以怎样回答？','Nice to meet you, too.','I am at home.|It is raining.|Open the book.','对方表示很高兴认识你。','Nice to meet you, too.表示“我也很高兴认识你”。'],
]);
vocab('职业英文体验馆',[
 ['cook','厨师','以做饭、烹饪为职业的人。'],['pilot','飞行员','驾驶飞机的人。'],['worker','工人','通常指从事体力或技术劳动的人。'],['dentist','牙医','帮助检查和治疗牙齿的人。'],['firefighter','消防员','参与灭火和救援的人员。'],
]);
vocab('英文城市小地图',[
 ['cinema','电影院','可以观看电影的场所。'],['museum','博物馆','常展示文物或知识展品。'],['restaurant','餐馆','可以点餐就餐的地方。'],['post office','邮局','可以办理寄信等业务。'],['zoo','动物园','人们在这里参观多种动物。'],
]);
vocab('英文衣柜整理日',[
 ['sweater','毛衣','常用毛线织成的上衣。'],['socks','袜子','一般穿在鞋子里面。'],['trousers','长裤','覆盖两条腿的长下装。'],['gloves','手套','寒冷时常戴在手上。'],['scarf','围巾','常围在脖子上保暖。'],
]);
vocab('英文天气播报',[
 ['hot','热的','温度高时的感觉。'],['cold','冷的','温度低时的感觉。'],['warm','温暖的','不冷也不太热，偏暖。'],['cool','凉爽的','天气适度偏凉时的感觉。'],['foggy','有雾的','空气中有雾，远处景物不清晰。'],
]);
put('物品藏在哪里',[
 ['The school is between the park and the shop. 学校在哪里？','公园和商店之间','公园上方|商店内部|公园下面','between表示在两者之间。','between A and B表示在A与B之间。'],
 ['The bike is in front of the house. 自行车在哪里？','房子前面','房子后面|房子里面|房子上方','注意in front of这个短语。','in front of the house表示在房子前面。'],
 ['The kite is above the tree. 风筝在哪里？','树的上方','树干里面|树的下方|地下','above表示位置更高。','above the tree表示在树的上方。'],
 ['The shoes are under the bed. 鞋子在哪里？','床下面','床上面|床里面|床头柜上','under表示在某物下方。','under the bed表示在床下面。'],
 ['The ball is near the chair. 球在哪里？','椅子附近','椅子内部|椅子上面|天花板上','near强调距离近。','near the chair表示在椅子附近，没有明确说在椅子上。'],
]);
put('一周的英文安排',[
 ['Which day comes after Friday? 星期五后一天是？','Saturday','Monday|Tuesday|Thursday','按一周顺序往后数一天。','Friday之后是Saturday，即星期六。'],
 ['Which day comes before Monday? 星期一前一天是？','Sunday','Tuesday|Wednesday|Friday','星期日之后进入新的一周。','Monday之前是Sunday，即星期日。'],
 ['Today is Tuesday. Tomorrow is ___. 应填？','Wednesday','Monday|Friday|Sunday','tomorrow表示明天。','星期二的下一天是星期三Wednesday。'],
 ['Today is Thursday. Yesterday was ___. 应填？','Wednesday','Friday|Saturday|Monday','yesterday表示昨天。','星期四的前一天是星期三Wednesday。'],
 ['Which pair usually names the weekend? 哪组通常表示周末？','Saturday and Sunday','Monday and Tuesday|Tuesday and Wednesday|Wednesday and Thursday','通常的周末是星期六和星期日。','Saturday是星期六，Sunday是星期日，合起来表示周末。'],
]);
vocab('英文月份日历',[
 ['June','六月','一年中的第六个月。'],['July','七月','在June之后。'],['August','八月','在July之后、September之前。'],['September','九月','一年中的第九个月。'],['October','十月','一年中的第十个月。'],
]);
vocab('动起来的英语',[
 ['sing','唱歌','用声音表现歌曲。'],['jump','跳跃','双脚或单脚离地的动作。'],['walk','步行','普通速度的一步一步移动。'],['draw','画画','用线条和颜色表现图画。'],['listen','听','用耳朵注意声音。'],
]);
put('是谁的物品',[
 ['You have a ruler. This is ___ ruler. 应填？','your','my|his|their','物品属于you。','you对应your，your ruler表示你的尺子。'],
 ['The cat has a long tail. ___ tail is black. 应填？','Its','His|Her|Our','这里说的是猫自己的尾巴。','物主代词its表示它的，Its tail表示它的尾巴。'],
 ['This book belongs to me. It is ___. 应填？','mine','my|me|I','空格后没有名词。','名词性物主代词mine可以独立表示“我的（书）”。'],
 ['Is this your pen? Yes, it is ___. 应填？','mine','my|I|me','回答者说这支笔是自己的。','it is mine表示它是我的，mine后面不需要再接名词。'],
 ['These bags belong to the children. They are ___ bags. 应填？','their','his|her|my','children表示多个孩子。','复数的孩子们对应their，表示他们的。'],
]);
put('英文比较小擂台',[
 ['short 的比较级应写成什么？','shorter','shortest|shortly|more shorter','单音节形容词通常加-er。','short加-er构成shorter，表示更短或更矮。'],
 ['thin 的比较级应写成什么？','thinner','thiner|thinnest|more thinner','需要双写末尾辅音字母。','thin双写n再加-er，构成thinner。'],
 ['happy 的比较级应写成什么？','happier','happyer|happiest|more happier','辅音字母加y结尾，变y为i。','happy变y为i再加-er，构成happier。'],
 ['good 的比较级应写成什么？','better','gooder|best|more better','这是不规则变化。','good的比较级是better，最高级是best。'],
 ['This bag is ___ than that one. 要表达“更大”，应填？','bigger','big|biggest|biger','than通常提示两者比较。','big的比较级是bigger，注意双写g。'],
]);
put('昨天发生的故事',[
 ['I ___ my room yesterday. 应填clean的过去式。','cleaned','cleans|cleaning|clean','时间是yesterday。','clean的规则过去式是cleaned。'],
 ['She ___ a letter last night. 应填write的过去式。','wrote','writes|writing|writed','write是一个不规则动词。','write的过去式是wrote，表示写了。'],
 ['We ___ happy yesterday. 应填哪个be动词？','were','are|is|am','主语we是复数，时间是过去。','we在过去时中搭配were。'],
 ['He ___ at home last Sunday. 应填哪个be动词？','was','is|are|am','主语he是单数，时间是过去。','he在过去时中搭配was。'],
 ['Did you ___ football yesterday? 应填？','play','played|plays|playing','助动词did后使用动词原形。','疑问句有did时，后面的实义动词用原形play。'],
]);
put('明天的小计划',[
 ['He will ___ his grandparents tomorrow. 应填？','visit','visits|visited|visiting','will后使用动词原形。','will visit表示将要看望，动词用原形。'],
 ['I ___ going to make a card this evening. 应填？','am','is|are|be','主语是I。','I与am搭配：I am going to...。'],
 ['We are going to ___ a picnic next week. 应填？','have','has|had|having','going to后接动词原形。','have a picnic表示野餐，将来计划中用have。'],
 ['“她明天将会游泳。”哪一句表达正确？','She will swim tomorrow.','She will swims tomorrow.|She swam yesterday.|She is swim tomorrow.','既要表达将来，也要注意动词形式。','will后用原形swim，tomorrow表示明天。'],
 ['Which phrase refers to the future? 哪个短语指将来？','next month','last month|two weeks ago|yesterday morning','next表示接下来的。','next month是下个月，其他短语指过去。'],
]);
put('读懂英文小故事',[
 ['Mia has a green bag. Her brother has a yellow bag. What color is Mia\'s bag?','Green.','Yellow.|Blue.|Red.','分清Mia和她哥哥或弟弟的物品。','Mia has a green bag说明她的书包是绿色。'],
 ['Jack goes to the library on Saturday. He reads there. Where does Jack read?','In the library.','In the kitchen.|At the zoo.|On the bus.','there指前一句提到的地点。','前一句地点是library，所以他在图书馆阅读。'],
 ['Lily has six apples. She gives two to Ben. How many apples does Lily have now?','Four.','Two.|Six.|Eight.','找原有数量和送出的数量。','6减2等于4，Lily还剩四个苹果。'],
 ['It is cold today. Dan puts on his coat. Why does Dan wear a coat?','Because it is cold.','Because it is hot.|Because he is swimming.|Because he lost his shoes.','第一句话给出天气信息。','天气冷，所以Dan穿上外套。'],
 ['Anna gets home at five and has dinner at six. When does Anna have dinner?','At six.','At five.|At seven.|At eight.','问题问晚饭时间，不是回家时间。','has dinner at six明确说明六点吃晚饭。'],
]);
vocab('颜色英文小课堂',[
 ['black','黑色','像常见的黑板或煤的颜色。'],['pink','粉色','比红色浅、常称粉红的颜色。'],['purple','紫色','常见的紫葡萄可呈这种颜色。'],['brown','棕色','许多树干呈这种颜色。'],['orange','橙色','这里表示颜色，与成熟橙子的果皮相近。'],
]);
