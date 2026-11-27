/**
 * Star Hospital Design Token System - Colors
 * Accurate color palette matching Star Hospital UI reference and UI/UX Pro Max rules.
 */

export const colors = {
  // Brand Colors
  primary: '#0866C6',       // Primary Blue - main brand, buttons, active tabs
  primaryDark: '#064A91',   // Dark Navy - headings, giant token display A-102
  primaryLight: '#EBF4FF',  // Light Blue tint for cards, chip selections
  secondary: '#2196F3',     // Secondary Blue - gradients, accents
  tealAccent: '#13B8A6',    // Teal Accent - medical highlights
  white: '#FFFFFF',         // White - contrast surfaces & text

  // Star Hospital Signature Palette (Navy & Teal & Mint)
  starNavy: '#12344D',      // Deep Executive Navy
  starTeal: '#18A999',      // Medical Precision Teal
  mintBg: '#F0FDF4',        // Mint Background Light
  mintBorder: '#A7F3D0',    // Mint Border Accent
  mintText: '#065F46',      // Mint Text Dark

  // Canvas & Surface
  background: '#F5F9FF',    // Cool Sky Canvas - screen backgrounds
  cardBackground: '#FFFFFF',// Card background
  surface: '#FFFFFF',       // Pure White - cards, inputs, dialogs
  surfaceSubtle: '#F8FAFC', // Subtle Gray - input backgrounds, disabled surfaces
  surfaceHighlight: '#E0F2FE', // Highlight blue tint

  // Text Hierarchy
  textPrimary: '#142D4E',   // Dark Slate - primary titles, headings, body text
  textSecondary: '#64748B', // Muted Slate - subtitles, labels, timestamps
  textMuted: '#64748B',     // Alias for muted text
  textPlaceholder: '#94A3B8', // Placeholder Gray
  textInverse: '#FFFFFF',   // White text on primary buttons/badges

  // Borders & Dividers
  border: '#E2E8F0',        // Light Blue/Slate border for cards & inputs
  borderLight: '#F1F5F9',   // Very subtle divider
  borderActive: '#0866C6',  // Active/focused border

  // Semantic Status Colors
  success: '#16A34A',       // Green - Confirmed, Serving, Online
  successLight: '#DCFCE7',  // Green pill background
  successText: '#15803D',   // Dark green for badge text

  warning: '#F59E0B',       // Amber - In Queue, Waiting, Rating Stars
  warningLight: '#FEF3C7',  // Amber pill background
  warningText: '#D97706',   // Dark amber for badge text

  danger: '#DC2626',        // Red - Cancelled, Emergency, Logout
  dangerLight: '#FEE2E2',   // Red pill background
  dangerText: '#B91C1C',    // Dark red for badge text

  info: '#0284C7',          // Informational Azure
  infoLight: '#E0F2FE',     // Info pill background
  infoText: '#0369A1',      // Info text

  // Overlays
  overlay: 'rgba(20, 45, 78, 0.5)',
  overlayLight: 'rgba(8, 102, 198, 0.08)',
} as const;

export type ColorToken = keyof typeof colors;
