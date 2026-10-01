import { chromium, expect } from '@playwright/test';
import { createTestMember, deleteTestMember, loginMember } from '../tests/e2e/member-fixture';
import { englishStartingLineLessons as bank } from '../content/english-starting-line';
import { writeFile } from 'node:fs/promises';
async function main() {
  const baseURL='http://127.0.0.1:3001';
  const member=await createTestMember();
  let browser;
  try {
    browser=await chromium.launch({channel:'chrome',headless:true});
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true});
    await loginMember(context,baseURL,member.password);
    const page=await context.newPage();
    await page.goto(`${baseURL}/practice`);
    await page.getByRole('combobox',{name:'学习年级'}).selectOption('1');
    await page.getByRole('group',{name:'学科筛选'}).getByRole('button',{name:'英语',exact:true}).click();
    await page.getByRole('textbox',{name:'搜索关卡'}).fill('新起点一年级上册');
    await expect(page.locator('.lesson-card')).toHaveCount(15);
    for(const [name,count] of [['单词与短语',6],['情景交流',7],['阅读理解',2]] as const) {
      await page.getByRole('group',{name:'知识分类筛选'}).getByRole('button',{name:new RegExp(name)}).click();
      await expect(page.locator('.lesson-card')).toHaveCount(count);
    }
    await page.getByRole('group',{name:'知识分类筛选'}).getByRole('button',{name:'全部分类',exact:true}).click();
    await page.screenshot({path:'/tmp/learn-english-pdf/mobile-library.png',fullPage:true});
    const l=bank.find(l=>l.category==='english-reading')!;
    await page.locator(`a.lesson-card[href="/learn/${l.id}"]`).click();
    for(let i=0;i<10;i++) {
      const q=l.questions[i];
      await expect(page.getByRole('heading',{name:q.prompt,exact:true})).toBeVisible();
      await expect(page.locator('.question-context')).toHaveText(q.context);
      await page.getByRole('button',{name:'给我一点提示',exact:true}).click();
      await expect(page.locator('.hint-content')).toHaveText(q.hint);
      await page.getByRole('button',{name:`${String.fromCharCode(65+q.answer)} ${q.options[q.answer]}`,exact:true}).click();
      await page.getByRole('button',{name:'确认答案',exact:true}).click();
      await expect(page.getByRole('heading',{name:'答对啦，想得很棒！'})).toBeVisible();
      await expect(page.locator('.feedback')).toContainText(q.explanation);
      if(i===0) {
        expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
        await page.screenshot({path:'/tmp/learn-english-pdf/mobile-quiz.png',fullPage:true});
      }
      await page.getByRole('button',{name:i===9?'看看学习成果':'下一题',exact:true}).click();
    }
    await expect(page.getByRole('heading',{name:'挑战完成！',exact:true})).toBeVisible();
    await expect(page.getByText('全部答对了，继续保持好奇心！',{exact:true})).toBeVisible();
    await writeFile('content/import-reports/grade1-english-starting-line-v1-browser.json',JSON.stringify({checkedAt:new Date().toISOString(),surface:'local production build connected to database',mobileViewport:'390x844',visibleNewLessons:15,categoryCounts:{vocabulary:6,conversation:7,reading:2},completedLessonId:l.id,correct:10,total:10,hintsAndExplanationsVerified:true,horizontalOverflow:false},null,2)+'\n');
    console.log('PASS: 15 lessons, 3 category filters, 10/10 quiz with context, hints and explanations, mobile layout.');
  } finally {
    await browser?.close();
    await deleteTestMember(member.id);
    console.log('Temporary test member removed.');
  }
}
main().catch(()=>{console.error('BROWSER_CHECK_FAILED');process.exitCode=1;});
