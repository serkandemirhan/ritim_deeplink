import { ActionRow, Badge, ConsoleShell, DataTable, MetricCard, Section } from '../../_components/ConsoleShell';
import { formatDate, joinSourceLabels } from '../../_data/mockConsoleData';
import { getLivePlatformUsers, splitLiveUsers } from '../../_data/liveConsoleData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function centerRoleTone(role?: string | null) {
  if (role === 'owner') return 'purple';
  if (role === 'admin') return 'blue';
  if (role === 'coach') return 'green';
  return 'default';
}

export default async function PlatformStaffPage() {
  const result = await getLivePlatformUsers();
  const { staff } = splitLiveUsers(result.users);
  const owners = staff.filter((user) => user.sportsCenterRole === 'owner');
  const admins = staff.filter((user) => user.sportsCenterRole === 'admin');
  const coaches = staff.filter((user) => user.sportsCenterRole === 'coach');
  const centers = new Set(staff.map((user) => user.sportsCenterId).filter(Boolean));

  return (
    <ConsoleShell
      active="staff"
      role="Ritim platform_admin"
      title="Staff / Managers"
      subtitle="Spor merkezi owner, admin ve coach rollerinin gerçek Supabase membership görünümü."
    >
      <div className="metrics-grid">
        <MetricCard label="Staff / Managers" value={staff.length} detail="owner/admin/coach memberships" tone="blue" />
        <MetricCard label="Owners" value={owners.length} detail="tenant_owner" tone="purple" />
        <MetricCard label="Admins" value={admins.length} detail="tenant_admin" tone="blue" />
        <MetricCard label="Coaches" value={coaches.length} detail="trainer" tone="green" />
        <MetricCard label="Centers represented" value={centers.size} detail="unique tenant ids" tone="orange" />
      </div>

      <div className="console-grid">
        <div className="span-12">
          <Section title="Live Staff / Managers" description="Mock staff listesi kullanılmaz; tenant_members rolleri Supabase’den okunur.">
            {result.error ? (
              <div className="alert-item">
                <strong>Live staff data unavailable</strong>
                <p>{result.error}</p>
              </div>
            ) : null}
            <DataTable
              columns={['Staff', 'Email', 'Sports Center', 'Role', 'Status', 'Plan', 'Join Source', 'Last Seen', 'Joined', 'Actions']}
              rows={staff.map((user) => [
                <strong key={`${user.id}-name`}>{user.fullName}</strong>,
                user.email,
                user.sportsCenterName ?? user.sportsCenterId ?? '-',
                <Badge key={`${user.id}-role`} tone={centerRoleTone(user.sportsCenterRole)}>{user.sportsCenterRole}</Badge>,
                <Badge key={`${user.id}-status`} tone={user.status === 'active' ? 'green' : 'orange'}>{user.status}</Badge>,
                <Badge key={`${user.id}-plan`} tone={user.personalPlan === 'personal_pro' ? 'purple' : 'blue'}>{user.personalPlan}</Badge>,
                user.joinSource ? joinSourceLabels[user.joinSource] : '-',
                formatDate(user.lastSeenAt),
                formatDate(user.createdAt),
                <ActionRow key={`${user.id}-actions`} actions={['View', 'Change role', 'Audit']} />,
              ])}
            />
          </Section>
        </div>
      </div>
    </ConsoleShell>
  );
}
