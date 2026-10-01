# 人教数学一年级下册

依据用户提供的《义务教育教科书·数学一年级下册》编写，共200道选择题，20关，每关10题。教材封面、目录和代表页已视觉核对；manifest.json 保存原始文件摘要及每题知识点参考页码。PDF页码比印刷页码大5。

| 内容 | 关数 | 题数 |
| --- | ---: | ---: |
| 认识图形（二） | 1 | 10 |
| 20以内的退位减法及应用 | 3 | 30 |
| 分类与整理 | 2 | 20 |
| 100以内数的认识 | 2 | 20 |
| 认识人民币 | 2 | 20 |
| 100以内的加法和减法（一）及应用 | 7 | 70 |
| 找规律 | 2 | 20 |
| 总复习 | 1 | 10 |

前台：全部练习 → 一年级 → 数学，搜索“人教数学一年级下册”。题目分入图形与几何、计算、应用题、统计与可能性、数的认识、单位与测量、规律与逻辑七个现有分类。

题目按教材知识点重新编写，不是原书练习的逐题转录。题目中的数量、分类记录、排列规则、颜色等必要信息均明确提供；不依赖看不到的教材插图。暂不导入剪贴、涂色、实物拼摆或需要上传作业的操作题。

“同样多”“装满几袋”采用连加、连减解释，不要求掌握乘除法。生成器和测试中的乘除运算仅用于核算，不出现在面向学生的算式教学中。人民币练习统一单位后计算，数字计算不超出100。

- lessons.json：发布数据，含答案、提示、解析。
- manifest.json：稳定ID、教材单元和页码、数学核验信息。
- scripts/build-math-grade1-volume2.py：人工编题源稿及可复现生成器。
- scripts/import-math-grade1-volume2.ts：事务导入；只新增缺失ID，若同ID内容已被编辑则停止，不覆盖。
- scripts/verify-math-grade1-volume2.ts：本地手机视口完整答题验证，使用可清理的临时会员。

```sh
python3 scripts/build-math-grade1-volume2.py
node --import tsx --test tests/math-grade1-volume2.test.ts
node --import tsx scripts/import-math-grade1-volume2.ts --check
node --import tsx scripts/import-math-grade1-volume2.ts --apply
```

导入与验证报告位于 content/import-reports/grade1-math-volume2-v1-*.json。
