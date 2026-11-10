import SwiftUI

// MARK: - Root

@MainActor
struct RootView: View {
    @EnvironmentObject var store: AppStore

    var body: some View {
        TabView(selection: $store.selectedTab) {
            NavigationStack { ChatView() }
                .tabItem { Label("Chat", systemImage: "bubble.left.and.text.bubble.right") }
                .tag(AppStore.Tab.chat)

            NavigationStack { ActivityView() }
                .tabItem { Label("Activity", systemImage: "list.bullet.rectangle") }
                .tag(AppStore.Tab.activity)

            NavigationStack { SettingsView() }
                .tabItem { Label("Settings", systemImage: "gearshape") }
                .tag(AppStore.Tab.settings)
        }
        .tint(Tokens.accent)
        .overlay(alignment: .bottom) {
            if let toast = store.toast {
                ToastView(toast: toast)
                    .padding(.bottom, 60)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .animation(.easeOut(duration: Motion.d2), value: store.toast?.id)
        .fullScreenCover(isPresented: dashboardBinding) {
            if let id = store.dashboardId {
                DashboardView(dashboardId: id)
            }
        }
        .sheet(isPresented: confirmBinding) {
            if let id = store.confirmSheet, let action = store.actions.first(where: { $0.id == id }) {
                DestructiveConfirmView(action: action)
            }
        }
    }

    private var dashboardBinding: Binding<Bool> {
        Binding(
            get: { store.dashboardId != nil },
            set: { if !$0 { store.dashboardId = nil } }
        )
    }

    private var confirmBinding: Binding<Bool> {
        Binding(
            get: { store.confirmSheet != nil },
            set: { if !$0 { store.confirmSheet = nil } }
        )
    }
}

// MARK: - Toast

@MainActor
private struct ToastView: View {
    @EnvironmentObject var store: AppStore
    let toast: AppToast

    var body: some View {
        HStack(spacing: Space.s3) {
            Image(systemName: "checkmark.circle.fill")
                .foregroundColor(Tokens.success)
            Text(toast.text)
                .font(.subheadline)
                .foregroundColor(Tokens.textPrimary)
            if let undoLabel = toast.undoLabel, let onUndo = toast.onUndo {
                Button(undoLabel) {
                    onUndo()
                }
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(Tokens.accent)
            }
        }
        .padding(.horizontal, Space.s4)
        .padding(.vertical, Space.s3)
        .background(RoundedRectangle(cornerRadius: Radius.md, style: .continuous).fill(Tokens.surfaceRaised))
        .overlay(RoundedRectangle(cornerRadius: Radius.md, style: .continuous).strokeBorder(Tokens.border))
        .shadow(color: .black.opacity(0.16), radius: 24, y: 8)
        .task(id: toast.id) {
            let delay = toast.undoLabel != nil ? 10_000_000_000 : 4_000_000_000
            try? await Task.sleep(nanoseconds: delay)
            store.dismissToast()
        }
    }
}

// MARK: - Destructive confirm sheet

@MainActor
struct DestructiveConfirmView: View {
    @EnvironmentObject var store: AppStore
    let action: Action

    var body: some View {
        VStack(alignment: .leading, spacing: Space.s4) {
            HStack(spacing: Space.s3) {
                Image(systemName: action.glyph)
                    .font(.title2)
                    .foregroundColor(Tokens.danger)
                Text("\(action.title)?")
                    .font(.title2)
                    .fontWeight(.semibold)
                    .foregroundColor(Tokens.textPrimary)
            }

            VStack(alignment: .leading, spacing: Space.s2) {
                ForEach(action.preview) { row in
                    HStack(alignment: .top) {
                        Text(row.label)
                            .font(.subheadline)
                            .foregroundColor(Tokens.textTertiary)
                            .frame(width: 64, alignment: .leading)
                        Text(row.value)
                            .font(.subheadline)
                            .foregroundColor(Tokens.textPrimary)
                    }
                }
            }

            Text(action.consequence)
                .font(.footnote)
                .foregroundColor(Tokens.danger)
            Text("This can't be undone.")
                .font(.footnote)
                .fontWeight(.semibold)
                .foregroundColor(Tokens.danger)

            HStack {
                Spacer()
                Button("Cancel") { store.cancelDestructive() }
                    .buttonStyle(VariantButtonStyle(variant: .secondary))
                Button(action.title) { store.confirmDestructive() }
                    .buttonStyle(VariantButtonStyle(variant: .destructive))
            }
        }
        .padding(Space.s6)
        .presentationDetents([.medium])
    }
}
