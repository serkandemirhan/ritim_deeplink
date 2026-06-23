import { ActionRow, Badge, ConsoleShell, DataTable, MetricCard, Section } from '../../_components/ConsoleShell';
import { requireSuperAdmin } from '../../_auth/permissions';
import { formatDate, joinSourceLabels } from '../../_data/mockConsoleData';
import { getLivePlatformUsers, splitLiveUsers } from '../../_data/liveConsoleData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function platformRoleTone(role: string) {
  return role === 'user' ? 'default' : 'purple';
}

function centerRoleTone(role?: string | null) {
  if (role === 'owner') return 'purple';
  if (role === 'admin') return 'blue';
  if (role === 'coach') return 'green';
  return 'default';
}

export default async function PlatformUsersPage() {
  const session = await requireSuperAdmin();
  const result = await getLivePlatformUsers();
  const { admins, members, staff } = splitLiveUsers(result.users);
  const personalUsers = result.users.filter((user) => !user.sportsCenterRole && user.platformRole === 'user');
  const platformAdmins = result.users.filter((user) => user.platformRole !== 'user');

  return (
    <ConsoleShell
      active="users"
      role="Ritim platform_admin"
      sessionRole={session.role}
      title="Users / Admins"
      subtitle="Supabase Auth, profiles ve tenant membership kayıtlarından gelen gerçek kullanıcı listesi."
    >
      <div className="metrics-grid">
        <MetricCard label="All users" value={result.users.length} detail="Supabase live data" tone="green" />
        <MetricCard label="Platform admins" value={platformAdmins.length} detail="app_metadata role" tone="purple" />
        <MetricCard label="Center staff" value={staff.length} detail="owner/admin/coach memberships" tone="blue" />
        <MetricCard label="Members" value={members.length} detail="member memberships" tone="green" />
        <MetricCard label="Personal users" value={personalUsers.length} detail="no center membership" tone="orange" />
      </div>

      <div className="console-grid">
        <div className="span-12">
          <Section title="Live Users" description="Mock data kullanılmaz. Supabase okunamazsa tablo boş kalır ve hata gösterilir.">
            {result.error ? (
              <div className="alert-item">
                <strong>Live user data unavailable</strong>
                <p>{result.error}</p>
              </div>
            ) : null}
            <DataTable
              columns={['User', 'Email', 'Platform Role', 'Sports Center', 'Center Role', 'Status', 'Personal Plan', 'Join Source', 'Last Seen', 'Created', 'Actions']}
              rows={result.users.map((user) => [
                <strong key={`${user.id}-name`}>{user.fullName}</strong>,
                user.email,
                <Badge key={`${user.id}-platform-role`} tone={platformRoleTone(user.platformRole)}>{user.platformRole}</Badge>,
                user.sportsCenterName ?? 'Personal',
                user.sportsCenterRole ? <Badge key={`${user.id}-center-role`} tone={centerRoleTone(user.sportsCenterRole)}>{user.sportsCenterRole}</Badge> : '-',
                <Badge key={`${user.id}-status`} tone={user.status === 'active' ? 'green' : 'orange'}>{user.status}</Badge>,
                <Badge key={`${user.id}-plan`} tone={user.personalPlan === 'personal_pro' ? 'purple' : 'blue'}>{user.personalPlan}</Badge>,
                user.joinSource ? joinSourceLabels[user.joinSource] : '-',
                formatDate(user.lastSeenAt),
                formatDate(user.createdAt),
                <ActionRow key={`${user.id}-actions`} actions={user.platformRole !== 'user' ? ['View', 'Change role', 'Audit'] : ['View', 'Open memberships', 'Support']} />,
              ])}
            />
          </Section>
        </div>

        <div className="span-12">
          <Section title="Admin / Staff Summary" description="Users/Admin görünümünün hızlı ayrımı.">
            <DataTable
              columns={['Segment', 'Count', 'Detail']}
              rows={[
                ['Platform admins', platformAdmins.length, 'platform_super_admin / platform_admin / support'],
                ['Sports center staff', admins.length, 'center owner/admin/coach plus platform admins'],
                ['Members', members.length, 'sports center member role'],
                ['Personal users', personalUsers.length, 'no tenant membership'],
              ]}
            />
          </Section>
        </div>
      </div>
    </ConsoleShell>
  );
}
