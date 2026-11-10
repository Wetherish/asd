import SwiftUI
import UIKit

// MARK: - Color

extension UIColor {
    convenience init(hex: String) {
        var s = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        if s.hasPrefix("#") { s.removeFirst() }
        var value: UInt64 = 0
        Scanner(string: s).scanHexInt64(&value)
        let r = CGFloat((value >> 16) & 0xFF) / 255
        let g = CGFloat((value >> 8) & 0xFF) / 255
        let b = CGFloat(value & 0xFF) / 255
        self.init(red: r, green: g, blue: b, alpha: 1)
    }
}

extension Color {
    init(hex: String) {
        self.init(uiColor: UIColor(hex: hex))
    }

    /// Adaptive color: light value in light mode, dark value in dark mode.
    init(light: String, dark: String) {
        self.init(uiColor: UIColor { traits in
            traits.userInterfaceStyle == .dark ? UIColor(hex: dark) : UIColor(hex: light)
        })
    }
}

// MARK: - Design tokens (01-foundations.md)

enum Tokens {
    // Accent — one only
    static let accent = Color(light: "#2E5BD7", dark: "#7A9BFF")
    static let accentPressed = Color(light: "#244BBB", dark: "#92AEFF")
    static let accentTint = Color(light: "#EAF0FF", dark: "#1B2440")
    static let accentOn = Color(light: "#FFFFFF", dark: "#0E0F12")

    // Neutrals
    static let canvas = Color(light: "#FFFFFF", dark: "#0E0F12")
    static let surface = Color(light: "#F7F8FA", dark: "#16181D")
    static let surfaceRaised = Color(light: "#FFFFFF", dark: "#1D2027")
    static let surfaceSunken = Color(light: "#EFF1F5", dark: "#0A0B0E")
    static let border = Color(light: "#DFE3EA", dark: "#2A2E37")
    static let borderStrong = Color(light: "#7C8698", dark: "#5C6675")
    static let textTertiary = Color(light: "#6B7380", dark: "#9BA3B0")
    static let textSecondary = Color(light: "#4A515C", dark: "#C3C9D4")
    static let textPrimary = Color(light: "#1B1F26", dark: "#F2F4F8")
    static let textInverse = Color(light: "#FFFFFF", dark: "#0E0F12")

    // Semantic — state only
    static let success = Color(light: "#1B7F4B", dark: "#5FD08A")
    static let warning = Color(light: "#8A5A00", dark: "#E9B949")
    static let danger = Color(light: "#B3261E", dark: "#FF8A80")
    static let successTint = Color(light: "#1B7F4B", dark: "#5FD08A").opacity(0.10)
    static let warningTint = Color(light: "#8A5A00", dark: "#E9B949").opacity(0.10)
    static let dangerTint = Color(light: "#B3261E", dark: "#FF8A80").opacity(0.10)

    // Scrim
    static let scrim = Color(light: "#0E0F12", dark: "#0E0F12").opacity(0.4)
}

enum Space {
    static let s1: CGFloat = 4
    static let s2: CGFloat = 8
    static let s3: CGFloat = 12
    static let s4: CGFloat = 16
    static let s6: CGFloat = 24
    static let s8: CGFloat = 32
    static let s12: CGFloat = 48
}

enum Radius {
    static let sm: CGFloat = 8
    static let md: CGFloat = 12
    static let lg: CGFloat = 20
    static let pill: CGFloat = 999
}

enum Motion {
    static let d1: Double = 0.12
    static let d2: Double = 0.22
}
