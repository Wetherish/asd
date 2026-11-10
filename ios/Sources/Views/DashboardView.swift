import SwiftUI

@MainActor
struct DashboardView: View {
    @EnvironmentObject var store: AppStore
    let dashboardId: String

    private var dashboard: Dashboard? { store.dashboards[dashboardId] }

    var body: some View {
        NavigationStack {
            Group {
                if let d = dashboard {
                    ScrollView {
                        VStack(alignment: .leading, spacing: Space.s6) {
                            metaRow(d)
                            kpiRow(d)
                            ForEach(d.charts) { chart in
                                chartCard(chart)
                            }
                        }
                        .padding(Space.s4)
                    }
                    .safeAreaInset(edge: .bottom) { footer(d) }
                    .toolbar { toolbar(d) }
                } else {
                    EmptyStateView(glyph: "exclamationmark.triangle", title: "Dashboard unavailable.", line: nil)
                }
            }
            .navigationTitle(dashboard?.name ?? "Dashboard")
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    @ToolbarContentBuilder
    private func toolbar(_ d: Dashboard) -> some ToolbarContent {
        ToolbarItem(placement: .navigationBarLeading) {
            Button { store.dashboardId = nil } label: {
                Image(systemName: "xmark")
            }
            .accessibilityLabel("Close dashboard")
        }
        ToolbarItem(placement: .navigationBarTrailing) {
            HStack(spacing: Space.s4) {
                Button { store.refreshDashboard(d.id) } label: {
                    Image(systemName: "arrow.clockwise")
                }
                .accessibilityLabel("Refresh dashboard")
                Menu {
                    Button("Rename") {}
                    Button("Duplicate") {}
                    Button("Delete dashboard", role: .destructive) { store.deleteDashboard(d.id) }
                } label: {
                    Image(systemName: "ellipsis")
                }
            }
        }
    }

    private func metaRow(_ d: Dashboard) -> some View {
        HStack(spacing: Space.s2) {
            if d.stale {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundColor(Tokens.warning)
            }
            Text("\(d.period) · \(d.source) · \(d.updatedLabel)")
                .font(.footnote)
                .foregroundColor(d.stale ? Tokens.warning : Tokens.textTertiary)
        }
    }

    private func kpiRow(_ d: Dashboard) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: Space.s3) {
                ForEach(d.kpis) { kpi in
                    VStack(alignment: .leading, spacing: Space.s1) {
                        Text(kpi.label)
                            .font(.footnote)
                            .foregroundColor(Tokens.textTertiary)
                        Text(kpi.value)
                            .font(.system(size: 28, weight: .semibold))
                            .foregroundColor(Tokens.textPrimary)
                        HStack(spacing: Space.s1) {
                            Image(systemName: trendIcon(kpi.trend))
                                .font(.caption)
                            Text(kpi.delta)
                                .font(.caption)
                        }
                        .foregroundColor(trendColor(kpi.trend))
                    }
                    .padding(Space.s4)
                    .frame(width: 160, alignment: .leading)
                    .background(RoundedRectangle(cornerRadius: Radius.md, style: .continuous).fill(Tokens.surface))
                    .overlay(RoundedRectangle(cornerRadius: Radius.md, style: .continuous).strokeBorder(Tokens.border))
                }
            }
        }
    }

    private func chartCard(_ chart: DashboardChart) -> some View {
        VStack(alignment: .leading, spacing: Space.s3) {
            Text(chart.title)
                .font(.headline)
                .foregroundColor(Tokens.textPrimary)
            ForEach(chart.items) { item in
                HStack(spacing: Space.s3) {
                    Text(item.label)
                        .font(.subheadline)
                        .foregroundColor(Tokens.textPrimary)
                        .frame(width: 96, alignment: .leading)
                    if let pct = item.pct {
                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                Capsule().fill(Tokens.surfaceSunken)
                                Capsule().fill(Tokens.accent)
                                    .frame(width: max(4, geo.size.width * parsedPct(pct)))
                            }
                        }
                        .frame(height: 8)
                    }
                    Spacer()
                    Text(item.value)
                        .font(.subheadline)
                        .foregroundColor(Tokens.textPrimary)
                    if let delta = item.delta {
                        Text(delta)
                            .font(.caption)
                            .foregroundColor(Tokens.textTertiary)
                            .frame(width: 44, alignment: .trailing)
                    }
                }
            }
        }
        .padding(Space.s4)
        .background(RoundedRectangle(cornerRadius: Radius.md, style: .continuous).fill(Tokens.surface))
        .overlay(RoundedRectangle(cornerRadius: Radius.md, style: .continuous).strokeBorder(Tokens.border))
        .accessibilityElement(children: .combine)
        .accessibilityLabel(chart.title + ": " + chart.items.map { "\($0.label) \($0.value)\($0.pct.map { " \($0)" } ?? "")" }.joined(separator: ", "))
    }

    private func footer(_ d: Dashboard) -> some View {
        Button {
            store.dashboardId = nil
        } label: {
            Label("Ask the agent to change this", systemImage: "square.and.pencil")
                .font(.headline)
                .foregroundColor(Tokens.accent)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, Space.s3)
        .background(Tokens.canvas)
        .overlay(Divider(), alignment: .top)
    }

    private func parsedPct(_ s: String) -> CGFloat {
        let digits = s.filter { $0.isNumber || $0 == "." }
        return CGFloat(Double(digits) ?? 0) / 100
    }

    private func trendIcon(_ t: Trend) -> String {
        switch t {
        case .up: return "arrow.up.right"
        case .down: return "arrow.down.right"
        case .flat: return "minus"
        }
    }

    private func trendColor(_ t: Trend) -> Color {
        switch t {
        case .up: return Tokens.danger
        case .down: return Tokens.success
        case .flat: return Tokens.textTertiary
        }
    }
}
