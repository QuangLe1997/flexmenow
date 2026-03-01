import React from 'react';

const I = ({ d, size = 24, fill = "none", stroke = "currentColor", sw = 2, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

export const Sparkles = (p) => <I {...p} d={["M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z","M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75L19 14z","M5 18l.5 1.5L7 20l-1.5.5L5 22l-.5-1.5L3 20l1.5-.5L5 18z"]} />;
export const Wand = (p) => <I {...p} d={["M15 4V2","M15 16v-2","M8 9h2","M20 9h2","M17.8 11.8L19 13","M15 9h.01","M17.8 6.2L19 5","M3 21l9-9","M12.2 6.2L11 5"]} />;
export const BookOpen = (p) => <I {...p} d={["M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z","M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"]} />;
export const Grid = (p) => <I {...p} d={["M3 3h7v7H3z","M14 3h7v7h-7z","M14 14h7v7h-7z","M3 14h7v7H3z"]} />;
export const User = (p) => <I {...p} d={["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2","M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"]} />;
export const ChevronLeft = (p) => <I {...p} d="M15 18l-6-6 6-6" />;
export const ChevronRight = (p) => <I {...p} d="M9 18l6-6-6-6" />;
export const X = (p) => <I {...p} d={["M18 6L6 18","M6 6l12 12"]} />;
export const Heart = (p) => <I {...p} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />;
export const Share = (p) => <I {...p} d={["M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8","M16 6l-4-4-4 4","M12 2v13"]} />;
export const Download = (p) => <I {...p} d={["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4","M7 10l5 5 5-5","M12 15V3"]} />;
export const Search = (p) => <I {...p} d={["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z","M21 21l-4.35-4.35"]} />;
export const Camera = (p) => <I {...p} d={["M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z","M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"]} />;
export const FlipH = (p) => <I {...p} d={["M8 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h3","M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3","M12 20v2","M12 14v2","M12 8v2","M12 2v2"]} />;
export const ImageIcon = (p) => <I {...p} d={["M21 15l-5-5L5 21","M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5z","M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"]} />;
export const Settings = (p) => <I {...p} d={["M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z","M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"]} />;
export const Bell = (p) => <I {...p} d={["M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9","M13.73 21a2 2 0 0 1-3.46 0"]} />;
export const Star = (p) => <I {...p} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />;
export const Zap = (p) => <I {...p} d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />;
export const Flame = (p) => <I {...p} d={["M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"]} />;
export const Layers = (p) => <I {...p} d={["M12 2L2 7l10 5 10-5-10-5z","M2 17l10 5 10-5","M2 12l10 5 10-5"]} />;
export const Crown = (p) => <I {...p} d={["M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z","M2 16h20"]} sw={2} />;
export const ShieldCheck = (p) => <I {...p} d={["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z","M9 12l2 2 4-4"]} />;
export const Crosshair = (p) => <I {...p} d={["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z","M22 12h-4","M6 12H2","M12 6V2","M12 22v-4"]} />;
export const Check = (p) => <I {...p} d="M20 6L9 17l-5-5" />;
export const CheckCircle = (p) => <I {...p} d={["M22 11.08V12a10 10 0 1 1-5.93-9.14","M22 4L12 14.01l-3-3"]} />;
export const Clock = (p) => <I {...p} d={["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z","M12 6v6l4 2"]} />;
export const RotateCcw = (p) => <I {...p} d={["M1 4v6h6","M3.51 15a9 9 0 1 0 .49-4.5"]} />;
export const Eye = (p) => <I {...p} d={["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z","M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"]} />;
export const Moon = (p) => <I {...p} d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />;
export const LogOut = (p) => <I {...p} d={["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4","M16 17l5-5-5-5","M21 12H9"]} />;
export const MoreHorizontal = (p) => <I {...p} d={["M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z","M19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z","M5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"]} fill="currentColor" sw={0} />;
export const Palette = (p) => <I {...p} d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.04-.23-.29-.38-.63-.38-1.01 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-5.17-4.36-9-10-9zM6.5 13A1.5 1.5 0 1 1 8 11.5 1.5 1.5 0 0 1 6.5 13zm3-4A1.5 1.5 0 1 1 11 7.5 1.5 1.5 0 0 1 9.5 9zm5 0A1.5 1.5 0 1 1 16 7.5 1.5 1.5 0 0 1 14.5 9zm3 4A1.5 1.5 0 1 1 19 11.5 1.5 1.5 0 0 1 17.5 13z" />;
export const CreditCard = (p) => <I {...p} d={["M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z","M1 10h22"]} />;
export const Shield = (p) => <I {...p} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />;
export const HelpCircle = (p) => <I {...p} d={["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z","M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3","M12 17h.01"]} />;
export const ExternalLink = (p) => <I {...p} d={["M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6","M15 3h6v6","M10 14L21 3"]} />;
export const Loader = ({ size = 24, stroke = "currentColor", className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke}
    strokeWidth={2} strokeLinecap="round" className={className}
    style={{ animation: 'spin 1s linear infinite' }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
