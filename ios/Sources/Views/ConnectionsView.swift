import SwiftUI

@MainActor
struct ConnectionsView: View {
    @EnvironmentObject var store: AppStore
    @State private var opened: Connection?

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                ForEach(store.connections) { c in
                    ConnectionRow(connection: c) { opened = c }
                    if c.id != store.connections.last?.id {
                        Divider().padding(.leading, 56)
                    }
                }
            }
            .padding(.horizontal, Space.s4)
            .background(RoundedRectangle(cornerRadius: Radius.md, style: .continuous).fill(Tokens.surface))
            .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))

            Text("Permissions are checked before every action. You can change these anytime.")
                .font(.footnote)
                .foregroundColor(Tokens.textTertiary)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, Space.s4)
                .padding(.top, Space.s3)
        }
        .background(Tokens.canvas)
        .navigationTitle("Connections")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(item: $opened) { c in
            ConnectionDetailSheet(connection: c)
        }
    }
}

@MainActor
private struct ConnectionDetailSheet: View {
    @EnvironmentObject var store: AppStore
    let connection: Connection

    var body: some View {
        VStack(alignment: .leading, spacing: Space.s4) {
            HStack(spacing: Space.s3) {
                Image(systemName: connection.glyph)
                    .font(.title2)
                    .foregroundColor(Tokens.textSecondary)
                    .frame(width: 40, height: 40)
                    .background(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous).fill(Tokens.surface))
                VStack(alignment: .leading, spacing: 2) {
                    Text(connection.name).font(.headline).foregroundColor(Tokens.textPrimary)
                    Text("Connected").font(.footnote).foregroundColor(Tokens.textTertiary)
                }
                Spacer()
            }

            Text("Can do").font(.footnote).foregroundColor(Tokens.textTertiary)
            VStack(alignment: .leading, spacing: Space.s2) {
                ForEach(connection.scopes, id: \.self) { scope in
                    HStack(spacing: Space.s2) {
                        Image(systemName: "checkmark").font(.footnote).foregroundColor(Tokens.success)
                        Text(scope).font(.subheadline).foregroundColor(Tokens.textPrimary)
                    }
                }
            }

            Spacer()

            Button("Disconnect \(connection.name)") {
                store.disconnectService(connection.id)
            }
            .frame(maxWidth: .infinity)
            .buttonStyle(VariantButtonStyle(variant: .destructive))
        }
        .padding(Space.s6)
        .presentationDetents([.medium])
    }
}
