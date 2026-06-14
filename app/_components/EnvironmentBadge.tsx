import { environmentLabel, getCurrentEnvironment } from '../_lib/environment';

export default async function EnvironmentBadge() {
  const environment = await getCurrentEnvironment();
  const label = environmentLabel(environment);
  if (!label) return null;

  return <div className={`environment-badge environment-${environment}`}>{label}</div>;
}
