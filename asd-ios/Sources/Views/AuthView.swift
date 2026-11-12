import SwiftUI

/// Sign in / create account. Mirrors `asd-web/src/views/Auth.tsx`: email +
/// password against `POST /auth/login` and `POST /auth/signup` (Cognito-backed).
struct AuthView: View {
    @EnvironmentObject private var store: AppStore

    enum Mode { case login, signup }

    @State private var mode: Mode = .login
    @State private var email = ""
    @State private var password = ""
    @State private var busy = false
    @State private var errorMessage: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Text("asd").font(.display(44)).padding(.top, 40)
                Text(mode == .login ? "Sign in" : "Create account")
                    .font(.serifTitle(26))
                    .padding(.top, 4)

                SectionLabel(text: "Email")
                TextField("you@example.com", text: $email)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .keyboardType(.emailAddress)
                    .textContentType(.emailAddress)
                    .padding(13)
                    .background(Color.surface)
                    .clipShape(RoundedRectangle(cornerRadius: Radius.card, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: Radius.card, style: .continuous)
                            .strokeBorder(Color.border, lineWidth: 1)
                    )

                SectionLabel(text: "Password")
                SecureField("Password", text: $password)
                    .textContentType(mode == .login ? .password : .newPassword)
                    .padding(13)
                    .background(Color.surface)
                    .clipShape(RoundedRectangle(cornerRadius: Radius.card, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: Radius.card, style: .continuous)
                            .strokeBorder(Color.border, lineWidth: 1)
                    )

                if mode == .signup {
                    Text("At least 8 characters with uppercase, lowercase, and a number.")
                        .font(.label(11)).foregroundColor(.text3).padding(.top, 8)
                }

                Button { submit() } label: {
                    Text(busy ? "Please wait…" : (mode == .login ? "Sign in" : "Create account"))
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(PrimaryButtonStyle())
                .disabled(busy || email.isEmpty || password.isEmpty)
                .padding(.top, 20)

                if let error = errorMessage {
                    Text(error).font(.label(11)).foregroundColor(.danger).padding(.top, 12)
                }

                Button {
                    mode = mode == .login ? .signup : .login
                    errorMessage = nil
                } label: {
                    Text(mode == .login ? "Need an account? Sign up" : "Already have an account? Sign in")
                        .font(.label(11))
                        .foregroundColor(.accentText)
                        .frame(maxWidth: .infinity)
                }
                .padding(.top, 12)
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 20)
        }
        .background(Color.paper.ignoresSafeArea())
    }

    private func submit() {
        guard !email.isEmpty, !password.isEmpty, !busy else { return }
        busy = true
        errorMessage = nil
        Task { @MainActor in
            do {
                if mode == .login {
                    try await store.login(email: email, password: password)
                } else {
                    try await store.signup(email: email, password: password)
                }
            } catch {
                errorMessage = error.localizedDescription
            }
            busy = false
        }
    }
}
