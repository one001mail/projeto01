import { ENVIRONMENT_INFO } from "@/shared/content";

export const EnvironmentBadge = () => (
  <div className="inline-flex items-center gap-2 rounded-full border border-warning/30 bg-warning/5 px-3 py-1 text-xs font-mono text-warning">
    <span className="h-1.5 w-1.5 rounded-full bg-warning" />
    {ENVIRONMENT_INFO.label}
  </div>
);
