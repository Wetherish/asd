import { useEffect, useRef, useState } from 'react';
import { useStore } from '../lib/store';
import type { Dashboard, DashboardChart, DashboardChartItem } from '../lib/types';
import { deleteDashboard, refreshDashboard } from '../lib/agent';
import { uid } from '../lib/util';
import { Icon } from '../lib/icons';
import { Button } from '../components/Button';
import './DashboardView.css';

// Sequential ramp derived from the single accent (no new hues).
const RAMP_STEPS = [1, 0.8, 0.62, 0.46, 0.32];

function rampColor(i: number): string {
  const t = RAMP_STEPS[Math.min(i, RAMP_STEPS.length - 1)];
  return `color-mix(in srgb, var(--accent) ${Math.round(
    t * 100,
  )}%, var(--canvas))`;
}

function numericValue(s: string): number | null {
  if (!/^[€$£]?\s?[\d.,-]+$/.test(s.trim())) return null;
  const n = parseFloat(s.trim().replace(/[^\d.,-]/g, '').replace(',', '.'));
  return isNaN(n) ? null : n;
}

function chartWidths(items: DashboardChartItem[]): number[] | null {
  const pcts = items.map((i) => (i.pct ? parseFloat(i.pct) : NaN));
  if (pcts.every((n) => !isNaN(n))) return pcts;
  const nums = items.map((i) => numericValue(i.value) ?? NaN);
  if (nums.every((n) => !isNaN(n))) {
    const max = Math.max(...nums);
    if (max > 0) return nums.map((n) => (n / max) * 100);
  }
  return null;
}

function chartSummary(chart: DashboardChart): string {
  return (
    chart.items
      .map((i) => {
        const parts = [i.label, i.value];
        if (i.pct) parts.push(`${i.pct} of total`);
        if (i.delta) parts.push(`change ${i.delta}`);
        return parts.join(' ');
      })
      .join('. ') + '.'
  );
}

function ChartCard({ chart }: { chart: DashboardChart }) {
  const widths = chartWidths(chart.items);
  return (
    <section className="dashboard-chart">
      <h2 className="dashboard-chart-title">{chart.title}</h2>
      <div className="dashboard-chart-body">
        {chart.items.map((item, i) => (
          <div className="dashboard-chart-row" key={item.label}>
            <span
              className="dashboard-chart-swatch"
              style={{ background: rampColor(i) }}
              aria-hidden="true"
            />
            <span className="dashboard-chart-label">{item.label}</span>
            {widths && (
              <span className="dashboard-chart-track" aria-hidden="true">
                <span
                  className="dashboard-chart-fill"
                  style={{ width: `${widths[i]}%`, background: rampColor(i) }}
                />
              </span>
            )}
            <span className="dashboard-chart-value tabular">{item.value}</span>
            {(item.pct || item.delta) && (
              <span className="dashboard-chart-meta tabular">
                {item.pct ?? item.delta}
              </span>
            )}
          </div>
        ))}
      </div>
      <p className="sr-only">{chartSummary(chart)}</p>
    </section>
  );
}

export function DashboardView() {
  const dashboardId = useStore((s) => s.dashboardId);
  const dashboards = useStore((s) => s.dashboards);
  const setView = useStore((s) => s.setView);
  const patchDashboard = useStore((s) => s.patchDashboard);

  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const dashboard = dashboardId ? dashboards[dashboardId] : undefined;

  if (!dashboard) {
    return (
      <div className="dashboard">
        <header className="dashboard-nav">
          <button
            type="button"
            className="dashboard-nav-btn"
            aria-label="Close dashboard"
            onClick={() => setView('chat')}
          >
            <Icon name="close" size={18} />
          </button>
        </header>
        <div className="dashboard-fallback">
          <p className="dashboard-fallback-text">This dashboard didn't load.</p>
          <Button variant="secondary" onClick={() => setView('chat')}>
            Back to chat
          </Button>
        </div>
      </div>
    );
  }

  const id = dashboard.id;
  const isRefreshing = dashboard.state === 'refreshing';

  const share = () =>
    useStore.getState().pushToast({
      id: uid('toast'),
      text: 'Share snapshot',
      undo: false,
    });

  const startRename = () => {
    setNameDraft(dashboard.name);
    setRenaming(true);
    setMenuOpen(false);
  };

  const commitRename = () => {
    const n = nameDraft.trim();
    if (n) patchDashboard(id, { name: n });
    setRenaming(false);
  };

  const duplicate = () => {
    const copy: Dashboard = {
      ...dashboard,
      id: uid('dash'),
      name: `${dashboard.name} copy`,
    };
    useStore.getState().upsertDashboard(copy);
    setMenuOpen(false);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-nav">
        <button
          type="button"
          className="dashboard-nav-btn"
          aria-label="Close dashboard"
          onClick={() => setView('chat')}
        >
          <Icon name="close" size={18} />
        </button>

        {renaming ? (
          <input
            className="dashboard-name-input"
            value={nameDraft}
            autoFocus
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') setRenaming(false);
            }}
            aria-label="Dashboard name"
          />
        ) : (
          <h1 className="dashboard-name">{dashboard.name}</h1>
        )}

        <div className="dashboard-nav-actions">
          <button
            type="button"
            className="dashboard-nav-btn"
            aria-label="Share"
            onClick={share}
          >
            <Icon name="share" size={18} />
          </button>
          <button
            type="button"
            className="dashboard-nav-btn"
            aria-label={isRefreshing ? 'Refreshing' : 'Refresh'}
            disabled={isRefreshing}
            onClick={() => refreshDashboard(id)}
          >
            <span
              className={isRefreshing ? 'dashboard-spin' : undefined}
              aria-hidden="true"
            >
              <Icon name="refresh" size={18} />
            </span>
          </button>
          <div className="dashboard-menu-wrap" ref={menuRef}>
            <button
              type="button"
              className="dashboard-nav-btn"
              aria-label="More options"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <Icon name="more" size={18} />
            </button>
            {menuOpen && (
              <div className="dashboard-menu" role="menu">
                <button type="button" role="menuitem" onClick={startRename}>
                  Rename
                </button>
                <button type="button" role="menuitem" onClick={duplicate}>
                  Duplicate
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="dashboard-menu-delete"
                  onClick={() => deleteDashboard(id)}
                >
                  Delete dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="dashboard-scroll">
        <div className="dashboard-inner">
          <div className="dashboard-meta">
            <span>{dashboard.period}</span>
            <span className="dashboard-meta-sep" aria-hidden="true">
              ·
            </span>
            <span>{dashboard.source}</span>
            <span className="dashboard-meta-sep" aria-hidden="true">
              ·
            </span>
            {dashboard.stale ? (
              <span className="dashboard-stale">
                <Icon name="warning-triangle" size={12} />
                {dashboard.updatedLabel}
              </span>
            ) : (
              <span>{dashboard.updatedLabel}</span>
            )}
          </div>

          <div className="dashboard-kpis">
            {dashboard.kpis.map((k) => (
              <div className="dashboard-kpi" key={k.label}>
                <span className="dashboard-kpi-label">{k.label}</span>
                <span className="dashboard-kpi-value tabular">{k.value}</span>
                <span
                  className={
                    'dashboard-kpi-delta ' +
                    (k.direction === 'up'
                      ? 'up'
                      : k.direction === 'down'
                        ? 'down'
                        : 'flat')
                  }
                >
                  {k.delta}
                </span>
              </div>
            ))}
          </div>

          <div className="dashboard-charts">
            {dashboard.charts.map((chart, i) => (
              <ChartCard key={`${chart.title}-${i}`} chart={chart} />
            ))}
          </div>
        </div>
      </div>

      <footer className="dashboard-footer">
        <Button variant="ghost" leadingIcon="pencil" onClick={() => setView('chat')}>
          Ask the agent to change this
        </Button>
      </footer>
    </div>
  );
}
