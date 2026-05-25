import { ScrollViewStyleReset } from 'expo-router/html';
import type { ReactNode } from 'react';

import { pwaMeta } from '@/constants/pwa';
import { JournalTheme } from '@/constants/theme';

export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content={pwaMeta.themeColor} />
        <meta name="application-name" content={pwaMeta.appName} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={pwaMeta.shortName} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192.png" />

        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const globalStyles = `
html, body, #root {
  height: 100%;
  background-color: ${JournalTheme.background};
  overscroll-behavior: none;
}

body {
  margin: 0;
  font-family: Georgia, 'Times New Roman', serif;
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

* {
  box-sizing: border-box;
}

@media (display-mode: standalone) {
  body {
    user-select: none;
  }

  input, textarea {
    user-select: text;
  }
}

/* Fix bottom tab bar clipping on mobile web / PWA */
[data-testid="tab-bar"], nav[role="tablist"] {
  padding-bottom: max(env(safe-area-inset-bottom, 0px), 16px) !important;
}
`;
