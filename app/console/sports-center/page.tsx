import { ActionRow, Badge, ConsoleShell, DataTable, MetricCard, Section, UsageBar } from '../_components/ConsoleShell';
import {
  activityLogs,
  formatDate,
  getSubscription,
  joinRequests,
  joinSourceLabels,
  nfcCards,
  sportsCenters,
  staffMembers,
} from '../_data/mockConsoleData';

const todayKey = '2026-06-14';
const center = sportsCenters.find((item) => item.id === 'sc-lyon-fit') ?? sportsCenters[0];
const subscription = getSubscription(center.id);

function requestTone(status: string): 'default' | 'green' | 'blue' | 'orange' {
  if (status === 'active') return 'green';
  if (status === 'pending') return 'orange';
  if (status === 'invited') return 'blue';
  return 'default';
}

function cardTone(status: string): 'green' | 'orange' | 'red' {
  if (status === 'assigned') return 'green';
  if (status === 'lost' || status === 'inactive') return 'red';
  return 'orange';
}

export default function SportsCenterConsolePage() {
  const centerRequests = joinRequests.filter((request) => request.sportsCenterId === center.id);
  const pendingRequests = centerRequests.filter((request) => request.status === 'pending');
  const centerCards = nfcCards.filter((card) => card.sportsCenterId === center.id);
  const centerLogs = activityLogs.filter((log) => log.sportsCenterId === center.id);
  const todayLogs = centerLogs.filter((log) => log.createdAt.startsWith(todayKey));
  const centerStaff = staffMembers.filter((staff) => staff.sportsCenterId === center.id);
  const assignedCards = centerCards.filter((card) => card.status === 'assigned');
  const unassignedCards = centerCards.filter((card) => card.status === 'unassigned');
  const nearMemberLimit = subscription?.maxMembers ? center.membersCount / subscription.maxMembers >= 0.8 : false;
  const nearCardLimit = subscription?.maxNfcCards ? center.nfcCardsCount / subscription.maxNfcCards >= 0.8 : false;
  const uniqueActiveMembers = new Set(todayLogs.map((log) => log.member)).size;
  const inactiveMembers = 7;
  const activitiesToday = 214;

  const onboardingActions = [
    { title: 'Generate QR Code', text: `Public check-in token: ${center.clubCode}-QR` },
    { title: 'Create Public Invite Link', text: `ritim.app/join/${center.slug}` },
    { title: 'Invite Member by Email', text: 'Send a single-use onboarding invitation.' },
    { title: 'Add Member Manually', text: 'Create a member record from the desk.' },
    { title: 'View Club Code', text: center.clubCode },
    { title: 'Copy Invite Link', text: `https://ritim.app/join/${center.slug}` },
  ];

  const alertItems = [
    ...(nearMemberLimit ? [{ title: 'Member limit near', text: `${center.membersCount}/${subscription?.maxMembers} members used. Approve requests carefully or upgrade plan.` }] : []),
    ...(nearCardLimit ? [{ title: 'NFC card limit near', text: `${center.nfcCardsCount}/${subscription?.maxNfcCards} cards used. Order cleanup or upgrade before issuing more.` }] : []),
    ...(pendingRequests.length > 0 ? [{ title: 'Join approvals waiting', text: `${pendingRequests.length} member request needs approve/reject action.` }] : []),
    ...(unassignedCards.length > 0 ? [{ title: 'Unassigned NFC cards', text: `${unassignedCards.length} card is not linked to a member or activity.` }] : []),
  ];

  return (
    <ConsoleShell
      active="sports-center"
      role="Sports center owner/admin/coach"
      title={`${center.name} Console`}
      subtitle="Salon ekibinin kendi üyelerini, katılım taleplerini, NFC kartlarını, personelini ve günlük operasyonunu yönettiği panel."
    >
      <div className="metrics-grid">
        <MetricCard label="Members usage" value={`${center.membersCount} / ${subscription?.maxMembers ?? '-'}`} detail="Sports Center Basic member capacity" />
        <MetricCard label="NFC cards usage" value={`${center.nfcCardsCount} / ${subscription?.maxNfcCards ?? '-'}`} detail="Sports center card capacity" tone="purple" />
        <MetricCard label="Pending joins" value={pendingRequests.length} detail="Approve, reject or view profile" tone="orange" />
        <MetricCard label="Activities today" value={activitiesToday} detail={`${todayLogs.length} shown in latest logs`} tone="blue" />
        <MetricCard label="Active members this week" value={29} detail={`${uniqueActiveMembers} active in sample today`} tone="green" />
        <MetricCard label="Inactive members" value={inactiveMembers} detail="Needs coach follow-up" tone="orange" />
        <MetricCard label="Unassigned NFC cards" value={unassignedCards.length} detail={`${assignedCards.length} assigned in sample inventory`} tone="orange" />
        <MetricCard label="Current plan" value="Sports Center Basic" detail={`${subscription?.provider ?? 'manual'} · ${subscription?.status ?? 'active'}`} tone="purple" />
      </div>

      <div className="console-grid">
        <div className="span-8">
          <Section
            title="Join Requests"
            description="Members can arrive from QR code, NFC card, invite link, email invitation, manual admin flow or club code."
            action={<ActionRow actions={['Approve selected', 'Invite member']} />}
          >
            <DataTable
              columns={['Member', 'Email', 'Source', 'Status', 'Requested', 'Actions']}
              rows={centerRequests.map((request) => [
                <strong key={`${request.id}-name`}>{request.userName}</strong>,
                request.email,
                joinSourceLabels[request.source],
                <Badge key={`${request.id}-status`} tone={requestTone(request.status)}>{request.status}</Badge>,
                request.requestedAt,
                <ActionRow key={`${request.id}-actions`} actions={['Approve', 'Reject', 'View User']} />,
              ])}
            />
            {(center.membersCount >= (subscription?.maxMembers ?? Number.POSITIVE_INFINITY)) ? (
              <div className="alert-item">
                <strong>Approval blocked</strong>
                <p>Your Sports Center Basic plan supports up to 50 members. Contact Ritim to increase your limit.</p>
              </div>
            ) : nearMemberLimit ? (
              <div className="alert-item">
                <strong>You are close to your member limit.</strong>
                <p>Yeni onaylardan önce kalan kapasiteyi kontrol et.</p>
              </div>
            ) : null}
          </Section>
        </div>

        <div className="span-4">
          <Section title="Limit Usage" description="Current plan controls members and NFC capacity.">
            <div className="alert-list">
              <UsageBar label="Members" current={center.membersCount} max={subscription?.maxMembers ?? null} />
              <UsageBar label="NFC cards" current={center.nfcCardsCount} max={subscription?.maxNfcCards ?? null} />
              <div className="alert-item">
                <strong>Current Plan</strong>
                <p>{subscription?.planCode ?? 'sports_center_basic'} · {subscription?.status ?? 'active'} · {subscription?.provider ?? 'manual'} · renews {subscription?.currentPeriodEnd ?? '-'}</p>
              </div>
              {nearMemberLimit || nearCardLimit ? (
                <div className="alert-item">
                  <strong>Upgrade önerisi</strong>
                  <p>{nearMemberLimit ? 'You are close to your member limit. ' : ''}{nearCardLimit ? 'You are close to your NFC card limit.' : ''}</p>
                </div>
              ) : null}
            </div>
          </Section>
        </div>

        <div className="span-12">
          <Section title="Invite & Onboarding Tools" description="Fast paths for bringing members into this sports center.">
            <div className="quick-actions">
              {onboardingActions.map((action) => (
                <button className="quick-action" type="button" key={action.title}>
                  <strong>{action.title}</strong>
                  <p>{action.text}</p>
                </button>
              ))}
            </div>
          </Section>
        </div>

        <div className="span-7">
          <Section title="NFC Card Usage" description="Cards owned by this sports center only.">
            <DataTable
              columns={['Card', 'Assigned User', 'Activity', 'Status', 'Last Scan', 'Actions']}
              rows={centerCards.map((card) => [
                card.cardName,
                card.assignedUser ?? '-',
                card.linkedActivity ?? '-',
                <Badge key={`${card.id}-status`} tone={cardTone(card.status)}>{card.status}</Badge>,
                formatDate(card.lastScannedAt),
                <ActionRow key={`${card.id}-actions`} actions={card.status === 'assigned' ? ['Manage', 'Disable'] : ['Assign', 'Mark lost']} />,
              ])}
            />
          </Section>
        </div>

        <div className="span-5">
          <Section title="Member Activity Summary" description="Who moved today and which actions came from NFC.">
            <DataTable
              columns={['Member', 'Last Activity', 'Today', 'Source']}
              rows={centerLogs.map((log) => [
                log.member,
                `${log.activity} · ${log.amount} ${log.unit}`,
                log.createdAt.startsWith(todayKey) ? <Badge key={`${log.id}-today`} tone="green">Today</Badge> : <Badge key={`${log.id}-older`}>Older</Badge>,
                <Badge key={`${log.id}-source`} tone={log.source === 'nfc' ? 'green' : 'blue'}>{log.source}</Badge>,
              ])}
            />
          </Section>
        </div>

        <div className="span-6">
          <Section title="Activities" description="Activities are unlimited by plan. Manage units, defaults, icon and color.">
            <DataTable
              columns={['Activity', 'Category', 'Default', 'Status', 'Actions']}
              rows={[
                ['Bench Press', 'Fitness', '10 reps', <Badge key="bench-active" tone="green">active</Badge>, <ActionRow key="bench-actions" actions={['Edit', 'Deactivate']} />],
                ['Squat', 'Fitness', '20 reps', <Badge key="squat-active" tone="green">active</Badge>, <ActionRow key="squat-actions" actions={['Edit', 'Deactivate']} />],
                ['Running', 'Cardio', '15 min', <Badge key="run-active" tone="green">active</Badge>, <ActionRow key="run-actions" actions={['Edit', 'Deactivate']} />],
              ]}
            />
          </Section>
        </div>

        <div className="span-6">
          <Section title="Members" description="Member management entry point for search, profile, activity history and status changes.">
            <DataTable
              columns={['Member', 'Status', 'Assigned Cards', 'Last Activity', 'Actions']}
              rows={[
                ['Alex Durand', <Badge key="alex-active" tone="green">active</Badge>, 1, '2026-06-14 09:40', <ActionRow key="alex-actions" actions={['Profile', 'History', 'Deactivate']} />],
                ['Aylin Martin', <Badge key="aylin-pending" tone="orange">pending</Badge>, 1, '2026-06-14 09:12', <ActionRow key="aylin-actions" actions={['Profile', 'Approve', 'Block']} />],
                ['Marc Blanc', <Badge key="marc-active" tone="green">active</Badge>, 0, '2026-06-14 08:35', <ActionRow key="marc-actions" actions={['Profile', 'History', 'Deactivate']} />],
              ]}
            />
          </Section>
        </div>

        <div className="span-6">
          <Section title="Staff Overview" description="Owner, admin and coach visibility for this center.">
            <DataTable
              columns={['Name', 'Email', 'Role', 'Status', 'Last Login', 'Actions']}
              rows={centerStaff.map((staff) => [
                staff.name,
                staff.email,
                <Badge key={`${staff.id}-role`} tone={staff.role === 'owner' ? 'purple' : staff.role === 'admin' ? 'blue' : 'green'}>{staff.role}</Badge>,
                <Badge key={`${staff.id}-status`} tone={requestTone(staff.status)}>{staff.status}</Badge>,
                staff.lastLoginAt,
                <ActionRow key={`${staff.id}-actions`} actions={['Change role', 'Remove']} />,
              ])}
            />
          </Section>
        </div>

        <div className="span-6">
          <Section title="Alerts & Tasks" description="Operational issues that need center admin action.">
            <div className="alert-list">
              {alertItems.map((alert) => (
                <div className="alert-item" key={alert.title}>
                  <strong>{alert.title}</strong>
                  <p>{alert.text}</p>
                </div>
              ))}
              {alertItems.length === 0 ? (
                <div className="alert-item">
                  <strong>No urgent tasks</strong>
                  <p>Join queue, NFC assignment and limits are currently healthy.</p>
                </div>
              ) : null}
            </div>
          </Section>
        </div>

        <div className="span-12">
          <Section title="Recent Activity Logs" description="Latest verified or manual member actions for this center.">
            <DataTable
              columns={['Time', 'Member', 'Activity', 'Value', 'Source', 'Card']}
              rows={centerLogs.map((log) => [
                log.createdAt,
                log.member,
                log.activity,
                `${log.amount} ${log.unit}`,
                <Badge key={`${log.id}-log-source`} tone={log.source === 'nfc' ? 'green' : 'blue'}>{log.source}</Badge>,
                log.cardName ?? '-',
              ])}
            />
          </Section>
        </div>
      </div>
    </ConsoleShell>
  );
}
