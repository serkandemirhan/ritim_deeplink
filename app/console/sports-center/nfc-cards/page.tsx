import { ActionRow, Badge, ConsoleShell, DataTable, MetricCard, Section } from '../../_components/ConsoleShell';
import { requireOrganizationAccess } from '../../_auth/permissions';
import { getOrganizationDashboardData } from '../../_data/consoleDashboardData';
import { listNfcCards } from '../../_data/consoleRepository';
import { formatDate, sportsCenters } from '../../_data/mockConsoleData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const center = sportsCenters.find((item) => item.id === 'sc-lyon-fit') ?? sportsCenters[0];

function cardTone(status: string): 'green' | 'orange' | 'red' {
  if (status === 'active' || status === 'assigned') return 'green';
  if (status === 'lost' || status === 'inactive' || status === 'archived') return 'red';
  return 'orange';
}

export default async function SportsCenterNfcCardsPage() {
  const session = await requireOrganizationAccess(center.id);
  const [dashboardData, cardsResult] = await Promise.all([
    getOrganizationDashboardData(center.id),
    listNfcCards(center.id),
  ]);
  const assignedCards = cardsResult.data.filter((card) => card.status === 'assigned' || card.assignedMemberId);
  const unassignedCards = cardsResult.data.filter((card) => card.status === 'unassigned');
  const inactiveCards = cardsResult.data.filter((card) => card.status === 'inactive' || card.status === 'lost' || card.status === 'archived');

  return (
    <ConsoleShell
      active="nfc-cards"
      role="Sports center owner/admin/coach"
      sessionRole={session.role}
      title={`${dashboardData.organization.name} NFC Cards`}
      subtitle="Organization-scoped NFC card inventory, assignment health and scan state."
    >
      <div className="metrics-grid">
        <MetricCard label="Cards" value={dashboardData.organization.nfcCardsCount || cardsResult.data.length} detail={`${dashboardData.source} source`} tone="purple" />
        <MetricCard label="Assigned" value={dashboardData.assignedCardsCount || assignedCards.length} detail="linked to members or activities" tone="green" />
        <MetricCard label="Unassigned" value={dashboardData.unassignedCardsCount || unassignedCards.length} detail="needs setup" tone="orange" />
        <MetricCard label="Inactive / lost" value={inactiveCards.length} detail="not usable for scans" tone="orange" />
      </div>

      <div className="console-grid">
        <div className="span-12">
          <Section title="Card Inventory" description="Scoped by active organization id; global physical tag behavior remains tenant-aware.">
            {(dashboardData.error || cardsResult.error) ? (
              <div className="alert-item">
                <strong>Live card data unavailable</strong>
                <p>{dashboardData.error ?? cardsResult.error}</p>
              </div>
            ) : null}
            <DataTable
              columns={['Card', 'Public Code', 'Assigned Member', 'Activity', 'Default', 'Status', 'Last Scan', 'Actions']}
              rows={cardsResult.data.map((card) => [
                card.label,
                card.publicCode,
                card.assignedMemberId ?? '-',
                card.activityTypeId ?? '-',
                card.defaultAmount ? `${card.defaultAmount} ${card.unit ?? ''}` : '-',
                <Badge key={`${card.id}-status`} tone={cardTone(card.status)}>{card.status}</Badge>,
                formatDate(card.lastScannedAt ?? null),
                <ActionRow key={`${card.id}-actions`} actions={card.status === 'unassigned' ? ['Assign', 'Mark lost'] : ['Manage', 'Disable']} />,
              ])}
            />
          </Section>
        </div>
      </div>
    </ConsoleShell>
  );
}
