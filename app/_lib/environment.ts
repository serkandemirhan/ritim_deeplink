import { headers } from 'next/headers';
import {
  environmentFromHost,
  environmentLabel,
  getDeeplinkDomain,
  getNfcUrl,
  getPublicAppUrl,
  type RitimEnvironment,
} from './environmentCore';

export {
  environmentFromHost,
  environmentLabel,
  getDeeplinkDomain,
  getNfcUrl,
  getPublicAppUrl,
  type RitimEnvironment,
};

export async function getCurrentEnvironment(): Promise<RitimEnvironment> {
  const headerList = await headers();
  return environmentFromHost(headerList.get('host'));
}
