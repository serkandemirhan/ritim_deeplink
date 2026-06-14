import { ActionRow, Badge, ConsoleShell, DataTable, MetricCard, Section, UsageBar } from '../_components/ConsoleShell';
import {
  activityLogs,
  auditLogs,
  formatDate,
  getPlatformUsers,
  getSubscription,
  isNearLimit,
  joinRequests,
  joinSourceLabels,
  nfcCards,
  sportsCenters,
  subscriptions,
} from '../_data/mockConsoleData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const todayKey = '2026-06-14';

function statusTone(status: string): 'green' | 'blue' | 'orange' | 'red' {
  if (status === 'active') return 'green';
  if (status === 'trialing') return 'blue';
  if (status === 'paused') return 'orange';
  return 'red';
}

export default async function PlatformConsolePage() {
  const platformUsersResult = await getPlatformUsers();
  const platformUsers = platformUsersResult.users;
  const activeCenters = sportsCenters.filter((center) => center.status === 'active').length;
  const trialCenters = sportsCenters.filter((center) => center.status === 'trialing').length;
  const pausedCenters = sportsCenters.filter((center) => center.status === 'paused').length;
  const totalMembers = sportsCenters.reduce((sum, center) => sum + center.membersCount, 0);
  const totalNfcCards = sportsCenters.reduce((sum, center) => sum + center.nfcCardsCount, 0);
  const pendingRequests = joinRequests.filter((request) => request.status === 'pending');
  const scannedToday = nfcCards.filter((card) => card.lastScannedAt?.startsWith(todayKey)).length;
  const platformAdmins = platformUsers.filter((user) => user.platformRole !== 'user').length;
  const sportsCenterConsoleUsers = platformUsers.filter((user) => user.sportsCenterRole && user.sportsCenterRole !== 'member').length;
  const personalProUsers = platformUsers.filter((user) => user.personalPlan === 'personal_pro').length;
  const pendingUsers = platformUsers.filter((user) => user.status === 'pending' || user.status === 'invited').length;

  const centersNearLimits = sportsCenters.filter((center) => {
    const subscription = getSubscription(center.id);
    return isNearLimit(center.membersCount, subscription?.maxMembers ?? null) || isNearLimit(center.nfcCardsCount, subscription?.maxNfcCards ?? null);
  });
  const centersNearMemberLimit = sportsCenters.filter((center) => {
    const subscription = getSubscription(center.id);
    return isNearLimit(center.membersCount, subscription?.maxMembers ?? null);
  });
  const centersNearNfcLimit = sportsCenters.filter((center) => {
    const subscription = getSubscription(center.id);
    return isNearLimit(center.nfcCardsCount, subscription?.maxNfcCards ?? null);
  });

  const sourceRows = Object.entries(joinSourceLabels).map(([source, label]) => {
    const requests = joinRequests.filter((request) => request.source === source);
    const pending = requests.filter((request) => request.status === 'pending').length;
    return [
      label,
      <Badge key={`${source}-all`} tone={requests.length > 0 ? 'blue' : 'default'}>{requests.length} total</Badge>,
      <Badge key={`${source}-pending`} tone={pending > 0 ? 'orange' : 'green'}>{pending} pending</Badge>,
    ];
  });

  const pendingCenterRows = sportsCenters
    .map((center) => {
      const centerRequests = pendingRequests.filter((request) => request.sportsCenterId === center.id);
      return { center, centerRequests };
    })
    .filter(({ centerRequests }) => centerRequests.length > 0)
    .map(({ center, centerRequests }) => [
      center.name,
      <Badge key={`${center.id}-pending`} tone="orange">{centerRequests.length} pending</Badge>,
      centerRequests.filter((request) => request.source === 'qr_code').length,
      centerRequests.filter((request) => request.source === 'nfc_card').length,
      centerRequests.filter((request) => request.source === 'invite_link').length,
      centerRequests.filter((request) => request.source === 'club_code').length,
      centerRequests[centerRequests.length - 1]?.requestedAt ?? '-',
      <ActionRow key={`${center.id}-actions`} actions={['Review queue', 'Open center']} />,
    ]);

  const alertItems = [
    ...centersNearLimits.map((center) => {
      const subscription = getSubscription(center.id);
      return {
        title: `${center.name} limit uyarısı`,
        text: `Members ${center.membersCount}/${subscription?.maxMembers ?? '-'} · NFC ${center.nfcCardsCount}/${subscription?.maxNfcCards ?? '-'}`,
      };
    }),
    ...pendingRequests
      .filter((request) => request.requestedAt < '2026-06-08')
      .map((request) => ({
        title: `${request.userName} bekleyen başvuru`,
        text: `${request.email} · ${formatDate(request.requestedAt)} tarihinden beri onay bekliyor.`,
      })),
    ...sportsCenters
      .filter((center) => center.status === 'paused')
      .map((center) => ({
        title: `${center.name} duraklatıldı`,
        text: `Son aktivite: ${formatDate(center.lastActivityAt)} · üyelik el ile durdurulmuş.`,
      })),
    ...nfcCards
      .filter((card) => card.status === 'lost')
      .map((card) => ({
        title: `${card.cardName} kayıp`,
        text: `${sportsCenters.find((center) => center.id === card.sportsCenterId)?.name ?? 'Unknown center'} içinde devre dışı bırakılmalı.`,
      })),
  ];

  return (
    <ConsoleShell
      active="platform"
      role="Ritim platform_admin"
      title="Platform Management Console"
      subtitle="Ritim ekibinin tüm spor merkezlerini, abonelikleri, NFC kapasitesini ve onboarding kuyruğunu yönettiği merkezi panel."
    >
      <div className="metrics-grid">
        <MetricCard label="Total sports centers" value={sportsCenters.length} detail={`${activeCenters} active · ${trialCenters} trialing · ${pausedCenters} paused`} />
        <MetricCard label="Active sports centers" value={activeCenters} detail="Web console enabled centers" tone="green" />
        <MetricCard label="Trial sports centers" value={trialCenters} detail="Manual pilot or trialing status" tone="blue" />
        <MetricCard label="Paused / cancelled" value={pausedCenters} detail="Needs platform attention" tone="orange" />
        <MetricCard label="Members managed" value={totalMembers} detail="All sports centers combined" tone="blue" />
        <MetricCard label="NFC cards issued" value={totalNfcCards} detail={`${scannedToday} card scanned today`} tone="purple" />
        <MetricCard label="Join requests" value={pendingRequests.length} detail="Pending platform-wide approval" tone="orange" />
        <MetricCard label="Near member limit" value={centersNearMemberLimit.length} detail="Usage >= 80%" tone="orange" />
        <MetricCard label="Near NFC limit" value={centersNearNfcLimit.length} detail="Usage >= 80%" tone="orange" />
        <MetricCard label="All users" value={platformUsers.length} detail={`${platformAdmins} platform · ${sportsCenterConsoleUsers} center staff · ${platformUsersResult.source}`} tone="green" />
        <MetricCard label="Personal Pro users" value={personalProUsers} detail={`${pendingUsers} invited or pending users`} tone="purple" />
      </div>

      <div className="console-grid">
        <div className="span-12">
          <Section title="Sports Centers" description="Global tenant list with owner, subscription, usage limits and latest activity.">
            <DataTable
              columns={['Center', 'Owner', 'Plan', 'Status', 'Members', 'NFC Cards', 'Created', 'Last Activity', 'Actions']}
              rows={sportsCenters.map((center) => {
                const subscription = getSubscription(center.id);
                return [
                  <strong key={`${center.id}-name`}>{center.name}</strong>,
                  center.ownerEmail,
                  subscription?.planCode ?? center.planCode,
                  <Badge key={`${center.id}-status`} tone={statusTone(center.status)}>{center.status}</Badge>,
                  <UsageBar key={`${center.id}-members`} label="Members" current={center.membersCount} max={subscription?.maxMembers ?? null} />,
                  <UsageBar key={`${center.id}-cards`} label="NFC" current={center.nfcCardsCount} max={subscription?.maxNfcCards ?? null} />,
                  center.createdAt,
                  formatDate(center.lastActivityAt),
                  <ActionRow key={`${center.id}-actions`} actions={['View', 'Edit', 'Change Status', 'Open Subscription']} />,
                ];
              })}
            />
          </Section>
        </div>

        <div className="span-7">
          <Section title="Onboarding Requests" description="Pending member joins grouped by sports center and source.">
            <DataTable
              columns={['Sports Center', 'Pending', 'QR', 'NFC', 'Invite Link', 'Club Code', 'Oldest Request', 'Actions']}
              rows={pendingCenterRows}
            />
          </Section>
        </div>

        <div className="span-5">
          <Section title="Source Analytics" description="Which onboarding path is producing requests.">
            <div className="source-list">
              {sourceRows.map(([label, total, pending]) => (
                <div className="source-row" key={String(label)}>
                  <span>{label}</span>
                  <div className="badge-stack">{total}{pending}</div>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <div className="span-12">
          <Section title="Platform Actions" description="Admin operations required for Phase 1 pilots and sports center activation.">
            <div className="quick-actions">
              {[
                ['Create sports center', 'Name, slug, country, city, address, main admin, plan, limits, status and provider.'],
                ['Assign owner/admin', 'Create or link main admin user and set sports_center_users role = owner.'],
                ['Activate manually', 'Set provider = manual and status = active or trialing for pilot centers.'],
                ['Pause/cancel subscription', 'Update subscription and sports center status without touching personal subscriptions.'],
                ['View all NFC cards', 'Inspect sports center card inventory and lost/inactive card alerts.'],
                ['View users/admins', 'Support view for sports center staff and member access state.'],
              ].map(([title, text]) => (
                <button className="quick-action" type="button" key={title}>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </button>
              ))}
            </div>
          </Section>
        </div>

        <div className="span-12">
          <Section title="Users / Admins" description="All known Ritim users across personal accounts, platform roles and sports center memberships.">
            {platformUsersResult.error ? (
              <div className="alert-item">
                <strong>Live user data fallback</strong>
                <p>{platformUsersResult.error} Showing mock users until Vercel has Supabase service credentials.</p>
              </div>
            ) : null}
            <DataTable
              columns={['User', 'Email', 'Platform Role', 'Sports Center', 'Center Role', 'Status', 'Personal Plan', 'Join Source', 'Last Seen', 'Actions']}
              rows={platformUsers.map((user) => {
                const center = sportsCenters.find((item) => item.id === user.sportsCenterId);
                const isPlatformAdmin = user.platformRole !== 'user';
                return [
                  <strong key={`${user.id}-name`}>{user.fullName}</strong>,
                  user.email,
                  <Badge key={`${user.id}-platform-role`} tone={isPlatformAdmin ? 'purple' : 'default'}>{user.platformRole}</Badge>,
                  user.sportsCenterName ?? center?.name ?? 'Personal',
                  user.sportsCenterRole ? <Badge key={`${user.id}-center-role`} tone={user.sportsCenterRole === 'owner' ? 'purple' : user.sportsCenterRole === 'admin' ? 'blue' : user.sportsCenterRole === 'coach' ? 'green' : 'default'}>{user.sportsCenterRole}</Badge> : '-',
                  <Badge key={`${user.id}-status`} tone={user.status === 'active' ? 'green' : user.status === 'pending' || user.status === 'invited' ? 'orange' : 'red'}>{user.status}</Badge>,
                  <Badge key={`${user.id}-plan`} tone={user.personalPlan === 'personal_pro' ? 'purple' : 'blue'}>{user.personalPlan}</Badge>,
                  user.joinSource ? joinSourceLabels[user.joinSource] : '-',
                  user.lastSeenAt,
                  <ActionRow key={`${user.id}-actions`} actions={isPlatformAdmin ? ['View', 'Change role', 'Audit'] : ['View', 'Open memberships', 'Support']} />,
                ];
              })}
            />
          </Section>
        </div>

        <div className="span-6">
          <Section title="Subscription Limits" description="Centers close to members or NFC limits.">
            <DataTable
              columns={['Center', 'Members', 'NFC Cards', 'Plan', 'Status', 'Action']}
              rows={centersNearLimits.map((center) => {
                const subscription = getSubscription(center.id);
                return [
                  center.name,
                  <UsageBar key={`${center.id}-limit-members`} label="Members" current={center.membersCount} max={subscription?.maxMembers ?? null} />,
                  <UsageBar key={`${center.id}-limit-cards`} label="NFC" current={center.nfcCardsCount} max={subscription?.maxNfcCards ?? null} />,
                  subscription?.planCode ?? center.planCode,
                  <Badge key={`${center.id}-risk`} tone="orange">{center.status}</Badge>,
                  <ActionRow key={`${center.id}-limit-actions`} actions={['Upgrade', 'Contact owner']} />,
                ];
              })}
            />
          </Section>
        </div>

        <div className="span-6">
          <Section title="Plans Overview" description="Manual Phase 1 subscriptions and current period status.">
            <DataTable
              columns={['Owner', 'Plan', 'Status', 'Provider', 'Members', 'NFC Cards', 'Period End', 'Action']}
              rows={subscriptions.map((subscription) => {
                const center = sportsCenters.find((item) => item.id === subscription.ownerId);
                return [
                center?.name ?? subscription.ownerId,
                subscription.planCode,
                <Badge key={`${subscription.id}-status`} tone={statusTone(subscription.status)}>{subscription.status}</Badge>,
                <Badge key={`${subscription.id}-provider`} tone={subscription.provider === 'stripe' ? 'purple' : subscription.provider === 'manual' ? 'blue' : 'green'}>{subscription.provider}</Badge>,
                center ? <UsageBar key={`${subscription.id}-members`} label="Members" current={center.membersCount} max={subscription.maxMembers} /> : 'Personal',
                center ? <UsageBar key={`${subscription.id}-cards`} label="NFC" current={center.nfcCardsCount} max={subscription.maxNfcCards} /> : subscription.maxNfcCards,
                subscription.currentPeriodEnd,
                <ActionRow key={`${subscription.id}-action`} actions={subscription.ownerType === 'sports_center' ? ['Open Subscription', 'Manual activation'] : ['View user']} />,
              ];
              })}
            />
          </Section>
        </div>

        <div className="span-8">
          <Section title="Global NFC Card Overview" description="Card assignment health across all sports centers.">
            <DataTable
              columns={['Card', 'Sports Center', 'Assigned User', 'Activity', 'Status', 'Last Scan']}
              rows={nfcCards.map((card) => [
                card.cardName,
                sportsCenters.find((center) => center.id === card.sportsCenterId)?.name ?? '-',
                card.assignedUser ?? '-',
                card.linkedActivity ?? '-',
                <Badge key={`${card.id}-status`} tone={card.status === 'assigned' ? 'green' : card.status === 'lost' ? 'red' : 'orange'}>{card.status}</Badge>,
                formatDate(card.lastScannedAt),
              ])}
            />
          </Section>
        </div>

        <div className="span-4">
          <Section title="Platform Alerts" description="Phase 1 operational watch list.">
            <div className="alert-list">
              {alertItems.map((alert) => (
                <div className="alert-item" key={`${alert.title}-${alert.text}`}>
                  <strong>{alert.title}</strong>
                  <p>{alert.text}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <div className="span-6">
          <Section title="Recent Activity Logs" description="Latest member activity visible to platform support.">
            <DataTable
              columns={['Center', 'Member', 'Activity', 'Source', 'Time']}
              rows={activityLogs.map((log) => [
                sportsCenters.find((center) => center.id === log.sportsCenterId)?.name ?? '-',
                log.member,
                `${log.amount} ${log.unit} ${log.activity}`,
                <Badge key={`${log.id}-source`} tone={log.source === 'nfc' ? 'green' : 'blue'}>{log.source}</Badge>,
                log.createdAt,
              ])}
            />
          </Section>
        </div>

        <div className="span-6">
          <Section title="Audit Log Preview" description="Admin actions and sensitive operational changes.">
            <DataTable
              columns={['Time', 'Actor', 'Action', 'Entity', 'Details']}
              rows={auditLogs.map((log) => [log.createdAt, log.actor, log.action, log.entity, log.details])}
            />
          </Section>
        </div>
      </div>
    </ConsoleShell>
  );
}
