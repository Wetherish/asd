import Foundation

@MainActor
enum AgentState {
    static var pendingRetry: Set<String> = []
    static var deletedDashboards: [String: (Dashboard, Date)] = [:]
}

/// Simulated agent engine. Drives tool steps, streaming replies, approval
/// lifecycles, undo, retry, and destructive confirms with real timers.
extension AppStore {
    private func sleep(_ ms: Int) async {
        try? await Task.sleep(nanoseconds: UInt64(ms) * 1_000_000)
    }

    // MARK: - Tool chip

    private func step(_ sessionId: String, _ label: String, _ stepNo: Int, _ total: Int, _ durationMs: Int = 1100) async {
        toolStatus = ToolStatus(id: uid("t"), sessionId: sessionId, label: label, step: stepNo, total: total, state: .running, cause: nil, startedAt: Date(), seq: Seq.next())
        await sleep(durationMs)
    }

    private func doneChip(_ sessionId: String, _ stepNo: Int, _ total: Int) async {
        toolStatus = ToolStatus(id: uid("t"), sessionId: sessionId, label: "Done", step: stepNo, total: total, state: .done, cause: nil, startedAt: Date(), seq: Seq.next())
        await sleep(1200)
    }

    // MARK: - Message helpers

    private func streamText(_ sessionId: String, _ text: String) async {
        let id = uid("m")
        addMessage(Message(id: id, sessionId: sessionId, role: .agent, kind: .text, text: "", status: .streaming, dashboardId: nil, dashboardName: nil, dashboardMeta: nil, retry: false, seq: Seq.next(), createdAt: Date()))
        let words = text.split(separator: " ").map(String.init)
        var acc = ""
        for (i, w) in words.enumerated() {
            acc += (i == 0 ? "" : " ") + w
            if (i + 1) % 3 == 0 || i == words.count - 1 {
                let current = acc
                updateMessage(id) { $0.text = current }
                await sleep(70)
            }
        }
        updateMessage(id) { $0.text = text; $0.status = .sent }
    }

    private func addError(_ sessionId: String, _ text: String) {
        addMessage(Message(id: uid("m"), sessionId: sessionId, role: .agent, kind: .error, text: text, status: .sent, dashboardId: nil, dashboardName: nil, dashboardMeta: nil, retry: true, seq: Seq.next(), createdAt: Date()))
    }

    private func addDashboardCard(_ sessionId: String, _ dashboardId: String, _ name: String, _ meta: String) {
        addMessage(Message(id: uid("m"), sessionId: sessionId, role: .agent, kind: .dashboardCard, text: nil, status: .sent, dashboardId: dashboardId, dashboardName: name, dashboardMeta: meta, retry: false, seq: Seq.next(), createdAt: Date()))
    }

    private func stillHasPending(_ sessionId: String, excluding id: String) -> Bool {
        actions.contains { $0.sessionId == sessionId && $0.id != id && ($0.state == .pending || $0.state == .editing) }
    }

    // MARK: - Result mapping

    private func resultFor(_ a: Action) -> (resultLine: String, logTitle: String, logResult: String, tool: String) {
        switch a.type {
        case "email": return ("Sent to Anna", "Sent email to Anna", "Delivered to anna@example.com", "email")
        case "sms": return ("Message sent", "Sent message", "To +48 601 234 567", "sms")
        case "slack": return ("Posted to #general", "Posted to #general", "Posted", "slack")
        case "calendar":
            if a.destructive { return ("Deleted Standup", "Deleted event", "Standup · 5 people notified", "calendar") }
            return ("Invites sent to Anna", "Created event", "Lunch with Anna · 2 guests", "calendar")
        default:
            return ("Done", a.title, "Done", "dashboard")
        }
    }

    private func updateLogForApprove(_ a: Action, _ info: (resultLine: String, logTitle: String, logResult: String, tool: String)) {
        guard let log = logs.first(where: { $0.actionId == a.id }) else { return }
        updateLog(log.id) { $0.state = .done; $0.title = info.logTitle; $0.result = info.logResult; $0.tool = info.tool }
    }

    private func updateLogForReject(_ a: Action) {
        guard let log = logs.first(where: { $0.actionId == a.id }) else { return }
        updateLog(log.id) { $0.state = .rejected; $0.title = a.type == "email" ? "Rejected email to Anna" : "Rejected \(a.title.lowercased())"; $0.result = "You rejected this" }
    }

    // MARK: - Entry point

    func sendMessage(_ text: String) {
        var sessionId = activeSessionId
        if sessionId == nil { sessionId = createSession() }
        guard let sid = sessionId else { return }

        if let s = sessions.first(where: { $0.id == sid }), s.title == "New session" {
            updateSession(sid) { $0.title = String(text.prefix(40)); $0.snippet = text }
        }

        addMessage(Message(id: uid("m"), sessionId: sid, role: .user, kind: .text, text: text, status: .sent, dashboardId: nil, dashboardName: nil, dashboardMeta: nil, retry: false, seq: Seq.next(), createdAt: Date()))
        updateSession(sid) { $0.ts = Date() }

        let t = text.lowercased()
        if t.contains("delete") && (t.contains("standup") || t.contains("event") || t.contains("meeting") || t.contains("invite")) {
            Task { await self.destructiveFlow(sid) }
        } else if t.contains("schedule") || t.contains("lunch") || t.contains("event") || t.contains("meeting") {
            Task { await self.scheduleFlow(sid) }
        } else if t.contains("message") || t.contains("email") || t.contains("anna") || t.contains("send") {
            Task { await self.sendEmailFlow(sid) }
        } else if t.contains("dashboard") || t.contains("spending") || t.contains("report") || t.contains("chart") || t.contains("receipts") {
            Task { await self.dashboardFlow(sid) }
        } else if t.contains("summar") || t.contains("calendar") || t.contains("check") || t.contains("week") || t.contains("standup") {
            Task { await self.readCalendarFlow(sid) }
        } else {
            Task { await self.genericFlow(sid) }
        }
    }

    func retryLastFailed(_ sessionId: String) {
        guard AgentState.pendingRetry.remove(sessionId) != nil else { return }
        if let msgs = messages[sessionId], let err = msgs.reversed().first(where: { $0.retry }) {
            updateMessage(err.id) { $0.retry = false; $0.text = "Retrying…" }
        }
        Task { await dashboardSuccess(sessionId) }
    }

    // MARK: - Flows

    private func readCalendarFlow(_ sessionId: String) async {
        let logId = uid("l")
        addLog(LogEntry(id: logId, sessionId: sessionId, ts: Date(), title: "Read calendar", tool: "calendar", result: "", state: .running, actionId: nil))
        await step(sessionId, "Reading calendar…", 1, 2)
        await step(sessionId, "Counting events…", 2, 2)
        await doneChip(sessionId, 2, 2)
        updateLog(logId) { $0.state = .done; $0.result = "14 events" }
        toolStatus = nil
        await streamText(sessionId, "You have 14 events this week. Friday 1pm is taken, but Thursday afternoon is open.")
        if var d = dashboards["dash-week"] {
            d.state = .ready
            d.updatedTs = Date()
            d.updatedLabel = "Updated just now"
            d.stale = false
            dashboards[d.id] = d
        }
        addDashboardCard(sessionId, "dash-week", "Week ahead", "7 days · 14 items")
        addLog(LogEntry(id: uid("l"), sessionId: sessionId, ts: Date(), title: "Created dashboard", tool: "dashboard", result: "Week ahead · 14 items", state: .done, actionId: nil))
        updateSession(sessionId) { $0.snippet = "You have 14 events this week."; $0.ts = Date() }
    }

    private func dashboardFlow(_ sessionId: String) async {
        let logId = uid("l")
        addLog(LogEntry(id: logId, sessionId: sessionId, ts: Date(), title: "Read email", tool: "email", result: "", state: .running, actionId: nil))
        await step(sessionId, "Reading receipts…", 1, 4, 900)
        toolStatus = ToolStatus(id: uid("t"), sessionId: sessionId, label: "Couldn't read your inbox.", step: 1, total: 4, state: .failed, cause: "Access expired", startedAt: Date(), seq: Seq.next())
        updateLog(logId) { $0.state = .failed; $0.result = "Couldn't read your inbox" }
        addError(sessionId, "Nothing was changed. Retry to continue.")
        AgentState.pendingRetry.insert(sessionId)
    }

    private func dashboardSuccess(_ sessionId: String) async {
        let logId = uid("l")
        addLog(LogEntry(id: logId, sessionId: sessionId, ts: Date(), title: "Read email", tool: "email", result: "", state: .running, actionId: nil))
        await step(sessionId, "Reading messages…", 1, 4)
        await step(sessionId, "Grouping spend…", 2, 4)
        await step(sessionId, "Building dashboard…", 3, 4)
        await doneChip(sessionId, 4, 4)
        updateLog(logId) { $0.state = .done; $0.result = "38 receipts" }
        toolStatus = nil
        await streamText(sessionId, "Your week is up 12% on dining. Groceries are steady and transport is down 4%.")
        if var d = dashboards["dash-weekly"] {
            d.state = .ready
            d.updatedTs = Date()
            d.updatedLabel = "Updated now"
            d.stale = false
            dashboards[d.id] = d
        }
        addDashboardCard(sessionId, "dash-weekly", "Spending", "7 days · 12 items")
        addLog(LogEntry(id: uid("l"), sessionId: sessionId, ts: Date(), title: "Created dashboard", tool: "dashboard", result: "Spending · 12 items", state: .done, actionId: nil))
        updateSession(sessionId) { $0.snippet = "Your week is up 12% on dining."; $0.ts = Date() }
    }

    private func sendEmailFlow(_ sessionId: String) async {
        let actionId = uid("a")
        let logId = uid("l")
        addLog(LogEntry(id: logId, sessionId: sessionId, ts: Date(), title: "Draft email", tool: "email", result: "", state: .running, actionId: actionId))
        await step(sessionId, "Drafting message…", 1, 2, 900)
        upsertAction(Action(id: actionId, sessionId: sessionId, type: "email", glyph: "envelope", title: "Send email",
            preview: [
                PreviewRow(label: "To", value: "anna@example.com"),
                PreviewRow(label: "Subject", value: "Running late"),
                PreviewRow(label: "Body", value: "Hey Anna, running about 15 minutes behind. Start without me."),
            ],
            consequence: "Sends immediately. Can't be recalled.",
            reversible: false, destructive: false, state: .proposed, resultLine: nil, cause: nil,
            seq: Seq.next(), createdAt: Date(), approvedAt: nil, undoUntil: nil, approvingLong: false))
        updateLog(logId) { $0.state = .blocked; $0.result = "Send email to Anna" }
        toolStatus = ToolStatus(id: uid("t"), sessionId: sessionId, label: "Waiting for you", step: 2, total: 2, state: .blocked, cause: nil, startedAt: Date(), seq: Seq.next())
        await sleep(700)
        updateAction(actionId) { $0.state = .pending }
        await sleep(1200)
        toolStatus = nil
        updateSession(sessionId) { $0.hasPending = true; $0.snippet = "Send email to Anna — Running late"; $0.ts = Date() }
    }

    private func scheduleFlow(_ sessionId: String) async {
        let logId = uid("l")
        addLog(LogEntry(id: logId, sessionId: sessionId, ts: Date(), title: "Read calendar", tool: "calendar", result: "", state: .running, actionId: nil))
        await step(sessionId, "Checking calendar…", 1, 3)
        await step(sessionId, "Checking conflicts…", 2, 3, 900)
        updateLog(logId) { $0.state = .done; $0.result = "14 events" }
        await step(sessionId, "Finding a time…", 3, 3, 800)
        toolStatus = nil
        await streamText(sessionId, "Friday 1pm is taken — Standup runs 1:00–1:30 pm. Nothing was booked. I found 1:30–2:30 pm free.")
        let actionId = uid("a")
        upsertAction(Action(id: actionId, sessionId: sessionId, type: "calendar", glyph: "calendar", title: "Create event",
            preview: [
                PreviewRow(label: "Title", value: "Lunch with Anna"),
                PreviewRow(label: "When", value: "Fri 14 Nov, 1:30–2:30 pm"),
                PreviewRow(label: "Where", value: "Café Nero, Kings Cross"),
                PreviewRow(label: "Guests", value: "Anna Nowak, +1"),
            ],
            consequence: "Sends invites to 2 people. Can't be undone.",
            reversible: false, destructive: false, state: .proposed, resultLine: nil, cause: nil,
            seq: Seq.next(), createdAt: Date(), approvedAt: nil, undoUntil: nil, approvingLong: false))
        addLog(LogEntry(id: uid("l"), sessionId: sessionId, ts: Date(), title: "Create event", tool: "calendar", result: "Waiting for approval", state: .blocked, actionId: actionId))
        await sleep(700)
        updateAction(actionId) { $0.state = .pending }
        updateSession(sessionId) { $0.hasPending = true; $0.snippet = "Create event — Lunch with Anna"; $0.ts = Date() }
    }

    private func destructiveFlow(_ sessionId: String) async {
        await step(sessionId, "Finding the event…", 1, 2, 900)
        let actionId = uid("a")
        upsertAction(Action(id: actionId, sessionId: sessionId, type: "calendar", glyph: "xmark.octagon", title: "Delete event",
            preview: [
                PreviewRow(label: "Title", value: "Standup"),
                PreviewRow(label: "When", value: "Fri 14 Nov, 10:00"),
                PreviewRow(label: "Guests", value: "4 others"),
            ],
            consequence: "Sends cancellations to 5 people. Can't be undone.",
            reversible: false, destructive: true, state: .proposed, resultLine: nil, cause: nil,
            seq: Seq.next(), createdAt: Date(), approvedAt: nil, undoUntil: nil, approvingLong: false))
        addLog(LogEntry(id: uid("l"), sessionId: sessionId, ts: Date(), title: "Delete event", tool: "calendar", result: "Waiting for approval", state: .blocked, actionId: actionId))
        await sleep(700)
        updateAction(actionId) { $0.state = .pending }
        toolStatus = nil
        updateSession(sessionId) { $0.hasPending = true; $0.snippet = "Delete event — Standup"; $0.ts = Date() }
    }

    private func genericFlow(_ sessionId: String) async {
        await step(sessionId, "Checking calendar…", 1, 2, 900)
        await step(sessionId, "Reviewing your week…", 2, 2, 900)
        await doneChip(sessionId, 2, 2)
        toolStatus = nil
        await streamText(sessionId, "I can check your calendar, draft messages, or build a dashboard. Try a quick action above.")
        updateSession(sessionId) { $0.snippet = "A new request"; $0.ts = Date() }
    }

    // MARK: - Approval lifecycle

    private func doApprove(_ id: String) async {
        guard let a = actions.first(where: { $0.id == id }) else { return }
        updateAction(id) { $0.state = .approving; $0.approvingLong = false; $0.approvedAt = Date() }
        toolStatus = nil
        await sleep(1600)
        guard let cur = actions.first(where: { $0.id == id }), cur.state == .approving else { return }
        let info = resultFor(a)
        let reversible = a.reversible
        updateAction(id) { $0.state = .approved; $0.resultLine = info.resultLine; $0.undoUntil = reversible ? Date().addingTimeInterval(10) : nil }
        updateLogForApprove(a, info)
        updateSession(a.sessionId) { $0.hasPending = stillHasPending(a.sessionId, excluding: id); $0.ts = Date() }
        showToast(info.resultLine, undoLabel: reversible ? "Undo" : nil, onUndo: reversible ? { self.undoAction(id) } : nil)
        if reversible {
            let actionId = id
            Task {
                try? await Task.sleep(nanoseconds: 10_050_000_000)
                guard let c = self.actions.first(where: { $0.id == actionId }), c.state == .approved, let until = c.undoUntil, until <= Date() else { return }
                self.updateAction(actionId) { $0.state = .done; $0.undoUntil = nil }
            }
        }
    }

    func approveAction(_ id: String) {
        guard let a = actions.first(where: { $0.id == id }) else { return }
        if a.state != .pending && a.state != .editing { return }
        if a.destructive {
            confirmSheet = id
            return
        }
        Task { await doApprove(id) }
    }

    func confirmDestructive() {
        guard let id = confirmSheet else { return }
        confirmSheet = nil
        Task { await doApprove(id) }
    }

    func cancelDestructive() {
        confirmSheet = nil
    }

    func rejectAction(_ id: String) {
        guard let a = actions.first(where: { $0.id == id }) else { return }
        if a.state != .pending && a.state != .editing { return }
        updateAction(id) { $0.state = .rejected; $0.undoUntil = nil }
        toolStatus = nil
        updateLogForReject(a)
        updateSession(a.sessionId) { $0.hasPending = stillHasPending(a.sessionId, excluding: id); $0.ts = Date() }
    }

    func editAction(_ id: String) {
        updateAction(id) { $0.state = .editing }
    }

    func cancelEditAction(_ id: String) {
        updateAction(id) { $0.state = .pending }
    }

    func approveEditedAction(_ id: String, _ preview: [PreviewRow]) {
        updateAction(id) { $0.preview = preview; $0.state = .pending }
        Task { await doApprove(id) }
    }

    func askAgainAction(_ id: String) {
        guard let a = actions.first(where: { $0.id == id }) else { return }
        let newId = uid("a")
        var copy = a
        copy.id = newId
        copy.state = .proposed
        copy.seq = Seq.next()
        copy.createdAt = Date()
        copy.resultLine = nil
        copy.undoUntil = nil
        copy.approvedAt = nil
        upsertAction(copy)
        Task {
            await self.sleep(700)
            guard let cur = self.actions.first(where: { $0.id == newId }), cur.state == .proposed else { return }
            self.updateAction(newId) { $0.state = .pending }
            self.updateSession(a.sessionId) { $0.hasPending = true; $0.ts = Date() }
        }
    }

    func undoAction(_ id: String) {
        guard let a = actions.first(where: { $0.id == id }), a.state == .approved, a.undoUntil != nil else { return }
        updateAction(id) { $0.state = .undone; $0.undoUntil = nil; $0.resultLine = nil }
        if let log = logs.first(where: { $0.actionId == id }) {
            updateLog(log.id) { $0.result = "Undone" }
        }
        dismissToast()
    }

    // MARK: - Connections

    private func defaultScopes(_ id: String) -> [String] {
        switch id {
        case "calendar": return ["Read your events", "Create and edit events", "See attendees"]
        case "email": return ["Read your inbox", "Send email as you"]
        case "slack": return ["Read channels", "Post as you"]
        default: return ["Send messages"]
        }
    }

    func connectService(_ id: String) {
        updateConnection(id) { $0.state = .connecting; $0.cause = nil }
        Task {
            await self.sleep(1200)
            guard let c = self.connections.first(where: { $0.id == id }), c.state == .connecting else { return }
            self.updateConnection(id) { $0.state = .connected; $0.scopes = self.defaultScopes(id); $0.cause = nil }
        }
    }

    func disconnectService(_ id: String) {
        updateConnection(id) { $0.state = .disconnected; $0.scopes = []; $0.cause = nil }
    }

    // MARK: - Dashboards

    func refreshDashboard(_ id: String) {
        updateDashboard(id) { $0.state = .refreshing }
        Task {
            await self.sleep(900)
            guard let d = self.dashboards[id], d.state == .refreshing else { return }
            self.updateDashboard(id) { $0.state = .ready; $0.updatedTs = Date(); $0.updatedLabel = "Updated now"; $0.stale = false }
        }
    }

    func deleteDashboard(_ id: String) {
        guard let d = dashboards[id] else { return }
        removeDashboard(id)
        AgentState.deletedDashboards[id] = (d, Date().addingTimeInterval(10))
        dashboardId = nil
        showToast("Dashboard deleted", undoLabel: "Undo", onUndo: { [weak self] in self?.undoDashboardDelete(id) })
        Task {
            await self.sleep(10_050)
            AgentState.deletedDashboards.removeValue(forKey: id)
        }
    }

    func undoDashboardDelete(_ id: String) {
        guard let (d, _) = AgentState.deletedDashboards.removeValue(forKey: id) else { return }
        upsertDashboard(d)
        dashboardId = id
        dismissToast()
    }
}
