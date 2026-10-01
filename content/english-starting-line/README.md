# 新起点英语一年级上册题库

依据用户提供的《义务教育教科书·英语（一年级起点）一年级上册》整理。版本为人教版新起点 Starting Line；原始 PDF 的 SHA-256 保存在 manifest.json。印刷页码加 5 为 PDF 页码。

共 150 道原创选择题，15 关，每关 10 题，适用于一年级上册：

| 内容 | 关卡 | 题数 |
| --- | ---: | ---: |
| Starter 问候与自我介绍 | 1 | 10 |
| Unit 1 School | 2 | 20 |
| Unit 2 Face | 2 | 20 |
| Unit 3 Animals | 2 | 20 |
| Revision 1 | 1 | 10 |
| Unit 4 Numbers | 2 | 20 |
| Unit 5 Colours | 2 | 20 |
| Unit 6 Fruit | 2 | 20 |
| Revision 2 | 1 | 10 |

主分类：单词与短语 6 关、情景交流 7 关、阅读理解 2 关。标签“新起点一年级上册”可在前台检索全套题。

题目使用教材的核心词汇和常用句型重新编写。题内的虚构场景、物品颜色、数量和个人喜好均明确给出，不要求记忆教材插图。复习阅读题提供完整短对话。每题含中文提示、唯一正确选项和中文解析。

不含原版听力、歌曲、插图识别和涂画操作题；PDF 未提供可播放录音，不以文字冒充原版听力。该题库不是教材全部练习的逐题转录。

- lessons.json：可发布题库。
- manifest.json：每道题的单元、参考页码、稳定 ID 和正确答案，页码指所依据的知识点，并非原题位置。
- ../../scripts/build-english-starting-line.py：可复现的人工编题源稿；只生成本地文件。
- ../../scripts/import-english-starting-line.ts：检查或事务导入，遇到同 ID 内容被修改会停止，绝不覆盖已有题目。

```sh
node --import tsx --test tests/english-starting-line.test.ts
node --import tsx scripts/import-english-starting-line.ts --check
node --import tsx scripts/import-english-starting-line.ts --apply
```

导入结果及移动端验证结果保存在 content/import-reports/grade1-english-starting-line-v1-*.json。
