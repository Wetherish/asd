import { useStore } from '../lib/store';
import { Icon } from '../lib/icons';
import './TabBar.css';

function TabItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`tabbar-item ${active ? 'active' : ''}`}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
    >
      <Icon name={icon} size={22} filled={active} />
      <span className="tabbar-label">{label}</span>
    </button>
  );
}

export function TabBar() {
  const phoneTab = useStore((s) => s.phoneTab);
  const setPhoneTab = useStore((s) => s.setPhoneTab);

  return (
    <nav className="tabbar" aria-label="Tabs">
      <TabItem
        icon="bubble"
        label="Chat"
        active={phoneTab === 'chat'}
        onClick={() => setPhoneTab('chat')}
      />
      <TabItem
        icon="list"
        label="Activity"
        active={phoneTab === 'activity'}
        onClick={() => setPhoneTab('activity')}
      />
      <TabItem
        icon="gear"
        label="Settings"
        active={phoneTab === 'settings'}
        onClick={() => setPhoneTab('settings')}
      />
    </nav>
  );
}
