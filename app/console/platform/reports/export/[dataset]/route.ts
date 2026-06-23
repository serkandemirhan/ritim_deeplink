import { requireSuperAdmin } from '../../../../_auth/permissions';
import { getPlatformDashboardData } from '../../../../_data/consoleDashboardData';
import { listActivityLogs, listMembers, listNfcCards } from '../../../../_data/consoleRepository';

export const dynamic = 'force-dynamic';

type RouteProps = {
  params: Promise<{ dataset: string }>;
};

function csvCell(value: unknown) {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

function csv(headers: string[], rows: unknown[][]) {
  return [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
}

export async function GET(_request: Request, { params }: RouteProps) {
  await requireSuperAdmin();
  const { dataset } = await params;

  if (dataset === 'members') {
    const result = await listMembers();
    return csvResponse(dataset, csv(
      ['id', 'organization_id', 'user_id', 'status', 'joined_at', 'created_at'],
      result.data.map((member) => [member.id, member.organizationId, member.userId, member.status, member.joinedAt, member.createdAt])
    ));
  }

  if (dataset === 'nfc-cards') {
    const result = await listNfcCards();
    return csvResponse(dataset, csv(
      ['id', 'organization_id', 'label', 'public_code', 'assigned_member_id', 'activity_type_id', 'status', 'last_scanned_at'],
      result.data.map((card) => [card.id, card.organizationId, card.label, card.publicCode, card.assignedMemberId, card.activityTypeId, card.status, card.lastScannedAt])
    ));
  }

  if (dataset === 'activity-logs') {
    const result = await listActivityLogs();
    return csvResponse(dataset, csv(
      ['id', 'organization_id', 'user_id', 'activity_type', 'amount', 'unit', 'source', 'created_at'],
      result.data.map((log) => [log.id, log.organizationId, log.userId, log.activityType, log.amount, log.unit, log.source, log.createdAt])
    ));
  }

  if (dataset === 'organizations') {
    const result = await getPlatformDashboardData();
    return csvResponse(dataset, csv(
      ['id', 'name', 'slug', 'status', 'plan', 'members', 'nfc_cards', 'city', 'country'],
      result.organizations.map((org) => [org.id, org.name, org.slug, org.status, org.planCode, org.membersCount, org.nfcCardsCount, org.city, org.country])
    ));
  }

  return new Response('Unknown dataset', { status: 404 });
}

function csvResponse(dataset: string, body: string) {
  return new Response(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="ritim-${dataset}.csv"`,
    },
  });
}
