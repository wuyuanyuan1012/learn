import { redirect } from 'next/navigation';
import { getMember } from '@/lib/members/server';
import { MemberLoginForm } from '@/components/members/login-form';
export const metadata={title:'会员登录',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
export default async function Page(){if(await getMember())redirect('/');return <MemberLoginForm/>;}
