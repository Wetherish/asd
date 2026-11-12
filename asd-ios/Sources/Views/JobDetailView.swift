import SwiftUI

/// Job detail: live status, progress, steps, logs, and pause/cancel controls.
/// Reads from the shared store (kept fresh by the global WS subscription + poll).
struct JobDetailView: View {
    @EnvironmentObject private var store: AppStore
    let id: String

    var body: some View {
        if let job = store.jobs.first(where: { $0.id == id }) {
            content(job)
        } else {
            VStack {
                Text("Job not found").font(.label(12)).foregroundColor(.text3)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.paper.ignoresSafeArea())
        }
    }

    private func content(_ job: API.Job) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                HStack(spacing: 8) {
                    Pill(text: job.status.label, color: job.status.color)
                    if let recurring = job.recurring {
                        Text(recurring.rule).font(.label(11)).foregroundColor(.text3)
                    }
                }

                if job.status == .running {
                    ProgressView(value: job.progress).tint(.accent).padding(.top, 14)
                }
                Text("Started \(Format.relativeTime(job.createdAt))")
                    .font(.label(11)).foregroundColor(.text3).padding(.top, 6)

                SectionLabel(text: "Steps")
                if job.steps.isEmpty {
                    Text("No steps.").font(.label(11)).foregroundColor(.text3)
                } else {
                    ForEach(Array(job.steps.enumerated()), id: \.element.id) { index, step in
                        stepRow(step, index: index)
                    }
                }

                SectionLabel(text: "Logs")
                if job.logs.isEmpty {
                    Text("No log entries.").font(.label(11)).foregroundColor(.text3)
                } else {
                    VStack(alignment: .leading, spacing: 6) {
                        ForEach(Array(job.logs.enumerated()), id: \.offset) { _, entry in
                            logLine(entry)
                        }
                    }
                    .cardStyle()
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 20)
        }
        .background(Color.paper.ignoresSafeArea())
        .navigationTitle(job.title)
        .navigationBarTitleDisplayMode(.inline)
        .safeAreaInset(edge: .bottom) {
            HStack(spacing: 8) {
                Button {
                    Task { await store.pauseJob(job.id) }
                } label: {
                    Label("Pause", systemImage: "pause.fill")
                }
                .buttonStyle(GhostButtonStyle())
                .frame(maxWidth: .infinity)
                .disabled(!(job.status == .running || job.status == .scheduled))

                Button {
                    Task { await store.cancelJob(job.id) }
                } label: {
                    Label("Cancel", systemImage: "trash")
                }
                .buttonStyle(DangerButtonStyle())
                .frame(maxWidth: .infinity)
                .disabled(job.status == .done || job.status == .failed)
            }
            .padding(16)
            .background(Color.paper)
        }
    }

    private func stepRow(_ step: API.JobStep, index: Int) -> some View {
        HStack(alignment: .top, spacing: 11) {
            Circle().fill(stepColor(step.status)).frame(width: 9, height: 9).padding(.top, 4)
            VStack(alignment: .leading, spacing: 2) {
                Text("\(index + 1). \(step.title)").font(.text(14).weight(.semibold))
                if let detail = step.detail {
                    Text(detail).font(.label(11)).foregroundColor(.text3)
                }
            }
            Spacer()
            Text(step.status.rawValue).font(.label(11)).foregroundColor(.text3)
        }
        .padding(.vertical, 7)
    }

    private func logLine(_ entry: API.LogEntry) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Text(Format.logTime(entry.ts))
                .font(.system(size: 11, design: .monospaced))
                .foregroundColor(.text3)
            Text(entry.text)
                .font(.system(size: 12, design: .monospaced))
                .foregroundColor(logColor(entry.level))
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func stepColor(_ status: API.JobStepStatus) -> Color {
        switch status {
        case .done: return .success
        case .running: return .warning
        case .failed: return .danger
        case .queued: return .text3
        }
    }

    private func logColor(_ level: API.LogLevel) -> Color {
        switch level {
        case .info: return .text2
        case .warn: return .warning
        case .error: return .danger
        }
    }
}
