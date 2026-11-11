import { useEffect, useState } from "react";
import { TabBar } from "./components";
import { agents, sessions } from "./data";
import Home from "./views/Home";
import Sessions from "./views/Sessions";
import Agents from "./views/Agents";
import AgentDetail from "./views/AgentDetail";
import Jobs from "./views/Jobs";
import SessionDetail from "./views/SessionDetail";
import Settings from "./views/Settings";

type Tab = "home" | "sessions" | "agents" | "jobs";

export default function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [openSession, setOpenSession] = useState<string | null>(null);
  const [openAgent, setOpenAgent] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  const session = sessions.find((s) => s.id === openSession);
  const agent = agents.find((a) => a.id === openAgent);

  let content;
  if (showSettings) {
    content = <Settings theme={theme} onToggleTheme={toggleTheme} onBack={() => setShowSettings(false)} />;
  } else if (session) {
    content = <SessionDetail session={session} onBack={() => setOpenSession(null)} />;
  } else if (agent) {
    content = <AgentDetail id={agent.id} onBack={() => setOpenAgent(null)} onStart={() => setOpenAgent(null)} />;
  } else if (tab === "sessions") {
    content = <Sessions onOpen={(id) => setOpenSession(id)} />;
  } else if (tab === "agents") {
    content = <Agents onOpen={(id) => setOpenAgent(id)} />;
  } else if (tab === "jobs") {
    content = <Jobs />;
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

  const showTabs = !showSettings && !session && !agent;

  return (
    <div className="app">
      {content}
      {showTabs ? <TabBar active={tab} onChange={(t) => setTab(t as Tab)} /> : null}
    </div>
  );
}
