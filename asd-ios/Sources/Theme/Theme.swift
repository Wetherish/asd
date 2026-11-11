import SwiftUI

// MARK: - Color tokens (light / dark)

extension Color {
    init(hex: UInt32) {
        let r = Double((hex >> 16) & 0xFF) / 255
        let g = Double((hex >> 8) & 0xFF) / 255
        let b = Double(hex & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }

    init(light: Color, dark: Color) {
        self.init(uiColor: UIColor { traits in
            traits.userInterfaceStyle == .dark ? UIColor(dark) : UIColor(light)
        })
    }

    static let paper = Color(light: Color(hex: 0xFCFBF8), dark: Color(hex: 0x141210))
    static let surface = Color(light: Color(hex: 0xF4F2EC), dark: Color(hex: 0x1E1B17))
    static let surface2 = Color(light: Color(hex: 0xEAE7DE), dark: Color(hex: 0x26221D))
    static let border = Color(light: Color(hex: 0xDCD8CC), dark: Color(hex: 0x34302A))
    static let ink = Color(light: Color(hex: 0x1C1A17), dark: Color(hex: 0xEDE9E2))
    static let text2 = Color(light: Color(hex: 0x6B675E), dark: Color(hex: 0xB5AEA0))
    static let text3 = Color(light: Color(hex: 0x9A9488), dark: Color(hex: 0x857E72))
    static let accent = Color(hex: 0x0F766E)
    static let accentText = Color(light: Color(hex: 0x0F766E), dark: Color(hex: 0x4FD1C5))
    static let accentTint = Color(light: Color(hex: 0xE6F2F0), dark: Color(hex: 0x12312E))
    static let success = Color(light: Color(hex: 0x1F7A4D), dark: Color(hex: 0x4CAF7D))
    static let warning = Color(light: Color(hex: 0xB26A00), dark: Color(hex: 0xE0A13B))
    static let danger = Color(light: Color(hex: 0xC0392B), dark: Color(hex: 0xE05A4E))
}

// MARK: - Typography

extension Font {
    /// Cormorant Garamond Light Italic (system serif italic fallback)
    static func display(_ size: CGFloat) -> Font {
        .system(size: size, weight: .light, design: .serif).italic()
    }
    /// Cormorant Garamond Regular (system serif fallback)
    static func serifTitle(_ size: CGFloat) -> Font {
        .system(size: size, design: .serif)
    }
    /// Montserrat Medium (system medium fallback)
    static func label(_ size: CGFloat) -> Font {
        .system(size: size, weight: .medium)
    }
    /// SF Pro body
    static func text(_ size: CGFloat) -> Font {
        .system(size: size)
    }
}

// MARK: - Spacing / radius

enum Space {
    static let xs: CGFloat = 4
    static let s: CGFloat = 8
    static let m: CGFloat = 12
    static let l: CGFloat = 16
    static let xl: CGFloat = 20
    static let xxl: CGFloat = 24
    static let xxxl: CGFloat = 32
}

enum Radius {
    static let card: CGFloat = 14
    static let button: CGFloat = 11
    static let chip: CGFloat = 999
}

// MARK: - Modifiers

extension View {
    func overline(_ color: Color = .text3) -> some View {
        self.font(.label(11)).tracking(2.2).textCase(.uppercase).foregroundColor(color)
    }

    func cardStyle() -> some View {
        self
            .padding(13)
            .background(Color.surface)
            .clipShape(RoundedRectangle(cornerRadius: Radius.card, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: Radius.card, style: .continuous)
                    .strokeBorder(Color.border, lineWidth: 1)
            )
    }
}
