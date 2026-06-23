import { redirect } from 'next/navigation';
import { Badge, ConsoleShell, DataTable, MetricCard, Section } from '../../_components/ConsoleShell';
import { requireOrganizationAccess } from '../../_auth/permissions';
import { getOrganizationDashboardData } from '../../_data/consoleDashboardData';
import { listJoinRequests, reviewJoinRequest } from '../../_data/consoleRepository';
import { formatDate, sportsCenters } from '../../_data/mockConsoleData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const center = sportsCenters.find((item) => item.id === 'sc-lyon-fit') ?? sportsCenters[0];
const sourceLabels: Record<string, string> = {
  qr: 'QR Code',
  nfc: 'NFC Card',
  invite_link: 'Invite Link',
  email_invite: 'Email Invite',
  manual_admin: 'Manual Admin',
  club_code: 'Club Code',
};

async function reviewRequestAction(formData: FormData) {
  'use server';

  const session = await requireOrganizationAccess(center.id);
  const requestId = String(formData.get('requestId') ?? '');
  const status = String(formData.get('status') ?? '') as 'approved' | 'rejected';
  const result = await reviewJoinRequest({
    requestId,
    status,
    reviewedBy: session.userId,
    actorRole: session.role,
  });
  if (result.error) {
    redirect(`/console/sports-center/join-requests?error=${encodeURIComponent(result.error)}`);
  }
  redirect('/console/sports-center/join-requests');
}

export default async function JoinRequestsPage() {
  const session = await requireOrganizationAccess(center.id);
  const [dashboardData, requestsResult] = await Promise.all([
    getOrganizationDashboardData(center.id),
    listJoinRequests(center.id),
  ]);
  const pending = requestsResult.data.filter((request) => request.status === 'pending');
  const approved = requestsResult.data.filter((request) => request.status === 'approved');
  const rejected = requestsResult.data.filter((request) => request.status === 'rejected');

  return (
    <ConsoleShell
      active="join-requests"
      role="Sports center owner/admin/coach"
      sessionRole={session.role}
      title={`${dashboardData.organization.name} Join Requests`}
      subtitle="Approve or reject organization-scoped onboarding requests. Approved requests create active member rows."
    >
      <div className="metrics-grid">
        <MetricCard label="Pending" value={pending.length} detail="needs review" tone="orange" />
        <MetricCard label="Approved" value={approved.length} detail="member created on approve" tone="green" />
        <MetricCard label="Rejected" value={rejected.length} detail="personal user remains unchanged" tone="red" />
        <MetricCard label="Member capacity" value={`${dashboardData.organization.membersCount}/${dashboardData.organization.maxMembers ?? '-'}`} detail="checked before approval" tone="blue" />
      </div>

      <div className="console-grid">
        <div className="span-12">
          <Section title="Request Queue" description="Reject keeps the user as a personal Ritim user; approve creates tenant_members role=member when capacity allows.">
            {(dashboardData.error || requestsResult.error) ? (
              <div className="alert-item">
                <strong>Live join request data unavailable</strong>
                <p>{dashboardData.error ?? requestsResult.error}</p>
              </div>
            ) : null}
            <DataTable
              columns={['Request', 'User ID', 'Source', 'Status', 'Requested', 'Reviewed', 'Actions']}
              rows={requestsResult.data.map((request) => [
                request.id,
                request.userId,
                sourceLabels[request.source] ?? request.source,
                <Badge key={`${request.id}-status`} tone={request.status === 'approved' ? 'green' : request.status === 'rejected' ? 'red' : 'orange'}>{request.status}</Badge>,
                formatDate(request.requestedAt),
                request.reviewedAt ? formatDate(request.reviewedAt) : '-',
                request.status === 'pending' ? (
                  <div className="action-row" key={`${request.id}-actions`}>
                    <form action={reviewRequestAction}>
                      <input name="requestId" type="hidden" value={request.id} />
                      <input name="status" type="hidden" value="approved" />
                      <button type="submit">Approve</button>
                    </form>
                    <form action={reviewRequestAction}>
                      <input name="requestId" type="hidden" value={request.id} />
                      <input name="status" type="hidden" value="rejected" />
                      <button type="submit">Reject</button>
                    </form>
                  </div>
                ) : '-',
              ])}
            />
          </Section>
        </div>
      </div>
    </ConsoleShell>
  );
}
