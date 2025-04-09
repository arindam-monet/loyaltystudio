'use client';

export default function DeveloperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full space-y-6">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Developer</h2>
        <p className="text-muted-foreground">
          Manage API keys, webhooks, and access developer documentation.
        </p>
      </div>

      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}
