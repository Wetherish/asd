import { useEffect, useState } from "react";
import { TabBar } from "./components";
import { useApp } from "./store";
import Home from "./views/Home";
import Sessions from "./views/Sessions";
import Agents from "./views/Agents";
import AgentDetail from "./views/AgentDetail";
import Jobs from "./views/Jobs";
import JobDetail from "./views/JobDetail";
import SessionDetail from "./views/SessionDetail";
import Settings from "./views/Settings";
import Auth from "./views/Auth";

type Tab = "home" | "sessions" | "agents" | "jobs";

export default function App() {
  const { ready, needsAuth, sessions, agents, jobs } = useApp();
  const [tab, setTab] = useState<Tab>("home");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [openSession, setOpenSession] = useState<string | null>(null);
  const [openAgent, setOpenAgent] = useState<string | null>(null);
  const [openJob, setOpenJob] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  if (needsAuth) {
    return (
      <div className="app">
        <Auth />
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="app">
        <div
          className="body"
          style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
        >
          <div className="meta">Connecting…</div>
        </div>
      </div>
    );
  }

  const session = sessions.find((s) => s.id === openSession);
  const agent = agents.find((a) => a.id === openAgent);
  const job = jobs.find((j) => j.id === openJob);

  let content;
  if (showSettings) {
    content = <Settings theme={theme} onToggleTheme={toggleTheme} onBack={() => setShowSettings(false)} />;
  } else if (session) {
    content = <SessionDetail session={session} onBack={() => setOpenSession(null)} />;
  } else if (agent) {
    content = <AgentDetail id={agent.id} onBack={() => setOpenAgent(null)} onStart={() => setOpenAgent(null)} />;
  } else if (job) {
    content = <JobDetail id={job.id} onBack={() => setOpenJob(null)} />;
  } else if (tab === "sessions") {
    content = <Sessions onOpen={(id) => setOpenSession(id)} />;
  } else if (tab === "agents") {
    content = <Agents onOpen={(id) => setOpenAgent(id)} />;
  } else if (tab === "jobs") {
    content = <Jobs onOpen={(id) => setOpenJob(id)} />;
  } else {
    content = (
      <Home
        onOpenSession={(id) => setOpenSession(id)}
        onSettings={() => setShowSettings(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  const showTabs = !showSettings && !session && !agent && !job;

  return (
    <div className="app">
      {content}
      {showTabs ? <TabBar active={tab} onChange={(t) => setTab(t as Tab)} /> : null}
    </div>
  );
}
