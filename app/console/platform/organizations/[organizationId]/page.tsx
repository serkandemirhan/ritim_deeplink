import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ActionRow, Badge, ConsoleShell, DataTable, MetricCard, Section, UsageBar } from '../../../_components/ConsoleShell';
import { requireSuperAdmin } from '../../../_auth/permissions';
import { getPlatformDashboardData } from '../../../_data/consoleDashboardData';
import { listActivityLibraryItems, listActivityLogs, listAuditLogs, listMembers, listNfcCards, listRhythms, listStaff } from '../../../_data/consoleRepository';
import { formatDate } from '../../../_data/mockConsoleData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PageProps = {
  params: Promise<{ organizationId: string }>;
};

function statusTone(status: string): 'green' | 'blue' | 'orange' | 'red' {
  if (status === 'active') return 'green';
  if (status === 'trialing') return 'blue';
  if (status === 'paused' || status === 'suspended') return 'orange';
  return 'red';
}

export default async function OrganizationDetailPage({ params }: PageProps) {
  const { organizationId } = await params;
  const session = await requireSuperAdmin();
  const [dashboardData, membersResult, staffResult, cardsResult, rhythmsResult, libraryResult, logsResult, auditResult] = await Promise.all([
    getPlatformDashboardData(),
    listMembers(organizationId),
    listStaff(organizationId),
    listNfcCards(organizationId),
    listRhythms(organizationId),
    listActivityLibraryItems(organizationId),
    listActivityLogs(organizationId),
    listAuditLogs(organizationId),
  ]);
  const organization = dashboardData.organizations.find((item) => item.id === organizationId);
  if (!organization) notFound();

  return (
    <ConsoleShell
      active="organizations"
      role="Ritim platform_admin"
      sessionRole={session.role}
      title={organization.name}
      subtitle="Organization detail across subscription, admins, members, NFC cards, rhythms, usage and audit."
      actions={<Link className="mini-button" href={`/console/platform/organizations/${organization.id}/edit`}>Edit organization</Link>}
    >
      <div className="metrics-grid">
        <MetricCard label="Members" value={organization.membersCount} detail={`${membersResult.data.length} rows loaded`} />
        <MetricCard label="NFC cards" value={organization.nfcCardsCount} detail={`${cardsResult.data.length} rows loaded`} tone="purple" />
        <MetricCard label="Staff" value={staffResult.data.length} detail="owner/admin/trainer memberships" tone="blue" />
        <MetricCard label="Activity logs" value={logsResult.data.length} detail={`${dashboardData.source} source`} tone="green" />
      </div>

      {(dashboardData.error || membersResult.error || cardsResult.error || logsResult.error) ? (
        <div className="alert-item">
          <strong>Live detail fallback</strong>
          <p>{dashboardData.error ?? membersResult.error ?? cardsResult.error ?? logsResult.error}</p>
        </div>
      ) : null}

      <div className="console-grid">
        <div className="span-6">
          <Section title="Basic Info" description="Tenant identity and operational status.">
            <DataTable
              columns={['Field', 'Value']}
              rows={[
                ['Name', organization.name],
                ['Slug', organization.slug],
                ['Contact email', organization.contactEmail || '-'],
                ['Location', `${organization.city || '-'} / ${organization.country || '-'}`],
                ['Status', <Badge key="status" tone={statusTone(organization.status)}>{organization.status}</Badge>],
                ['Created', formatDate(organization.createdAt)],
                ['Last activity', formatDate(organization.lastActivityAt)],
              ]}
            />
          </Section>
        </div>

        <div className="span-6">
          <Section title="Subscription & Usage" description="Plan, limits and current usage.">
            <div className="alert-list">
              <div className="alert-item">
                <strong>{organization.planCode}</strong>
                <p>{organization.subscriptionProvider} · {organization.subscriptionStatus}</p>
              </div>
              <UsageBar label="Members" current={organization.membersCount} max={organization.maxMembers} />
              <UsageBar label="NFC cards" current={organization.nfcCardsCount} max={organization.maxNfcCards} />
            </div>
          </Section>
        </div>

        <div className="span-6">
          <Section title="Admins / Staff" description="Organization-scoped non-member roles.">
            <DataTable
              columns={['Membership', 'User ID', 'Status', 'Joined']}
              rows={staffResult.data.map((member) => [
                member.id,
                member.userId,
                <Badge key={`${member.id}-status`} tone={member.status === 'active' ? 'green' : 'orange'}>{member.status}</Badge>,
                formatDate(member.joinedAt ?? member.createdAt),
              ])}
            />
          </Section>
        </div>

        <div className="span-6">
          <Section title="Members" description="Organization member records.">
            <DataTable
              columns={['Membership', 'User ID', 'Status', 'Joined']}
              rows={membersResult.data.map((member) => [
                member.id,
                member.userId,
                <Badge key={`${member.id}-status`} tone={member.status === 'active' ? 'green' : 'orange'}>{member.status}</Badge>,
                formatDate(member.joinedAt ?? member.createdAt),
              ])}
            />
          </Section>
        </div>

        <div className="span-6">
          <Section title="NFC Cards" description="Cards scoped to this organization.">
            <DataTable
              columns={['Card', 'Status', 'Activity', 'Amount', 'Last Scan']}
              rows={cardsResult.data.map((card) => [
                card.label,
                <Badge key={`${card.id}-status`} tone={card.status === 'active' || card.status === 'assigned' ? 'green' : 'orange'}>{card.status}</Badge>,
                card.activityTypeId ?? '-',
                card.defaultAmount ? `${card.defaultAmount} ${card.unit ?? ''}` : '-',
                formatDate(card.lastScannedAt ?? null),
              ])}
            />
          </Section>
        </div>

        <div className="span-6">
          <Section title="Rhythms & Library" description="Assigned rhythms and activity library coverage.">
            <DataTable
              columns={['Type', 'Count', 'Action']}
              rows={[
                ['Rhythms', rhythmsResult.data.length, <ActionRow key="rhythms" actions={['Open rhythms']} />],
                ['Activity library', libraryResult.data.length, <ActionRow key="library" actions={['Open library']} />],
              ]}
            />
          </Section>
        </div>

        <div className="span-6">
          <Section title="Recent Activity" description="Latest organization activity logs.">
            <DataTable
              columns={['Time', 'User', 'Activity', 'Amount', 'Source']}
              rows={logsResult.data.slice(0, 8).map((log) => [
                formatDate(log.createdAt),
                log.userId,
                log.activityType,
                `${log.amount} ${log.unit}`,
                <Badge key={`${log.id}-source`} tone={log.source === 'nfc' ? 'green' : 'blue'}>{log.source}</Badge>,
              ])}
            />
          </Section>
        </div>

        <div className="span-6">
          <Section title="Audit" description="Recent sensitive console changes.">
            <DataTable
              columns={['Time', 'Actor', 'Action', 'Target', 'Status']}
              rows={auditResult.data.slice(0, 8).map((log) => [
                formatDate(log.createdAt),
                log.actorUserId,
                log.actionType,
                log.targetEntityType,
                <Badge key={`${log.id}-status`} tone={log.status === 'success' ? 'green' : 'red'}>{log.status}</Badge>,
              ])}
            />
          </Section>
        </div>
      </div>
    </ConsoleShell>
  );
}
