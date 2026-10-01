# 统编版小学语文题库

用户授权清空全部旧语文题目且不创建备份，随后导入 ChinaTextbook 的统编版目录。本批按教材单元选取字词和知识点，改编为可自动判分的选择题；并非全部课后原题逐字转录。

共 **134 关、1,340 题**，每关 10 题，覆盖 **12 册、94 个单元**。每单元至少 10 题，包含词汇基础及对应的语文知识练习。

| 年级 | 上册 | 下册 | 合计题数 | 关卡数 |
| --- | ---: | ---: | ---: | ---: |
| 一年级 | 120 | 120 | 240 | 24 |
| 二年级 | 120 | 110 | 230 | 23 |
| 三年级 | 110 | 110 | 220 | 22 |
| 四年级 | 110 | 110 | 220 | 22 |
| 五年级 | 110 | 120 | 230 | 23 |
| 六年级 | 110 | 90 | 200 | 20 |

七类：拼音 480 题、汉字 40 题、词语 460 题、句子与标点 60 题、古诗文 120 题、阅读理解 120 题、写话与习作 60 题。

前台「全部练习」选择年级和语文后可按知识分类筛选；搜索 `3年级下册` 等可限定册别。字音、词义练习每关通常组合两个单元，每道题的所属单元单独保存在 manifest 中，关卡标签列出涉及的单元。

## 来源与内容性质

来源：[ChinaTextbook 统编版语文目录](https://github.com/TapXWorld/ChinaTextbook/tree/5a80345f2043ba6f8db8d7be9cf3db82725ff1f7/小学/语文/统编版)，固定 commit 为 `5a80345f2043ba6f8db8d7be9cf3db82725ff1f7`。

`sources.json` 保存 12 份 PDF 的固定下载地址、SHA-256、页数、单元目录。全部 1,601 页完成文字提取，逐册查看目录图像；一年级上册正文实图核对了页码，12 册印刷页均为 PDF 页减 5。部分 PDF 的 Poppler 标记内容语法有警告，但文本提取完成，所用诗句另经逐句比对。

- 460 个词条每条生成字音、词义各一题。437 个词条在对应单元的 PDF 文本中定位到文字出现页；另外 23 个作为相应单元的知识点补充，明确使用 `unit-knowledge-reference`，不声称该词必然逐字出现在参考页。
- 注音按字词本调标注，轻声不加调号。pypinyin 0.55.0 仅用于交叉检查，447 项一致，13 项轻声、多音或古文读音按语境校订；不能用词典库默认输出覆盖教材读音。详情见 `pinyin-audit.json`。
- 词义是为选择题编写的简明释义。选择题只要求从给定选项中辨认合适解释，不声称列出了一个词的全部义项。
- 120 道阅读题使用 12 篇按年级能力目标编写的原创短文，每题提供短文全文，**不是教材课文原文**。来源单元表示所练习的能力参考，不能当成原文所在页。
- 120 道古诗题来自 24 首公版古诗，提供作答材料，正文、作者、朝代逐首与教材文本核对。保留教材《雪梅》的“阁”字写法。诗文出处页保存在 `poems.json` 和 manifest 中。
- 习作、口语交际、观察和看图类知识被改编为选材、顺序、表达及阅读判断。完整作文、书写、背诵、朗读录音与现场活动没有伪装成自动评分原题。
- `pending-activity-pages.json` 是 347 页含相关活动关键词的辅助索引，供后续开发开放题/配图题使用；不是逐题完整的未导入清单。

## 构建和验证

主要数据：`vocabulary.txt`、`modules.json`、`poems.json`。发布数据：`lessons.json`。逐题来源及正确答案依据：`manifest.json`。覆盖统计：`coverage.json`。

```sh
# 源 PDF 和提取文本暂存在 /tmp/learn-chinese；运行题库不依赖临时文件。
python3 scripts/tongbian-chinese/author-modules.py
python3 scripts/tongbian-chinese/author-reading.py
python3 scripts/tongbian-chinese/author-poems.py
python3 scripts/tongbian-chinese/build-bank.py
# audit-content.py 需要临时目录中的 pypinyin 0.55.0 和教材文本。
python3 scripts/tongbian-chinese/audit-content.py
node --import tsx --test tests/tongbian-chinese.test.ts
npm run typecheck
node --import tsx scripts/import-tongbian-chinese.ts --check
node --import tsx scripts/import-tongbian-chinese.ts --apply
node --import tsx scripts/import-tongbian-chinese.ts --check
```

导入器在一个事务内按 15 关分块写入，对导入前存在的所有关卡校验指纹，已有本批 ID 的内容被编辑时拒绝覆盖。重复执行不会新增重复关卡。清空报告与导入报告位于 `../import-reports/`，报告只含数量等操作结果，没有旧语文题目内容备份。

本次是数据导入，无需部署前后台代码。手机验证 `scripts/verify-tongbian-chinese.ts` 使用临时会员检查所有年级、上下册、知识分类，以及字音、阅读、古诗三关完整答题，结束后删除测试会员。
