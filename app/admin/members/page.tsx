import { requireAdmin } from '@/lib/auth';
import { memberQuery } from '@/lib/members/database';
import { MemberManager } from '@/components/members/member-manager';
export const metadata={title:'会员管理'};
export default async function Page(){
 await requireAdmin();
 const {rows}=await memberQuery<{id:string;name:string;grade:number;active:boolean;created_at:string}>('select id,name,grade,active,created_at::text from learning_members order by created_at desc');
 return <MemberManager members={rows}/>;
}
