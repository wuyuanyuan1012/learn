import { test, expect, createTestMember, deleteTestMember, loginMember, testState, testMemberId } from './member-fixture';
import { expandedSeedLessons } from '../../content/ten-question-lessons';
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

test('member auth gates routes, remembers login, separates accounts and blocks cross-origin writes',async({browser,context,page,baseURL,member})=>{
 const guest=await browser.newContext();try{
  const unauth=await guest.request.post(`${baseURL}/api/member/progress`,{headers:{Origin:baseURL!},data:{memberId:member.id,operations:[]}});expect(unauth.status()).toBe(401);
  const guestPage=await guest.newPage();await guestPage.goto(`${baseURL}/practice`);await expect(guestPage).toHaveURL(/member-login/);
  await guestPage.getByLabel('会员密码',{exact:true}).fill(member.password);await guestPage.getByRole('button',{name:'进入学习'}).click();await expect(guestPage.getByRole('heading',{name:'今日挑战',exact:true})).toBeVisible();
  const cookie=(await guest.cookies()).find(c=>c.name==='fun_learning_member')!;expect(cookie.httpOnly).toBe(true);expect(cookie.expires>Date.now()/1000+28*86400).toBe(true);
  const saved=await guest.storageState();const reopened=await browser.newContext({storageState:saved});try{const p=await reopened.newPage();await p.goto(`${baseURL}/`);await expect(p.getByRole('heading',{name:'今日挑战',exact:true})).toBeVisible();}finally{await reopened.close();}
 }finally{await guest.close();}
 const other=await createTestMember();try{
  const forbidden=await context.request.post(`${baseURL}/api/member/progress`,{headers:{Origin:baseURL!},data:{memberId:other.id,operations:[]}});expect(forbidden.status()).toBe(409);
  const csrf=await context.request.post(`${baseURL}/api/member/logout`,{headers:{Origin:'https://attacker.example'}});expect(csrf.status()).toBe(403);
  await page.goto('/');await expect(page.getByText(member.name,{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'退出会员'}).click();await expect(page).toHaveURL(/member-login/);
  await page.getByLabel('会员密码',{exact:true}).fill(other.password);await page.getByRole('button',{name:'进入学习'}).click();await expect(page.getByText(other.name,{exact:true})).toBeVisible();
  await expect(page.getByRole('region',{name:'今日学习情况'})).toContainText('0 / 4');
 }finally{await deleteTestMember(other.id);}
});

test('two devices resume the same quiz and sync completion, wrong answers, grade and daily cards',async({browser,page,baseURL,member})=>{
 const other=await browser.newContext({viewport:{width:390,height:844}});await loginMember(other,baseURL!,member.password);const second=await other.newPage();
 const lesson=expandedSeedLessons[0];
 try{
  await page.goto(`/learn/${lesson.id}`);
  await page.getByRole('button',{name:'A 6元',exact:true}).click();await page.getByRole('button',{name:'确认答案'}).click();await page.getByRole('button',{name:'下一题'}).click();
  await expect.poll(async()=>{return (await testState(member.id))?.sessions[lesson.id]?.index;},{timeout:20000}).toBe(1);
  await second.goto(`${baseURL}/learn/${lesson.id}`);await expect(second.getByText('第 2 / 10 题')).toBeVisible();
  for(const [i,q] of lesson.questions.slice(1).entries()){
   await second.getByRole('button',{name:`${String.fromCharCode(65+q.answer)} ${q.options[q.answer]}`,exact:true}).click();await second.getByRole('button',{name:'确认答案'}).click();await second.getByRole('button',{name:i===8?'看看学习成果':'下一题'}).click();
  }
  await expect(second.getByRole('heading',{name:'挑战完成！'})).toBeVisible();
  await expect.poll(async()=>{return (await testState(member.id))?.records.length;},{timeout:20000}).toBe(1);
  await page.goto('/progress');await expect(page.getByRole('heading',{name:lesson.title})).toBeVisible();await expect(page.locator('.history-score')).toContainText('9 / 10');
  await page.goto('/');await expect(page.getByRole('region',{name:'数学今日挑战'})).toContainText('已完成');
  await page.getByLabel('学习年级').selectOption('1');await expect.poll(async()=>{return (await testState(member.id))?.grade;},{timeout:20000}).toBe(1);
  await second.goto(`${baseURL}/`);await expect(second.getByLabel('学习年级')).toHaveValue('1');
  await page.screenshot({path:'test-results/member-mobile.png',fullPage:true});
 }finally{await other.close();}
});

test('offline completed records retry after reconnect without duplicates',async({page,context,member})=>{
 await page.goto('/');await expect(page.getByRole('heading',{name:'今日挑战',exact:true})).toBeVisible();
 const lesson=expandedSeedLessons[0];await page.goto(`/learn/${lesson.id}`);
 await expect(page.getByRole('heading',{name:lesson.questions[0].prompt})).toBeVisible();
 await context.setOffline(true);
 for(const [i,q] of lesson.questions.entries()){
  await page.getByRole('button',{name:`${String.fromCharCode(65+q.answer)} ${q.options[q.answer]}`,exact:true}).click();await page.getByRole('button',{name:'确认答案'}).click();await page.getByRole('button',{name:i===9?'看看学习成果':'下一题'}).click();
 }
 await expect(page.getByRole('heading',{name:'挑战完成！'})).toBeVisible();await context.setOffline(false);await page.evaluate(()=>window.dispatchEvent(new Event('online')));
 await expect.poll(async()=>{return (await testState(member.id))?.records.length;},{timeout:30000}).toBe(1);
 await page.reload();await page.goto('/progress');await expect(page.locator('.history-row')).toHaveCount(1);
});

test('admin creates unique member password, resets it and disables every existing login',async({browser,page,context,baseURL,member})=>{
 test.setTimeout(240000);
 const creds=Object.fromEntries(readFileSync('.env.admin.local','utf8').split('\n').filter(l=>l.includes('=')).map(l=>[l.slice(0,l.indexOf('=')),l.slice(l.indexOf('=')+1).trim()]));
 const name=`会员验证-${randomBytes(6).toString('hex')}`,password=randomBytes(10).toString('hex');let createdId='';
 await page.goto('/admin/login');await page.getByLabel('邮箱',{exact:true}).fill(creds.ADMIN_EMAIL);await page.getByLabel('密码',{exact:true}).fill(creds.ADMIN_PASSWORD);await page.getByRole('button',{name:'登录后台'}).click();
 await page.getByRole('navigation',{name:'后台模块导航'}).getByRole('link',{name:'会员管理',exact:true}).click();await expect(page.getByRole('heading',{name:'会员管理',exact:true})).toBeVisible();
 try{
  await page.getByLabel('会员昵称').fill(name);await page.getByLabel('自动生成 8 位数字密码',{exact:true}).uncheck();await page.getByLabel('会员密码',{exact:true}).fill(member.password);await page.getByRole('button',{name:'创建会员',exact:true}).click();await expect(page.getByRole('alert')).toContainText('已被其他会员使用');
  await page.getByLabel('会员密码',{exact:true}).fill(password);await page.getByRole('button',{name:'创建会员',exact:true}).click();await expect(page.getByRole('status')).toContainText('会员已创建');
  createdId=(await testMemberId(name))!;
  const oldContext=await browser.newContext();try{
   await loginMember(oldContext,baseURL!,password);
   await page.getByLabel('搜索会员').fill(name);await page.locator('.member-row').getByRole('button',{name:'编辑 / 重置密码'}).click();await page.getByLabel('自动生成 8 位数字密码（重置密码）').check();await page.getByRole('button',{name:'保存会员'}).click();await expect(page.getByRole('status')).toContainText('会员已更新');
   const nextPassword=(await page.locator('.issued-password').textContent())!;
   const revoked=await oldContext.request.post(`${baseURL}/api/member/progress`,{headers:{Origin:baseURL!},data:{memberId:createdId,operations:[]}});expect(revoked.status()).toBe(401);
   const bad=await oldContext.request.post(`${baseURL}/api/member/login`,{headers:{Origin:baseURL!},data:{password}});expect(bad.status()).toBe(401);
   await loginMember(oldContext,baseURL!,nextPassword);
   await page.getByLabel('自动生成 8 位数字密码（重置密码）').uncheck();await page.getByLabel('启用会员').uncheck();await page.getByRole('button',{name:'保存会员'}).click();await expect(page.locator('.member-row')).toContainText('已停用');
   const disabled=await oldContext.request.post(`${baseURL}/api/member/progress`,{headers:{Origin:baseURL!},data:{memberId:createdId,operations:[]}});expect(disabled.status()).toBe(401);
  }finally{await oldContext.close();}
 }finally{if(createdId)await deleteTestMember(createdId);else{const id=await testMemberId(name);if(id)await deleteTestMember(id);}}
});

test('legacy local records are only imported after explicit confirmation',async({page,member})=>{
 const lesson=expandedSeedLessons[0];
 const record={id:crypto.randomUUID(),lessonId:lesson.id,title:lesson.title,subject:lesson.subject,grade:lesson.grade,correct:10,total:10,seconds:60,completedAt:new Date(Date.now()-86400000).toISOString(),wrongIds:[]};
 const archived={...record,id:crypto.randomUUID(),lessonId:crypto.randomUUID(),title:'已下架的旧练习'};
 await page.addInitScript(records=>localStorage.setItem('fun-learning:records:v1',JSON.stringify(records)),[record,archived]);
 await page.goto('/progress');await expect(page.getByRole('button',{name:'导入本机旧记录'})).toBeVisible();
 expect((await testState(member.id))?.records).toHaveLength(0);
 page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'导入本机旧记录'}).click();
 await expect.poll(async()=> (await testState(member.id))?.records.length,{timeout:20000}).toBe(2);
 await expect(page.getByRole('heading',{name:'已下架的旧练习'})).toBeVisible();
 await expect(page.getByRole('heading',{name:lesson.title})).toBeVisible();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('fun-learning:records:v1')!).length)).toBe(2);
});
