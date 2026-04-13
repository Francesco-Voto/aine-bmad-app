import * as React from 'react';

interface PageShellProps {
  title: string;
  children: React.ReactNode;
}

const PageShell: React.FC<PageShellProps> = ({ title, children }) => {
  return (
    <div className="page-layout">
      <h1
        style={{
          fontSize: 'var(--text-lg)',
          fontWeight: 500,
          margin: '0 0 var(--space-4) 0',
          color: 'var(--color-text-primary)',
        }}
      >
        {title}
      </h1>
      <div
        style={{
          height: 1,
          background: 'var(--color-border)',
          marginBottom: 'var(--space-4)',
        }}
        role="separator"
        aria-hidden="true"
      />
      <main>{children}</main>
    </div>
  );
};

export { PageShell };
