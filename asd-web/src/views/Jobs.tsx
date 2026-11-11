import { jobs } from "../data";
import { StatusBar } from "../components";

const pillFor = (s: string) =>
  s === "running" ? "run" : s === "scheduled" ? "sched" : s === "failed" ? "fail" : "ok";
const labelFor = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function Jobs() {
  const groups = [
    { key: "running", label: "Running" },
    { key: "scheduled", label: "Scheduled" },
    { key: "recent", label: "Recent" },
  ] as const;

  return (
    <>
      <StatusBar />
      <div className="listhead">
        <div className="listtitle">Jobs</div>
      </div>
      <div className="body">
        {groups.map((g) => (
          <div key={g.key}>
            <div className="section-label">{g.label}</div>
            {jobs
              .filter((j) => j.group === g.key)
              .map((j) => (
                <div className="row" key={j.id}>
                  <span className="grow">
                    <span className="row-title">{j.title}</span>
                    <span className="row-meta">
                      {j.agent} · {j.meta}
                    </span>
                    {j.status === "running" ? (
                      <span className="progress">
                        <i style={{ width: `${j.progress}%` }} />
                      </span>
                    ) : null}
                  </span>
                  <span className={`pill pill-${pillFor(j.status)}`}>{labelFor(j.status)}</span>
                </div>
              ))}
          </div>
        ))}
      </div>
    </>
  );
}
