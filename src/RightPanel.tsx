import { useStore } from './lib/store';
import { Icon } from './lib/icons';
import { ApprovalCard } from './components/ApprovalCard';
import { relativeTime } from './lib/util';
import './RightPanel.css';

function Tab({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      className={`panel-tab ${active ? 'active' : ''}`}
      onClick={onClick}
      role="tab"
      aria-selected={active}
    >
      <span>{label}</span>
      {count ? <span className="tab-count">{count}</span> : null}
    </button>
  );
}

export function RightPanel() {
  const panelMode = useStore((s) => s.panelMode);
  const setPanelMode = useStore((s) => s.setPanelMode);
  const actions = useStore((s) => s.actions);
  const expandedActionId = useStore((s) => s.expandedActionId);
  const setExpandedActionId = useStore((s) => s.setExpandedActionId);
  const dashboards = useStore((s) => s.dashboards);
  const openDashboard = useStore((s) => s.openDashboard);

  const pending = actions.filter(
    (a) => a.state === 'pending' || a.state === 'editing',
  );
  const expanded =
    pending.find((a) => a.id === expandedActionId) ?? pending[pending.length - 1] ?? null;
  const dashboardList = Object.values(dashboards);

  return (
    <aside className="right-panel" aria-label="Approvals and dashboards">
      <div className="panel-tabs" role="tablist">
        <Tab
          active={panelMode === 'approvals'}
          label="Approvals"
          count={pending.length}
          onClick={() => setPanelMode('approvals')}
        />
        <Tab
          active={panelMode === 'dashboard'}
          label="Dashboard"
          onClick={() => setPanelMode('dashboard')}
        />
      </div>

      {panelMode === 'approvals' ? (
        pending.length === 0 ? (
          <div className="panel-empty">
            <Icon name="check-circle" size={40} />
            <div className="panel-empty-title">Nothing needs you.</div>
            <button className="panel-empty-action" onClick={() => setPanelMode('dashboard')}>
              Open a dashboard
            </button>
          </div>
        ) : (
          <div className="queue">
            <div className="queue-list">
              {pending.map((a) => (
                <button
                  key={a.id}
                  className={`queue-row ${a.id === expanded?.id ? 'selected' : ''}`}
                  onClick={() => setExpandedActionId(a.id)}
                >
                  <Icon name={a.glyph} size={16} />
                  <span className="queue-title">{a.title}</span>
                  <span className="queue-age tabular">{relativeTime(a.createdAt)}</span>
                </button>
              ))}
            </div>
            {expanded ? (
              <div className="queue-expanded">
                <ApprovalCard action={expanded} />
              </div>
            ) : null}
          </div>
        )
      ) : dashboardList.length === 0 ? (
        <div className="panel-empty">
          <Icon name="bubble" size={40} />
          <div className="panel-empty-title">Nothing here yet.</div>
          <div className="panel-empty-line">Ask the agent to build a dashboard.</div>
        </div>
      ) : (
        <div className="dashboard-list">
          {dashboardList.map((d) => (
            <button
              key={d.id}
              className="dashboard-summary"
              onClick={() => openDashboard(d.id)}
            >
              <span className="dashboard-summary-name">{d.name}</span>
              <span className="dashboard-summary-meta">
                {d.period} · {d.itemCount} items
              </span>
              <Icon name="chevron-right" size={16} />
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
