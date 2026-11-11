import Foundation

struct Agent: Identifiable {
    let id: String
    let name: String
    let desc: String
    let caps: [String]
}

struct Session: Identifiable {
    let id: String
    let title: String
    let lead: String
    let meta: String
    let time: String
    let group: String
}

enum JobStatus: String {
    case running, done, failed, scheduled
}

struct Job: Identifiable {
    let id: String
    let title: String
    let agent: String
    let meta: String
    let status: JobStatus
    let progress: Double
    let group: String
}

struct Artifact: Identifiable {
    let id: String
    let kind: String
    let name: String
    let by: String
    let time: String
}

enum Seed {
    static let agents: [Agent] = [
        Agent(id: "researcher", name: "Researcher", desc: "Researches and compares options", caps: ["Web", "Summarise"]),
        Agent(id: "builder", name: "Builder", desc: "Builds and deploys dashboards", caps: ["Code", "Deploy"]),
        Agent(id: "planner", name: "Planner", desc: "Manages your calendar and tasks", caps: ["Calendar", "Reminders"]),
        Agent(id: "reviewer", name: "Reviewer", desc: "Reads and summarizes documents", caps: ["Docs", "Contracts"]),
    ]

    static let sessions: [Session] = [
        Session(id: "vacuum", title: "Vacuum research", lead: "Researcher", meta: "4 artifacts", time: "2m", group: "Today"),
        Session(id: "project", title: "Project design", lead: "Researcher", meta: "Shared · 3 people", time: "1h", group: "Today"),
        Session(id: "weekend", title: "Weekend plan", lead: "Planner", meta: "2 artifacts", time: "1d", group: "Yesterday"),
        Session(id: "contract", title: "Read the contract", lead: "Reviewer", meta: "1 artifact", time: "1d", group: "Yesterday"),
        Session(id: "kitchen", title: "Kitchen reno budget", lead: "Planner", meta: "5 artifacts", time: "3d", group: "This week"),
    ]

    static let jobs: [Job] = [
        Job(id: "build-dash", title: "Build dashboard", agent: "Builder", meta: "step 2 of 3", status: .running, progress: 0.66, group: "running"),
        Job(id: "scrape", title: "Scrape reviews", agent: "Researcher", meta: "step 1 of 2", status: .running, progress: 0.3, group: "running"),
        Job(id: "weekly", title: "Weekly summary", agent: "Researcher", meta: "Every Monday · 9:00", status: .scheduled, progress: 0, group: "scheduled"),
        Job(id: "weekly-done", title: "Weekly summary", agent: "Researcher", meta: "email drafted", status: .done, progress: 1, group: "recent"),
        Job(id: "invoices", title: "Import invoices", agent: "Builder", meta: "2 errors", status: .failed, progress: 0, group: "recent"),
    ]

    static let artifacts: [Artifact] = [
        Artifact(id: "shortlist", kind: "Table", name: "Shortlist", by: "Builder", time: "2m"),
        Artifact(id: "scratch", kind: "Canvas", name: "Scratch design", by: "You + 3", time: "5m"),
        Artifact(id: "notes", kind: "Doc", name: "Notes", by: "Researcher", time: "1h"),
    ]
}
