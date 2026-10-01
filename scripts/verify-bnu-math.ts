import { chromium, expect } from '@playwright/test';
import { createTestMember, deleteTestMember, loginMember } from '../tests/e2e/member-fixture';
import { bnuMathLessons as bank } from '../content/bnu-math';
import { categoryName } from '../lib/classification';
import { writeFile } from 'node:fs/promises';
async function main() {
 const baseURL='http://127.0.0.1:3001';const member=await createTestMember();let browser;
 try {
  browser=await chromium.launch({channel:'chrome',headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true});
  await loginMember(context,baseURL,member.password);const page=await context.newPage();
  await page.goto(`${baseURL}/practice`);
  await page.getByRole('group',{name:'学科筛选'}).getByRole('button',{name:'数学',exact:true}).click();
  const checks=[];
  for(let grade=1;grade<=6;grade++) {
   await page.getByRole('combobox',{name:'学习年级'}).selectOption(String(grade));
   await page.getByRole('textbox',{name:'搜索关卡'}).fill('北师大版');
   const gradeBank=bank.filter(l=>l.grade===grade);await expect(page.locator('.lesson-card')).toHaveCount(gradeBank.length);
   for(const term of ['上册','下册']) {
    await page.getByRole('textbox',{name:'搜索关卡'}).fill(`${grade}年级${term}`);
    await expect(page.locator('.lesson-card')).toHaveCount(gradeBank.filter(l=>l.tags.includes(`${grade}年级${term}`)).length);
   }
   await page.getByRole('textbox',{name:'搜索关卡'}).fill('北师大版');
   for(const category of new Set(gradeBank.map(l=>l.category))) {
    const name=categoryName('math',category);
    await page.getByRole('group',{name:'知识分类筛选'}).getByRole('button',{name:new RegExp(name)}).click();
    await expect(page.locator('.lesson-card')).toHaveCount(gradeBank.filter(l=>l.category===category).length);
   }
   await page.getByRole('group',{name:'知识分类筛选'}).getByRole('button',{name:'全部分类',exact:true}).click();
   checks.push({grade,lessons:gradeBank.length,categories:new Set(gradeBank.map(l=>l.category)).size});
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.screenshot({path:'/tmp/learn-bnu/mobile-library.png',fullPage:true});
  const completed=[];
  for(const l of [bank.find(l=>l.grade===1&&l.category==='math-calculation')!,bank.find(l=>l.topic==='分数混合运算顺序')!]) {
   await page.goto(`${baseURL}/learn/${l.id}`);
   for(let i=0;i<10;i++) {
    const q=l.questions[i];await expect(page.getByRole('heading',{name:q.prompt,exact:true})).toBeVisible();
    await page.getByRole('button',{name:'给我一点提示',exact:true}).click();await expect(page.locator('.hint-content')).toHaveText(q.hint);
    await page.getByRole('button',{name:`${String.fromCharCode(65+q.answer)} ${q.options[q.answer]}`,exact:true}).click();
    await page.getByRole('button',{name:'确认答案',exact:true}).click();
    await expect(page.getByRole('heading',{name:'答对啦，想得很棒！'})).toBeVisible();await expect(page.locator('.feedback')).toContainText(q.explanation);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
    if(i===0)await page.screenshot({path:`/tmp/learn-bnu/mobile-quiz-grade${l.grade}.png`,fullPage:true});
    await page.getByRole('button',{name:i===9?'看看学习成果':'下一题',exact:true}).click();
   }
   await expect(page.getByRole('heading',{name:'挑战完成！',exact:true})).toBeVisible();
   await expect(page.getByText('全部答对了，继续保持好奇心！',{exact:true})).toBeVisible();completed.push(l.id);
  }
  await writeFile('content/import-reports/bnu-primary-math-v1-browser.json',JSON.stringify({checkedAt:new Date().toISOString(),surface:'local production build connected to production database',mobileViewport:'390x844',gradeAndTermFilters:checks,visibleNewLessons:bank.length,completedLessonIds:completed,correct:20,total:20,hintsAndExplanationsVerified:true,horizontalOverflow:false},null,2)+'\n');
  console.log('PASS: all 199 lessons, six grades, twelve terms, category filters; two complete 10/10 quizzes; mobile layout.');
 } finally {await browser?.close();await deleteTestMember(member.id);console.log('Temporary test member removed.');}
}
main().catch((error:unknown)=>{console.error(error instanceof Error ? error.message.slice(0,2000) : 'BROWSER_CHECK_FAILED');process.exitCode=1;});
