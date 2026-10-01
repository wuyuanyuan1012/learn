import { requireMember } from '@/lib/members/server';
import { MemberProvider } from '@/components/members/member-provider';
export const dynamic='force-dynamic';
export default async function Layout({children}:{children:React.ReactNode}){
 const {member}=await requireMember();return <MemberProvider member={member}>{children}</MemberProvider>;
}
