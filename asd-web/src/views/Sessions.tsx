import { sessions } from "../data";
import { StatusBar } from "../components";
import { Chevron, Search } from "../icons";

export default function Sessions({ onOpen }: { onOpen: (id: string) => void }) {
  const groups = ["Today", "Yesterday", "This week"];
  return (
    <>
      <StatusBar />
      <div className="listhead">
        <div className="listtitle">Sessions</div>
        <button className="linkbtn">New</button>
      </div>
      <div className="search">
        <Search />
        <span>Search</span>
      </div>
      <div className="body">
        {groups.map((g) => (
          <div key={g}>
            <div className="section-label">{g}</div>
            {sessions
              .filter((s) => s.group === g)
              .map((s) => (
                <button
                  className="row"
                  key={s.id}
                  style={{ width: "100%", textAlign: "left" }}
                  onClick={() => onOpen(s.id)}
                >
                  <span className="grow">
                    <span className="row-title">{s.title}</span>
                    <span className="row-meta">
                      {s.lead} · {s.meta}
                    </span>
                  </span>
                  <span className="meta">{s.time}</span>
                  <Chevron width={15} height={15} />
                </button>
              ))}
          </div>
        ))}
      </div>
    </>
  );
}
