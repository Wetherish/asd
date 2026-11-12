import Foundation

/// Error thrown by the client when a request fails or the response is invalid.
struct APIError: Error, LocalizedError, CustomStringConvertible {
    let code: String
    let message: String
    let status: Int
    let details: JSONValue?

    var errorDescription: String? { message }
    var description: String { "APIError(\(status) \(code)): \(message)" }
}

/// Thin `URLSession` wrapper for the REST half of the contract.
struct HTTPClient {
    let baseURL: URL
    let tokenProvider: () -> String?

    enum Failure: Error { case invalidURL, invalidResponse }

    func get<T: Decodable>(_ path: String) async throws -> T {
        let (data, http) = try await perform("GET", path, bodyData: nil)
        return try decode(data, http)
    }

    func post<T: Decodable, B: Encodable>(_ path: String, body: B) async throws -> T {
        let (data, http) = try await perform("POST", path, bodyData: try JSONEncoder().encode(body))
        return try decode(data, http)
    }

    /// Bodyless POST (e.g. job pause/cancel).
    func post<T: Decodable>(_ path: String) async throws -> T {
        let (data, http) = try await perform("POST", path, bodyData: nil)
        return try decode(data, http)
    }

    func patch<T: Decodable, B: Encodable>(_ path: String, body: B) async throws -> T {
        let (data, http) = try await perform("PATCH", path, bodyData: try JSONEncoder().encode(body))
        return try decode(data, http)
    }

    func delete(_ path: String) async throws {
        let (_, http) = try await perform("DELETE", path, bodyData: nil)
        guard (200..<300).contains(http.statusCode) else {
            throw APIError(code: "http", message: "Delete failed", status: http.statusCode)
        }
    }

    // MARK: Internals

    private func perform(_ method: String, _ path: String, bodyData: Data?) async throws -> (Data, HTTPURLResponse) {
        var request = URLRequest(url: try makeURL(path))
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = tokenProvider() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        request.httpBody = bodyData

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw Failure.invalidResponse }
        return (data, http)
    }

    private func decode<T: Decodable>(_ data: Data, _ http: HTTPURLResponse) throws -> T {
        guard (200..<300).contains(http.statusCode) else {
            throw APIError(
                code: "http",
                message: Self.errorMessage(from: data) ?? HTTPURLResponse.localizedString(forStatusCode: http.statusCode),
                status: http.statusCode,
                details: nil
            )
        }
        return try JSONDecoder().decode(T.self, from: data)
    }

    /// Extracts the human-readable message from either error envelope the server
    /// can return: the contract shape `{ code, message, details }` or NestJS's
    /// `{ statusCode, message, error }`. Both carry the text in `message`.
    private static func errorMessage(from data: Data) -> String? {
        struct Envelope: Decodable { let message: String? }
        guard let envelope = try? JSONDecoder().decode(Envelope.self, from: data),
              let message = envelope.message, !message.isEmpty else { return nil }
        return message
    }

    private func makeURL(_ path: String) throws -> URL {
        var base = baseURL.absoluteString
        if !base.hasSuffix("/") { base += "/" }
        let trimmed = path.hasPrefix("/") ? String(path.dropFirst()) : path
        guard let url = URL(string: trimmed, relativeTo: URL(string: base))?.absoluteURL else {
            throw Failure.invalidURL
        }
        return url
    }
}
