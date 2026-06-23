import { Badge, ConsoleShell, DataTable, MetricCard, Section, UsageBar } from '../../_components/ConsoleShell';
import { requireOrganizationAccess } from '../../_auth/permissions';
import { getOrganizationDashboardData } from '../../_data/consoleDashboardData';
import { listOrganizationSubscriptions } from '../../_data/consoleRepository';
import { formatDate, sportsCenters } from '../../_data/mockConsoleData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const center = sportsCenters.find((item) => item.id === 'sc-lyon-fit') ?? sportsCenters[0];

export default async function SportsCenterSubscriptionPage() {
  const session = await requireOrganizationAccess(center.id);
  const [dashboardData, subscriptionsResult] = await Promise.all([
    getOrganizationDashboardData(center.id),
    listOrganizationSubscriptions(center.id),
  ]);
  const latestSubscription = subscriptionsResult.data[0];

  return (
    <ConsoleShell
      active="subscriptions"
      role="Sports center owner/admin/coach"
      sessionRole={session.role}
      title={`${dashboardData.organization.name} Subscription`}
      subtitle="Read-only subscription usage for organization administrators."
    >
      <div className="metrics-grid">
        <MetricCard label="Plan" value={latestSubscription?.planCode ?? dashboardData.organization.planCode} detail="read only" tone="purple" />
        <MetricCard label="Status" value={latestSubscription?.status ?? dashboardData.organization.subscriptionStatus} detail={latestSubscription?.provider ?? dashboardData.organization.subscriptionProvider} tone="green" />
        <MetricCard label="Members" value={`${dashboardData.organization.membersCount}/${dashboardData.organization.maxMembers ?? '-'}`} detail="current usage" tone="blue" />
        <MetricCard label="NFC Cards" value={`${dashboardData.organization.nfcCardsCount}/${dashboardData.organization.maxNfcCards ?? '-'}`} detail="current usage" tone="orange" />
      </div>

      <div className="console-grid">
        <div className="span-5">
          <Section title="Usage" description="Creation flows enforce these limits before writes.">
            <div className="alert-list">
              <UsageBar label="Members" current={dashboardData.organization.membersCount} max={dashboardData.organization.maxMembers} />
              <UsageBar label="NFC cards" current={dashboardData.organization.nfcCardsCount} max={dashboardData.organization.maxNfcCards} />
            </div>
          </Section>
        </div>
        <div className="span-7">
          <Section title="Subscription History" description="Organization-scoped subscriptions only.">
            <DataTable
              columns={['Plan', 'Status', 'Provider', 'Overrides', 'Period End', 'Created']}
              rows={subscriptionsResult.data.map((subscription) => [
                subscription.planCode,
                <Badge key={`${subscription.id}-status`} tone={subscription.status === 'active' ? 'green' : 'orange'}>{subscription.status}</Badge>,
                subscription.provider,
                `${subscription.memberLimitOverride ?? '-'} members · ${subscription.nfcCardLimitOverride ?? '-'} NFC`,
                subscription.currentPeriodEnd ?? '-',
                formatDate(subscription.createdAt),
              ])}
            />
          </Section>
        </div>
      </div>
    </ConsoleShell>
  );
}
