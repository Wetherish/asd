import SwiftUI

// MARK: - Section label

struct SectionLabel: View {
    let text: String

    var body: some View {
        Text(text)
            .font(.label(10))
            .tracking(2)
            .textCase(.uppercase)
            .foregroundColor(.text3)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.top, 18)
            .padding(.bottom, 8)
    }
}

// MARK: - Pill

struct Pill: View {
    let text: String
    let color: Color

    var body: some View {
        Text(text)
            .font(.label(9))
            .tracking(1.2)
            .textCase(.uppercase)
            .padding(.horizontal, 9)
            .padding(.vertical, 4)
            .background(color.opacity(0.15))
            .foregroundColor(color)
            .clipShape(Capsule())
    }
}

extension API.JobStatus {
    var color: Color {
        switch self {
        case .running: return .warning
        case .done: return .success
        case .failed: return .danger
        case .scheduled: return .text2
        case .paused: return .text3
        }
    }
    var label: String { rawValue.capitalized }
}

// MARK: - Accent-edged card (trace / approval)

struct AccentCard<Content: View>: View {
    @ViewBuilder let content: Content

    var body: some View {
        HStack(spacing: 0) {
            Rectangle().fill(Color.accent).frame(width: 3)
            content.padding(13)
        }
        .background(Color.surface)
        .clipShape(RoundedRectangle(cornerRadius: Radius.card, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: Radius.card, style: .continuous)
                .strokeBorder(Color.border, lineWidth: 1)
        )
    }
}

// MARK: - Rows

struct SessionRow: View {
    let session: API.Session
    let leadName: String

    var body: some View {
        HStack(alignment: .center) {
            VStack(alignment: .leading, spacing: 3) {
                Text(session.title).font(.serifTitle(18))
                Text("\(leadName) · \(Format.sessionMeta(session))").font(.label(11)).foregroundColor(.text3)
            }
            Spacer()
            Text(Format.relativeTime(session.updatedAt)).font(.label(11)).foregroundColor(.text3)
            Image(systemName: "chevron.right").font(.system(size: 13)).foregroundColor(.text3)
        }
        .cardStyle()
    }
}

struct JobRow: View {
    let job: API.Job
    let meta: String

    var body: some View {
        HStack(alignment: .center) {
            VStack(alignment: .leading, spacing: 3) {
                Text(job.title).font(.serifTitle(18))
                Text(meta).font(.label(11)).foregroundColor(.text3)
                if job.status == .running {
                    ProgressView(value: job.progress).tint(.accent).padding(.top, 6)
                }
            }
            Spacer()
            Pill(text: job.status.label, color: job.status.color)
        }
        .cardStyle()
    }
}

struct AgentRow: View {
    let agent: API.Agent

    var body: some View {
        HStack(alignment: .center) {
            VStack(alignment: .leading, spacing: 3) {
                Text(agent.name).font(.serifTitle(18))
                Text(agent.description).font(.label(11)).foregroundColor(.text3)
                HStack(spacing: 6) {
                    ForEach(agent.capabilities, id: \.self) { capability in
                        Text(capability)
                            .font(.label(9))
                            .tracking(1.2)
                            .textCase(.uppercase)
                            .padding(.horizontal, 9)
                            .padding(.vertical, 4)
                            .background(Color.surface2)
                            .foregroundColor(.text2)
                            .clipShape(Capsule())
                    }
                }
                .padding(.top, 7)
            }
            Spacer()
            Image(systemName: "chevron.right").font(.system(size: 13)).foregroundColor(.text3)
        }
        .cardStyle()
    }
}

// MARK: - Button styles

struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.label(11)).tracking(1.2).textCase(.uppercase)
            .padding(.horizontal, 15).padding(.vertical, 9)
            .foregroundColor(.white)
            .background(Color.accent)
            .clipShape(RoundedRectangle(cornerRadius: Radius.button, style: .continuous))
            .opacity(configuration.isPressed ? 0.85 : 1)
    }
}

struct GhostButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.label(11)).tracking(1.2).textCase(.uppercase)
            .padding(.horizontal, 15).padding(.vertical, 9)
            .foregroundColor(.ink)
            .background(Color.surface2)
            .clipShape(RoundedRectangle(cornerRadius: Radius.button, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: Radius.button, style: .continuous)
                    .strokeBorder(Color.border, lineWidth: 1)
            )
    }
}

struct DangerButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.label(11)).tracking(1.2).textCase(.uppercase)
            .padding(.horizontal, 15).padding(.vertical, 9)
            .foregroundColor(.danger)
            .overlay(
                RoundedRectangle(cornerRadius: Radius.button, style: .continuous)
                    .strokeBorder(Color.danger, lineWidth: 1)
            )
    }
}
