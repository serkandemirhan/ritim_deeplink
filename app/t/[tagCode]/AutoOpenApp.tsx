'use client';

import { useEffect, useState } from 'react';

type AutoOpenAppProps = {
  appSchemeUrl: string;
};

export default function AutoOpenApp({ appSchemeUrl }: AutoOpenAppProps) {
  const [didTryOpen, setDidTryOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDidTryOpen(true);
      window.location.href = appSchemeUrl;
    }, 450);

    return () => window.clearTimeout(timer);
  }, [appSchemeUrl]);

  return (
    <p className="auto-open-note">
      {didTryOpen
        ? 'RitimApp otomatik açılmadıysa aşağıdaki butona dokun.'
        : 'RitimApp otomatik açılıyor...'}
    </p>
  );
}
