import SwiftUI

/// Generic full-screen artifact viewer/editor (table / doc / canvas / dashboard).
/// Doc bodies are editable, the name is renamable, and artifacts can be shared
/// with session members or deleted.
struct ArtifactDetailView: View {
    @EnvironmentObject private var store: AppStore
    @Environment(\.dismiss) private var dismiss

    let id: String
    let members: [API.Person]

    @State private var artifact: API.Artifact?
    @State private var name = ""
    @State private var body = ""
    @State private var editing = false
    @State private var saving = false
    @State private var showShare = false
    @State private var confirmDelete = false
    @State private var errorMessage: String?

    private var kind: API.ArtifactKind { artifact?.kind ?? .doc }
    private var isDoc: Bool { artifact?.content.kind == .doc }
    private var sharedSummary: String {
        let count = artifact?.sharedWith.count ?? 0
        return count > 0 ? "\(count) people" : "Only you"
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Text(kind.rawValue).overline(Color.accentText)

                if editing {
                    TextField("Name", text: $name)
                        .font(.serifTitle(24))
                        .padding(.top, 4)
                } else {
                    Text(name).font(.serifTitle(24)).padding(.top, 4)
                }

                if let error = errorMessage {
                    Text(error).font(.label(11)).foregroundColor(.danger).padding(.top, 8)
                }

                SectionLabel(text: "Content")
                contentView

                SectionLabel(text: "Shared with")
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(sharedSummary).font(.serifTitle(17))
                        Text("Manage access from the share sheet").font(.label(11)).foregroundColor(.text3)
                    }
                    Spacer()
                    Button("Share") { showShare = true }
                        .font(.label(11)).tracking(1.2).textCase(.uppercase).foregroundColor(.accentText)
                }
                .cardStyle()
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 20)
        }
        .background(Color.paper.ignoresSafeArea())
        .navigationTitle(editing ? "Editing" : "Artifact")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItemGroup(placement: .topBarTrailing) {
                if editing {
                    Button(saving ? "Saving…" : "Save") { Task { await save() } }
                        .disabled(saving || name.trimmingCharacters(in: .whitespaces).isEmpty)
                } else {
                    Menu {
                        Button("Edit") { beginEdit() }
                        Button("Share") { showShare = true }
                        Button("Delete", role: .destructive) { confirmDelete = true }
                    } label: {
                        Image(systemName: "ellipsis")
                    }
                }
            }
            if editing {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { cancelEdit() }
                }
            }
        }
        .sheet(isPresented: $showShare) {
            if let artifact {
                ShareArtifactSheet(artifact: artifact, members: members)
            }
        }
        .alert("Delete artifact?", isPresented: $confirmDelete) {
            Button("Delete", role: .destructive) { Task { await remove() } }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("“\(name)” will be permanently deleted.")
        }
        .task { await load() }
    }

    // MARK: Content

    @ViewBuilder
    private var contentView: some View {
        switch artifact?.content.kind {
        case .doc:
            if editing {
                TextEditor(text: $body)
                    .frame(minHeight: 220)
                    .padding(8)
                    .scrollContentBackground(.hidden)
                    .background(Color.surface)
                    .clipShape(RoundedRectangle(cornerRadius: Radius.card, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: Radius.card, style: .continuous)
                            .strokeBorder(Color.border, lineWidth: 1)
                    )
            } else if let text = artifact?.content.body, !text.isEmpty {
                Text(text).font(.text(15)).lineSpacing(3)
            } else {
                Text("Empty document").font(.label(11)).foregroundColor(.text3).italic()
            }
        case .table:
            table
        case .canvas:
            canvas
        case .dashboard:
            dashboard
        case .list:
            list
        case nil:
            Text("Loading…").font(.label(11)).foregroundColor(.text3)
        default:
            Text("Preview coming soon").font(.label(11)).foregroundColor(.text3)
        }
    }

    private var table: some View {
        let content = artifact?.content
        let columns = content?.columns ?? []
        let rows = content?.rows ?? []
        if columns.isEmpty && rows.isEmpty {
            return AnyView(Text("Empty table.").font(.label(11)).foregroundColor(.text3))
        }
        return AnyView(
            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    ForEach(columns, id: \.self) { c in
                        Text(c).font(.label(9)).tracking(1.2).textCase(.uppercase).foregroundColor(.text3)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
                .padding(.bottom, 8)
                Divider().overlay(Color.border)
                ForEach(rows, id: \.self) { row in
                    HStack {
                        ForEach(row, id: \.self) { cell in
                            Text(cell).font(.text(13)).frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }
                    .padding(.vertical, 8)
                    Divider().overlay(Color.border)
                }
            }
            .cardStyle()
        )
    }

    private var canvas: some View {
        let nodes = artifact?.content.nodes ?? []
        if nodes.isEmpty {
            return AnyView(Text("Empty canvas.").font(.label(11)).foregroundColor(.text3))
        }
        return AnyView(
            VStack(alignment: .leading, spacing: 8) {
                ForEach(nodes) { node in
                    HStack {
                        Text(node.type.rawValue).font(.serifTitle(17))
                        Spacer()
                        Text("x \(Int(node.x)) · y \(Int(node.y))").font(.label(11)).foregroundColor(.text3)
                    }
                    .cardStyle()
                }
            }
        )
    }

    private var dashboard: some View {
        let widgets = artifact?.content.widgets ?? []
        if widgets.isEmpty {
            return AnyView(Text("Empty dashboard.").font(.label(11)).foregroundColor(.text3))
        }
        return AnyView(
            VStack(alignment: .leading, spacing: 8) {
                ForEach(widgets) { widget in
                    HStack {
                        Text(widget.type).font(.serifTitle(17))
                        Spacer()
                    }
                    .cardStyle()
                }
            }
        )
    }

    private var list: some View {
        let items = artifact?.content.items ?? []
        if items.isEmpty {
            return AnyView(Text("Empty list.").font(.label(11)).foregroundColor(.text3))
        }
        return AnyView(
            VStack(alignment: .leading, spacing: 10) {
                ForEach(items) { item in
                    HStack(spacing: 10) {
                        Image(systemName: item.checked ? "checkmark.square.fill" : "square")
                            .foregroundColor(item.checked ? .accent : .text3)
                        Text(item.text).font(.text(15))
                    }
                }
            }
        )
    }

    // MARK: Actions

    private func load() async {
        if let value = try? await store.client.artifact(id) {
            apply(value)
        }
    }

    private func apply(_ a: API.Artifact) {
        artifact = a
        name = a.name
        body = a.content.body ?? ""
    }

    private func beginEdit() {
        name = artifact?.name ?? ""
        body = artifact?.content.body ?? ""
        editing = true
    }

    private func cancelEdit() {
        if let a = artifact { apply(a) }
        editing = false
    }

    private func save() async {
        saving = true
        errorMessage = nil
        do {
            let content = isDoc
                ? API.ArtifactContent(kind: .doc, columns: nil, rows: nil, body: body, nodes: nil, widgets: nil)
                : nil
            let updated = try await store.client.updateArtifact(id, name: name.trimmingCharacters(in: .whitespaces), content: content)
            apply(updated)
            editing = false
        } catch {
            errorMessage = error.localizedDescription
        }
        saving = false
    }

    private func remove() async {
        try? await store.client.deleteArtifact(id)
        dismiss()
    }
}

// MARK: - Share sheet

private struct ShareArtifactSheet: View {
    @EnvironmentObject private var store: AppStore
    @Environment(\.dismiss) private var dismiss

    let artifact: API.Artifact
    let members: [API.Person]

    @State private var selected: Set<String> = []
    @State private var role: API.PersonRole = .viewer
    @State private var busy = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    SectionLabel(text: "People")
                    if members.isEmpty {
                        Text("No other members in this session.").font(.label(11)).foregroundColor(.text3)
                    } else {
                        ForEach(members) { m in
                            Button {
                                if selected.contains(m.id) { selected.remove(m.id) } else { selected.insert(m.id) }
                            } label: {
                                HStack {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(m.name).font(.serifTitle(17))
                                        Text(m.email).font(.label(11)).foregroundColor(.text3)
                                    }
                                    Spacer()
                                    Image(systemName: selected.contains(m.id) ? "checkmark.square.fill" : "square")
                                        .foregroundColor(selected.contains(m.id) ? .accent : .text3)
                                }
                                .cardStyle()
                            }
                            .buttonStyle(.plain)
                        }
                    }

                    SectionLabel(text: "Permission")
                    Picker("Permission", selection: $role) {
                        Text("Can view").tag(API.PersonRole.viewer)
                        Text("Can edit").tag(API.PersonRole.editor)
                    }
                    .pickerStyle(.segmented)
                    .tint(.accent)

                    if let error = errorMessage {
                        Text(error).font(.label(11)).foregroundColor(.danger).padding(.top, 10)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 20)
            }
            .background(Color.paper.ignoresSafeArea())
            .navigationTitle("Share “\(artifact.name)”")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button(busy ? "Sharing…" : "Share") { Task { await share() } }
                        .disabled(busy || selected.isEmpty)
                }
            }
        }
    }

    private func share() async {
        busy = true
        errorMessage = nil
        do {
            _ = try await store.client.shareArtifact(artifact.id, personIds: Array(selected), role: role)
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
        busy = false
    }
}
