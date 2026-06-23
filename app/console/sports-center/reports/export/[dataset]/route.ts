import { requireOrganizationAccess } from '../../../../_auth/permissions';
import { listActivityLogs, listMembers, listNfcCards } from '../../../../_data/consoleRepository';
import { sportsCenters } from '../../../../_data/mockConsoleData';

export const dynamic = 'force-dynamic';

const center = sportsCenters.find((item) => item.id === 'sc-lyon-fit') ?? sportsCenters[0];

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
  await requireOrganizationAccess(center.id);
  const { dataset } = await params;

  if (dataset === 'members') {
    const result = await listMembers(center.id);
    return csvResponse(dataset, csv(
      ['id', 'user_id', 'status', 'joined_at', 'created_at'],
      result.data.map((member) => [member.id, member.userId, member.status, member.joinedAt, member.createdAt])
    ));
  }

  if (dataset === 'nfc-cards') {
    const result = await listNfcCards(center.id);
    return csvResponse(dataset, csv(
      ['id', 'label', 'public_code', 'assigned_member_id', 'activity_type_id', 'status', 'last_scanned_at'],
      result.data.map((card) => [card.id, card.label, card.publicCode, card.assignedMemberId, card.activityTypeId, card.status, card.lastScannedAt])
    ));
  }

  if (dataset === 'activity-logs') {
    const result = await listActivityLogs(center.id);
    return csvResponse(dataset, csv(
      ['id', 'user_id', 'activity_type', 'amount', 'unit', 'source', 'created_at'],
      result.data.map((log) => [log.id, log.userId, log.activityType, log.amount, log.unit, log.source, log.createdAt])
    ));
  }

  return new Response('Unknown dataset', { status: 404 });
}

function csvResponse(dataset: string, body: string) {
  return new Response(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="ritim-center-${dataset}.csv"`,
    },
  });
}
