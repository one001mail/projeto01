import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "info" | "warning" | "danger";

const TONE_STYLES: Record<Tone, string> = {
  info: "border-primary/30 bg-primary/5",
  warning: "border-warning/30 bg-warning/5",
  danger: "border-destructive/40 bg-destructive/10",
};

const TONE_ICON_STYLES: Record<Tone, string> = {
  info: "text-primary",
  warning: "text-warning",
  danger: "text-destructive",
};

const ICONS = {
  info: Info,
  warning: AlertTriangle,
  danger: ShieldAlert,
};

interface NoticeProps {
  tone?: Tone;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Notice = ({ tone = "info", title, children, className }: NoticeProps) => {
  const Icon = ICONS[tone];
  return (
    <div className={cn("rounded-lg border p-4 flex gap-3 items-start", TONE_STYLES[tone], className)}>
      <Icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", TONE_ICON_STYLES[tone])} />
      <div className="text-sm">
        {title && <p className="font-mono font-semibold mb-1">{title}</p>}
        <div className="text-muted-foreground">{children}</div>
      </div>
    </div>
  );
};
