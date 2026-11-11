import { agents } from "../data";
import { StatusBar } from "../components";
import { Chevron } from "../icons";

export default function Agents({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <>
      <StatusBar />
      <div className="listhead">
        <div className="listtitle">Agents</div>
        <button className="linkbtn">Add</button>
      </div>
      <div className="body">
        <div className="section-label">Your team</div>
        {agents.map((a) => (
          <button
            className="row"
            key={a.id}
            style={{ width: "100%", textAlign: "left" }}
            onClick={() => onOpen(a.id)}
          >
            <span className="grow">
              <span className="row-title">{a.name}</span>
              <span className="row-meta">{a.desc}</span>
              <span style={{ display: "flex", gap: 6, marginTop: 9 }}>
                {a.caps.map((c) => (
                  <span key={c} className="pill pill-sched">
                    {c}
                  </span>
                ))}
              </span>
            </span>
            <Chevron width={15} height={15} />
          </button>
        ))}
      </div>
    </>
  );
}
