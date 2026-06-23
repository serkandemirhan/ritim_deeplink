import { ActionRow, Badge, ConsoleShell, DataTable, MetricCard, Section } from '../../_components/ConsoleShell';
import { requireSuperAdmin } from '../../_auth/permissions';
import { formatDate, joinSourceLabels } from '../../_data/mockConsoleData';
import { getLivePlatformUsers, splitLiveUsers } from '../../_data/liveConsoleData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PlatformMembersPage() {
  const session = await requireSuperAdmin();
  const result = await getLivePlatformUsers();
  const { members } = splitLiveUsers(result.users);
  const activeMembers = members.filter((user) => user.status === 'active');
  const personalProMembers = members.filter((user) => user.personalPlan === 'personal_pro');
  const centers = new Set(members.map((user) => user.sportsCenterId).filter(Boolean));

  return (
    <ConsoleShell
      active="members"
      role="Ritim platform_admin"
      sessionRole={session.role}
      title="Members"
      subtitle="Spor merkezi üyesi olan kullanıcıların gerçek Supabase membership kayıtları."
    >
      <div className="metrics-grid">
        <MetricCard label="Members" value={members.length} detail="tenant_members role = member" tone="green" />
        <MetricCard label="Active members" value={activeMembers.length} detail="current live rows" tone="blue" />
        <MetricCard label="Personal Pro members" value={personalProMembers.length} detail="auth metadata plan" tone="purple" />
        <MetricCard label="Centers represented" value={centers.size} detail="unique tenant ids" tone="orange" />
      </div>

      <div className="console-grid">
        <div className="span-12">
          <Section title="Live Members" description="Mock member listesi kullanılmaz; Supabase Auth + profiles + tenant_members birleşimi gösterilir.">
            {result.error ? (
              <div className="alert-item">
                <strong>Live member data unavailable</strong>
                <p>{result.error}</p>
              </div>
            ) : null}
            <DataTable
              columns={['Member', 'Email', 'Sports Center', 'Status', 'Plan', 'Join Source', 'Last Seen', 'Joined', 'Actions']}
              rows={members.map((user) => [
                <strong key={`${user.id}-name`}>{user.fullName}</strong>,
                user.email,
                user.sportsCenterName ?? user.sportsCenterId ?? '-',
                <Badge key={`${user.id}-status`} tone={user.status === 'active' ? 'green' : 'orange'}>{user.status}</Badge>,
                <Badge key={`${user.id}-plan`} tone={user.personalPlan === 'personal_pro' ? 'purple' : 'blue'}>{user.personalPlan}</Badge>,
                user.joinSource ? joinSourceLabels[user.joinSource] : '-',
                formatDate(user.lastSeenAt),
                formatDate(user.createdAt),
                <ActionRow key={`${user.id}-actions`} actions={['View', 'Activity', 'Support']} />,
              ])}
            />
          </Section>
        </div>
      </div>
    </ConsoleShell>
  );
}
