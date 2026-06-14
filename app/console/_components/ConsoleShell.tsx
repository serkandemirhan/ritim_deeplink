import Link from 'next/link';
import type { ReactNode } from 'react';

type ConsoleShellProps = {
  title: string;
  subtitle: string;
  active: 'platform' | 'sports-center' | 'users' | 'members' | 'staff';
  role: string;
  children: ReactNode;
};

export function ConsoleShell({ title, subtitle, active, role, children }: ConsoleShellProps) {
  return (
    <main className="console-page">
      <aside className="console-sidebar">
        <Link href="/" className="console-brand">
          <span className="logo-mark">R</span>
          <span>Ritim</span>
        </Link>
        <nav className="console-nav">
          <Link className={active === 'platform' ? 'active' : ''} href="/console/platform">Platform Console</Link>
          <Link className={active === 'sports-center' ? 'active' : ''} href="/console/sports-center">Sports Center Console</Link>
          <span>Dashboard</span>
          <span>Sports Centers</span>
          <span>Create / Edit Center</span>
          <span>Subscriptions</span>
          <Link className={active === 'users' ? 'active' : ''} href="/console/platform/users">Users / Admins</Link>
          <span>Join Requests</span>
          <span>NFC Cards</span>
          <Link className={active === 'members' ? 'active' : ''} href="/console/platform/members">Members</Link>
          <Link className={active === 'staff' ? 'active' : ''} href="/console/platform/staff">Staff / Managers</Link>
          <span>Activities</span>
          <span>Activity History</span>
          <span>Audit Logs</span>
          <span>Settings</span>
        </nav>
        <div className="access-card">
          <strong>Access</strong>
          <span>{role}</span>
          <small>Live Supabase data · server-side console scope</small>
        </div>
      </aside>
      <section className="console-main">
        <header className="console-header">
          <div>
            <p className="eyebrow">{active === 'platform' ? 'Platform Management' : 'Sports Center Operations'}</p>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="header-actions">
            <Link className="mini-button secondary" href="/test-links">NFC Test</Link>
            <Link className="mini-button" href={active === 'platform' ? '/console/sports-center' : '/console/platform'}>
              Switch Console
            </Link>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}

export function MetricCard({ label, value, detail, tone = 'green' }: { label: string; value: string | number; detail?: string; tone?: 'green' | 'blue' | 'purple' | 'orange' | 'red' }) {
  return (
    <div className={`metric-card tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </div>
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

export function DataTable({ columns, rows }: { columns: string[]; rows: ReactNode[][] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'green' | 'blue' | 'purple' | 'orange' | 'red' }) {
  return <span className={`console-badge badge-${tone}`}>{children}</span>;
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
