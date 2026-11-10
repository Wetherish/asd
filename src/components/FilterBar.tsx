import './FilterBar.css';

export function FilterBar({
  filters,
  active,
  onSelect,
  counts,
}: {
  filters: string[];
  active: string;
  onSelect: (f: string) => void;
  counts?: Record<string, number>;
}) {
  return (
    <div className="filterbar" role="group" aria-label="Filter activity">
      {filters.map((f) => {
        const isActive = f === active;
        const count = counts?.[f];
        return (
          <button
            key={f}
            type="button"
            aria-pressed={isActive}
            className={`filterbar__chip${isActive ? ' filterbar__chip--active' : ''}`}
            onClick={() => onSelect(f)}
          >
            <span>{f}</span>
            {typeof count === 'number' ? <span className="filterbar__count">{count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
