/**
 * Prometheus-compatible metrics registry (sandbox-stub).
 *
 * We do not ship the `prom-client` dependency in this sandbox; this module
 * offers an in-memory, text-rendering counter/histogram registry so routes
 * and modules can emit metrics in a prometheus-compatible shape. Real
 * deployments can swap this adapter for `prom-client` without changing
 * callers.
 */
export interface Counter {
  inc(value?: number, labels?: Record<string, string>): void;
  snapshot(): Array<{ labels: Record<string, string>; value: number }>;
}

export interface Histogram {
  observe(value: number, labels?: Record<string, string>): void;
  snapshot(): Array<{ labels: Record<string, string>; count: number; sum: number }>;
}

export interface MetricsRegistry {
  counter(name: string, help: string): Counter;
  histogram(name: string, help: string, buckets?: readonly number[]): Histogram;
  render(): string;
}

function labelsKey(labels: Record<string, string> = {}): string {
  return Object.entries(labels)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}="${v}"`)
    .join(',');
}

function escapeLabelValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function labelsToPrometheus(labels: Record<string, string>): string {
  const entries = Object.entries(labels);
  if (entries.length === 0) return '';
  return `{${entries
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}="${escapeLabelValue(v)}"`)
    .join(',')}}`;
}

export function createMetricsRegistry(): MetricsRegistry {
  const counters = new Map<
    string,
    { help: string; values: Map<string, number>; labels: Map<string, Record<string, string>> }
  >();
  const histograms = new Map<
    string,
    {
      help: string;
      values: Map<string, { count: number; sum: number }>;
      labels: Map<string, Record<string, string>>;
    }
  >();

  return {
    counter(name, help): Counter {
      const existing = counters.get(name);
      const bucket = existing ?? { help, values: new Map(), labels: new Map() };
      if (!existing) counters.set(name, bucket);
      return {
        inc(value = 1, labels = {}): void {
          const key = labelsKey(labels);
          bucket.values.set(key, (bucket.values.get(key) ?? 0) + value);
          bucket.labels.set(key, labels);
        },
        snapshot(): Array<{ labels: Record<string, string>; value: number }> {
          return [...bucket.values.entries()].map(([key, value]) => ({
            labels: bucket.labels.get(key) ?? {},
            value,
          }));
        },
      };
    },
    histogram(name, help): Histogram {
      const existing = histograms.get(name);
      const bucket = existing ?? { help, values: new Map(), labels: new Map() };
      if (!existing) histograms.set(name, bucket);
      return {
        observe(value, labels = {}): void {
          const key = labelsKey(labels);
          const prev = bucket.values.get(key) ?? { count: 0, sum: 0 };
          bucket.values.set(key, { count: prev.count + 1, sum: prev.sum + value });
          bucket.labels.set(key, labels);
        },
        snapshot(): Array<{ labels: Record<string, string>; count: number; sum: number }> {
          return [...bucket.values.entries()].map(([key, v]) => ({
            labels: bucket.labels.get(key) ?? {},
            count: v.count,
            sum: v.sum,
          }));
        },
      };
    },
    render(): string {
      const out: string[] = [];
      for (const [name, bucket] of counters) {
        out.push(`# HELP ${name} ${bucket.help}`);
        out.push(`# TYPE ${name} counter`);
        for (const [key, value] of bucket.values) {
          const lbl = bucket.labels.get(key) ?? {};
          out.push(`${name}${labelsToPrometheus(lbl)} ${value}`);
        }
      }
      for (const [name, bucket] of histograms) {
        out.push(`# HELP ${name} ${bucket.help}`);
        out.push(`# TYPE ${name} summary`);
        for (const [key, v] of bucket.values) {
          const lbl = bucket.labels.get(key) ?? {};
          out.push(`${name}_count${labelsToPrometheus(lbl)} ${v.count}`);
          out.push(`${name}_sum${labelsToPrometheus(lbl)} ${v.sum}`);
        }
      }
      return `${out.join('\n')}\n`;
    },
  };
}

/** Default process-wide registry. Sandbox-safe: pure in-memory. */
export const metricsRegistry: MetricsRegistry = createMetricsRegistry();
