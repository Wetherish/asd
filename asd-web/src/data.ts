export type Agent = {
  id: string;
  name: string;
  desc: string;
  caps: string[];
};

export type Session = {
  id: string;
  title: string;
  lead: string;
  meta: string;
  time: string;
  group: string;
};

export type Job = {
  id: string;
  title: string;
  agent: string;
  meta: string;
  status: "running" | "done" | "failed" | "scheduled";
  progress: number;
  group: "running" | "scheduled" | "recent";
};

export type Artifact = {
  id: string;
  kind: string;
  name: string;
  by: string;
  time: string;
};

export const agents: Agent[] = [
  { id: "researcher", name: "Researcher", desc: "Researches and compares options", caps: ["Web", "Summarise"] },
  { id: "builder", name: "Builder", desc: "Builds and deploys dashboards", caps: ["Code", "Deploy"] },
  { id: "planner", name: "Planner", desc: "Manages your calendar and tasks", caps: ["Calendar", "Reminders"] },
  { id: "reviewer", name: "Reviewer", desc: "Reads and summarizes documents", caps: ["Docs", "Contracts"] },
];

export const sessions: Session[] = [
  { id: "vacuum", title: "Vacuum research", lead: "Researcher", meta: "4 artifacts", time: "2m", group: "Today" },
  { id: "project", title: "Project design", lead: "Researcher", meta: "Shared · 3 people", time: "1h", group: "Today" },
  { id: "weekend", title: "Weekend plan", lead: "Planner", meta: "2 artifacts", time: "1d", group: "Yesterday" },
  { id: "contract", title: "Read the contract", lead: "Reviewer", meta: "1 artifact", time: "1d", group: "Yesterday" },
  { id: "kitchen", title: "Kitchen reno budget", lead: "Planner", meta: "5 artifacts", time: "3d", group: "This week" },
];

export const jobs: Job[] = [
  { id: "build-dash", title: "Build dashboard", agent: "Builder", meta: "step 2 of 3", status: "running", progress: 66, group: "running" },
  { id: "scrape", title: "Scrape reviews", agent: "Researcher", meta: "step 1 of 2", status: "running", progress: 30, group: "running" },
  { id: "weekly", title: "Weekly summary", agent: "Researcher", meta: "Every Monday · 9:00", status: "scheduled", progress: 0, group: "scheduled" },
  { id: "weekly-done", title: "Weekly summary", agent: "Researcher", meta: "email drafted", status: "done", progress: 100, group: "recent" },
  { id: "invoices", title: "Import invoices", agent: "Builder", meta: "2 errors", status: "failed", progress: 0, group: "recent" },
];

export const artifacts: Artifact[] = [
  { id: "shortlist", kind: "Table", name: "Shortlist", by: "Builder", time: "2m" },
  { id: "scratch", kind: "Canvas", name: "Scratch design", by: "You + 3", time: "5m" },
  { id: "notes", kind: "Doc", name: "Notes", by: "Researcher", time: "1h" },
];

export const approval = {
  id: "send-priya",
  title: "Send message to Priya",
  meta: "Email · ready to send",
};
