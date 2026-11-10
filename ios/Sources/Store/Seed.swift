import Foundation

enum Seed {
    static func make() -> (
        connections: [Connection],
        sessions: [Session],
        messages: [String: [Message]],
        logs: [LogEntry],
        dashboards: [String: Dashboard],
        settings: AppSettings,
        activeSessionId: String
    ) {
        let now = Date()
        let weeklyId = "sess-weekly"
        let lunchId = "sess-lunch"
        let standupId = "sess-standup"

        let connections: [Connection] = [
            Connection(
                id: "calendar", name: "Calendar", glyph: "calendar",
                scopes: ["Read your events", "Create and edit events", "See attendees"],
                state: .connected, cause: nil
            ),
            Connection(
                id: "email", name: "Email", glyph: "envelope",
                scopes: ["Read your inbox", "Send email as you"],
                state: .connected, cause: nil
            ),
            Connection(
                id: "slack", name: "Slack", glyph: "number",
                scopes: ["Read channels", "Post as you"],
                state: .expired, cause: "Access expired"
            ),
            Connection(
                id: "sms", name: "SMS", glyph: "message",
                scopes: ["Send messages"],
                state: .disconnected, cause: nil
            ),
        ]

        let sessions: [Session] = [
            Session(
                id: weeklyId, title: "Weekly spending",
                snippet: "Your week is up 12% on dining.",
                ts: now.addingTimeInterval(-2 * 60), hasPending: false, lastFailed: false
            ),
            Session(
                id: lunchId, title: "Lunch with Anna",
                snippet: "Schedule lunch Friday at 1pm",
                ts: now.addingTimeInterval(-8 * 3600), hasPending: false, lastFailed: false
            ),
            Session(
                id: standupId, title: "Standup notes",
                snippet: "Summarise the standup thread",
                ts: now.addingTimeInterval(-26 * 3600), hasPending: false, lastFailed: true
            ),
        ]

        let messages: [String: [Message]] = [
            weeklyId: [
                Message(
                    id: "msg-w1", sessionId: weeklyId, role: .user, kind: .text,
                    text: "Create a dashboard of my weekly spending", status: .sent,
                    dashboardId: nil, dashboardName: nil, dashboardMeta: nil,
                    retry: false, seq: Seq.next(), createdAt: now.addingTimeInterval(-3 * 60)
                ),
                Message(
                    id: "msg-w2", sessionId: weeklyId, role: .agent, kind: .text,
                    text: "Your week is up 12% on dining. Groceries are steady and transport is down 4%.",
                    status: .sent, dashboardId: nil, dashboardName: nil, dashboardMeta: nil,
                    retry: false, seq: Seq.next(), createdAt: now.addingTimeInterval(-2.5 * 60)
                ),
                Message(
                    id: "msg-w3", sessionId: weeklyId, role: .agent, kind: .dashboardCard,
                    text: nil, status: .sent, dashboardId: "dash-weekly",
                    dashboardName: "Spending", dashboardMeta: "7 days · 12 items",
                    retry: false, seq: Seq.next(), createdAt: now.addingTimeInterval(-2 * 60)
                ),
            ],
            lunchId: [
                Message(
                    id: "msg-l1", sessionId: lunchId, role: .user, kind: .text,
                    text: "Schedule lunch Friday at 1pm", status: .sent,
                    dashboardId: nil, dashboardName: nil, dashboardMeta: nil,
                    retry: false, seq: Seq.next(), createdAt: now.addingTimeInterval(-8 * 3600)
                ),
            ],
            standupId: [
                Message(
                    id: "msg-s1", sessionId: standupId, role: .user, kind: .text,
                    text: "Summarise the standup thread", status: .sent,
                    dashboardId: nil, dashboardName: nil, dashboardMeta: nil,
                    retry: false, seq: Seq.next(), createdAt: now.addingTimeInterval(-26 * 3600)
                ),
            ],
        ]

        let logs: [LogEntry] = [
            LogEntry(id: "log-1", sessionId: weeklyId, ts: now.addingTimeInterval(-2 * 60),
                     title: "Created dashboard", tool: "dashboard", result: "Spending · 12 items",
                     state: .done, actionId: nil),
            LogEntry(id: "log-2", sessionId: weeklyId, ts: now.addingTimeInterval(-2.2 * 60),
                     title: "Read email", tool: "email", result: "38 receipts",
                     state: .done, actionId: nil),
            LogEntry(id: "log-3", sessionId: lunchId, ts: now.addingTimeInterval(-8 * 3600),
                     title: "Read calendar", tool: "calendar", result: "14 events",
                     state: .done, actionId: nil),
            LogEntry(id: "log-4", sessionId: standupId, ts: now.addingTimeInterval(-26 * 3600),
                     title: "Posted to #general", tool: "slack", result: "Slack rejected the message",
                     state: .failed, actionId: nil),
        ]

        let dashboards: [String: Dashboard] = [
            "dash-weekly": Dashboard(
                id: "dash-weekly", name: "Weekly spending", period: "1–7 Nov",
                source: "38 receipts", itemCount: 12, updatedLabel: "Updated 2m ago",
                updatedTs: now.addingTimeInterval(-2 * 60), stale: false, state: .ready,
                kpis: [
                    DashboardKPI(label: "Total spend", value: "€412", delta: "+12%", trend: .up),
                    DashboardKPI(label: "Per day", value: "€58", delta: "—", trend: .flat),
                    DashboardKPI(label: "Receipts", value: "38", delta: "+4", trend: .up),
                ],
                charts: [
                    DashboardChart(title: "By category", items: [
                        DashboardChartItem(label: "Dining", value: "€128", pct: "31%", delta: "+12%"),
                        DashboardChartItem(label: "Groceries", value: "€96", pct: "23%", delta: "flat"),
                        DashboardChartItem(label: "Transport", value: "€64", pct: "16%", delta: "−4%"),
                        DashboardChartItem(label: "Other", value: "€124", pct: "30%", delta: "+2%"),
                    ]),
                    DashboardChart(title: "Daily spend", items: [
                        DashboardChartItem(label: "Mon", value: "€52"),
                        DashboardChartItem(label: "Tue", value: "€38"),
                        DashboardChartItem(label: "Wed", value: "€71"),
                        DashboardChartItem(label: "Thu", value: "€44"),
                        DashboardChartItem(label: "Fri", value: "€89"),
                        DashboardChartItem(label: "Sat", value: "€118"),
                    ]),
                ]
            ),
            "dash-week": Dashboard(
                id: "dash-week", name: "Week ahead", period: "8–14 Nov",
                source: "Calendar", itemCount: 14, updatedLabel: "Updated just now",
                updatedTs: now, stale: false, state: .ready,
                kpis: [
                    DashboardKPI(label: "Events", value: "14", delta: "+2", trend: .up),
                    DashboardKPI(label: "Free slots", value: "6", delta: "—", trend: .flat),
                    DashboardKPI(label: "Busiest day", value: "Thu", delta: "—", trend: .flat),
                ],
                charts: [
                    DashboardChart(title: "Upcoming", items: [
                        DashboardChartItem(label: "Standup", value: "Mon–Fri · 10:00"),
                        DashboardChartItem(label: "1:1 with Maya", value: "Wed · 14:00"),
                        DashboardChartItem(label: "Lunch with Anna", value: "Fri · 13:30"),
                    ]),
                ]
            ),
        ]

        let settings = AppSettings()

        return (connections, sessions, messages, logs, dashboards, settings, weeklyId)
    }
}
