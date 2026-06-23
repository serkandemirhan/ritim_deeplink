import Link from 'next/link';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import type { ConsoleSessionRole } from '../_auth/permissions';

type ConsoleActiveKey =
  | 'platform'
  | 'sports-center'
  | 'users'
  | 'members'
  | 'staff'
  | 'organizations'
  | 'join-requests'
  | 'nfc-cards'
  | 'rhythms'
  | 'assignments'
  | 'activity-logs'
  | 'subscriptions'
  | 'reports'
  | 'audit-logs'
  | 'settings';

type Tone = 'default' | 'green' | 'blue' | 'purple' | 'orange' | 'red';

type ConsoleShellProps = {
  title: string;
  subtitle: string;
  active: ConsoleActiveKey;
  role: string;
  sessionRole?: ConsoleSessionRole;
  actions?: ReactNode;
  children: ReactNode;
};

const platformRoles: ConsoleSessionRole[] = ['super_admin', 'platform_admin', 'support'];

function hasPlatformAccess(role: ConsoleSessionRole) {
  return platformRoles.includes(role);
}

function canSeeNavItem(role: ConsoleSessionRole, scope: 'platform' | 'sports-center' | 'all') {
  if (scope === 'all') return true;
  if (scope === 'platform') return hasPlatformAccess(role);
  return hasPlatformAccess(role) || role === 'wellness_admin' || role === 'staff' || role === 'trainer';
}

type SidebarItem = {
  label: string;
  href?: string;
  active?: ConsoleActiveKey;
  scope: 'platform' | 'sports-center' | 'all';
};

const navItems: SidebarItem[] = [
  { label: 'Platform Console', href: '/console/platform', active: 'platform', scope: 'platform' },
  { label: 'Sports Center Console', href: '/console/sports-center', active: 'sports-center', scope: 'sports-center' },
  { label: 'Organizations', href: '/console/platform/organizations', active: 'organizations', scope: 'platform' },
  { label: 'Subscriptions', href: '/console/platform/subscriptions', active: 'subscriptions', scope: 'platform' },
  { label: 'Users / Admins', href: '/console/platform/users', active: 'users', scope: 'platform' },
  { label: 'Members', href: '/console/platform/members', active: 'members', scope: 'platform' },
  { label: 'Staff / Managers', href: '/console/platform/staff', active: 'staff', scope: 'platform' },
  { label: 'Join Requests', href: '/console/sports-center/join-requests', active: 'join-requests', scope: 'sports-center' },
  { label: 'Center Members', href: '/console/sports-center/members', active: 'members', scope: 'sports-center' },
  { label: 'NFC Cards', href: '/console/sports-center/nfc-cards', active: 'nfc-cards', scope: 'sports-center' },
  { label: 'Rhythms', href: '/console/sports-center/rhythms', active: 'rhythms', scope: 'sports-center' },
  { label: 'Assignments', href: '/console/sports-center/assignments', active: 'assignments', scope: 'sports-center' },
  { label: 'Activity Logs', href: '/console/sports-center/activity-logs', active: 'activity-logs', scope: 'sports-center' },
  { label: 'Subscription Usage', href: '/console/sports-center/subscription', active: 'subscriptions', scope: 'sports-center' },
  { label: 'Reports', href: '/console/platform/reports', active: 'reports', scope: 'platform' },
  { label: 'Audit Logs', href: '/console/platform/audit-logs', active: 'audit-logs', scope: 'platform' },
  { label: 'Center Reports', href: '/console/sports-center/reports', active: 'reports', scope: 'sports-center' },
  { label: 'System Settings', href: '/console/platform/settings', active: 'settings', scope: 'platform' },
  { label: 'Settings', href: '/console/sports-center/settings', active: 'settings', scope: 'sports-center' },
];

export function ConsoleShell({ title, subtitle, active, role, sessionRole = 'super_admin', actions, children }: ConsoleShellProps) {
  const visibleNavItems = navItems.filter((item) => canSeeNavItem(sessionRole, item.scope));
  const switchHref = hasPlatformAccess(sessionRole) && active !== 'sports-center' ? '/console/sports-center' : hasPlatformAccess(sessionRole) ? '/console/platform' : null;
  const headerActions = actions ?? (
    <>
      <Link className="mini-button secondary" href="/test-links">NFC Test</Link>
      {switchHref ? <Link className="mini-button" href={switchHref}>Switch Console</Link> : null}
    </>
  );

  return (
    <main className="console-page">
      <Sidebar active={active} items={visibleNavItems} role={role} sessionRole={sessionRole} />
      <section className="console-main">
        <PageHeader
          eyebrow={active === 'platform' ? 'Platform Management' : active === 'sports-center' ? 'Sports Center Operations' : 'Console'}
          title={title}
          subtitle={subtitle}
          actions={headerActions}
        />
        {children}
      </section>
    </main>
  );
}

export function Sidebar({ active, items, role, sessionRole }: { active: ConsoleActiveKey; items: SidebarItem[]; role: string; sessionRole: ConsoleSessionRole }) {
  return (
    <aside className="console-sidebar">
      <Link href="/" className="console-brand">
        <span className="logo-mark">R</span>
        <span>Ritim</span>
      </Link>
      <nav className="console-nav">
        {items.map((item) => (
          item.href ? (
            <Link className={item.active === active ? 'active' : ''} href={item.href} key={item.label}>{item.label}</Link>
          ) : (
            <span className={item.active === active ? 'active' : ''} key={item.label}>{item.label}</span>
          )
        ))}
      </nav>
      <div className="access-card">
        <strong>Access</strong>
        <span>{role}</span>
        <small>{sessionRole} · server-side console scope</small>
      </div>
    </aside>
  );
}

export function PageHeader({ eyebrow, title, subtitle, actions }: { eyebrow?: string; title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header className="console-header">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions ? <div className="header-actions">{actions}</div> : null}
    </header>
  );
}

export function StatCard({ label, value, detail, tone = 'green' }: { label: string; value: string | number; detail?: string; tone?: Exclude<Tone, 'default'> }) {
  return (
    <div className={`metric-card tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </div>
  );
}

export const MetricCard = StatCard;

export function ChartCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="console-section chart-card">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export function Section({ title, description, action, children }: { title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="console-section">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function SearchBar({ name = 'search', placeholder = 'Search', defaultValue }: { name?: string; placeholder?: string; defaultValue?: string }) {
  return (
    <label className="search-bar">
      <span>Search</span>
      <input name={name} placeholder={placeholder} defaultValue={defaultValue} type="search" />
    </label>
  );
}

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="filter-bar">{children}</div>;
}

export function FilterSelect({ label, name, options, defaultValue }: { label: string; name: string; options: Array<{ label: string; value: string }>; defaultValue?: string }) {
  return (
    <label className="filter-field">
      <span>{label}</span>
      <select name={name} defaultValue={defaultValue}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

export function DataTable({
  columns,
  rows,
  caption,
  emptyMessage = 'No records found.',
  pagination,
}: {
  columns: string[];
  rows: ReactNode[][];
  caption?: string;
  emptyMessage?: string;
  pagination?: { page: number; pageCount: number; totalItems: number };
}) {
  return (
    <div className="data-table">
      <div className="table-wrap">
        <table>
          {caption ? <caption>{caption}</caption> : null}
          <thead>
            <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
              </tr>
            )) : (
              <tr>
                <td colSpan={columns.length}>{emptyMessage}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {pagination ? (
        <div className="table-pagination">
          <span>{pagination.totalItems} records</span>
          <strong>Page {pagination.page} / {pagination.pageCount}</strong>
        </div>
      ) : null}
    </div>
  );
}

export function StatusBadge({ children, tone = 'default' }: { children: ReactNode; tone?: Tone }) {
  return <span className={`console-badge badge-${tone}`}>{children}</span>;
}

export const Badge = StatusBadge;

export function ConfirmDialog({ title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel' }: { title: string; description?: string; confirmLabel?: string; cancelLabel?: string }) {
  return (
    <div className="confirm-dialog" role="dialog" aria-label={title}>
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
      <div className="header-actions">
        <button className="mini-button secondary" type="button">{cancelLabel}</button>
        <button className="mini-button" type="button">{confirmLabel}</button>
      </div>
    </div>
  );
}

export function FormField({ label, helper, error, children }: { label: string; helper?: string; error?: string; children: ReactNode }) {
  return (
    <label className="form-field">
      <span>{label}</span>
      {children}
      {error ? <small className="field-error">{error}</small> : helper ? <small>{helper}</small> : null}
    </label>
  );
}

export function TextInput(props: ComponentPropsWithoutRef<'input'>) {
  return <input className="console-input" {...props} />;
}

export function SelectInput(props: ComponentPropsWithoutRef<'select'>) {
  return <select className="console-input" {...props} />;
}

export function EmptyState({ title = 'No data yet', description, action }: { title?: string; description?: string; action?: ReactNode }) {
  return (
    <div className="state-card empty-state">
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
      {action ? <div className="header-actions">{action}</div> : null}
    </div>
  );
}

export function LoadingState({ title = 'Loading', description = 'Data is being prepared.' }: { title?: string; description?: string }) {
  return (
    <div className="state-card loading-state" aria-busy="true">
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', description }: { title?: string; description?: string }) {
  return (
    <div className="state-card error-state">
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
    </div>
  );
}

export function PermissionDeniedState({ title = 'Permission denied', description = 'Bu console alanına erişim yetkin yok.' }: { title?: string; description?: string }) {
  return (
    <div className="state-card error-state">
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

export function ToastMessage({ children, tone = 'green' }: { children: ReactNode; tone?: Exclude<Tone, 'default'> }) {
  return <div className={`toast-message tone-${tone}`} role="status">{children}</div>;
}

export function UsageBar({ current, max, label }: { current: number; max: number | null; label: string }) {
  const percent = max ? Math.min(100, Math.round((current / max) * 100)) : 0;
  const tone = percent >= 100 ? 'red' : percent >= 80 ? 'orange' : 'green';
  return (
    <div className="usage">
      <div className="usage-top">
        <span>{label}</span>
        <strong>{max ? `${current}/${max}` : `${current}`}</strong>
      </div>
      <div className="usage-track">
        <div className={`usage-fill tone-${tone}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function ActionRow({ actions }: { actions: string[] }) {
  return (
    <div className="action-row">
      {actions.map((action) => <button key={action} type="button">{action}</button>)}
    </div>
  );
}
