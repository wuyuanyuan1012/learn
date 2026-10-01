# 人教版英语（一年级起点，主编吴欣）题库

本批次 `pep-starting-line-english-v1` 按指定 ChinaTextbook 目录的 12 册教材编写，共 84 关、840 题。每个年级上下册各 7 关、70 题；每关恰好 10 题。使用新 UUID 命名空间，不恢复已清空的旧英语题库。

## 范围与分类

- 72 个核心单元：每单元 5 道词汇辨义题、5 道语言运用题，共 720 题。
- 每册两篇原创配套短文，每篇 5 题，共 24 篇、120 题。短文随题展示，不依赖原书。
- 单词与短语 36 关、情景交流 24 关、句型与语法 12 关、阅读理解 12 关。
- 相邻两个单元的词汇和运用分别组成关卡；标签可筛选年级、上下册和单元。

这是教材单元主题与基础知识点的改编题库，不是逐页逐题转录，也不表示全部语音、词汇、故事、歌曲、复习页和知识点已全部覆盖。词汇与语言结构会在阅读中复现，以练习不同技能。听音辨音、口语评价、自由写作、绘画制作没有导入成伪自动判分题。

## 来源与核验

`sources.json` 保存固定仓库提交、原始链接、PDF SHA-256、页数、目录及单元页码。12 册共 1,031 页；上册使用文本提取，下册使用 Apple Vision OCR。已逐册视觉核对目录，区分书内页码与 PDF 页序（上册 +5、下册 +4）。

`vocabulary-source-audit.json` 记录全部 360 个词条在相应单元中的实际出现页。匹配统一大小写和空白；单复数词条可匹配词根，中文释义经过人工整理，不使用乱码 OCR 中文释义。

`question-manifest.json` 逐题记录来源单元、页码范围、改编类型、答案依据。词汇使用 `word-occurrence`；语言运用与原创阅读使用 `unit-knowledge-reference`，该引用不代表书中出现了同一道题。所有阅读答案附短文中的直接证据。

`pending-activities.json` 按源文活动标题索引尚未数字化的听说、开放写作等活动页，OCR 检索可能漏项，不表示完整逐题清单。

## 可编辑输入与重建

- `units.txt`：每单元 5 个词义对和 5 道人工编写的四选一题。
- `readings.txt`：24 篇原创短文、题目和逐字证据。
- `scripts/pep-english/build-bank.py`：生成关卡、覆盖报告、逐题来源与词汇审计。需要 `/tmp/learn-pep-english/g1a.txt` 等源文本；来源缺失时拒绝构建。
- `scripts/pep-english/index-pending.py`：生成待处理活动页索引。

```sh
python3 scripts/pep-english/build-bank.py
node --import tsx --test tests/pep-english.test.ts
npm run typecheck
node --import tsx scripts/import-pep-english.ts --check
node --import tsx scripts/import-pep-english.ts --apply
node --import tsx scripts/import-pep-english.ts --check
```

导入使用事务、冲突检查、现有行指纹核验、逐字段回读和稳定编号；重复执行不会重复导入，也不会覆盖后台已编辑的关卡。清空旧英语的操作独立于导入，不随重新导入执行。报告位于 `content/import-reports/`。
