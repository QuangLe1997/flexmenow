import React, { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// FLEXME APP MOCKUP — v6.0 (Royal Gold VIP, English-First, SVG Icons)
// Design System: Gold #F59E0B | Luxury Black #050505 | Inter + JetBrains Mono
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Design Tokens ───────────────────────────────────────────────────────────
const C = {
  brand: "#F59E0B", brand400: "#FBBF24", brand600: "#B45309", brand800: "#78350F",
  blue: "#3B82F6", purple: "#7C3AFF", green: "#10B981", red: "#EF4444",
  bg: "#050505", card: "#121212", input: "#1A1A1A",
  text: "#FFFFFF", textSec: "#A3A3A3", textTer: "#525252",
  border: "rgba(255,255,255,0.06)", borderMed: "rgba(255,255,255,0.10)",
};
const grad = {
  hero: `linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #B45309 100%)`,
  btn: `linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #B45309 100%)`,
  story: `linear-gradient(135deg, ${C.brand600} 0%, ${C.brand800} 100%)`,
  glow: `radial-gradient(circle at center, rgba(245,158,11,0.15) 0%, rgba(5,5,5,1) 70%)`,
  glass: `linear-gradient(to bottom right, rgba(255,255,255,0.1), rgba(245,158,11,0.05))`,
};

// ─── SVG Icons (Lucide-style) ────────────────────────────────────────────────
const Ic = ({ d, size = 20, stroke = "currentColor", fill = "none", sw = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
);
const Icons = {
  Sparkles: (p) => <Ic {...p} d={["M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z", "M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75L19 14z", "M5 18l.5 1.5L7 20l-1.5.5L5 22l-.5-1.5L3 20l1.5-.5L5 18z"]} />,
  Wand: (p) => <Ic {...p} d={["M15 4V2", "M15 16v-2", "M8 9h2", "M20 9h2", "M17.8 11.8L19 13", "M15 9h.01", "M17.8 6.2L19 5", "M3 21l9-9", "M12.2 6.2L11 5"]} />,
  BookOpen: (p) => <Ic {...p} d={["M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z", "M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"]} />,
  Grid: (p) => <Ic {...p} d={["M3 3h7v7H3z", "M14 3h7v7h-7z", "M14 14h7v7h-7z", "M3 14h7v7H3z"]} />,
  User: (p) => <Ic {...p} d={["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2", "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"]} />,
  Camera: (p) => <Ic {...p} d={["M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z", "M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"]} />,
  Flame: (p) => <Ic {...p} d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />,
  Layers: (p) => <Ic {...p} d={["M12 2L2 7l10 5 10-5-10-5z", "M2 17l10 5 10-5", "M2 12l10 5 10-5"]} />,
  Heart: (p) => <Ic {...p} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />,
  Bookmark: (p) => <Ic {...p} d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />,
  Share: (p) => <Ic {...p} d={["M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8", "M16 6l-4-4-4 4", "M12 2v13"]} />,
  Download: (p) => <Ic {...p} d={["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M7 10l5 5 5-5", "M12 15V3"]} />,
  Settings: (p) => <Ic {...p} d={["M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"]} />,
  Search: (p) => <Ic {...p} d={["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z", "M21 21l-4.35-4.35"]} />,
  Bell: (p) => <Ic {...p} d={["M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9", "M13.73 21a2 2 0 0 1-3.46 0"]} />,
  ArrowLeft: (p) => <Ic {...p} d={["M19 12H5", "M12 19l-7-7 7-7"]} />,
  X: (p) => <Ic {...p} d={["M18 6L6 18", "M6 6l12 12"]} />,
  Send: (p) => <Ic {...p} d={["M22 2L11 13", "M22 2L15 22 11 13 2 9l20-7z"]} />,
  Zap: (p) => <Ic {...p} d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
  Check: (p) => <Ic {...p} d="M20 6L9 17l-5-5" />,
  CheckCircle: (p) => <Ic {...p} d={["M22 11.08V12a10 10 0 1 1-5.93-9.14", "M22 4L12 14.01l-3-3"]} />,
  Eye: (p) => <Ic {...p} d={["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"]} />,
  Image: (p) => <Ic {...p} d={["M21 15l-5-5L5 21", "M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5z", "M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"]} />,
  Moon: (p) => <Ic {...p} d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
  CreditCard: (p) => <Ic {...p} d={["M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z", "M1 10h22"]} />,
  Shield: (p) => <Ic {...p} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  Help: (p) => <Ic {...p} d={["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3", "M12 17h.01"]} />,
  LogOut: (p) => <Ic {...p} d={["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5", "M21 12H9"]} />,
  MessageCircle: (p) => <Ic {...p} d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  Award: (p) => <Ic {...p} d={["M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14z", "M8.21 13.89L7 23l5-3 5 3-1.21-9.12"]} />,
  Edit: (p) => <Ic {...p} d={["M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7", "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"]} />,
  Crown: (p) => <Ic {...p} d={["M2 4l3 12h14l3-12-6 7-4-9-4 9-6-7z", "M3 20h18"]} />,
  RefreshCw: (p) => <Ic {...p} d={["M23 4v6h-6", "M1 20v-6h6", "M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"]} />,
  Play: (p) => <Ic {...p} d="M5 3l14 9-14 9V3z" />,
  Plus: (p) => <Ic {...p} d={["M12 5v14", "M5 12h14"]} />,
  Upload: (p) => <Ic {...p} d={["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M17 8l-5-5-5 5", "M12 3v12"]} />,
  Crop: (p) => <Ic {...p} d={["M6.13 1L6 16a2 2 0 0 0 2 2h15", "M1 6.13L16 6a2 2 0 0 1 2 2v15"]} />,
  Loader: (p) => <Ic {...p} d={["M21 12a9 9 0 1 1-6.219-8.56"]} />,
  Maximize: (p) => <Ic {...p} d={["M8 3H5a2 2 0 0 0-2 2v3", "M21 8V5a2 2 0 0 0-2-2h-3", "M3 16v3a2 2 0 0 0 2 2h3", "M16 21h3a2 2 0 0 0 2-2v-3"]} />,
  ChevronRight: (p) => <Ic {...p} d="M9 18l6-6-6-6" />,
  FlipH: (p) => <Ic {...p} d={["M8 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h3", "M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3", "M12 20V4"]} />,
  Palette: (p) => <Ic {...p} d={["M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10c0 1.7-.5 2.8-1.3 3.5-.6.5-1.5.5-2.2.5H16c-1.1 0-2 .9-2 2 0 .6.2 1 .5 1.4.3.3.5.8.5 1.1 0 .8-.7 1.5-1.5 1.5H12z", "M7.5 10.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z", "M12 7.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z", "M16.5 10.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"]} />,
};

// ─── Mock Data ───────────────────────────────────────────────────────────────
const shots = [
  { id: 1, title: "Paris Eiffel", cat: "travel", type: "travel", gender: "female", style: "Realistic", likes: 12345, views: 45200, credits: 1, badge: "HOT", img: "/assets/images/templates/gold/t1_paris_eiffel.png" },
  { id: 2, title: "Lambo Night", cat: "luxury", type: "sexy", gender: "male", style: "Cinematic", likes: 9823, views: 32100, credits: 2, badge: "HOT", img: "/assets/images/templates/gold/t2_lamborghini.png", premium: true },
  { id: 3, title: "CEO Office", cat: "lifestyle", type: "business", gender: "male", style: "Corporate", likes: 6120, views: 18300, credits: 1, badge: null, img: "/assets/images/templates/gold/t3_ceo_office.png" },
  { id: 4, title: "Anime Hero", cat: "art", type: "trend", gender: "male", style: "Anime", likes: 15200, views: 52000, credits: 1, badge: "NEW", img: "/assets/images/templates/gold/t4_anime_hero.png" },
  { id: 5, title: "Tokyo Neon", cat: "travel", type: "travel", gender: "female", style: "Cinematic", likes: 8450, views: 28700, credits: 1, badge: null, img: "/assets/images/templates/gold/t5_tokyo_neon.png" },
  { id: 6, title: "Yacht Life", cat: "luxury", type: "sexy", gender: "couple", style: "Bright", likes: 4300, views: 14200, credits: 2, badge: null, img: "/assets/images/templates/gold/t6_yacht_life.png", premium: true },
  { id: 7, title: "Coffee Aesthetic", cat: "lifestyle", type: "trend", gender: "female", style: "Warm", likes: 7800, views: 23400, credits: 1, badge: null, img: "/assets/images/templates/gold/t7_coffee.png" },
  { id: 8, title: "Cyberpunk City", cat: "art", type: "trend", gender: "male", style: "Cyberpunk", likes: 18000, views: 67000, credits: 1, badge: "HOT", img: "/assets/images/templates/gold/t8_cyberpunk.png" },
  { id: 9, title: "Bali Sunset", cat: "travel", type: "travel", gender: "couple", style: "Warm", likes: 5600, views: 19800, credits: 1, badge: null, img: "/assets/images/templates/gold/t9_bali_sunset.png" },
  { id: 10, title: "Gym Beast", cat: "lifestyle", type: "sexy", gender: "male", style: "Strong", likes: 4100, views: 12500, credits: 1, badge: null, img: "/assets/images/templates/gold/t10_gym_beast.png" },
  { id: 11, title: "Christmas", cat: "seasonal", type: "traditional", gender: "couple", style: "Festive", likes: 3200, views: 9800, credits: 1, badge: "NEW", img: "/assets/images/templates/gold/t11_christmas.png" },
  { id: 12, title: "Magazine Cover", cat: "art", type: "business", gender: "female", style: "Fashion", likes: 11500, views: 38000, credits: 2, badge: null, img: "/assets/images/templates/gold/t12_magazine.png", premium: true },
];

const tales = [
  { id: "paris7", title: "PARIS 7 DAYS", cat: "Travel", gender: "female", type: "travel", duration: "many", pics: 10, credits: 8, desc: "A 7-day journey through Paris — from the airport to Eiffel Tower, through Louvre and along the Seine.", img: "/assets/images/templates/gold/t1_paris_eiffel.png",
    chapters: [
      { h: "The Beginning", text: "In 2024, you leave everything behind and buy a one-way ticket to Paris. The first night, you stand beneath the Eiffel Tower with an almost-empty bag but a heart full of hope. The lights of Paris whisper that everything will be fine if you're brave enough...", choices: ["Find a side job", "Meet a stranger"] },
      { h: "The Turning Point", text: "A French photographer needs an assistant. This is the break you've been waiting for. In a small studio in Montmartre, you learn that Paris isn't for the faint of heart — it belongs to those who dare to live fully...", choices: ["Accept immediately", "Negotiate terms"] },
      { h: "The Peak", text: "Your first photo exhibition in Paris receives rave reviews from the press. The spotlight shines directly on you. This is the moment you know buying that one-way ticket was the right call.", choices: ["Open your own studio", "Return home to share"] },
    ]},
  { id: "tokyo", title: "NEON TOKYO NIGHTS", cat: "Cyberpunk", gender: "male", type: "trend", duration: "many", pics: 8, credits: 6, desc: "Neon lights hiding the deepest secrets of the city that never sleeps.", img: "/assets/images/templates/gold/t5_tokyo_neon.png",
    chapters: [
      { h: "Arrival", text: "Tokyo at 3 AM — the city never sleeps. You step out of Narita, hologram screens everywhere, synthwave echoing from alleyways. It feels like stepping into a cyberpunk movie...", choices: ["Explore Akihabara", "Head to Shinjuku"] },
      { h: "Underground", text: "You find an underground gallery hidden behind a neon alley. Here, AI artists share works, exchange techniques, and create things the world has never seen...", choices: ["Join the showcase", "Keep observing"] },
      { h: "Reveal", text: "Your work goes viral across Tokyo. The whole city is searching for 'Neon Ghost' — the name you signed under those AI artworks taking the scene by storm. Time to decide...", choices: ["Reveal your identity", "Stay anonymous forever"] },
    ]},
  { id: "bali", title: "BALI DIGITAL NOMAD", cat: "Paradise", gender: "male", type: "travel", duration: "many", pics: 6, credits: 5, desc: "Working remotely from paradise island — the life everyone dreams of.", img: "/assets/images/templates/gold/t9_bali_sunset.png",
    chapters: [
      { h: "Landing in Bali", text: "Coconut rice, 100mbps wifi, and rice terrace views. Bali isn't just a holiday destination — it's where you're reborn. Laptop open, Bali coffee beside you, you begin a new chapter...", choices: ["Stay in Canggu", "Stay in Ubud"] },
      { h: "The Nomad Community", text: "You meet international creative directors, photographers and developers. They teach you how to monetize your passion and create passive income from AI content...", choices: ["Join a co-working space", "Work independently"] },
      { h: "Final Decision", text: "After 3 months, Bali has completely changed how you live and work. You earn more but work less. Time to decide your next move...", choices: ["Stay forever", "Bring the lifestyle home"] },
    ]},
  { id: "bae", title: "GOT A BAE", cat: "Romance", gender: "couple", type: "sexy", duration: "many", pics: 8, credits: 6, desc: "The cutest couple story — from first date butterflies to forever love.", img: "/assets/images/templates/gold/t7_coffee.png",
    chapters: [
      { h: "First Date", text: "Butterflies everywhere. You walk into the restaurant and there they are — smiling at you like you're the only person in the room. The candles flicker, the wine is poured, and the conversation flows like you've known each other forever...", choices: ["Be bold and confident", "Play it cool"] },
      { h: "Falling Hard", text: "Late night walks under string lights, surprise gifts, cooking disasters that end in laughter. Every moment together feels like a scene from a movie. Your friends say you're glowing — and they're right...", choices: ["Say I love you first", "Wait for the moment"] },
      { h: "Forever Starts Now", text: "Anniversary dinner. Champagne glasses clinking. Looking into each other's eyes, you both know — this is it. This is the person you want to wake up next to for the rest of your life.", choices: ["Plan the future together", "Live in the moment"] },
    ]},
  { id: "ceo", title: "CEO FOR A DAY", cat: "Career", gender: "male", type: "business", duration: "once", pics: 6, credits: 5, desc: "One day as a CEO — from 5AM morning routine to evening gala.", img: "/assets/images/templates/gold/t3_ceo_office.png",
    chapters: [
      { h: "The Morning Ritual", text: "5 AM. The city is still asleep but you're already up. Espresso in hand, standing at your penthouse window watching the golden sunrise. Today you run the show. Dark suit, gold cufflinks, confidence on max...", choices: ["Hit the gym first", "Head straight to office"] },
      { h: "Power Moves", text: "The boardroom falls silent as you walk in. Every seat is filled with people waiting for your vision. You lead the meeting with clarity and conviction. Deals are closed, partnerships are sealed. This is what leadership looks like...", choices: ["Close the mega deal", "Mentor the new team"] },
      { h: "Victory Lap", text: "Evening gala. Black tie. Golden chandeliers. Champagne flowing. Everyone wants to shake your hand. As you step out to your supercar under the city lights, you know — today was legendary.", choices: ["Drive into the night", "Give a toast to the team"] },
    ]},
  { id: "gym", title: "GYM TRANSFORMATION", cat: "Fitness", gender: "male", type: "sexy", duration: "many", pics: 6, credits: 5, desc: "From day one to beast mode — your ultimate fitness glow-up story.", img: "/assets/images/templates/gold/t10_gym_beast.png",
    chapters: [
      { h: "Day One", text: "The gym is intimidating. Everyone seems to know what they're doing except you. But you showed up — and that's what matters. First set of push-ups, arms shaking, but you push through. The journey of a thousand reps begins with one...", choices: ["Hire a trainer", "Follow a YouTube plan"] },
      { h: "The Grind", text: "Weeks turn into months. The weights that once crushed you now feel light. Your reflection is changing — shoulders broader, posture stronger, eyes sharper. People are starting to notice. The discipline has become your identity...", choices: ["Enter a competition", "Share progress online"] },
      { h: "Beast Mode", text: "Dramatic spotlight hits you mid-workout. Chalk dust glows amber in the air. Every rep is controlled power. You've become the person you once admired from across the gym. This isn't just fitness — it's a complete transformation.", choices: ["Inspire others", "Set a new PR"] },
    ]},
  { id: "lambo", title: "LAMBO DREAM", cat: "Luxury", gender: "male", type: "sexy", duration: "moment", pics: 8, credits: 7, desc: "From dreaming about supercars to turning the key in your own Lamborghini.", img: "/assets/images/templates/gold/t2_lamborghini.png",
    chapters: [
      { h: "The Poster on the Wall", text: "Every kid has a dream car poster. Yours was a Lamborghini. Years later, the poster faded but the dream didn't. Late nights, side hustles, smart investments — every sacrifice was fuel for this fire...", choices: ["Start a business", "Invest aggressively"] },
      { h: "Test Drive", text: "The dealership smells like leather and ambition. The sales rep hands you the key for a test drive. The V10 roars to life. Your hands tremble — not from fear, but from how close the dream feels now...", choices: ["Push it to the limit", "Cruise with style"] },
      { h: "The Key is Yours", text: "Papers signed. The key is in your hand — for real this time. You sit in YOUR Lamborghini, engine purring. The sunset hits the carbon fiber just right. This isn't about the car. It's about what you became to get here.", choices: ["Drive into the sunset", "Take a victory lap"] },
    ]},
  { id: "anime", title: "ANIME PROTAGONIST", cat: "Fantasy", gender: "male", type: "trend", duration: "many", pics: 10, credits: 8, desc: "You wake up as the main character in your favorite anime — power, friends, destiny.", img: "/assets/images/templates/gold/t4_anime_hero.png",
    chapters: [
      { h: "Awakening", text: "A flash of light. Cherry blossoms everywhere. You open your eyes in a world of vibrant colors and impossible physics. A voice whispers your name — you've been chosen. The power within you is awakening...", choices: ["Train immediately", "Explore the world"] },
      { h: "The Rival Appears", text: "At the academy, everyone underestimates you. Then HE appears — silver hair, cold eyes, a smirk that says 'you're nothing.' Your rivalry begins. Every training session pushes you beyond your limits...", choices: ["Challenge him now", "Train in secret"] },
      { h: "Final Form", text: "The sky splits open. The final boss descends. Your friends are behind you, your rival fights beside you. Golden energy surrounds your body. This is your moment — the protagonist always wins the final battle.", choices: ["Unleash full power", "Protect your friends"] },
    ]},
  { id: "yacht", title: "YACHT WEEK", cat: "Luxury", gender: "couple", type: "sexy", duration: "many", pics: 8, credits: 7, desc: "Seven days on a mega yacht — crystal waters, sunset parties, and the VIP life.", img: "/assets/images/templates/gold/t6_yacht_life.png",
    chapters: [
      { h: "Boarding", text: "The helicopter lands on the upper deck. Welcome to 200 feet of pure luxury floating on the Mediterranean. Champagne is already poured. The crew in white uniforms greets you by name. This week, the ocean belongs to you...", choices: ["Explore the yacht", "Jump in the sea"] },
      { h: "Island Hopping", text: "Hidden coves only accessible by water. Turquoise lagoons so clear you can see 30 feet down. Lunch on a private beach with a personal chef. Every island is more beautiful than the last...", choices: ["Dive the reef", "Jet ski adventure"] },
      { h: "Sunset Gala", text: "Final night. String lights across the deck. DJ playing smooth deep house. The sunset paints the sky in gold and purple. You raise a glass to the horizon. Some moments are worth every penny.", choices: ["Make a toast", "Dance till dawn"] },
    ]},
  { id: "xmas", title: "CHRISTMAS MAGIC", cat: "Seasonal", gender: "couple", type: "traditional", duration: "once", pics: 6, credits: 5, desc: "A magical Christmas story — snow, gifts, family warmth, and holiday wonder.", img: "/assets/images/templates/gold/t11_christmas.png",
    chapters: [
      { h: "First Snow", text: "The first snowflake lands on your nose. The whole city transforms overnight — twinkling lights in every window, the smell of cinnamon in the air, carolers on the corner. The magic of Christmas is real...", choices: ["Build a snowman", "Go gift shopping"] },
      { h: "Eve of Wonder", text: "Christmas Eve. The fire crackles. The tree is perfect — every ornament tells a story. Family arrives one by one, each hug warmer than the last. The kitchen is a beautiful chaos of cookies and laughter...", choices: ["Open one early gift", "Tell a family story"] },
      { h: "Christmas Morning", text: "Golden light through frosted windows. The sound of wrapping paper. Joy in every face. You realize the best gift isn't under the tree — it's the people around it. Merry Christmas.", choices: ["Share the moment", "Start a new tradition"] },
    ]},
  { id: "coffee", title: "CAFÉ CHRONICLES", cat: "Lifestyle", gender: "female", type: "trend", duration: "moment", pics: 6, credits: 4, desc: "From first sip to latte art master — a cozy journey through coffee culture.", img: "/assets/images/templates/gold/t7_coffee.png",
    chapters: [
      { h: "The First Cup", text: "A tiny café on a rainy side street. The barista with kind eyes pours something that changes your life. That first sip — bitter, warm, complex. You didn't just taste coffee. You tasted a whole new world...", choices: ["Ask about the beans", "Order another cup"] },
      { h: "The Art of Brewing", text: "You buy your first V60. Then a French press. Then an espresso machine. Your kitchen becomes a lab. Each morning is an experiment — grind size, water temp, bloom time. Your friends say you're obsessed. They're right...", choices: ["Enter a competition", "Open a pop-up"] },
      { h: "Your Own Café", text: "The sign goes up. YOUR name. YOUR café. First customer walks in. You pour a perfect rosetta latte art. They smile. The steam rises. The music plays. This is your happy place, and now the world gets to share it.", choices: ["Expand the menu", "Keep it simple"] },
    ]},
  { id: "cyber", title: "CYBERPUNK 2099", cat: "Sci-Fi", gender: "male", type: "trend", duration: "once", pics: 10, credits: 9, desc: "Neon streets, neural implants, and a heist that could change everything.", img: "/assets/images/templates/gold/t8_cyberpunk.png",
    chapters: [
      { h: "The Download", text: "Rain on chrome. Neon reflections in puddles. You jack into the neural net and download the blueprint. The megacorp doesn't know you exist — yet. In this city, information is the ultimate weapon...", choices: ["Hack deeper", "Meet your crew"] },
      { h: "The Crew", text: "A rogue AI, a street samurai, and a ghost hacker. Your crew is small but lethal. The heist requires precision — one wrong move and the corpo security drones will light up the district...", choices: ["Go in silent", "Go in loud"] },
      { h: "The Upload", text: "You did it. The data is yours. Standing on a rooftop, neon city stretching to infinity, you upload the files that will expose everything. The world will never be the same. Neither will you.", choices: ["Disappear forever", "Become a legend"] },
    ]},
];

// ─── WOW Feature Mock Data ──────────────────────────────────────────────────
const wowTopics = [
  { id: "travel", name: "Travel", emoji: "✈️", color: "#3B82F6", desc: "Explore dreamy destinations" },
  { id: "lifestyle", name: "Lifestyle", emoji: "✨", color: "#A855F7", desc: "Aesthetic daily moments" },
  { id: "fashion", name: "Fashion", emoji: "👗", color: "#EC4899", desc: "Runway-ready looks" },
  { id: "romance", name: "Romance", emoji: "💕", color: "#F43F5E", desc: "Love story vibes" },
  { id: "adventure", name: "Adventure", emoji: "🏔️", color: "#10B981", desc: "Wild & free energy" },
  { id: "food", name: "Food", emoji: "🍽️", color: "#F97316", desc: "Foodie aesthetic" },
  { id: "fitness", name: "Fitness", emoji: "💪", color: "#EF4444", desc: "Beast mode activated" },
  { id: "luxury", name: "Luxury", emoji: "👑", color: "#F59E0B", desc: "VIP lifestyle flexing" },
];
const wowPricing = [
  { id: "3d", days: 3, price: "$2.99", perDay: "$1.00", badge: "TRIAL" },
  { id: "7d", days: 7, price: "$4.99", perDay: "$0.71", badge: "POPULAR" },
  { id: "30d", days: 30, price: "$14.99", perDay: "$0.50", badge: null },
  { id: "forever", days: "∞", price: "$29.99", perDay: "$1.00", badge: "VIP", sub: "/mo" },
];
const wowTimeSlots = [
  { id: "morning", label: "Morning", time: "8:00 AM", emoji: "🌅" },
  { id: "noon", label: "Noon", time: "12:00 PM", emoji: "☀️" },
  { id: "evening", label: "Evening", time: "6:00 PM", emoji: "🌇" },
  { id: "night", label: "Night", time: "9:00 PM", emoji: "🌙" },
];
const wowDeliveryMock = {
  day: 5, total: 7, topic: "travel", date: "Mar 5, 2026",
  photos: [
    { img: `${"/assets/images/templates/gold/"}t1_paris_eiffel.png`, caption: "Lost in the streets of Santorini, where every corner is a postcard.", hashtags: "#Santorini #TravelVibes #WanderlustLife #FlexMe", ratio: "4:5", platform: "Instagram" },
    { img: `${"/assets/images/templates/gold/"}t9_bali_sunset.png`, caption: "Sunset chasing is not a hobby, it's a lifestyle.", hashtags: "#SunsetLover #GoldenHour #TravelGram #FlexMe", ratio: "9:16", platform: "TikTok" },
    { img: `${"/assets/images/templates/gold/"}t6_yacht_life.png`, caption: "Blue waters, clear mind. This is where I belong.", hashtags: "#OceanVibes #LuxuryTravel #IslandLife #FlexMe", ratio: "1:1", platform: "Facebook" },
    { img: `${"/assets/images/templates/gold/"}t5_tokyo_neon.png`, caption: "From Greek islands to neon streets — the world is my backdrop.", hashtags: "#WorldTraveler #NomadLife #ExploreMore #FlexMe", ratio: "4:5", platform: "Instagram" },
  ],
  suggestedTime: "6:00 PM — Best engagement for Travel content",
};

const vibes = [
  { id: "original", name: "Original+", color: null },
  { id: "warm", name: "Warm", color: "#F59E0B" },
  { id: "cool", name: "Cool", color: "#3B82F6" },
  { id: "golden", name: "Golden", color: "#FBBF24" },
  { id: "soft", name: "Soft Dream", color: "#F9A8D4" },
  { id: "night", name: "Night Mood", color: "#6366F1" },
  { id: "fresh", name: "Fresh", color: "#34D399" },
];

const notifs = [
  { icon: "Heart", color: C.red, text: "neo.arc liked your Cyberpunk shot", time: "2m" },
  { icon: "MessageCircle", color: C.blue, text: "flash.lab commented: \"Absolutely fire\"", time: "15m" },
  { icon: "Zap", color: C.brand, text: "You earned 1 Credit from 7-day streak!", time: "1h" },
  { icon: "Award", color: C.brand, text: "Your shot made Top Trending today", time: "3h" },
  { icon: "User", color: C.green, text: "luna.visual started following you", time: "5h" },
];

const fmt = (n) => n >= 1000 ? (n / 1000).toFixed(1) + "k" : n;

// ═══════════════════════════════════════════════════════════════════════════════
// APP COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState("splash");
  const [prevScreen, setPrevScreen] = useState(null);
  const [tab, setTab] = useState("create");
  const [credits, setCredits] = useState(12);
  const [liked, setLiked] = useState({});
  const [saved, setSaved] = useState({});
  const [filterCat, setFilterCat] = useState("all");
  const [filterGender, setFilterGender] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [storyGender, setStoryGender] = useState("all");
  const [storyType, setStoryType] = useState("all");
  const [storyDuration, setStoryDuration] = useState("all");
  const [storySearch, setStorySearch] = useState("");
  const [selectedShot, setSelectedShot] = useState(null);
  const [selectedTale, setSelectedTale] = useState(null);
  const [taleChapter, setTaleChapter] = useState(0);
  const [taleChoice, setTaleChoice] = useState(null);
  const [profileTab, setProfileTab] = useState("shots");
  const [camMode, setCamMode] = useState("photo");
  const [selectedVibe, setSelectedVibe] = useState("original");
  const [glowEnhance, setGlowEnhance] = useState(65);
  const [glowUsedToday, setGlowUsedToday] = useState(3);
  const [showNotif, setShowNotif] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [plan, setPlan] = useState("pro");
  const [toast, setToast] = useState(null);
  const [searchQ, setSearchQ] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [aiMsgs, setAiMsgs] = useState([{ role: "ai", text: "Hey Flexer! I can help you create content, suggest styles, and enhance your photos. What would you like to start with?" }]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [uploadedImg, setUploadedImg] = useState(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState("");
  const aiRef = useRef(null);
  const msgRef = useRef(null);

  const [tourSlide, setTourSlide] = useState(0);
  const [personalizeChoice, setPersonalizeChoice] = useState(null);

  // ── WOW Feature State ──
  const [wowStep, setWowStep] = useState(1);
  const [wowMode, setWowMode] = useState("solo");
  const [wowFaces, setWowFaces] = useState([null, null]);
  const [wowTopic, setWowTopic] = useState(null);
  const [wowSource, setWowSource] = useState("surprise");
  const [wowPickedPacks, setWowPickedPacks] = useState([]);
  const [wowDuration, setWowDuration] = useState("7d");
  const [wowTime, setWowTime] = useState("morning");
  const [wowActive, setWowActive] = useState(false);
  const [wowDeliveryDay, setWowDeliveryDay] = useState(5);
  const [showWowSettings, setShowWowSettings] = useState(false);

  useEffect(() => { if (screen === "splash") { const t = setTimeout(() => setScreen("tour"), 2000); return () => clearTimeout(t); } }, [screen]);
  useEffect(() => { if (msgRef.current) msgRef.current.scrollTop = msgRef.current.scrollHeight; }, [aiMsgs, aiLoading]);

  const go = (s) => { setPrevScreen(screen); setScreen(s); };
  const back = () => { setScreen(prevScreen || "main"); setPrevScreen(null); };
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  const resetWowWizard = () => { setWowStep(1); setWowMode("solo"); setWowFaces([null, null]); setWowTopic(null); setWowSource("surprise"); setWowPickedPacks([]); setWowDuration("7d"); setWowTime("morning"); };

  const sendAI = () => {
    if (!aiInput.trim() || aiLoading) return;
    const q = aiInput; setAiInput("");
    setAiMsgs(m => [...m, { role: "user", text: q }]);
    setAiLoading(true);
    const answers = {
      "Style suggestion": "Based on your profile, I suggest Cyberpunk Pastel — cold neon with film grain. A #A8E6CF filter softly layered on portrait creates an dreamy effect that's trending right now!",
      "Write caption": '"I didn\'t change — I just became the version the city lights already saw." #FlexShot #AIVisual #Aesthetic',
      "Photo tips": "Optimize: Shadow -20, Highlight +15, add Blue Split-tone in shadows. I can auto-apply this style for you right now!",
      "Concept ideas": '"Digital Ghost" is trending — shoot real photos then AI overlay glitch textures, creating a feeling of dissolving into the digital world. Perfect match for your style!',
    };
    setTimeout(() => {
      setAiLoading(false);
      setAiMsgs(m => [...m, { role: "ai", text: answers[q] || `About "${q}" — interesting idea! Try combining editorial lighting with AI art overlay. Shoot with natural light then use FlexShot to layer unique textures on top.` }]);
    }, 1300);
  };

  // ═══════════════════════════════════════════════
  // SHARED UI COMPONENTS
  // ═══════════════════════════════════════════════

  const IconBtn = ({ icon, onClick, size = 36, iconSize = 15, bg = C.card, borderColor = C.borderMed, strokeColor = C.textTer, badge, style: sx }) => {
    const IC = Icons[icon];
    return (
      <button onClick={onClick} style={{ width: size, height: size, borderRadius: 12, background: bg, border: `1px solid ${borderColor}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", flexShrink: 0, ...sx }}>
        <IC size={iconSize} stroke={strokeColor} />
        {badge && <div style={{ position: "absolute", top: 7, right: 7, width: 7, height: 7, borderRadius: "50%", background: C.brand, border: `1.5px solid ${C.bg}` }} />}
      </button>
    );
  };

  const Header = ({ title, left, right }) => (
    <div style={{ padding: "56px 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      {left || <div style={{ fontSize: 26, fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", color: C.text, letterSpacing: -2, fontFamily: "'Inter', sans-serif" }}>{title}</div>}
      <div style={{ display: "flex", gap: 8 }}>{right}</div>
    </div>
  );

  const Banner = ({ title, highlight, desc, bgImg }) => (
    <div style={{ margin: "0 20px 8px", borderRadius: 24, overflow: "hidden", position: "relative", border: `1px solid ${C.border}`, height: 160, boxShadow: "0 16px 40px rgba(0,0,0,0.4)" }}>
      <img src={bgImg} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.3 }} alt="" />
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${C.bg} 0%, rgba(5,5,5,0.7) 60%, transparent 100%)` }} />
      <div style={{ position: "relative", padding: "20px 22px", display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ padding: "5px 8px", borderRadius: 8, background: `${C.brand}20`, border: `1px solid ${C.brand}40` }}>
            <Icons.Sparkles size={14} stroke={C.brand400} />
          </div>
          <div style={{ fontSize: 8, fontWeight: 900, textTransform: "uppercase", letterSpacing: 4, color: C.brand400 }}>{title}</div>
        </div>
        <div style={{ fontSize: 20, fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", color: C.text, letterSpacing: -1, lineHeight: 1, marginBottom: 6, fontFamily: "'Inter', sans-serif" }}>{highlight}</div>
        <div style={{ fontSize: 9, color: C.textTer, textTransform: "uppercase", letterSpacing: 1, lineHeight: 1.6, fontStyle: "italic" }}>{desc}</div>
      </div>
    </div>
  );

  const BottomNav = () => (
    <div style={{ position: "absolute", bottom: 0, width: "100%", background: `${C.card}F2`, backdropFilter: "blur(20px)", borderTop: `1px solid ${C.border}`, padding: "14px 24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 200 }}>
      {[
        { id: "glow", label: "Glow", Icon: Icons.Sparkles },
        { id: "create", label: "Create", Icon: Icons.Wand },
        { id: "story", label: "Story", Icon: Icons.BookOpen },
        { id: "me", label: "Me", Icon: Icons.User },
      ].map(({ id, label, Icon: TabIcon }) => {
        const active = tab === id;
        return (
          <button key={id} onClick={() => { setScreen("main"); setTab(id); }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, border: "none", background: "none", cursor: "pointer", padding: "4px 8px", transition: "all 0.2s" }}>
            <TabIcon size={22} stroke={active ? C.brand : C.textTer} fill={active ? `${C.brand}20` : "none"} />
            {active && <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.brand, marginTop: -2 }} />}
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: active ? C.brand : C.textTer }}>{label}</div>
          </button>
        );
      })}
    </div>
  );

  // ═══════════════════════════════════════════════
  // SCREENS
  // ═══════════════════════════════════════════════

  // ── Onboarding image sets ──
  const splashImgs = ["/assets/images/onboarding/splash_1.png", "/assets/images/onboarding/splash_2.png", "/assets/images/onboarding/splash_3.png"];
  const splashHero = "/assets/images/onboarding/splash_spotlight.png";
  const glowImgs = ["/assets/images/onboarding/glow_1.png", "/assets/images/onboarding/glow_2.png", "/assets/images/onboarding/glow_3.png", "/assets/images/onboarding/glow_4.png"];
  const shotImgs = ["/assets/images/onboarding/shot_1.png", "/assets/images/onboarding/shot_2.png", "/assets/images/onboarding/shot_3.png", "/assets/images/onboarding/shot_4.png", "/assets/images/onboarding/shot_5.png"];
  const taleImgs = [
    "/assets/images/onboarding/tale_timeline.png",
    "/assets/images/onboarding/tale_d1_arrival.png",
    "/assets/images/onboarding/tale_d1_pool.png",
    "/assets/images/onboarding/tale_d2_temple.png",
    "/assets/images/onboarding/tale_d2_rice.png",
    "/assets/images/onboarding/tale_d3_cliff.png",
    "/assets/images/onboarding/tale_d3_yacht.png",
  ];
  const taleDayLabels = ["3-Day Journey", "Day 1 — Arrival", "Day 1 — Sunset", "Day 2 — Explore", "Day 2 — Adventure", "Day 3 — Freedom", "Day 3 — Cheers"];
  const loginImgs = [...glowImgs, ...shotImgs.slice(0, 3)];

  // ── Shared auto-slide hook ──
  const useAutoSlide = (images, interval = 2200) => {
    const [idx, setIdx] = useState(0);
    useEffect(() => {
      if (images.length < 2) return;
      const t = setInterval(() => setIdx(i => (i + 1) % images.length), interval);
      return () => clearInterval(t);
    }, [images.length, interval]);
    return idx;
  };

  // ── Slideshow component (crossfade + Ken Burns) ──
  const ImgSlideshow = ({ images, interval, borderRadius = 0, style: outerStyle = {} }) => {
    const idx = useAutoSlide(images, interval || 2200);
    return (
      <div style={{ position: "relative", overflow: "hidden", borderRadius, ...outerStyle }}>
        {images.map((src, i) => (
          <img key={src} src={src} alt="" style={{
            position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
            opacity: i === idx ? 1 : 0,
            transform: i === idx ? "scale(1.08)" : "scale(1.18)",
            transition: "opacity 1.2s ease, transform 8s ease-out",
          }} />
        ))}
      </div>
    );
  };

  // ── S0.1 SPLASH — Premium Grand Entrance ──
  const Splash = () => {
    const allShowcase = [...shotImgs, ...glowImgs.slice(0, 2), ...taleImgs.slice(0, 2)];
    const bgIdx = useAutoSlide(allShowcase, 1600);
    const [phase, setPhase] = useState(0); // 0=init, 1=logo-in, 2=text-in, 3=bar-fill
    useEffect(() => {
      const t1 = setTimeout(() => setPhase(1), 200);
      const t2 = setTimeout(() => setPhase(2), 800);
      const t3 = setTimeout(() => setPhase(3), 1300);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, []);
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", background: "#020005", position: "relative", overflow: "hidden" }}>
        {/* Static spotlight background — main hero */}
        <img src={splashHero} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: phase >= 1 ? 0.7 : 0.3, transition: "opacity 1.5s ease", transform: "scale(1.1)" }} />
        {/* Cycling showcase images — subtle overlay */}
        {allShowcase.map((src, i) => (
          <img key={src} src={src} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: i === bgIdx ? 0.12 : 0, transform: i === bgIdx ? "scale(1.05)" : "scale(1.2)", transition: "opacity 1.4s ease, transform 7s ease-out", filter: "blur(2px) saturate(1.2)" }} />
        ))}
        {/* Vignette overlay */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 30%, transparent 0%, rgba(2,0,5,0.5) 50%, rgba(2,0,5,0.92) 100%)" }} />
        {/* Top accent line */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${C.brand}60, transparent)`, opacity: phase >= 1 ? 1 : 0, transition: "opacity 1s ease 0.3s" }} />

        {/* Logo entrance animation */}
        <div style={{ textAlign: "center", position: "relative", zIndex: 2 }}>
          {/* Icon — scale + rotate entrance */}
          <div style={{
            width: 72, height: 72, background: C.brand, borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px",
            transform: phase >= 1 ? "rotate(12deg) scale(1)" : "rotate(-45deg) scale(0.3)",
            opacity: phase >= 1 ? 1 : 0,
            boxShadow: phase >= 2 ? `0 0 80px ${C.brand}60, 0 0 160px ${C.brand}20, 0 20px 60px rgba(0,0,0,0.5)` : `0 0 20px ${C.brand}20`,
            animation: phase >= 2 ? "glowPulse 2.5s ease-in-out infinite" : "none",
            transition: "transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.5s ease, box-shadow 1s ease 0.5s",
          }}>
            <Icons.Zap size={40} stroke="#000" fill="rgba(0,0,0,0.15)" />
          </div>
          {/* Brand name — slide up */}
          <div style={{
            fontSize: 52, fontWeight: 900, fontStyle: "italic", letterSpacing: -3, fontFamily: "'Inter', sans-serif",
            transform: phase >= 2 ? "translateY(0)" : "translateY(20px)",
            opacity: phase >= 2 ? 1 : 0,
            transition: "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease",
          }}>
            <span style={{ color: "#FFFFFF" }}>Flex</span><span style={{ color: C.brand, filter: phase >= 2 ? `drop-shadow(0 0 20px ${C.brand}80)` : "none", transition: "filter 1s ease 0.3s" }}>Me</span>
          </div>
          {/* Tagline — fade in */}
          <div style={{
            fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: 6, textTransform: "uppercase", marginTop: 14,
            opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? "translateY(0)" : "translateY(10px)",
            transition: "all 0.6s ease 0.2s",
          }}>Your glow-up starts here</div>
        </div>

        {/* Loading bar — premium animated progress */}
        <div style={{ position: "absolute", bottom: "18%", left: "50%", transform: "translateX(-50%)", width: 140, zIndex: 2, opacity: phase >= 3 ? 1 : 0, transition: "opacity 0.5s ease" }}>
          <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 2, background: `linear-gradient(90deg, ${C.brand}, #A855F7)`, width: phase >= 3 ? "100%" : "0%", transition: "width 1.5s cubic-bezier(0.4, 0, 0.2, 1)", boxShadow: `0 0 12px ${C.brand}60` }} />
          </div>
          <div style={{ textAlign: "center", marginTop: 10, fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.2)", letterSpacing: 4, fontFamily: "'JetBrains Mono', monospace" }}>LOADING</div>
        </div>

        {/* Bottom image counter dots */}
        <div style={{ position: "absolute", bottom: "10%", display: "flex", gap: 6, zIndex: 2, opacity: phase >= 3 ? 0.4 : 0, transition: "opacity 0.5s ease 0.5s" }}>
          {allShowcase.slice(0, 7).map((_, i) => (
            <div key={i} style={{ width: i === bgIdx % 7 ? 14 : 4, height: 4, borderRadius: 2, background: i === bgIdx % 7 ? C.brand : "rgba(255,255,255,0.2)", transition: "all 0.5s" }} />
          ))}
        </div>
      </div>
    );
  };

  // ── S0.2 WELCOME TOUR — 3 slides, each with UNIQUE 3D animation ──
  const tourSlides = [
    { icon: "Camera", badge: "FlexLocket", title: "Glow different.", slogan: "Main character energy, zero filter.", sub: "AI glow-up so clean even your ex won't know.", images: glowImgs, accent: "#A855F7", accentBg: "rgba(168,85,247,0.12)", speed: 2200, anim: "flip3d" },
    { icon: "Flame", badge: "FlexShot", title: "Be anywhere.", slogan: "Paris today. Tokyo tomorrow. No passport needed.", sub: "One selfie. Any vibe. AI does the rest.", images: shotImgs, accent: C.brand, accentBg: `${C.brand}15`, speed: 2000, anim: "carousel3d" },
    { icon: "Sparkles", badge: "FlexTale", title: "Own the feed.", slogan: "Your life, but make it cinematic.", sub: "AI turns you into the main character of any story.", images: taleImgs, accent: "#7C3AFF", accentBg: "rgba(124,58,255,0.12)", speed: 2000, anim: "stack3d" },
  ];

  // ── 3D Flip Card (FlexLocket) — cards flip rotateY ──
  const Flip3D = ({ images, accent, speed }) => {
    const idx = useAutoSlide(images, speed);
    return (
      <div style={{ width: 220, height: 310, perspective: 1000, margin: "0 auto" }}>
        <div style={{ width: "100%", height: "100%", position: "relative", transformStyle: "preserve-3d" }}>
          {images.map((src, i) => {
            const isActive = i === idx;
            const isPrev = i === (idx - 1 + images.length) % images.length;
            return (
              <div key={src} style={{
                position: "absolute", inset: 0, borderRadius: 26, overflow: "hidden", backfaceVisibility: "hidden",
                transform: isActive ? "rotateY(0deg) scale(1)" : isPrev ? "rotateY(-90deg) scale(0.9)" : "rotateY(90deg) scale(0.9)",
                opacity: isActive ? 1 : 0,
                transition: "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s ease",
                boxShadow: isActive ? `0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px ${accent}25, 0 0 50px ${accent}12` : "none",
              }}>
                <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(transparent, rgba(0,0,0,0.7))" }} />
              </div>
            );
          })}
          {/* Reflection glow under card */}
          <div style={{ position: "absolute", bottom: -20, left: "10%", right: "10%", height: 40, background: `${accent}15`, filter: "blur(20px)", borderRadius: "50%" }} />
        </div>
        {/* Image counter */}
        <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 16 }}>
          {images.map((_, i) => (
            <div key={i} style={{ width: i === idx ? 18 : 6, height: 6, borderRadius: 3, background: i === idx ? accent : "rgba(255,255,255,0.15)", transition: "all 0.4s", boxShadow: i === idx ? `0 0 8px ${accent}60` : "none" }} />
          ))}
        </div>
      </div>
    );
  };

  // ── 3D Carousel (FlexShot) — rotating cylinder of cards ──
  const Carousel3D = ({ images, accent, speed }) => {
    const idx = useAutoSlide(images, speed);
    const count = images.length;
    const angleStep = 360 / count;
    const tz = 180; // translateZ depth
    return (
      <div style={{ width: 260, height: 320, perspective: 900, margin: "0 auto" }}>
        <div style={{ width: 180, height: 260, position: "relative", margin: "0 auto", transformStyle: "preserve-3d", transform: `rotateY(${-idx * angleStep}deg)`, transition: "transform 1s cubic-bezier(0.4, 0, 0.2, 1)" }}>
          {images.map((src, i) => {
            const angle = i * angleStep;
            return (
              <div key={src} style={{
                position: "absolute", inset: 0, borderRadius: 22, overflow: "hidden", backfaceVisibility: "hidden",
                transform: `rotateY(${angle}deg) translateZ(${tz}px)`,
                boxShadow: `0 16px 40px rgba(0,0,0,0.6), 0 0 0 1px ${accent}15`,
              }}>
                <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.5) 100%)" }} />
              </div>
            );
          })}
        </div>
        {/* Floor reflection */}
        <div style={{ width: 120, height: 30, background: `${accent}10`, filter: "blur(20px)", borderRadius: "50%", margin: "-5px auto 0" }} />
        <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 8 }}>
          {images.map((_, i) => (
            <div key={i} style={{ width: i === idx ? 18 : 6, height: 6, borderRadius: 3, background: i === idx ? accent : "rgba(255,255,255,0.15)", transition: "all 0.4s", boxShadow: i === idx ? `0 0 8px ${accent}60` : "none" }} />
          ))}
        </div>
      </div>
    );
  };

  // ── 3D Stacked Cards (FlexTale) — travel diary stack with day labels ──
  const Stack3D = ({ images, accent, speed }) => {
    const idx = useAutoSlide(images, speed);
    const labels = taleDayLabels;
    return (
      <div style={{ width: 240, height: 360, position: "relative", margin: "0 auto", perspective: 800 }}>
        {images.map((src, i) => {
          const offset = ((i - idx + images.length) % images.length);
          const isActive = offset === 0;
          const depth = offset === 0 ? 0 : offset === 1 ? 1 : offset === images.length - 1 ? -1 : offset;
          const clampDepth = Math.min(Math.abs(depth), 3);
          return (
            <div key={src} style={{
              position: "absolute", top: 10, left: 10, width: 220, height: 310, borderRadius: 24, overflow: "hidden",
              transform: isActive
                ? "translateZ(40px) rotateY(0deg) scale(1)"
                : `translateZ(${-clampDepth * 30}px) translateX(${depth * 14}px) rotateY(${depth * -6}deg) scale(${1 - clampDepth * 0.06})`,
              opacity: clampDepth > 2 ? 0 : 1 - clampDepth * 0.2,
              zIndex: 10 - clampDepth,
              transition: "all 0.9s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: isActive ? `0 24px 60px rgba(0,0,0,0.7), 0 0 0 1.5px ${accent}30, 0 0 40px ${accent}15` : `0 8px 24px rgba(0,0,0,0.4)`,
            }}>
              <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              {/* Cinematic gradient overlay */}
              <div style={{ position: "absolute", inset: 0, background: isActive ? "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, transparent 40%, rgba(0,0,0,0.65) 100%)" : "rgba(0,0,0,0.3)" }} />
              {/* Labels on active card */}
              {isActive && labels[i] && i === 0 ? (
                /* Timeline overview card — centered title */
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", padding: "0 16px 18px", animation: "fadeIn 0.4s ease" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: 2, marginBottom: 4, textShadow: `0 0 12px ${accent}60` }}>Bali · 3 Days</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>Your journey</div>
                </div>
              ) : isActive && labels[i] && (
                /* Day photo cards — day badge + scene title */
                <>
                  <div style={{ position: "absolute", top: 12, left: 12, display: "flex", alignItems: "center", gap: 6, animation: "fadeIn 0.4s ease" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: accent, boxShadow: `0 0 8px ${accent}80` }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: 1.5, textShadow: "0 1px 6px rgba(0,0,0,0.7)" }}>
                      {labels[i].split(" — ")[0]}
                    </span>
                  </div>
                  <div style={{ position: "absolute", bottom: 14, left: 14, right: 14, animation: "fadeIn 0.5s ease 0.1s both" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.7)", marginBottom: 2 }}>
                      {labels[i].split(" — ")[1]}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-mono)", letterSpacing: 0.5 }}>
                      {i} / {images.length - 1}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
        {/* Glow */}
        <div style={{ position: "absolute", bottom: 0, left: "15%", right: "15%", height: 30, background: `${accent}12`, filter: "blur(18px)", borderRadius: "50%" }} />
        {/* Timeline dots — first = map icon, rest grouped by day */}
        <div style={{ position: "absolute", bottom: -18, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 4 }}>
          {images.map((_, i) => {
            const isMap = i === 0;
            const isStart = i > 0 && (i - 1) % 2 === 0;
            return (
              <React.Fragment key={i}>
                {isStart && <div style={{ width: 10, height: 1, background: "rgba(255,255,255,0.1)", margin: "0 1px" }} />}
                <div style={{
                  width: i === idx ? (isMap ? 22 : 20) : (isMap ? 8 : 6), height: isMap ? 8 : 6, borderRadius: isMap ? 4 : 3,
                  background: i === idx ? accent : i < idx ? `${accent}40` : "rgba(255,255,255,0.12)",
                  transition: "all 0.4s",
                  boxShadow: i === idx ? `0 0 10px ${accent}60` : "none",
                }} />
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  const AnimMap = { flip3d: Flip3D, carousel3d: Carousel3D, stack3d: Stack3D };

  const Tour = () => {
    const s = tourSlides[tourSlide];
    const IC = Icons[s.icon];
    const isLast = tourSlide === tourSlides.length - 1;
    const AnimComp = AnimMap[s.anim];
    const bgIdx = useAutoSlide(s.images, s.speed + 500);

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.bg, position: "relative", overflow: "hidden" }}>
        {/* Full-bleed background slideshow (dimmed, blurred) */}
        {s.images.map((src, i) => (
          <img key={src} src={src} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: i === bgIdx ? 0.18 : 0, filter: "blur(30px) saturate(1.4)", transform: "scale(1.3)", transition: "opacity 1.4s ease" }} />
        ))}
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${C.bg}DD 0%, ${C.bg}50 30%, ${C.bg}70 60%, ${C.bg}F0 100%)` }} />
        {/* Top accent line */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${s.accent}80, transparent)`, zIndex: 5 }} />

        {/* Skip */}
        <div style={{ position: "absolute", top: 52, right: 20, zIndex: 10 }}>
          <button onClick={() => setScreen("personalize")} style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, color: C.textSec, fontSize: 12, fontWeight: 600, cursor: "pointer", padding: "8px 18px" }}>Skip</button>
        </div>

        {/* 3D Animated Image Area */}
        <div style={{ position: "relative", zIndex: 2, flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "55px 16px 0" }}>
          <AnimComp images={s.images} accent={s.accent} speed={s.speed} />
        </div>

        {/* Badge + text */}
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: s.accentBg, border: `1px solid ${s.accent}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IC size={15} stroke={s.accent} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 900, color: s.accent, letterSpacing: 3, textTransform: "uppercase" }}>{s.badge}</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, fontStyle: "italic", color: C.text, marginBottom: 6, letterSpacing: -1 }}>{s.title}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: s.accent, letterSpacing: 0.5, marginBottom: 8, fontStyle: "italic" }}>{s.slogan}</div>
          <div style={{ fontSize: 13, color: C.textSec, lineHeight: 1.6, maxWidth: 280, margin: "0 auto", fontWeight: 500 }}>{s.sub}</div>
        </div>

        {/* Slide dots */}
        <div style={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "center", gap: 8, padding: "18px 0 14px" }}>
          {tourSlides.map((_, i) => (
            <div key={i} style={{ width: i === tourSlide ? 28 : 8, height: 8, borderRadius: 4, background: i === tourSlide ? s.accent : "rgba(255,255,255,0.1)", transition: "all 0.4s ease", boxShadow: i === tourSlide ? `0 0 12px ${s.accent}50` : "none" }} />
          ))}
        </div>

        {/* CTA */}
        <div style={{ position: "relative", zIndex: 2, padding: "0 24px 34px" }}>
          <button onClick={() => isLast ? setScreen("personalize") : setTourSlide(tourSlide + 1)}
            style={{ width: "100%", padding: "17px 0", background: isLast ? C.brand : "rgba(255,255,255,0.06)", color: isLast ? "#000" : C.text, borderRadius: 22, fontWeight: 800, fontSize: 14, letterSpacing: isLast ? 2 : 0.5, textTransform: isLast ? "uppercase" : "none", border: isLast ? "none" : "1px solid rgba(255,255,255,0.1)", cursor: "pointer", boxShadow: isLast ? `0 12px 30px ${C.brand}40` : "none", backdropFilter: isLast ? "none" : "blur(10px)", transition: "all 0.3s" }}>
            {isLast ? "Get Started" : "Next"}
          </button>
        </div>
      </div>
    );
  };

  // ── S0.3 PERSONALIZE ──
  const personalizeOpts = [
    { icon: "Camera", title: "Glow up my pics", sub: "Slay without the filter. AI magic, no cap.", accent: "#A855F7", accentBg: "rgba(168,85,247,0.1)", tabTarget: "glow", images: glowImgs },
    { icon: "Flame", title: "Put me anywhere", sub: "Yacht? Lambo? Paris? Say less.", accent: C.brand, accentBg: `${C.brand}10`, tabTarget: "create", images: shotImgs },
    { icon: "Sparkles", title: "Make me go viral", sub: "Main character storyline. Feed goes crazy.", accent: "#7C3AFF", accentBg: "rgba(124,58,255,0.1)", tabTarget: "story", images: taleImgs },
  ];

  const Personalize = () => {
    const bgIdx = useAutoSlide([...glowImgs, ...shotImgs.slice(0, 2), ...taleImgs.slice(0, 2)], 2000);
    const allBgImgs = [...glowImgs, ...shotImgs.slice(0, 2), ...taleImgs.slice(0, 2)];

    useEffect(() => {
      if (personalizeChoice !== null) {
        const t = setTimeout(() => {
          setTab(personalizeOpts[personalizeChoice].tabTarget);
          setScreen("login");
        }, 600);
        return () => clearTimeout(t);
      }
    }, [personalizeChoice]);

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.bg, position: "relative", overflow: "hidden" }}>
        {/* Cycling background */}
        {allBgImgs.map((src, i) => (
          <img key={src} src={src} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: i === bgIdx ? 0.12 : 0, filter: "blur(40px) saturate(1.3)", transform: "scale(1.4)", transition: "opacity 1.5s ease" }} />
        ))}
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${C.bg}E0 0%, ${C.bg}90 40%, ${C.bg}F0 100%)` }} />

        <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", padding: "90px 24px 40px", alignItems: "center" }}>
          {/* Header */}
          <div style={{ fontSize: 10, fontWeight: 900, color: C.brand, letterSpacing: 5, textTransform: "uppercase", marginBottom: 14 }}>Your vibe</div>
          <div style={{ fontSize: 24, fontWeight: 900, fontStyle: "italic", color: C.text, textAlign: "center", marginBottom: 6, letterSpacing: -0.5 }}>
            What's your flex?
          </div>
          <div style={{ fontSize: 13, color: C.textTer, textAlign: "center", marginBottom: 32 }}>Pick one. We'll make it hit different.</div>

          {/* Option cards with thumbnail strip */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
            {personalizeOpts.map((opt, i) => {
              const IC = Icons[opt.icon];
              const isSel = personalizeChoice === i;
              return (
                <button key={i} onClick={() => setPersonalizeChoice(i)}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, borderRadius: 20, background: isSel ? `${opt.accent}0C` : "rgba(255,255,255,0.03)", border: isSel ? `2px solid ${opt.accent}` : `1px solid rgba(255,255,255,0.06)`, textAlign: "left", cursor: "pointer", transition: "all 0.3s", boxShadow: isSel ? `0 0 0 4px ${opt.accent}10, 0 8px 28px rgba(0,0,0,0.4)` : "0 2px 8px rgba(0,0,0,0.2)", transform: isSel ? "scale(1.02)" : "scale(1)", backdropFilter: "blur(10px)" }}>
                  {/* Thumbnail preview */}
                  <div style={{ width: 56, height: 56, borderRadius: 16, overflow: "hidden", flexShrink: 0, position: "relative", border: `1px solid ${opt.accent}25` }}>
                    <ImgSlideshow images={opt.images} interval={1600 + i * 400} borderRadius={16} style={{ width: 56, height: 56 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{opt.title}</div>
                    <div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>{opt.sub}</div>
                  </div>
                  {isSel ? (
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: opt.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icons.Check size={14} stroke="#fff" strokeWidth={3} />
                    </div>
                  ) : (
                    <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid rgba(255,255,255,0.1)`, flexShrink: 0 }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ── S0.4 LOGIN ──
  const LoginScreen = () => {
    const bgIdx = useAutoSlide(loginImgs, 2500);
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.bg, position: "relative", overflow: "hidden" }}>
        {/* Cycling showcase background */}
        {loginImgs.map((src, i) => (
          <img key={src} src={src} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: i === bgIdx ? 0.25 : 0, transform: i === bgIdx ? "scale(1.05)" : "scale(1.15)", transition: "opacity 1.5s ease, transform 8s ease-out" }} />
        ))}
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${C.bg}99 0%, ${C.bg}DD 35%, ${C.bg}F8 55%, ${C.bg} 75%)` }} />

        <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 70 }}>
            <div style={{ width: 56, height: 56, background: C.brand, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", transform: "rotate(12deg)", boxShadow: `0 0 50px ${C.brand}50, 0 0 100px ${C.brand}15` }}>
              <Icons.Zap size={30} stroke="#000" fill="rgba(0,0,0,0.2)" />
            </div>
            <div style={{ fontSize: 38, fontWeight: 900, fontStyle: "italic", letterSpacing: -2, fontFamily: "'Inter', sans-serif" }}>
              <span style={{ color: "#FFFFFF" }}>Flex</span><span style={{ color: C.brand }}>Me</span>
            </div>
            <div style={{ fontSize: 12, color: C.textTer, marginTop: 10, fontWeight: 500 }}>
              Get <span style={{ color: C.brand, fontWeight: 800 }}>12 free credits</span> to start
            </div>
          </div>

          {/* Auth buttons */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
            <button onClick={() => setScreen("main")}
              style={{ width: "100%", height: 56, borderRadius: 18, background: "#fff", color: "#111", border: "none", fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, cursor: "pointer", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </button>
            <button onClick={() => setScreen("main")}
              style={{ width: "100%", height: 56, borderRadius: 18, background: "#000", color: "#fff", border: `1px solid rgba(255,255,255,0.1)`, fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, cursor: "pointer", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
              Continue with Apple
            </button>
          </div>

          {/* Anonymous */}
          <button onClick={() => setScreen("main")}
            style={{ width: "100%", height: 48, borderRadius: 18, background: "transparent", color: C.textSec, border: "none", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", marginTop: 4 }}>
            <Icons.User size={16} stroke={C.textTer} />
            Continue without account
          </button>

          {/* Terms */}
          <div style={{ marginTop: 16, textAlign: "center", fontSize: 11, color: C.textTer, lineHeight: 1.8 }}>
            By continuing, you agree to our{" "}
            <span style={{ color: "#7C3AFF", fontWeight: 600 }}>Terms</span> and{" "}
            <span style={{ color: "#7C3AFF", fontWeight: 600 }}>Privacy Policy</span>
          </div>
        </div>
      </div>
    );
  };

  // ─── GLOW TAB (FlexLocket) — Camera-First, Simple ──────────────────────────
  const GlowTab = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Minimal header */}
      <div style={{ padding: "52px 20px 10px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 900, fontStyle: "italic", color: C.text }}>
          Flex<span style={{ color: C.brand }}>Locket</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, background: `${C.brand}10`, padding: "4px 10px", borderRadius: 10, border: `1px solid ${C.brand}20` }}>
            <Icons.Zap size={10} stroke={C.brand} fill={`${C.brand}30`} />
            <span style={{ fontSize: 10, fontWeight: 800, color: C.brand, fontFamily: "'JetBrains Mono', monospace" }}>{10 - glowUsedToday}</span>
          </div>
          <IconBtn icon="Settings" onClick={() => setShowSettings(true)} />
        </div>
      </div>

      {/* ═══ CAMERA VIEWFINDER — Main focus ═══ */}
      <div style={{ flex: 1, margin: "0 16px", borderRadius: 28, background: "#0A0A0A", border: `1.5px solid ${C.borderMed}`, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0 }}>
        {/* Simulated camera feed */}
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 45%, #1a1a1a 0%, #0a0a0a 70%)` }} />
        {/* Oval face guide */}
        <div style={{
          width: 140, height: 190, borderRadius: "50%", border: `1.5px dashed ${C.brand}30`,
          position: "relative", zIndex: 2,
        }}>
          {/* Subtle face icon inside */}
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.08 }}>
            <Icons.User size={60} stroke={C.text} />
          </div>
        </div>
        {/* Corner brackets */}
        {[["t","l"],["t","r"],["b","l"],["b","r"]].map(([v,h]) => (
          <div key={v+h} style={{ position: "absolute", [v==="t"?"top":"bottom"]: 20, [h==="l"?"left":"right"]: 20, width: 24, height: 24, borderTop: v==="t" ? `2px solid ${C.brand}50` : "none", borderBottom: v==="b" ? `2px solid ${C.brand}50` : "none", borderLeft: h==="l" ? `2px solid ${C.brand}50` : "none", borderRight: h==="r" ? `2px solid ${C.brand}50` : "none", borderRadius: v==="t"&&h==="l" ? "4px 0 0 0" : v==="t"&&h==="r" ? "0 4px 0 0" : v==="b"&&h==="l" ? "0 0 0 4px" : "0 0 4px 0" }} />
        ))}
        {/* Top hint */}
        <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", padding: "4px 12px", borderRadius: 10, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.green, boxShadow: `0 0 6px ${C.green}`, animation: "pulse 1.5s infinite" }} />
          <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: 1.5, textTransform: "uppercase" }}>Ready</span>
        </div>
        {/* Flip camera button */}
        <button onClick={() => {}} style={{ position: "absolute", top: 14, right: 14, width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)", border: `1px solid rgba(255,255,255,0.1)`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icons.RefreshCw size={14} stroke="rgba(255,255,255,0.6)" />
        </button>
      </div>

      {/* ═══ VIBES — Compact strip ═══ */}
      <div style={{ display: "flex", gap: 6, padding: "12px 16px 8px", overflowX: "auto", scrollbarWidth: "none", flexShrink: 0 }}>
        {vibes.map(v => (
          <button key={v.id} onClick={() => setSelectedVibe(v.id)}
            style={{
              flexShrink: 0, display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 20,
              fontSize: 10, fontWeight: 700,
              border: selectedVibe === v.id ? `1.5px solid ${v.color || C.brand}` : `1px solid ${C.borderMed}`,
              background: selectedVibe === v.id ? `${v.color || C.brand}12` : "transparent",
              color: selectedVibe === v.id ? (v.color || C.brand) : C.textTer,
              cursor: "pointer", transition: "all 0.2s",
            }}>
            {v.color && <div style={{ width: 8, height: 8, borderRadius: "50%", background: v.color, boxShadow: selectedVibe === v.id ? `0 0 6px ${v.color}60` : "none" }} />}
            {v.name}
          </button>
        ))}
      </div>

      {/* ═══ BOTTOM CONTROLS — Gallery, Shutter, Mode ═══ */}
      <div style={{ padding: "8px 20px 100px", display: "flex", alignItems: "center", justifyContent: "center", gap: 28, flexShrink: 0 }}>
        {/* Gallery */}
        <button onClick={() => { setProcessingProgress(0); setProcessingStep(""); setGlowUsedToday(p => Math.min(p + 1, 10)); go("glow-processing"); }}
          style={{ width: 48, height: 48, borderRadius: 14, background: C.card, border: `1px solid ${C.borderMed}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icons.Image size={20} stroke={C.textTer} />
        </button>
        {/* Shutter */}
        <button onClick={() => { setProcessingProgress(0); setProcessingStep(""); setGlowUsedToday(p => Math.min(p + 1, 10)); go("glow-processing"); }}
          style={{ width: 72, height: 72, borderRadius: "50%", background: C.brand, border: `4px solid ${C.bg}`, boxShadow: `0 0 0 2px ${C.brand}40, 0 0 24px ${C.brand}30`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff" }} />
        </button>
        {/* Camera mode toggle */}
        <button onClick={() => setCamMode(m => m === "photo" ? "video" : "photo")}
          style={{ width: 48, height: 48, borderRadius: 14, background: C.card, border: `1px solid ${C.borderMed}`, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3 }}>
          {camMode === "video" ? <Icons.Play size={16} stroke={C.textTer} /> : <Icons.Camera size={16} stroke={C.textTer} />}
          <span style={{ fontSize: 6, fontWeight: 700, color: C.textTer, textTransform: "uppercase", letterSpacing: 0.5 }}>{camMode}</span>
        </button>
      </div>
    </div>
  );

  // ─── CREATE TAB (FlexShot) — Option 5 Mix Premium Layout ─────────────────
  const openShot = (shot) => { setSelectedShot(shot); go("shot-detail"); };
  const ShotLikeBtn = ({ shot, pos }) => (
    <button onClick={e => { e.stopPropagation(); setLiked(p => ({ ...p, [shot.id]: !p[shot.id] })); }}
      style={{ position: "absolute", ...pos, width: 30, height: 30, borderRadius: "50%", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5 }}>
      <Icons.Heart size={13} stroke={liked[shot.id] ? C.red : "#fff"} fill={liked[shot.id] ? C.red : "none"} />
    </button>
  );
  const ShotBadge = ({ badge }) => badge ? (
    <div style={{ padding: "3px 9px", borderRadius: 8, background: badge === "HOT" ? `linear-gradient(135deg, ${C.brand600}, ${C.brand})` : C.brand, fontSize: 8, fontWeight: 900, color: "#000", letterSpacing: 1.5, textTransform: "uppercase" }}>{badge}</div>
  ) : null;
  const PremiumBadge = () => (
    <div style={{ width: 26, height: 26, borderRadius: 9, background: `${C.brand}20`, border: `1px solid ${C.brand}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Icons.Crown size={13} stroke={C.brand} />
    </div>
  );

  const CreateTab = () => {
    const [heroIdx, setHeroIdx] = useState(0);
    const hotShots = shots.filter(s => s.badge === "HOT");
    const trendShots = shots.filter(s => s.likes > 8000).slice(0, 5);
    const premiumShots = shots.filter(s => s.premium);
    const filtered = shots
      .filter(s => filterCat === "all" || s.cat === filterCat)
      .filter(s => filterGender === "all" || s.gender === filterGender)
      .filter(s => filterType === "all" || s.type === filterType)
      .filter(s => !searchQ || s.title.toLowerCase().includes(searchQ.toLowerCase()));
    const editorPicks = shots.filter(s => s.views > 30000);

    // Hero auto-cycle
    useEffect(() => { if (hotShots.length < 2) return; const t = setInterval(() => setHeroIdx(s => (s + 1) % hotShots.length), 4000); return () => clearInterval(t); }, [hotShots.length]);

    // ── Section Header helper ──
    const SectionHead = ({ title, action, onAction }) => (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 20px 10px" }}>
        <div style={{ fontSize: 16, fontWeight: 900, fontStyle: "italic", color: C.text, letterSpacing: -0.5 }}>{title}</div>
        {action && <button onClick={onAction} style={{ background: "none", border: "none", color: C.brand, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>{action} <Icons.ChevronRight size={12} stroke={C.brand} /></button>}
      </div>
    );

    // ── Standard card for grid ──
    const ShotCard = ({ shot, tall }) => (
      <div onClick={() => openShot(shot)}
        style={{ position: "relative", borderRadius: 20, overflow: "hidden", border: `1px solid ${C.border}`, cursor: "pointer", aspectRatio: tall ? "3/5" : "3/4", boxShadow: "0 8px 28px rgba(0,0,0,0.45)" }}>
        <img src={shot.img} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={shot.title} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.15) 40%, transparent 100%)" }} />
        <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6, zIndex: 3 }}>
          <ShotBadge badge={shot.badge} />
          {shot.premium && <PremiumBadge />}
        </div>
        <ShotLikeBtn shot={shot} pos={{ top: 10, right: 10 }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 12px 12px", zIndex: 3 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", fontStyle: "italic", letterSpacing: -0.3, marginBottom: 4 }}>{shot.title}</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Icons.Heart size={10} stroke={C.textTer} />
              <span style={{ fontSize: 9, color: C.textTer }}>{fmt(shot.likes)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 3, background: `${C.brand}15`, padding: "3px 8px", borderRadius: 8 }}>
              <Icons.Zap size={8} stroke={C.brand} fill={`${C.brand}30`} />
              <span style={{ fontSize: 9, fontWeight: 800, color: C.brand, fontFamily: "'JetBrains Mono', monospace" }}>{shot.credits}</span>
            </div>
          </div>
        </div>
      </div>
    );

    // ── Editor's Pick full-width card ──
    const EditorPickCard = ({ shot }) => (
      <div onClick={() => openShot(shot)} style={{ position: "relative", borderRadius: 22, overflow: "hidden", cursor: "pointer", height: 180, margin: "6px 0", boxShadow: `0 12px 36px rgba(0,0,0,0.5), inset 0 1px 0 ${C.brand}10` }}>
        <img src={shot.img} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} alt="" />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${C.brand}, transparent)`, opacity: 0.5 }} />
        <ShotLikeBtn shot={shot} pos={{ top: 12, right: 12 }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 18px 16px", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ padding: "3px 10px", borderRadius: 8, background: `${C.brand}20`, border: `1px solid ${C.brand}30` }}>
              <span style={{ fontSize: 8, fontWeight: 900, color: C.brand, letterSpacing: 2, textTransform: "uppercase" }}>Editor's Pick</span>
            </div>
            <ShotBadge badge={shot.badge} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, fontStyle: "italic", color: "#fff", letterSpacing: -0.5, marginBottom: 4 }}>{shot.title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 10, color: C.textTer }}>{fmt(shot.views)} views</span>
            <span style={{ fontSize: 10, color: C.textTer }}>{fmt(shot.likes)} likes</span>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, background: C.brand, padding: "5px 12px", borderRadius: 10 }}>
              <Icons.Zap size={10} stroke="#000" fill="rgba(0,0,0,0.2)" />
              <span style={{ fontSize: 10, fontWeight: 900, color: "#000", fontFamily: "'JetBrains Mono', monospace" }}>{shot.credits} cr</span>
            </div>
          </div>
        </div>
      </div>
    );

    return (
      <div style={{ paddingBottom: 20 }}>
        {/* Header */}
        <Header title="FlexShot" left={
          <div style={{ fontSize: 26, fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", letterSpacing: -2, fontFamily: "'Inter', sans-serif" }}>
            <span style={{ color: C.text }}>Flex</span><span style={{ color: C.brand }}>Shot</span>
          </div>
        } right={
          <IconBtn icon="Bell" onClick={() => setShowNotif(true)} badge />
        } />

        {/* ═══ 1. HERO SPOTLIGHT — auto-cycling HOT template ═══ */}
        {hotShots.length > 0 && (
          <div style={{ margin: "0 20px 4px", borderRadius: 24, overflow: "hidden", position: "relative", height: 280, boxShadow: `0 20px 50px rgba(0,0,0,0.6), inset 0 1px 0 ${C.brand}15`, cursor: "pointer" }}
            onClick={() => openShot(hotShots[heroIdx])}>
            {hotShots.map((shot, i) => (
              <img key={shot.id} src={shot.img} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: heroIdx === i ? 1 : 0, transform: heroIdx === i ? "scale(1.05)" : "scale(1.15)", transition: "opacity 1.5s ease, transform 8s ease-out" }} />
            ))}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.88) 75%, rgba(0,0,0,0.98) 100%)" }} />
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${C.brand}, transparent)`, opacity: 0.6 }} />
            {/* Hero top badges */}
            <div style={{ position: "absolute", top: 14, left: 14, zIndex: 3, display: "flex", gap: 6, alignItems: "center" }}>
              <div style={{ padding: "4px 10px", borderRadius: 10, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)", border: `1px solid ${C.brand}30` }}>
                <span style={{ fontSize: 8, fontWeight: 900, color: C.brand, letterSpacing: 2 }}>SPOTLIGHT</span>
              </div>
              <ShotBadge badge={hotShots[heroIdx]?.badge} />
            </div>
            <ShotLikeBtn shot={hotShots[heroIdx]} pos={{ top: 14, right: 14 }} />
            {/* Hero bottom info */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 18px 18px", zIndex: 3 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.brand400, textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>{hotShots[heroIdx]?.style} Style</div>
              <div style={{ fontSize: 24, fontWeight: 900, fontStyle: "italic", color: "#fff", letterSpacing: -1, marginBottom: 6, textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}>{hotShots[heroIdx]?.title}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{fmt(hotShots[heroIdx]?.likes)} likes</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{fmt(hotShots[heroIdx]?.views)} views</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {hotShots.map((_, i) => <div key={i} style={{ width: heroIdx === i ? 16 : 5, height: 5, borderRadius: 3, background: heroIdx === i ? C.brand : "rgba(255,255,255,0.18)", transition: "all 0.5s", boxShadow: heroIdx === i ? `0 0 8px ${C.brand}60` : "none" }} />)}
                  </div>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: C.brand, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 16px ${C.brand}50` }}>
                    <Icons.ChevronRight size={18} stroke="#000" strokeWidth={3} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ 2. QUICK FILTERS ═══ */}
        <FilterBar
          hasActive={filterGender !== "all" || filterType !== "all" || filterCat !== "all" || !!searchQ}
          count={filtered.length} countLabel={`template${filtered.length !== 1 ? "s" : ""}`}
          onClear={() => { setFilterGender("all"); setFilterType("all"); setFilterCat("all"); setSearchQ(""); }}
          searchValue={searchQ} onSearch={setSearchQ} searchPlaceholder="Search templates...">
          <FilterRow label="For" value={filterGender} onChange={setFilterGender} items={[
            { id: "all", label: "All" },
            { id: "male", label: "Male", icon: "User" },
            { id: "female", label: "Female", icon: "User" },
            { id: "couple", label: "Couple", icon: "Heart" },
          ]} />
          <FilterRow label="Vibe" value={filterType} onChange={setFilterType} compact items={[
            { id: "all", label: "All" },
            { id: "sexy", label: "Sexy", icon: "Flame" },
            { id: "business", label: "Business", icon: "Award" },
            { id: "traditional", label: "Traditional" },
            { id: "trend", label: "Trending", icon: "Zap" },
            { id: "travel", label: "Travel", icon: "Camera" },
          ]} />
          <FilterRow label="Cat" value={filterCat} onChange={setFilterCat} compact items={[
            { id: "all", label: "All" },
            { id: "travel", label: "Travel" },
            { id: "luxury", label: "Luxury" },
            { id: "lifestyle", label: "Lifestyle" },
            { id: "art", label: "Art" },
            { id: "seasonal", label: "Seasonal" },
          ]} />
        </FilterBar>

        {/* ═══ 3. TRENDING — large horizontal scroll ═══ */}
        <SectionHead title="Trending Now" action="See all" />
        <div style={{ display: "flex", gap: 12, padding: "0 20px", overflowX: "auto", scrollbarWidth: "none", paddingBottom: 4 }}>
          {trendShots.map(shot => (
            <div key={shot.id} onClick={() => openShot(shot)}
              style={{ width: 160, flexShrink: 0, position: "relative", borderRadius: 20, overflow: "hidden", cursor: "pointer", aspectRatio: "3/4.5", boxShadow: "0 10px 30px rgba(0,0,0,0.45)", border: `1px solid ${C.border}` }}>
              <img src={shot.img} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={shot.title} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.1) 40%, transparent 100%)" }} />
              <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6 }}>
                <ShotBadge badge={shot.badge} />
              </div>
              <ShotLikeBtn shot={shot} pos={{ top: 10, right: 10 }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 12px 12px" }}>
                <div style={{ fontSize: 14, fontWeight: 800, fontStyle: "italic", color: "#fff", letterSpacing: -0.3, marginBottom: 4 }}>{shot.title}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 9, color: C.textTer }}>{fmt(shot.likes)} likes</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 3, background: `${C.brand}15`, padding: "3px 8px", borderRadius: 8 }}>
                    <Icons.Zap size={8} stroke={C.brand} fill={`${C.brand}30`} />
                    <span style={{ fontSize: 9, fontWeight: 800, color: C.brand, fontFamily: "'JetBrains Mono', monospace" }}>{shot.credits}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ═══ 4. STAGGERED GRID + EDITOR'S PICKS ═══ */}
        <SectionHead title="All Templates" action={filtered.length + " templates"} />
        <div style={{ padding: "0 20px" }}>
          {(() => {
            const items = [];
            let gridBuf = [];
            let rowIdx = 0;
            const flushGrid = () => {
              if (gridBuf.length === 0) return;
              for (let r = 0; r < gridBuf.length; r += 2) {
                const left = gridBuf[r];
                const right = gridBuf[r + 1];
                const leftTall = (rowIdx % 2 === 0);
                items.push(
                  <div key={`row-${rowIdx}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <ShotCard shot={left} tall={leftTall} />
                    {right ? <ShotCard shot={right} tall={!leftTall} /> : <div />}
                  </div>
                );
                rowIdx++;
              }
              gridBuf = [];
            };
            let editorIdx = 0;
            filtered.forEach((shot) => {
              gridBuf.push(shot);
              if (gridBuf.length === 4) {
                flushGrid();
                if (editorIdx < editorPicks.length) {
                  items.push(<EditorPickCard key={`ep-${editorIdx}`} shot={editorPicks[editorIdx]} />);
                  editorIdx++;
                }
              }
            });
            flushGrid();
            return items;
          })()}
        </div>

        {/* ═══ 5. PREMIUM COLLECTION — gold horizontal scroll ═══ */}
        {premiumShots.length > 0 && (
          <>
            <SectionHead title="Premium Collection" action="Unlock all" onAction={() => setShowPaywall(true)} />
            <div style={{ display: "flex", gap: 12, padding: "0 20px", overflowX: "auto", scrollbarWidth: "none", paddingBottom: 8 }}>
              {premiumShots.map(shot => (
                <div key={shot.id} onClick={() => openShot(shot)}
                  style={{ width: 150, flexShrink: 0, position: "relative", borderRadius: 20, overflow: "hidden", cursor: "pointer", aspectRatio: "3/4.5", border: `1.5px solid ${C.brand}30`, boxShadow: `0 10px 30px rgba(0,0,0,0.45), 0 0 20px ${C.brand}08` }}>
                  <img src={shot.img} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={shot.title} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 50%)" }} />
                  {/* Gold top line */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${C.brand}, transparent)`, opacity: 0.5 }} />
                  <div style={{ position: "absolute", top: 10, left: 10 }}><PremiumBadge /></div>
                  <ShotLikeBtn shot={shot} pos={{ top: 10, right: 10 }} />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 12px 12px" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, fontStyle: "italic", color: "#fff", letterSpacing: -0.3, marginBottom: 4 }}>{shot.title}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 3, background: `${C.brand}20`, padding: "4px 10px", borderRadius: 10, width: "fit-content" }}>
                      <Icons.Crown size={10} stroke={C.brand} />
                      <span style={{ fontSize: 9, fontWeight: 800, color: C.brand, fontFamily: "'JetBrains Mono', monospace" }}>{shot.credits} cr</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  // ─── STORY TAB (FlexTale) — 3D Swing Cards ─────────────────────────────────
  const G = "/assets/images/templates/gold/", V = "/assets/images/templates/viral/";
  const storyImgMap = {
    paris7: [`${G}t1_paris_eiffel.png`, `${G}t7_coffee.png`, `${G}t12_magazine.png`],
    tokyo: [`${G}t5_tokyo_neon.png`, `${G}t8_cyberpunk.png`, `${G}t4_anime_hero.png`],
    bali: [`${G}t9_bali_sunset.png`, `${G}t6_yacht_life.png`, `${G}t7_coffee.png`],
    bae: [`${V}t7_coffee.png`, `${V}t9_bali_sunset.png`, `${V}t12_magazine.png`],
    ceo: [`${G}t3_ceo_office.png`, `${G}t2_lamborghini.png`, `${G}t12_magazine.png`],
    gym: [`${G}t10_gym_beast.png`, `${V}t10_gym_beast.png`, `${G}t3_ceo_office.png`],
    lambo: [`${G}t2_lamborghini.png`, `${V}t2_lamborghini.png`, `${G}t6_yacht_life.png`],
    anime: [`${G}t4_anime_hero.png`, `${V}t4_anime_hero.png`, `${G}t5_tokyo_neon.png`],
    yacht: [`${G}t6_yacht_life.png`, `${V}t6_yacht_life.png`, `${G}t9_bali_sunset.png`],
    xmas: [`${G}t11_christmas.png`, `${V}t11_christmas.png`, `${G}t7_coffee.png`],
    coffee: [`${G}t7_coffee.png`, `${V}t7_coffee.png`, `${G}t1_paris_eiffel.png`],
    cyber: [`${G}t8_cyberpunk.png`, `${V}t8_cyberpunk.png`, `${G}t5_tokyo_neon.png`],
  };

  // ─── Shared helpers ──
  const CreditPill = ({ credits: cr }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 3, background: `${C.brand}10`, padding: "4px 9px", borderRadius: 10, flexShrink: 0 }}>
      <Icons.Zap size={9} stroke={C.brand} fill={`${C.brand}30`} />
      <span style={{ fontSize: 9, fontWeight: 800, color: C.brand, fontFamily: "'JetBrains Mono', monospace" }}>{cr}</span>
    </div>
  );
  const CatPill = ({ cat }) => (
    <div style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(10px)", padding: "3px 10px", borderRadius: 10, border: `1px solid ${C.brand}25` }}>
      <span style={{ fontSize: 8, fontWeight: 800, color: C.brand, textTransform: "uppercase", letterSpacing: 1.5 }}>{cat}</span>
    </div>
  );
  const openTale = (tale) => { setSelectedTale(tale); go("tale-preview"); };
  const GoBtn = ({ onClick, size = 36 }) => (
    <button onClick={e => { e.stopPropagation(); onClick(); }} style={{ width: size, height: size, borderRadius: "50%", background: C.brand, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 16px ${C.brand}50`, flexShrink: 0, transition: "transform 0.2s" }}>
      <Icons.ChevronRight size={size * 0.5} stroke="#000" strokeWidth={3} />
    </button>
  );

  // ── Dot indicator helper ──
  const Dots = ({ count, active }) => (
    <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{ width: active === i ? 16 : 5, height: 5, borderRadius: 3, background: active === i ? C.brand : "rgba(255,255,255,0.18)", transition: "all 0.5s cubic-bezier(0.4,0,0.2,1)", boxShadow: active === i ? `0 0 8px ${C.brand}60` : "none" }} />
      ))}
    </div>
  );
  // ── Info footer helper ──
  const CardInfo = ({ tale, clamp = 2 }) => (
    <div style={{ padding: "12px 16px 14px", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
          <div style={{ flex: 1, fontSize: 15, fontWeight: 900, color: C.text, letterSpacing: -0.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontStyle: "italic" }}>{tale.title}</div>
          <CreditPill credits={tale.credits} />
        </div>
        <div style={{ fontSize: 11, color: C.textSec, lineHeight: 1.55, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: clamp, WebkitBoxOrient: "vertical", marginBottom: 5 }}>{tale.desc}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, color: C.textTer, fontFamily: "'JetBrains Mono', monospace" }}>{tale.chapters.length} ch · {tale.pics} img</span>
        </div>
      </div>
      <GoBtn onClick={() => openTale(tale)} />
    </div>
  );

  // ═══ STYLE A — CINEMATIC PARALLAX ═══
  // Full-bleed hero image with slow parallax zoom + crossfade, gold accent line, premium overlay
  const StoryStyleA = ({ tale }) => {
    const [idx, setIdx] = useState(0);
    const imgs = storyImgMap[tale.id] || [tale.img];
    useEffect(() => { const t = setInterval(() => setIdx(s => (s + 1) % imgs.length), 3800); return () => clearInterval(t); }, [imgs.length]);
    return (
      <div onClick={() => openTale(tale)} style={{ borderRadius: 24, overflow: "hidden", cursor: "pointer", position: "relative", height: 320, boxShadow: `0 20px 50px rgba(0,0,0,0.6), inset 0 1px 0 ${C.brand}15` }}>
        {imgs.map((img, i) => (
          <img key={i} src={img} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: idx === i ? 1 : 0, transform: idx === i ? "scale(1.08)" : "scale(1.15)", transition: "opacity 1.5s cubic-bezier(0.4,0,0.2,1), transform 8s ease-out" }} />
        ))}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.85) 75%, rgba(0,0,0,0.98) 100%)" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${C.brand}, transparent)`, opacity: 0.6 }} />
        <div style={{ position: "absolute", top: 14, left: 14, zIndex: 2 }}><CatPill cat={tale.cat} /></div>
        <div style={{ position: "absolute", top: 14, right: 14, zIndex: 2 }}><CreditPill credits={tale.credits} /></div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 18px 18px", zIndex: 2 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: -0.8, marginBottom: 6, fontStyle: "italic", textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}>{tale.title}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.55, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", marginBottom: 10 }}>{tale.desc}</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono', monospace" }}>{tale.chapters.length} chapters · {tale.pics} images</span>
              <Dots count={imgs.length} active={idx} />
            </div>
            <GoBtn onClick={() => openTale(tale)} size={38} />
          </div>
        </div>
      </div>
    );
  };

  // ═══ STYLE B — GLASS CAROUSEL ═══
  // 3D rotating cards in a glass container with frosted background blur
  const StoryStyleB = ({ tale }) => {
    const [active, setActive] = useState(0);
    const imgs = storyImgMap[tale.id] || [tale.img];
    const N = imgs.length;
    useEffect(() => { const t = setInterval(() => setActive(s => (s + 1) % N), 2800); return () => clearInterval(t); }, [N]);
    const getPos = (i) => {
      const d = (i - active + N) % N;
      if (d === 0) return { z: 10, tx: 0, ry: 0, sc: 1, op: 1, br: 1 };
      if (d === 1) return { z: 5, tx: 65, ry: 15, sc: 0.78, op: 0.55, br: 0.4 };
      if (d === N - 1) return { z: 5, tx: -65, ry: -15, sc: 0.78, op: 0.55, br: 0.4 };
      return { z: 1, tx: 0, ry: 0, sc: 0.6, op: 0, br: 0.2 };
    };
    return (
      <div onClick={() => openTale(tale)} style={{ borderRadius: 24, overflow: "hidden", cursor: "pointer", background: `linear-gradient(135deg, ${C.card}, #0a0a0a)`, border: `1px solid rgba(255,255,255,0.04)`, boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
        <div style={{ position: "relative", height: 230, overflow: "hidden", perspective: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* ambient glow */}
          <div style={{ position: "absolute", width: "70%", height: "70%", borderRadius: "50%", background: `radial-gradient(circle, ${C.brand}08 0%, transparent 70%)`, top: "50%", left: "50%", transform: "translate(-50%,-50%)", filter: "blur(20px)" }} />
          {imgs.map((img, i) => { const p = getPos(i); return (
            <div key={i} style={{ position: "absolute", width: 125, height: 175, borderRadius: 16, overflow: "hidden", border: `2px solid ${p.z === 10 ? C.brand + '50' : 'rgba(255,255,255,0.04)'}`, boxShadow: p.z === 10 ? `0 15px 35px rgba(0,0,0,0.7), 0 0 20px ${C.brand}15` : "0 8px 20px rgba(0,0,0,0.4)", transform: `translateX(${p.tx}px) rotateY(${p.ry}deg) scale(${p.sc})`, opacity: p.op, zIndex: p.z, filter: `brightness(${p.br})`, transition: "all 0.8s cubic-bezier(0.34,1.4,0.64,1)", transformStyle: "preserve-3d" }}>
              <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ); })}
          <div style={{ position: "absolute", top: 12, left: 12, zIndex: 20 }}><CatPill cat={tale.cat} /></div>
          <div style={{ position: "absolute", bottom: 10, zIndex: 20 }}><Dots count={N} active={active} /></div>
        </div>
        <CardInfo tale={tale} clamp={2} />
      </div>
    );
  };

  // ═══ STYLE C — ACCORDION REVEAL ═══
  // 3 portrait strips that expand on focus with smooth glow transition
  const StoryStyleC = ({ tale }) => {
    const [focus, setFocus] = useState(0);
    const imgs = storyImgMap[tale.id] || [tale.img, tale.img, tale.img];
    useEffect(() => { const t = setInterval(() => setFocus(s => (s + 1) % 3), 2600); return () => clearInterval(t); }, []);
    return (
      <div onClick={() => openTale(tale)} style={{ borderRadius: 24, overflow: "hidden", cursor: "pointer", background: C.card, border: `1px solid rgba(255,255,255,0.04)`, boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", gap: 3, height: 240, position: "relative" }}>
          {imgs.slice(0, 3).map((img, i) => (
            <div key={i} style={{ flex: focus === i ? 2.5 : 0.8, overflow: "hidden", position: "relative", transition: "flex 0.9s cubic-bezier(0.25,0.8,0.25,1)", borderRadius: focus === i ? 0 : 2 }}>
              <img src={img || imgs[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 4s ease, filter 0.6s", transform: focus === i ? "scale(1.08)" : "scale(1.15)", filter: focus === i ? "brightness(1) saturate(1.1)" : "brightness(0.35) saturate(0.7)" }} />
              <div style={{ position: "absolute", inset: 0, background: focus === i ? "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)" : "none", transition: "all 0.6s" }} />
              {focus === i && (
                <div style={{ position: "absolute", bottom: 10, left: 10, right: 10, zIndex: 2 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: C.brand, textTransform: "uppercase", letterSpacing: 2, fontFamily: "'JetBrains Mono', monospace" }}>Ch. {i + 1}</div>
                </div>
              )}
            </div>
          ))}
          <div style={{ position: "absolute", top: 12, left: 12, zIndex: 2, display: "flex", gap: 6 }}>
            <CatPill cat={tale.cat} />
          </div>
          <div style={{ position: "absolute", top: 12, right: 12, zIndex: 2 }}><CreditPill credits={tale.credits} /></div>
        </div>
        <CardInfo tale={tale} clamp={2} />
      </div>
    );
  };

  // ═══ STYLE D — FLOATING POLAROID ═══
  // Text left side, polaroid-style card floats right with tilt + shadow animation
  const StoryStyleD = ({ tale }) => {
    const [idx, setIdx] = useState(0);
    const imgs = storyImgMap[tale.id] || [tale.img];
    useEffect(() => { const t = setInterval(() => setIdx(s => (s + 1) % imgs.length), 3400); return () => clearInterval(t); }, [imgs.length]);
    const tilts = ["-3deg", "2deg", "-1.5deg"];
    return (
      <div onClick={() => openTale(tale)} style={{ borderRadius: 24, overflow: "hidden", cursor: "pointer", display: "flex", background: `linear-gradient(135deg, ${C.card}, #0c0c0c)`, border: `1px solid rgba(255,255,255,0.04)`, height: 210, boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
        <div style={{ flex: 1, padding: "18px 4px 18px 18px", display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
          <div style={{ marginBottom: 8 }}><CatPill cat={tale.cat} /></div>
          <div style={{ fontSize: 17, fontWeight: 900, color: C.text, letterSpacing: -0.4, marginBottom: 6, fontStyle: "italic", lineHeight: 1.2 }}>{tale.title}</div>
          <div style={{ fontSize: 11, color: C.textSec, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", marginBottom: 10 }}>{tale.desc}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 10, color: C.textTer, fontFamily: "'JetBrains Mono', monospace" }}>{tale.chapters.length} ch · {tale.pics} img</span>
            <CreditPill credits={tale.credits} />
            <div style={{ marginLeft: "auto" }}><GoBtn onClick={() => openTale(tale)} size={32} /></div>
          </div>
        </div>
        <div style={{ width: 155, flexShrink: 0, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", perspective: 400 }}>
          {imgs.map((img, i) => (
            <div key={i} style={{ position: "absolute", width: 115, height: 158, background: "#fff", borderRadius: 4, padding: "6px 6px 24px", boxShadow: idx === i ? `0 12px 35px rgba(0,0,0,0.6), 0 0 15px ${C.brand}10` : "0 4px 12px rgba(0,0,0,0.3)", transform: `rotate(${tilts[i % 3]}) scale(${idx === i ? 1 : 0.88}) translateY(${idx === i ? 0 : 8}px)`, opacity: idx === i ? 1 : 0.25, zIndex: idx === i ? 10 : 5 - i, transition: "all 0.8s cubic-bezier(0.34,1.3,0.64,1)" }}>
              <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 2 }} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ═══ STYLE E — SPLIT DIAGONAL ═══
  // Diagonal split with image crossfade top, text bottom, gold diagonal line
  const StoryStyleE = ({ tale }) => {
    const [idx, setIdx] = useState(0);
    const imgs = storyImgMap[tale.id] || [tale.img];
    useEffect(() => { const t = setInterval(() => setIdx(s => (s + 1) % imgs.length), 3200); return () => clearInterval(t); }, [imgs.length]);
    return (
      <div onClick={() => openTale(tale)} style={{ borderRadius: 24, overflow: "hidden", cursor: "pointer", position: "relative", height: 260, background: C.card, border: `1px solid rgba(255,255,255,0.04)`, boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
        {/* Image layer with clip-path diagonal */}
        <div style={{ position: "absolute", inset: 0, clipPath: "polygon(0 0, 100% 0, 100% 60%, 0 80%)" }}>
          {imgs.map((img, i) => (
            <img key={i} src={img} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: idx === i ? 1 : 0, transition: "opacity 1.2s ease, transform 6s ease", transform: idx === i ? "scale(1.05)" : "scale(1.12)" }} />
          ))}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.7) 100%)" }} />
        </div>
        {/* Diagonal gold line */}
        <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${C.brand}60, ${C.brand}20, transparent)`, top: "68%", transform: "rotate(-3.5deg)", transformOrigin: "left center", zIndex: 3 }} />
        {/* Pills */}
        <div style={{ position: "absolute", top: 14, left: 14, zIndex: 4, display: "flex", gap: 6 }}>
          <CatPill cat={tale.cat} />
          <CreditPill credits={tale.credits} />
        </div>
        {/* Text at bottom */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 18px 16px", zIndex: 4 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: C.text, letterSpacing: -0.5, marginBottom: 4, fontStyle: "italic" }}>{tale.title}</div>
          <div style={{ fontSize: 11, color: C.textSec, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", marginBottom: 6 }}>{tale.desc}</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 10, color: C.textTer, fontFamily: "'JetBrains Mono', monospace" }}>{tale.chapters.length} ch · {tale.pics} img</span>
              <Dots count={imgs.length} active={idx} />
            </div>
            <GoBtn onClick={() => openTale(tale)} size={36} />
          </div>
        </div>
      </div>
    );
  };

  // ═══ STYLE F — VERTICAL TRIPTYCH ═══
  // 3 portrait thumbnails in a row, the center one rises up with glow border
  const StoryStyleF = ({ tale }) => {
    const [center, setCenter] = useState(1);
    const imgs = storyImgMap[tale.id] || [tale.img, tale.img, tale.img];
    useEffect(() => { const t = setInterval(() => setCenter(s => (s + 1) % 3), 3000); return () => clearInterval(t); }, []);
    return (
      <div onClick={() => openTale(tale)} style={{ borderRadius: 24, overflow: "hidden", cursor: "pointer", background: C.card, border: `1px solid rgba(255,255,255,0.04)`, boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", alignItems: "center", padding: "20px 20px 8px", height: 210 }}>
          {imgs.slice(0, 3).map((img, i) => {
            const isCenter = center === i;
            return (
              <div key={i} style={{ width: isCenter ? 105 : 85, height: isCenter ? 155 : 125, borderRadius: isCenter ? 16 : 12, overflow: "hidden", border: isCenter ? `2px solid ${C.brand}50` : "2px solid rgba(255,255,255,0.04)", boxShadow: isCenter ? `0 10px 30px rgba(0,0,0,0.6), 0 0 20px ${C.brand}15` : "0 4px 12px rgba(0,0,0,0.3)", transition: "all 0.7s cubic-bezier(0.34,1.2,0.64,1)", transform: isCenter ? "translateY(-8px)" : "translateY(6px)", filter: isCenter ? "brightness(1) saturate(1.1)" : "brightness(0.5) saturate(0.6)", flexShrink: 0 }}>
                <img src={img || imgs[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            );
          })}
        </div>
        <CardInfo tale={tale} clamp={2} />
      </div>
    );
  };

  // ═══ STYLE G — SPOTLIGHT FOCUS ═══
  // Single large portrait with breathing glow border animation, blurred bg
  const StoryStyleG = ({ tale }) => {
    const [idx, setIdx] = useState(0);
    const imgs = storyImgMap[tale.id] || [tale.img];
    useEffect(() => { const t = setInterval(() => setIdx(s => (s + 1) % imgs.length), 4000); return () => clearInterval(t); }, [imgs.length]);
    return (
      <div onClick={() => openTale(tale)} style={{ borderRadius: 24, overflow: "hidden", cursor: "pointer", background: "#060606", border: `1px solid rgba(255,255,255,0.04)`, boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
        <div style={{ position: "relative", height: 250, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {/* Blurred ambient bg */}
          <img src={imgs[idx]} alt="" style={{ position: "absolute", inset: -20, width: "calc(100% + 40px)", height: "calc(100% + 40px)", objectFit: "cover", filter: "blur(30px) brightness(0.25) saturate(1.5)", transition: "all 1s" }} />
          {/* Main portrait card */}
          {imgs.map((img, i) => (
            <div key={i} style={{ position: "absolute", width: 140, height: 200, borderRadius: 18, overflow: "hidden", border: `2px solid ${idx === i ? C.brand + '50' : 'transparent'}`, boxShadow: idx === i ? `0 15px 40px rgba(0,0,0,0.7), 0 0 30px ${C.brand}20` : "none", opacity: idx === i ? 1 : 0, transform: idx === i ? "scale(1) rotate(0deg)" : "scale(0.85) rotate(3deg)", transition: "all 0.9s cubic-bezier(0.34,1.2,0.64,1)" }}>
              <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ))}
          <div style={{ position: "absolute", top: 12, left: 12, zIndex: 3, display: "flex", gap: 6 }}>
            <CatPill cat={tale.cat} />
            <CreditPill credits={tale.credits} />
          </div>
          <div style={{ position: "absolute", bottom: 10, zIndex: 3 }}><Dots count={imgs.length} active={idx} /></div>
        </div>
        <CardInfo tale={tale} clamp={2} />
      </div>
    );
  };

  // ═══ STYLE H — MAGAZINE SPREAD ═══
  // Two stacked portrait cards offset like a magazine, auto swap with flip
  const StoryStyleH = ({ tale }) => {
    const [front, setFront] = useState(0);
    const imgs = storyImgMap[tale.id] || [tale.img];
    useEffect(() => { const t = setInterval(() => setFront(s => (s + 1) % imgs.length), 3500); return () => clearInterval(t); }, [imgs.length]);
    return (
      <div onClick={() => openTale(tale)} style={{ borderRadius: 24, overflow: "hidden", cursor: "pointer", background: `linear-gradient(145deg, #0e0e0e, ${C.card})`, border: `1px solid rgba(255,255,255,0.04)`, height: 220, display: "flex", boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
        {/* Card stack area */}
        <div style={{ width: 170, flexShrink: 0, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", perspective: 600 }}>
          {imgs.map((img, i) => {
            const isFront = front === i;
            const isBack = (front + 1) % imgs.length === i;
            return (
              <div key={i} style={{ position: "absolute", width: 110, height: 155, borderRadius: 14, overflow: "hidden", border: `2px solid ${isFront ? C.brand + '40' : 'rgba(255,255,255,0.03)'}`, boxShadow: isFront ? `0 12px 30px rgba(0,0,0,0.6), 0 0 15px ${C.brand}10` : "0 4px 15px rgba(0,0,0,0.3)", transform: isFront ? "translate(-8px, -4px) rotate(-4deg) scale(1)" : isBack ? "translate(12px, 6px) rotate(3deg) scale(0.9)" : "translate(20px, 10px) rotate(6deg) scale(0.82)", opacity: isFront ? 1 : isBack ? 0.5 : 0.15, zIndex: isFront ? 10 : isBack ? 5 : 1, transition: "all 0.9s cubic-bezier(0.34,1.3,0.64,1)", transformOrigin: "center center" }}>
                <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            );
          })}
        </div>
        {/* Text area */}
        <div style={{ flex: 1, padding: "18px 18px 18px 4px", display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
          <div style={{ marginBottom: 8, display: "flex", gap: 6 }}><CatPill cat={tale.cat} /><CreditPill credits={tale.credits} /></div>
          <div style={{ fontSize: 16, fontWeight: 900, color: C.text, letterSpacing: -0.4, marginBottom: 6, fontStyle: "italic", lineHeight: 1.2 }}>{tale.title}</div>
          <div style={{ fontSize: 11, color: C.textSec, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", marginBottom: 8 }}>{tale.desc}</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, color: C.textTer, fontFamily: "'JetBrains Mono', monospace" }}>{tale.chapters.length} ch · {tale.pics} img</span>
            <GoBtn onClick={() => openTale(tale)} size={32} />
          </div>
        </div>
      </div>
    );
  };

  // ═══ Layout: 8 unique styles, never repeat adjacent ═══
  const storyStyles = [StoryStyleA, StoryStyleB, StoryStyleC, StoryStyleD, StoryStyleE, StoryStyleF, StoryStyleG, StoryStyleH];

  // ── Premium filter components ──
  const FilterRow = ({ label, items, value, onChange, compact }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 36 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.textTer, letterSpacing: 0.5, flexShrink: 0, width: 34, textAlign: "right" }}>{label}</div>
      <div style={{ display: "flex", gap: 4, overflowX: "auto", scrollbarWidth: "none", flex: 1 }}>
        {items.map(it => {
          const on = value === it.id;
          const isAll = it.id === "all";
          return (
            <button key={it.id} onClick={() => onChange(on && !isAll ? "all" : it.id)}
              style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 4, padding: compact ? "5px 10px" : "6px 13px", borderRadius: 10, fontSize: compact ? 10 : 11, fontWeight: on ? 700 : 500, background: on ? (isAll ? "rgba(255,255,255,0.08)" : `${C.brand}15`) : "transparent", color: on ? (isAll ? C.text : C.brand) : C.textTer, border: on ? `1px solid ${isAll ? "rgba(255,255,255,0.1)" : C.brand + '30'}` : "1px solid transparent", cursor: "pointer", transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)", whiteSpace: "nowrap", letterSpacing: 0.2 }}>
              {it.icon && Icons[it.icon] && React.createElement(Icons[it.icon], { size: 10, stroke: on ? C.brand : C.textTer, strokeWidth: on ? 2 : 1.5 })}
              {it.label}
            </button>
          );
        })}
      </div>
    </div>
  );
  const FilterBar = ({ children, hasActive, count, countLabel, onClear, searchValue, onSearch, searchPlaceholder }) => (
    <div style={{ margin: "8px 16px", borderRadius: 16, background: "rgba(255,255,255,0.02)", border: `1px solid ${hasActive ? C.brand + '15' : 'rgba(255,255,255,0.04)'}`, padding: "8px 10px", transition: "border-color 0.3s" }}>
      {/* Search input */}
      {onSearch && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "0 10px", marginBottom: 6 }}>
          <Icons.Search size={13} stroke={C.textTer} />
          <input value={searchValue || ""} onChange={e => onSearch(e.target.value)} placeholder={searchPlaceholder || "Search..."}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "9px 0", fontSize: 12, color: C.text, fontFamily: "inherit", fontWeight: 500 }} />
          {searchValue && (
            <button onClick={() => onSearch("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }}>
              <Icons.X size={12} stroke={C.textTer} />
            </button>
          )}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {children}
      </div>
      {hasActive && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, marginTop: 6, borderTop: `1px solid rgba(255,255,255,0.04)` }}>
          <span style={{ fontSize: 11, color: C.textSec, fontWeight: 600 }}>{count} {countLabel}</span>
          <button onClick={onClear}
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "4px 10px", color: C.textSec, fontSize: 10, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, transition: "all 0.2s" }}>
            <Icons.X size={9} stroke={C.textSec} /> Reset
          </button>
        </div>
      )}
    </div>
  );

  const StoryTab = () => {
    const filteredTales = tales
      .filter(t => storyGender === "all" || t.gender === storyGender)
      .filter(t => storyType === "all" || t.type === storyType)
      .filter(t => storyDuration === "all" || t.duration === storyDuration)
      .filter(t => !storySearch || t.title.toLowerCase().includes(storySearch.toLowerCase()) || t.desc.toLowerCase().includes(storySearch.toLowerCase()));
    const hasStoryFilter = storyGender !== "all" || storyType !== "all" || storyDuration !== "all" || !!storySearch;

    return (
      <div>
        <Header title="FlexTale" left={
          <div style={{ fontSize: 26, fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", letterSpacing: -2, fontFamily: "'Inter', sans-serif" }}>
            <span style={{ color: C.text }}>Flex</span><span style={{ color: C.brand }}>Tale</span>
          </div>
        } right={
          <button onClick={() => setShowPaywall(true)} style={{ background: `${C.brand}15`, border: `1px solid ${C.brand}30`, padding: "7px 14px", borderRadius: 16, color: C.brand, fontSize: 12, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "'JetBrains Mono', monospace" }}>
            <Icons.Zap size={14} stroke={C.brand} fill={`${C.brand}30`} /> {credits}
          </button>
        } />
        <Banner title="Interactive Stories" highlight="Live the narrative" desc="Beyond the page. AI creates your story. You make the choices." bgImg="/assets/images/banners/gold_flextale.png" />

        {/* Filters */}
        <FilterBar
          hasActive={hasStoryFilter}
          count={filteredTales.length} countLabel={`stor${filteredTales.length !== 1 ? "ies" : "y"}`}
          onClear={() => { setStoryGender("all"); setStoryType("all"); setStoryDuration("all"); setStorySearch(""); }}
          searchValue={storySearch} onSearch={setStorySearch} searchPlaceholder="Search stories...">
          <FilterRow label="For" value={storyGender} onChange={setStoryGender} items={[
            { id: "all", label: "All" },
            { id: "male", label: "Male", icon: "User" },
            { id: "female", label: "Female", icon: "User" },
            { id: "couple", label: "Couple", icon: "Heart" },
          ]} />
          <FilterRow label="Vibe" value={storyType} onChange={setStoryType} compact items={[
            { id: "all", label: "All" },
            { id: "sexy", label: "Sexy", icon: "Flame" },
            { id: "business", label: "Business", icon: "Award" },
            { id: "traditional", label: "Traditional" },
            { id: "trend", label: "Trending", icon: "Zap" },
            { id: "travel", label: "Travel", icon: "Camera" },
          ]} />
          <FilterRow label="Time" value={storyDuration} onChange={setStoryDuration} items={[
            { id: "all", label: "All" },
            { id: "moment", label: "Moment", icon: "Zap" },
            { id: "once", label: "One Day", icon: "Sparkles" },
            { id: "many", label: "Many Days", icon: "Layers" },
          ]} />
        </FilterBar>

        {/* ═══ WOW HERO CARD — Make Me WOW Everyday ═══ */}
        <div style={{ padding: "12px 16px 0" }}>
          {!wowActive ? (
            /* ── Not subscribed: Animated gradient CTA ── */
            <div onClick={() => go("wow-intro")}
              style={{ borderRadius: 24, overflow: "hidden", cursor: "pointer", position: "relative", padding: "22px 20px", background: "linear-gradient(135deg, #7C3AFF 0%, #F59E0B 40%, #EC4899 100%)", backgroundSize: "200% 200%", animation: "wowGlow 4s ease infinite", boxShadow: "0 16px 40px rgba(124,58,255,0.25), 0 0 30px rgba(245,158,11,0.15)" }}>
              {/* Shimmer overlay */}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%)", backgroundSize: "200% 100%", animation: "shimmerLine 3s infinite" }} />
              <div style={{ position: "relative", zIndex: 2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ animation: "crownFloat 3s ease-in-out infinite" }}>
                    <Icons.Crown size={28} stroke="#fff" fill="rgba(255,255,255,0.15)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 4, color: "rgba(255,255,255,0.7)", textTransform: "uppercase" }}>VIP Feature</div>
                    <div style={{ fontSize: 18, fontWeight: 900, fontStyle: "italic", color: "#fff", letterSpacing: -0.5, textTransform: "uppercase", textShadow: "0 2px 12px rgba(0,0,0,0.3)" }}>MAKE ME WOW EVERYDAY</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: 600, marginBottom: 14, lineHeight: 1.5 }}>
                  Subscribe once — get AI photos delivered daily. No credits needed. Just post and flex.
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ padding: "5px 12px", borderRadius: 20, background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.25)" }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", letterSpacing: 1 }}>SUBSCRIPTION ONLY</span>
                  </div>
                  <div style={{ padding: "5px 10px", borderRadius: 20, background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.15)" }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.8)", letterSpacing: 0.5 }}>From $2.99</span>
                  </div>
                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 16, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}>
                    <Icons.Crown size={14} stroke="#F59E0B" />
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#fff", letterSpacing: 0.5 }}>Subscribe</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ── Subscribed: Mini dashboard ── */
            <div onClick={() => go("wow-dashboard")}
              style={{ borderRadius: 20, overflow: "hidden", cursor: "pointer", background: C.card, border: `1px solid ${C.brand}20`, padding: "16px 18px", boxShadow: `0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px ${C.brand}08` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Icons.Crown size={14} stroke={C.brand} />
                  <span style={{ fontSize: 9, fontWeight: 900, color: C.brand, letterSpacing: 2, textTransform: "uppercase" }}>Subscribed</span>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.green }} />
                </div>
                <div style={{ padding: "3px 10px", borderRadius: 10, background: `${C.brand}15`, border: `1px solid ${C.brand}25` }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: C.brand, fontFamily: "'JetBrains Mono', monospace" }}>DAY {wowDeliveryDay}/{wowPricing.find(p => p.id === wowDuration)?.days || 7}</span>
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ width: "100%", height: 4, borderRadius: 2, background: C.input, marginBottom: 12 }}>
                <div style={{ width: `${(wowDeliveryDay / (wowPricing.find(p => p.id === wowDuration)?.days || 7)) * 100}%`, height: "100%", borderRadius: 2, background: grad.hero, transition: "width 0.5s ease" }} />
              </div>
              {/* Thumbnail strip */}
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                {wowDeliveryMock.photos.slice(0, 4).map((p, i) => (
                  <div key={i} style={{ width: 52, height: 52, borderRadius: 12, overflow: "hidden", border: `1px solid ${C.brand}20`, flexShrink: 0 }}>
                    <img src={p.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ))}
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, color: C.brand }}>
                    <span style={{ fontSize: 11, fontWeight: 700 }}>View today's WOW</span>
                    <Icons.ChevronRight size={14} stroke={C.brand} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Story cards */}
        <div style={{ padding: "16px 16px 8px", display: "flex", flexDirection: "column", gap: 16 }}>
          {filteredTales.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <Icons.BookOpen size={32} stroke={C.textTer} />
              <div style={{ fontSize: 14, fontWeight: 700, color: C.textSec, marginTop: 12 }}>No stories found</div>
              <div style={{ fontSize: 11, color: C.textTer, marginTop: 4 }}>Try adjusting your filters</div>
            </div>
          ) : filteredTales.map((tale, idx) => {
            const Style = storyStyles[idx % storyStyles.length];
            return <Style key={tale.id} tale={tale} />;
          })}
        </div>
      </div>
    );
  };

  // ─── ME TAB (includes Saved) ─────────────────────────────────────────────
  const MeTab = () => (
    <div>
      <div style={{ padding: "52px 20px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", color: C.text, fontFamily: "'Inter', sans-serif" }}>Profile</div>
        <div style={{ display: "flex", gap: 8 }}>
          <IconBtn icon="Bell" onClick={() => setShowNotif(true)} badge />
          <IconBtn icon="Settings" onClick={() => setShowSettings(true)} />
        </div>
      </div>
      <div style={{ margin: "8px 20px", borderRadius: 32, background: C.card, border: `1px solid rgba(255,255,255,0.05)`, padding: 20, position: "relative", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: 128, height: 128, background: `rgba(245,158,11,0.05)`, borderRadius: "50%", filter: "blur(40px)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, position: "relative" }}>
          <div style={{ width: 68, height: 68, borderRadius: "50%", background: C.brand, padding: 2, boxShadow: `0 0 24px rgba(245,158,11,0.3)`, flexShrink: 0 }}>
            <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", border: `2px solid ${C.bg}` }}>
              <img src="/assets/images/templates/gold/t10_gym_beast.png" style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, fontStyle: "italic", color: C.text, letterSpacing: -0.5, fontFamily: "'Inter', sans-serif" }}>Alex Neo</div>
            <div style={{ fontSize: 10, color: C.brand400, fontWeight: 700, letterSpacing: 2, marginTop: 2 }}>@alex.neo</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
              <Icons.Flame size={12} stroke={C.brand} />
              <span style={{ fontSize: 9, color: C.textTer, fontWeight: 700, letterSpacing: 1 }}>7-day streak</span>
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
          {[{ l: "Shots", v: "48" }, { l: "Followers", v: "2.4k" }, { l: "Credits", v: credits }].map(({ l, v }) => (
            <div key={l} style={{ background: `${C.bg}CC`, borderRadius: 14, padding: "12px 8px", textAlign: "center", border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: C.text, fontFamily: l === "Credits" ? "'JetBrains Mono', monospace" : "inherit" }}>{v}</div>
              <div style={{ fontSize: 8, color: C.textTer, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
        <button onClick={() => showToast("Edit profile coming soon!")} style={{ width: "100%", padding: "12px 0", background: C.input, borderRadius: 14, border: `1px solid ${C.borderMed}`, color: C.textSec, fontSize: 11, fontWeight: 700, letterSpacing: 1, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Icons.Edit size={14} stroke={C.textSec} /> Edit Profile
        </button>
      </div>
      <div style={{ display: "flex", gap: 6, padding: "12px 20px 0" }}>
        {["shots", "saved", "tales"].map(t => (
          <button key={t} onClick={() => setProfileTab(t)}
            style={{ flex: 1, padding: "10px 0", borderRadius: 12, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, border: profileTab === t ? `1.5px solid ${C.brand}` : `1px solid ${C.borderMed}`, background: profileTab === t ? C.brand : "transparent", color: profileTab === t ? "#fff" : C.textTer, cursor: "pointer", transition: "all 0.2s" }}>
            {t === "shots" ? "Shots" : t === "saved" ? "Saved" : "Tales"}
          </button>
        ))}
      </div>
      <div style={{ padding: "12px 20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
        {Array.from({ length: 9 }).map((_, i) => {
          const s = shots[i % shots.length];
          const types = ["glow", "shot", "story"];
          const type = types[i % 3];
          return (
            <div key={i} onClick={() => { if (profileTab !== "tales") { setSelectedShot(s); go("shot-detail"); } }}
              style={{ aspectRatio: "1", borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}`, cursor: "pointer", position: "relative" }}>
              {profileTab === "tales" ? (
                <div style={{ width: "100%", height: "100%", background: C.input, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icons.BookOpen size={20} stroke={C.brand400} />
                </div>
              ) : (
                <>
                  <img src={s.img} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                  {profileTab === "saved" && (
                    <div style={{ position: "absolute", top: 5, right: 5, width: 18, height: 18, borderRadius: 5, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {type === "glow" && <Icons.Sparkles size={9} stroke={C.text} />}
                      {type === "shot" && <Icons.Wand size={9} stroke={C.brand400} />}
                      {type === "story" && <Icons.Layers size={9} stroke={C.purple} />}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ margin: "8px 20px 20px", borderRadius: 20, background: `${C.brand}10`, border: `1px solid ${C.brand}20`, padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ width: 40, height: 40, background: grad.btn, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 20px ${C.brand}30`, flexShrink: 0 }}>
            <Icons.Crown size={18} stroke="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.text, letterSpacing: -0.3 }}>Upgrade to Pro</div>
            <div style={{ fontSize: 10, color: C.brand400, letterSpacing: 1 }}>Unlimited credits</div>
          </div>
        </div>
        <button onClick={() => setShowPaywall(true)} style={{ width: "100%", padding: "12px 0", background: grad.btn, color: "#fff", borderRadius: 14, fontWeight: 800, fontSize: 11, letterSpacing: 1, border: "none", cursor: "pointer" }}>
          View Plans
        </button>
      </div>
    </div>
  );

  // ─── SUB-SCREENS ───────────────────────────────────────────────────────────
  const ShotDetail = () => {
    if (!selectedShot) return null;
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ position: "relative", height: "50%", flexShrink: 0 }}>
          <img src={selectedShot.img} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 40%, rgba(0,0,0,0.9) 100%)" }} />
          <button onClick={back} style={{ position: "absolute", top: 52, left: 18, width: 40, height: 40, borderRadius: "50%", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", border: `1px solid ${C.borderMed}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icons.ArrowLeft size={18} stroke="#fff" />
          </button>
          <button onClick={() => setShowAI(true)} style={{ position: "absolute", top: 52, right: 18, width: 40, height: 40, borderRadius: "50%", background: C.brand, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 16px ${C.brand}60` }}>
            <Icons.Wand size={16} stroke="#fff" />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 20, scrollbarWidth: "none" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", color: C.text, letterSpacing: -1, fontFamily: "'Inter', sans-serif" }}>{selectedShot.title}</div>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.brand400, textTransform: "uppercase", letterSpacing: 2 }}>{selectedShot.cat}</div>
            </div>
            <button onClick={() => setSaved(p => ({ ...p, [selectedShot.id]: !p[selectedShot.id] }))}
              style={{ width: 40, height: 40, borderRadius: 14, background: saved[selectedShot.id] ? C.brand : C.card, border: `1px solid ${saved[selectedShot.id] ? C.brand : C.borderMed}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icons.Bookmark size={16} stroke={saved[selectedShot.id] ? "#fff" : C.textTer} fill={saved[selectedShot.id] ? "#fff" : "none"} />
            </button>
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            {[
              { label: `${fmt(selectedShot.likes + (liked[selectedShot.id] ? 1 : 0))}`, icon: "Heart", active: liked[selectedShot.id], color: C.red, onClick: () => setLiked(p => ({ ...p, [selectedShot.id]: !p[selectedShot.id] })) },
              { label: "Share", icon: "Share", active: false, onClick: () => showToast("Link copied!") },
              { label: "Create", icon: "Wand", primary: true, onClick: () => { setUploadedImg(null); go("photo-upload"); } },
            ].map(({ label, icon, active, color, primary, onClick }, i) => {
              const IC = Icons[icon];
              return (
                <button key={i} onClick={onClick} style={{ flex: 1, padding: "12px 0", borderRadius: 14, background: primary ? grad.btn : active ? `${color}18` : C.card, border: primary ? "none" : `1px solid ${active ? color + "40" : C.borderMed}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <IC size={13} stroke={primary ? "#fff" : active ? color : C.textTer} fill={active && icon === "Heart" ? color : "none"} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: primary ? "#fff" : active ? color : C.textTer }}>{label}</span>
                </button>
              );
            })}
          </div>
          <div style={{ background: C.card, borderRadius: 16, padding: 16, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 9, color: C.textTer, textTransform: "uppercase", letterSpacing: 2, fontWeight: 700, marginBottom: 12 }}>Stats</div>
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              {[{ label: "Views", val: fmt(selectedShot.views), icon: "Eye" }, { label: "Likes", val: fmt(selectedShot.likes), icon: "Heart" }, { label: "Credits", val: selectedShot.credits, icon: "Zap" }].map(({ label, val, icon }) => {
                const IC = Icons[icon];
                return (
                  <div key={label} style={{ textAlign: "center" }}>
                    <IC size={14} stroke={C.brand400} />
                    <div style={{ fontSize: 16, fontWeight: 900, color: C.text, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>{val}</div>
                    <div style={{ fontSize: 8, color: C.textTer, textTransform: "uppercase", letterSpacing: 1.5, marginTop: 2 }}>{label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const GlowResult = () => {
    const [glowSliderPos, setGlowSliderPos] = useState(50);
    const [glowShowBefore, setGlowShowBefore] = useState(false);
    const [glowResultVibe, setGlowResultVibe] = useState(selectedVibe);
    const [glowResultEnhance, setGlowResultEnhance] = useState(glowEnhance);

    const enhancements = [
      { label: "Skin smoothing", value: "Subtle", icon: "✦", color: "#F9A8D4" },
      { label: "Lighting balance", value: "Corrected", icon: "☀", color: "#FBBF24" },
      { label: "Eye brightness", value: "+12%", icon: "◆", color: "#A855F7" },
      { label: "Color grading", value: vibes.find(v => v.id === glowResultVibe)?.name || "Original+", icon: "♫", color: "#3B82F6" },
    ];

    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg, overflow: "auto" }}>
        {/* Header */}
        <div style={{ padding: "52px 20px 8px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <button onClick={back} style={{ width: 40, height: 40, borderRadius: "50%", background: C.card, border: `1px solid ${C.borderMed}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icons.ArrowLeft size={18} stroke={C.text} />
          </button>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 900, fontStyle: "italic", color: C.text }}>
              <Icons.Sparkles size={14} stroke={C.brand} style={{ verticalAlign: "middle", marginRight: 4 }} />
              Glow <span style={{ color: C.brand }}>Enhanced</span>
            </div>
          </div>
          <button onClick={() => { setProcessingProgress(0); setProcessingStep(""); go("glow-processing"); }}
            style={{ width: 40, height: 40, borderRadius: "50%", background: C.card, border: `1px solid ${C.borderMed}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icons.RefreshCw size={16} stroke={C.textSec} />
          </button>
        </div>

        {/* Gamification text */}
        <div style={{ textAlign: "center", padding: "4px 20px 12px", flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: C.brand400, fontWeight: 600, fontStyle: "italic" }}>
            Can you spot the difference? ✦
          </span>
        </div>

        {/* ═══ BEFORE / AFTER — Interactive Split View ═══ */}
        <div style={{ margin: "0 20px", borderRadius: 24, overflow: "hidden", position: "relative", aspectRatio: "3/4", flexShrink: 0, border: `2px solid ${C.borderMed}`, boxShadow: `0 12px 40px rgba(0,0,0,0.5)` }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
            setGlowSliderPos(Math.max(5, Math.min(95, pct)));
          }}
          onDoubleClick={() => setGlowShowBefore(p => !p)}>
          {/* AFTER layer (full) */}
          <img src="/assets/images/onboarding/gold_locket.png" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: glowShowBefore ? "none" : `brightness(1.05) contrast(1.03) saturate(${glowResultVibe === "warm" ? 1.2 : glowResultVibe === "cool" ? 0.95 : glowResultVibe === "golden" ? 1.15 : 1.05})` }} alt="" />
          {/* BEFORE layer (clipped) */}
          <div style={{ position: "absolute", inset: 0, width: `${glowShowBefore ? 100 : glowSliderPos}%`, overflow: "hidden", transition: glowShowBefore ? "width 0.3s" : "none" }}>
            <img src="/assets/images/onboarding/gold_locket.png" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.92) contrast(0.97) saturate(0.9)" }} alt="" />
          </div>
          {/* Slider line + handle */}
          {!glowShowBefore && (
            <>
              <div style={{ position: "absolute", left: `${glowSliderPos}%`, top: 0, bottom: 0, width: 2, background: "rgba(255,255,255,0.7)", transform: "translateX(-50%)", boxShadow: "0 0 12px rgba(0,0,0,0.5)", zIndex: 5 }} />
              <div style={{
                position: "absolute", left: `${glowSliderPos}%`, top: "50%", transform: "translate(-50%,-50%)", zIndex: 6,
                width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 2,
                boxShadow: "0 2px 16px rgba(0,0,0,0.4), 0 0 0 3px rgba(255,255,255,0.2)",
                cursor: "ew-resize",
              }}>
                <div style={{ width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderRight: "5px solid #333" }} />
                <div style={{ width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: "5px solid #333" }} />
              </div>
            </>
          )}
          {/* BEFORE / AFTER labels */}
          <div style={{ position: "absolute", top: 14, left: 14, padding: "4px 11px", borderRadius: 10, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", fontSize: 8, fontWeight: 800, color: "rgba(255,255,255,0.8)", letterSpacing: 1.5, zIndex: 3 }}>BEFORE</div>
          <div style={{ position: "absolute", top: 14, right: 14, padding: "4px 11px", borderRadius: 10, background: `${C.brand}90`, backdropFilter: "blur(8px)", fontSize: 8, fontWeight: 800, color: "#fff", letterSpacing: 1.5, zIndex: 3, display: "flex", alignItems: "center", gap: 4 }}>
            <Icons.Sparkles size={8} stroke="#fff" /> AFTER
          </div>
          {/* Double-tap hint */}
          <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", padding: "4px 12px", borderRadius: 10, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", fontSize: 8, color: "rgba(255,255,255,0.5)", fontWeight: 600, zIndex: 3, whiteSpace: "nowrap" }}>
            Tap to move slider · Double-tap to toggle
          </div>
        </div>

        {/* ═══ ENHANCE SLIDER — Post-capture adjust ═══ */}
        <div style={{ margin: "16px 20px 0", padding: "14px 16px 12px", borderRadius: 18, background: C.card, border: `1px solid ${C.borderMed}`, flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Icons.Wand size={13} stroke={C.purple} />
              <span style={{ fontSize: 11, fontWeight: 800, color: C.text }}>Enhance</span>
            </div>
            <div style={{ padding: "2px 9px", borderRadius: 7, background: `${C.purple}15`, border: `1px solid ${C.purple}20` }}>
              <span style={{ fontSize: 10, fontWeight: 900, color: C.purple, fontFamily: "'JetBrains Mono', monospace" }}>{glowResultEnhance}%</span>
            </div>
          </div>
          <div style={{ position: "relative", height: 6, borderRadius: 3, background: C.input, cursor: "pointer" }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = Math.round(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)));
              setGlowResultEnhance(pct);
            }}>
            <div style={{ width: `${glowResultEnhance}%`, height: "100%", borderRadius: 3, background: `linear-gradient(90deg, ${C.purple}, ${C.brand})`, transition: "width 0.15s" }} />
            <div style={{ position: "absolute", left: `${glowResultEnhance}%`, top: "50%", transform: "translate(-50%,-50%)", width: 16, height: 16, borderRadius: "50%", background: "#fff", boxShadow: `0 2px 8px rgba(0,0,0,0.3), 0 0 0 2px ${C.purple}40`, cursor: "pointer" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontSize: 7, color: C.textTer, fontWeight: 600 }}>Natural</span>
            <span style={{ fontSize: 7, color: C.textTer, fontWeight: 600 }}>Max Glow</span>
          </div>
        </div>

        {/* ═══ VIBE QUICK-SWITCH — Crossfade filters ═══ */}
        <div style={{ padding: "14px 0 0", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 20px 8px" }}>
            <Icons.Palette size={13} stroke={C.blue} />
            <span style={{ fontSize: 11, fontWeight: 800, color: C.text }}>Vibe</span>
            <span style={{ fontSize: 9, color: C.textTer, marginLeft: "auto" }}>Instant crossfade</span>
          </div>
          <div style={{ display: "flex", gap: 8, padding: "0 20px", overflowX: "auto", scrollbarWidth: "none" }}>
            {vibes.map(v => (
              <button key={v.id} onClick={() => setGlowResultVibe(v.id)}
                style={{
                  flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  padding: "8px 4px 6px", borderRadius: 14, width: 58,
                  border: glowResultVibe === v.id ? `2px solid ${v.color || C.brand}` : `1px solid ${C.borderMed}`,
                  background: glowResultVibe === v.id ? `${v.color || C.brand}10` : "transparent",
                  cursor: "pointer", transition: "all 0.2s",
                }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: v.color ? `linear-gradient(135deg, ${v.color}, ${v.color}80)` : `linear-gradient(135deg, #888, #555)`,
                  border: glowResultVibe === v.id ? `2px solid ${v.color || "#888"}` : "2px solid transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {glowResultVibe === v.id && <Icons.Check size={11} stroke="#fff" />}
                </div>
                <span style={{ fontSize: 8, fontWeight: glowResultVibe === v.id ? 800 : 600, color: glowResultVibe === v.id ? (v.color || C.brand) : C.textTer }}>{v.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ═══ ENHANCEMENT DETAILS — What AI changed ═══ */}
        <div style={{ margin: "14px 20px 0", padding: "12px 14px", borderRadius: 16, background: C.card, border: `1px solid ${C.borderMed}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Icons.Eye size={12} stroke={C.green} />
            <span style={{ fontSize: 10, fontWeight: 800, color: C.text }}>What AI enhanced</span>
            <div style={{ marginLeft: "auto", padding: "2px 7px", borderRadius: 6, background: `${C.green}15`, border: `1px solid ${C.green}20` }}>
              <span style={{ fontSize: 7, fontWeight: 800, color: C.green, letterSpacing: 0.5 }}>4 ADJUSTMENTS</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {enhancements.map((e, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 12, background: C.input, border: `1px solid ${C.border}` }}>
                <div style={{ width: 24, height: 24, borderRadius: 8, background: `${e.color}12`, border: `1px solid ${e.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>
                  {e.icon}
                </div>
                <div>
                  <div style={{ fontSize: 8, color: C.textTer, fontWeight: 600 }}>{e.label}</div>
                  <div style={{ fontSize: 9, color: C.text, fontWeight: 800 }}>{e.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ ACTION BAR — Save, Share, More ═══ */}
        <div style={{ padding: "16px 20px 12px", flexShrink: 0 }}>
          {/* Primary actions */}
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <button onClick={() => showToast("Image saved to gallery!")}
              style={{ flex: 1, padding: "14px 0", background: grad.btn, color: "#000", borderRadius: 16, fontWeight: 900, fontSize: 12, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: `0 4px 20px ${C.brand}30` }}>
              <Icons.Download size={16} stroke="#000" /> Save Image
            </button>
            <button onClick={() => showToast("Share link copied!")}
              style={{ flex: 1, padding: "14px 0", background: C.card, color: C.text, borderRadius: 16, fontWeight: 800, fontSize: 12, border: `1px solid ${C.borderMed}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Icons.Share size={16} stroke={C.text} /> Share
            </button>
          </div>
          {/* Secondary actions */}
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { icon: "Camera", label: "New photo", action: () => { back(); } },
              { icon: "Crop", label: "Crop", action: () => showToast("Crop editor opening...") },
              { icon: "Maximize", label: "Full view", action: () => showToast("Full screen mode") },
            ].map((a, i) => (
              <button key={i} onClick={a.action}
                style={{ flex: 1, padding: "10px 0", background: "transparent", border: `1px solid ${C.borderMed}`, borderRadius: 12, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                {React.createElement(Icons[a.icon], { size: 14, stroke: C.textSec })}
                <span style={{ fontSize: 8, color: C.textTer, fontWeight: 700 }}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ═══ UPSELL — Try FlexShot ═══ */}
        <div onClick={() => { setTab("create"); setScreen("main"); }}
          style={{ margin: "0 20px 20px", padding: "14px 16px", borderRadius: 16, background: `linear-gradient(135deg, ${C.brand}10, ${C.purple}08)`, border: `1px solid ${C.brand}15`, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: `${C.brand}15`, border: `1px solid ${C.brand}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icons.Sparkles size={16} stroke={C.brand} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.text }}>Want more than a glow-up?</div>
            <div style={{ fontSize: 9, color: C.textTer, marginTop: 2 }}>Try <span style={{ color: C.brand, fontWeight: 800 }}>FlexShot</span> — put yourself in any scene with AI</div>
          </div>
          <Icons.ChevronRight size={14} stroke={C.textTer} />
        </div>

        {/* Bottom padding */}
        <div style={{ height: 20, flexShrink: 0 }} />
      </div>
    );
  };

  const TaleReader = () => {
    if (!selectedTale) return null;
    const ch = selectedTale.chapters[taleChapter];
    const isLast = taleChapter >= selectedTale.chapters.length - 1;
    const imgs = storyImgMap[selectedTale.id] || selectedTale.chapters.map(() => selectedTale.img);
    const currentImg = imgs[taleChapter % imgs.length];
    const totalCh = selectedTale.chapters.length;
    const progress = ((taleChapter + 1) / totalCh) * 100;

    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
        {/* Top image area with 3D card */}
        <div style={{ position: "relative", height: 300, flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#080808" }}>
          {/* Blurred ambient bg */}
          <img src={currentImg} alt="" style={{ position: "absolute", inset: -20, width: "calc(100% + 40px)", height: "calc(100% + 40px)", objectFit: "cover", filter: "blur(30px) brightness(0.3)", transform: "scale(1.1)" }} />
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at center, transparent 30%, ${C.bg} 80%)` }} />

          {/* 3D card stack — prev / current / next */}
          <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", perspective: 600 }}>
            {/* Previous card (left, faded) */}
            {taleChapter > 0 && (
              <div style={{ position: "absolute", width: 100, height: 140, borderRadius: 12, overflow: "hidden", transform: "rotateY(-15deg) translateX(-70px) scale(0.8)", opacity: 0.4, filter: "brightness(0.4)", transition: "all 0.6s cubic-bezier(0.34,1.56,0.64,1)", border: `1px solid rgba(255,255,255,0.06)` }}>
                <img src={imgs[(taleChapter - 1) % imgs.length]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
            {/* Current card (center, hero) */}
            <div style={{ position: "relative", width: 160, height: 220, borderRadius: 16, overflow: "hidden", boxShadow: `0 20px 50px rgba(0,0,0,0.7), 0 0 30px ${C.brand}10`, border: `2px solid ${C.brand}40`, transform: "rotateY(0deg) scale(1)", transition: "all 0.6s cubic-bezier(0.34,1.56,0.64,1)", zIndex: 10 }}>
              <img src={currentImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "30px 12px 10px", background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)" }}>
                <div style={{ fontSize: 8, fontWeight: 900, color: C.brand, textTransform: "uppercase", letterSpacing: 2, fontFamily: "'JetBrains Mono', monospace" }}>Ch.{taleChapter + 1}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginTop: 2 }}>{ch.h}</div>
              </div>
            </div>
            {/* Next card (right, faded) */}
            {!isLast && (
              <div style={{ position: "absolute", width: 100, height: 140, borderRadius: 12, overflow: "hidden", transform: "rotateY(15deg) translateX(70px) scale(0.8)", opacity: 0.4, filter: "brightness(0.4)", transition: "all 0.6s cubic-bezier(0.34,1.56,0.64,1)", border: `1px solid rgba(255,255,255,0.06)` }}>
                <img src={imgs[(taleChapter + 1) % imgs.length]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
          </div>

          {/* Nav buttons */}
          <button onClick={back} style={{ position: "absolute", top: 52, left: 18, width: 40, height: 40, borderRadius: "50%", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20 }}>
            <Icons.ArrowLeft size={18} stroke="#fff" />
          </button>
          <div style={{ position: "absolute", top: 52, right: 18, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", padding: "6px 14px", borderRadius: 20, border: `1px solid ${C.borderMed}`, zIndex: 20 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>{taleChapter + 1}/{totalCh}</span>
          </div>

          {/* Progress bar at bottom of image */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "rgba(255,255,255,0.08)", zIndex: 20 }}>
            <div style={{ width: `${progress}%`, height: "100%", background: grad.hero, transition: "width 0.5s ease", borderRadius: 2 }} />
          </div>
        </div>

        {/* Chapter nav dots */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", padding: "14px 0 8px" }}>
          {selectedTale.chapters.map((_, i) => (
            <div key={i} style={{ width: i === taleChapter ? 22 : 6, height: 6, borderRadius: 3, background: i < taleChapter ? C.brand : i === taleChapter ? C.brand : C.textTer + '40', transition: "all 0.4s ease" }} />
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 20px 20px", scrollbarWidth: "none" }}>
          {/* Title + category */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ padding: "3px 10px", borderRadius: 10, background: `${C.brand}12`, border: `1px solid ${C.brand}25` }}>
              <span style={{ fontSize: 8, fontWeight: 900, color: C.brand, textTransform: "uppercase", letterSpacing: 2 }}>{selectedTale.cat}</span>
            </div>
            <span style={{ fontSize: 14, fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", color: C.text, letterSpacing: -0.5 }}>{selectedTale.title}</span>
          </div>

          {/* Chapter heading */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 3, height: 22, background: C.brand, borderRadius: 2 }} />
            <div style={{ fontSize: 15, fontWeight: 800, textTransform: "uppercase", color: C.text, letterSpacing: 1.5 }}>{ch.h}</div>
          </div>
          <div style={{ fontSize: 13, color: C.textSec, lineHeight: 2, marginBottom: 28 }}>{ch.text}</div>

          {/* Choices */}
          {taleChoice === null ? (
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, color: C.textTer, textTransform: "uppercase", letterSpacing: 3, marginBottom: 12 }}>What will you choose?</div>
              {ch.choices.map((c, i) => (
                <button key={i} onClick={() => setTaleChoice(i)}
                  style={{ width: "100%", marginBottom: 10, padding: "16px 18px", background: C.card, border: `1px solid ${C.borderMed}`, borderRadius: 16, textAlign: "left", cursor: "pointer", fontSize: 13, fontWeight: 700, color: C.text, display: "flex", alignItems: "center", gap: 12, transition: "all 0.2s" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: `${C.brand}10`, border: `1px solid ${C.brand}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ color: C.brand, fontWeight: 900, fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>{String.fromCharCode(65 + i)}</span>
                  </div>
                  {c}
                </button>
              ))}
            </div>
          ) : (
            <div>
              <div style={{ background: `${C.brand}12`, border: `1px solid ${C.brand}30`, borderRadius: 16, padding: "14px 16px", marginBottom: 20, display: "flex", gap: 10, alignItems: "center" }}>
                <Icons.CheckCircle size={16} stroke={C.brand400} />
                <span style={{ fontSize: 12, color: C.brand400, fontWeight: 700 }}>Chosen: {ch.choices[taleChoice]}</span>
              </div>
              {isLast ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ width: 72, height: 72, borderRadius: "50%", background: `${C.brand}10`, border: `2px solid ${C.brand}30`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: `0 0 40px ${C.brand}15` }}>
                    <Icons.Award size={32} stroke={C.brand400} />
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, textTransform: "uppercase", color: C.text, letterSpacing: 3, marginBottom: 6 }}>Complete!</div>
                  <div style={{ fontSize: 12, color: C.textTer, marginBottom: 24 }}>You've finished this journey</div>
                  <button onClick={back} style={{ width: "100%", padding: "18px 0", background: grad.btn, color: "#000", borderRadius: 20, fontWeight: 900, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", border: "none", cursor: "pointer", boxShadow: `0 8px 24px ${C.brand}30` }}>Explore More Stories</button>
                </div>
              ) : (
                <button onClick={() => { setTaleChapter(c => c + 1); setTaleChoice(null); }}
                  style={{ width: "100%", padding: "18px 0", background: grad.btn, color: "#000", borderRadius: 20, fontWeight: 900, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", border: "none", cursor: "pointer", boxShadow: `0 8px 24px ${C.brand}30`, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  Next Chapter <Icons.ChevronRight size={16} stroke="#000" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── PHOTO UPLOAD (FlexShot input) ─────────────────────────────────────────
  const PhotoUpload = () => {
    if (!selectedShot) return null;
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
        <div style={{ padding: "52px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={back} style={{ width: 40, height: 40, borderRadius: "50%", background: C.card, border: `1px solid ${C.borderMed}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icons.ArrowLeft size={18} stroke={C.text} />
          </button>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Upload Photo</div>
            <div style={{ fontSize: 9, color: C.textTer, letterSpacing: 2, fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>FLEXSHOT · {selectedShot.title.toUpperCase()}</div>
          </div>
          <div style={{ width: 40 }} />
        </div>
        {/* Upload area */}
        <div style={{ flex: 1, padding: "8px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          {!uploadedImg ? (
            <div onClick={() => setUploadedImg("/assets/images/templates/gold/t10_gym_beast.png")}
              style={{ flex: 1, borderRadius: 24, border: `2px dashed ${C.brand}40`, background: `${C.brand}06`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: grad.glow, opacity: 0.5 }} />
              <div style={{ position: "relative", textAlign: "center" }}>
                <div style={{ width: 80, height: 80, borderRadius: 24, background: `${C.brand}10`, border: `1px solid ${C.brand}20`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: `0 0 40px ${C.brand}10` }}>
                  <Icons.Upload size={32} stroke={C.brand} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 6 }}>Drop your selfie here</div>
                <div style={{ fontSize: 11, color: C.textTer, marginBottom: 20, lineHeight: 1.6 }}>or tap to choose from gallery</div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                  <div style={{ padding: "10px 20px", borderRadius: 14, background: C.brand, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                    <Icons.Camera size={14} stroke="#000" />
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#000", letterSpacing: 1 }}>Camera</span>
                  </div>
                  <div style={{ padding: "10px 20px", borderRadius: 14, background: C.card, border: `1px solid ${C.borderMed}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                    <Icons.Image size={14} stroke={C.textSec} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.textSec, letterSpacing: 1 }}>Gallery</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div style={{ flex: 1, borderRadius: 24, overflow: "hidden", position: "relative", border: `1px solid ${C.borderMed}` }}>
                <img src={uploadedImg} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 70%, rgba(0,0,0,0.6) 100%)" }} />
                {/* Crop guide corners */}
                {[["t","l"],["t","r"],["b","l"],["b","r"]].map(([v,h]) => (
                  <div key={v+h} style={{ position: "absolute", [v === "t" ? "top" : "bottom"]: 20, [h === "l" ? "left" : "right"]: 20, width: 24, height: 24, borderTop: v === "t" ? `2px solid ${C.brand}` : "none", borderBottom: v === "b" ? `2px solid ${C.brand}` : "none", borderLeft: h === "l" ? `2px solid ${C.brand}` : "none", borderRight: h === "r" ? `2px solid ${C.brand}` : "none" }} />
                ))}
                <button onClick={() => setUploadedImg(null)} style={{ position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: 10, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icons.X size={14} stroke="#fff" />
                </button>
                <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8 }}>
                  {[{ icon: "Crop", label: "Crop" }, { icon: "FlipH", label: "Flip" }, { icon: "Maximize", label: "Fit" }].map(({ icon, label }) => {
                    const IC = Icons[icon];
                    return (
                      <div key={label} style={{ padding: "8px 14px", borderRadius: 12, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", border: `1px solid ${C.borderMed}`, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                        <IC size={12} stroke={C.textSec} />
                        <span style={{ fontSize: 9, fontWeight: 700, color: C.textSec, letterSpacing: 1 }}>{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Template preview */}
              <div style={{ background: C.card, borderRadius: 16, padding: 14, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 14 }}>
                <img src={selectedShot.img} style={{ width: 48, height: 48, borderRadius: 12, objectFit: "cover" }} alt="" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: C.text }}>{selectedShot.title}</div>
                  <div style={{ fontSize: 9, color: C.textTer, letterSpacing: 1, marginTop: 2 }}>{selectedShot.style} · {selectedShot.credits} credit</div>
                </div>
                <Icons.Check size={16} stroke={C.brand} />
              </div>
            </>
          )}
        </div>
        {/* Generate button */}
        <div style={{ padding: "12px 20px 40px" }}>
          <button onClick={() => { if (!uploadedImg) return; setProcessingProgress(0); setProcessingStep(""); go("shot-processing"); }}
            style={{ width: "100%", padding: "18px 0", background: uploadedImg ? grad.btn : C.input, color: uploadedImg ? "#000" : C.textTer, borderRadius: 20, fontWeight: 900, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", border: "none", cursor: uploadedImg ? "pointer" : "default", boxShadow: uploadedImg ? `0 12px 28px ${C.brand}30` : "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.3s" }}>
            <Icons.Wand size={16} stroke={uploadedImg ? "#000" : C.textTer} />
            Generate FlexShot
          </button>
          <div style={{ textAlign: "center", fontSize: 9, color: C.textTer, marginTop: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>
            <Icons.Zap size={10} stroke={C.brand} style={{ display: "inline", verticalAlign: "middle" }} /> {selectedShot?.credits || 1} credit will be used
          </div>
        </div>
      </div>
    );
  };

  // ─── SHOT PROCESSING (AI generating) ──────────────────────────────────────
  const ShotProcessing = () => {
    const steps = ["Analyzing face...", "Mapping features...", "Applying template...", "Rendering scene...", "Enhancing details...", "Final polish..."];
    useEffect(() => {
      let p = 0;
      let s = 0;
      setProcessingStep(steps[0]);
      const interval = setInterval(() => {
        p += Math.random() * 8 + 2;
        if (p >= 100) { p = 100; clearInterval(interval); setTimeout(() => go("shot-result"), 600); }
        setProcessingProgress(Math.min(p, 100));
        const newS = Math.min(Math.floor(p / (100 / steps.length)), steps.length - 1);
        if (newS !== s) { s = newS; setProcessingStep(steps[newS]); }
      }, 400);
      return () => clearInterval(interval);
    }, []);
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.bg, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: grad.glow }} />
        {/* Rotating ring */}
        <div style={{ position: "relative", width: 160, height: 160, marginBottom: 32 }}>
          <svg width="160" height="160" viewBox="0 0 160 160" style={{ position: "absolute", animation: "spin 3s linear infinite" }}>
            <circle cx="80" cy="80" r="72" fill="none" stroke={C.border} strokeWidth="3" />
            <circle cx="80" cy="80" r="72" fill="none" stroke={C.brand} strokeWidth="3" strokeLinecap="round"
              strokeDasharray={`${processingProgress * 4.52} ${452 - processingProgress * 4.52}`}
              style={{ transition: "stroke-dasharray 0.4s ease", filter: `drop-shadow(0 0 8px ${C.brand}60)` }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: C.text, fontFamily: "'JetBrains Mono', monospace", letterSpacing: -2 }}>{Math.round(processingProgress)}%</div>
            <div style={{ fontSize: 8, color: C.textTer, letterSpacing: 3, textTransform: "uppercase", fontWeight: 700 }}>GENERATING</div>
          </div>
        </div>
        {/* Step indicator */}
        <div style={{ position: "relative", textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 900, fontStyle: "italic", color: C.text, textTransform: "uppercase", letterSpacing: -1, marginBottom: 8, fontFamily: "'Inter', sans-serif" }}>
            Creating your <span style={{ color: C.brand }}>FlexShot</span>
          </div>
          <div style={{ fontSize: 11, color: C.brand400, fontWeight: 600, letterSpacing: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Icons.Loader size={12} stroke={C.brand400} style={{ animation: "spin 1s linear infinite" }} />
            {processingStep}
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ position: "relative", width: 240, marginBottom: 20 }}>
          <div style={{ width: "100%", height: 4, borderRadius: 2, background: C.card }}>
            <div style={{ width: `${processingProgress}%`, height: "100%", borderRadius: 2, background: grad.hero, transition: "width 0.4s ease", position: "relative" }}>
              <div style={{ position: "absolute", right: 0, top: -1, width: 6, height: 6, borderRadius: "50%", background: C.brand400, boxShadow: `0 0 10px ${C.brand}` }} />
            </div>
          </div>
        </div>
        {/* Template info */}
        {selectedShot && (
          <div style={{ position: "relative", background: C.card, borderRadius: 16, padding: "12px 18px", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
            <img src={selectedShot.img} style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover" }} alt="" />
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec }}>{selectedShot.title}</div>
              <div style={{ fontSize: 9, color: C.textTer, letterSpacing: 1 }}>{selectedShot.style}</div>
            </div>
          </div>
        )}
        {/* Bottom tip */}
        <div style={{ position: "absolute", bottom: 50, fontSize: 9, color: C.textTer, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 2, opacity: 0.5 }}>AI_ENGINE v2.1 · VERTEX_IMAGEN</div>
      </div>
    );
  };

  // ─── SHOT RESULT ──────────────────────────────────────────────────────────
  const ShotResult = () => {
    if (!selectedShot) return null;
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
        <div style={{ padding: "52px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => { setUploadedImg(null); setScreen("main"); setTab("create"); }} style={{ width: 40, height: 40, borderRadius: "50%", background: C.card, border: `1px solid ${C.borderMed}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icons.X size={18} stroke={C.text} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Icons.CheckCircle size={16} stroke={C.green} />
            <span style={{ fontSize: 12, fontWeight: 800, color: C.text }}>FlexShot Ready</span>
          </div>
          <IconBtn icon="Share" onClick={() => showToast("Link copied!")} />
        </div>
        <div style={{ flex: 1, padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Result image */}
          <div style={{ flex: 1, borderRadius: 24, overflow: "hidden", position: "relative", border: `1px solid ${C.brand}20`, boxShadow: `0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px ${C.brand}10` }}>
            <img src={selectedShot.img} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 40%)" }} />
            {/* Gold glow top edge */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: grad.hero, opacity: 0.6 }} />
            <div style={{ position: "absolute", bottom: 16, left: 18, right: 18, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, fontStyle: "italic", color: C.text, textTransform: "uppercase", letterSpacing: -1, fontFamily: "'Inter', sans-serif" }}>{selectedShot.title}</div>
                <div style={{ fontSize: 9, color: C.brand400, fontWeight: 700, letterSpacing: 2, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>FLEXSHOT · AI GENERATED</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => { setLiked(p => ({ ...p, [selectedShot.id]: !p[selectedShot.id] })); }} style={{ width: 36, height: 36, borderRadius: 12, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", border: `1px solid ${C.borderMed}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icons.Heart size={14} stroke={liked[selectedShot.id] ? C.red : "#fff"} fill={liked[selectedShot.id] ? C.red : "none"} />
                </button>
                <button onClick={() => { setSaved(p => ({ ...p, [selectedShot.id]: !p[selectedShot.id] })); showToast("Saved!"); }} style={{ width: 36, height: 36, borderRadius: 12, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", border: `1px solid ${C.borderMed}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icons.Bookmark size={14} stroke={saved[selectedShot.id] ? C.brand : "#fff"} fill={saved[selectedShot.id] ? C.brand : "none"} />
                </button>
              </div>
            </div>
          </div>
          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => showToast("Image saved to gallery!")} style={{ flex: 1, padding: "16px 0", background: grad.btn, color: "#000", borderRadius: 16, fontWeight: 900, fontSize: 11, letterSpacing: 1, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: `0 10px 24px ${C.brand}30` }}>
              <Icons.Download size={16} stroke="#000" /> Save
            </button>
            <button onClick={() => { setUploadedImg(null); setProcessingProgress(0); go("photo-upload"); }} style={{ flex: 1, padding: "16px 0", background: C.card, color: C.text, borderRadius: 16, fontWeight: 800, fontSize: 11, letterSpacing: 1, border: `1px solid ${C.borderMed}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Icons.RefreshCw size={16} stroke={C.textSec} /> Retry
            </button>
          </div>
        </div>
        <div style={{ padding: "12px 20px 40px", textAlign: "center" }}>
          <button onClick={() => setShowAI(true)} style={{ fontSize: 10, color: C.brand400, fontWeight: 700, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, justifyContent: "center", width: "100%" }}>
            <Icons.Wand size={12} stroke={C.brand400} /> Not perfect? Ask AI to adjust
          </button>
        </div>
      </div>
    );
  };

  // ─── TALE PREVIEW ─────────────────────────────────────────────────────────
  const TalePreview = () => {
    if (!selectedTale) return null;
    const [previewSlide, setPreviewSlide] = useState(0);
    const imgs = storyImgMap[selectedTale.id] || selectedTale.chapters.map(() => selectedTale.img);
    const total = imgs.length;
    useEffect(() => { const t = setInterval(() => setPreviewSlide(s => (s + 1) % total), 2800); return () => clearInterval(t); }, [total]);

    const getStackStyle = (i) => {
      const diff = (i - previewSlide + total) % total;
      if (diff === 0) return { zIndex: 10, transform: "rotateY(0deg) translateX(0) scale(1)", opacity: 1, filter: "brightness(1)" };
      if (diff === 1) return { zIndex: 8, transform: "rotateY(14deg) translateX(40px) scale(0.85)", opacity: 0.6, filter: "brightness(0.5)" };
      if (diff === total - 1) return { zIndex: 8, transform: "rotateY(-14deg) translateX(-40px) scale(0.85)", opacity: 0.6, filter: "brightness(0.5)" };
      return { zIndex: 1, transform: "rotateY(0deg) translateX(0) scale(0.7)", opacity: 0, filter: "brightness(0.3)" };
    };

    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
        {/* 3D Hero area */}
        <div style={{ position: "relative", height: 320, flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#080808" }}>
          {/* Blurred ambient bg */}
          <img src={imgs[previewSlide]} alt="" style={{ position: "absolute", inset: -20, width: "calc(100% + 40px)", height: "calc(100% + 40px)", objectFit: "cover", filter: "blur(40px) brightness(0.25)", transform: "scale(1.1)", transition: "all 1s ease" }} />
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at center, transparent 20%, ${C.bg} 75%)` }} />

          {/* 3D swing stack */}
          <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", perspective: 700 }}>
            <div style={{ position: "absolute", width: 180, height: 180, borderRadius: "50%", background: `radial-gradient(circle, ${C.brand}10 0%, transparent 70%)` }} />
            {imgs.map((img, i) => {
              const s = getStackStyle(i);
              return (
                <div key={i} style={{
                  position: "absolute", width: 170, height: 230, borderRadius: 18, overflow: "hidden",
                  border: `2px solid ${i === previewSlide % total ? C.brand + '50' : 'rgba(255,255,255,0.06)'}`,
                  boxShadow: i === previewSlide % total ? `0 20px 50px rgba(0,0,0,0.7), 0 0 25px ${C.brand}12` : "0 8px 20px rgba(0,0,0,0.5)",
                  transform: s.transform, opacity: s.opacity, zIndex: s.zIndex, filter: s.filter,
                  transition: "all 0.7s cubic-bezier(0.34,1.56,0.64,1)", transformStyle: "preserve-3d",
                }}>
                  <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              );
            })}
          </div>

          {/* Nav */}
          <button onClick={back} style={{ position: "absolute", top: 52, left: 18, width: 40, height: 40, borderRadius: "50%", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20 }}>
            <Icons.ArrowLeft size={18} stroke="#fff" />
          </button>
          <div style={{ position: "absolute", top: 52, right: 18, display: "flex", gap: 8, zIndex: 20 }}>
            <button style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", border: `1px solid ${C.borderMed}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icons.Bookmark size={16} stroke="#fff" />
            </button>
            <button style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", border: `1px solid ${C.borderMed}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icons.Share size={16} stroke="#fff" />
            </button>
          </div>
          {/* Gold glow top */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: grad.hero, opacity: 0.6, zIndex: 20 }} />
          {/* Dot indicators */}
          <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", zIndex: 20, display: "flex", gap: 5 }}>
            {imgs.map((_, i) => (
              <div key={i} onClick={() => setPreviewSlide(i)}
                style={{ width: previewSlide === i ? 20 : 6, height: 6, borderRadius: 3, background: previewSlide === i ? C.brand : "rgba(255,255,255,0.25)", transition: "all 0.4s ease", cursor: "pointer" }} />
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 0", scrollbarWidth: "none" }}>
          {/* Title + badges */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ padding: "4px 12px", borderRadius: 12, background: `${C.brand}12`, border: `1px solid ${C.brand}30` }}>
              <span style={{ fontSize: 9, fontWeight: 900, color: C.brand, letterSpacing: 2, textTransform: "uppercase" }}>{selectedTale.cat}</span>
            </div>
            <div style={{ padding: "4px 10px", borderRadius: 12, background: `${C.purple}12`, display: "flex", alignItems: "center", gap: 4 }}>
              <Icons.Layers size={10} stroke={C.purple} />
              <span style={{ fontSize: 9, fontWeight: 800, color: C.purple, letterSpacing: 1 }}>TALE</span>
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", color: C.text, letterSpacing: -1, fontFamily: "'Inter', sans-serif", marginBottom: 10 }}>{selectedTale.title}</div>
          <div style={{ fontSize: 13, color: C.textSec, lineHeight: 1.8, marginBottom: 20 }}>{selectedTale.desc}</div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {[{ icon: "Image", val: selectedTale.pics, label: "Images" }, { icon: "BookOpen", val: selectedTale.chapters.length, label: "Chapters" }, { icon: "Zap", val: selectedTale.credits, label: "Credits" }].map(({ icon, val, label }) => {
              const IC = Icons[icon];
              return (
                <div key={label} style={{ flex: 1, background: C.card, borderRadius: 16, padding: "14px 8px", textAlign: "center", border: `1px solid ${C.border}` }}>
                  <IC size={15} stroke={C.brand400} style={{ marginBottom: 6 }} />
                  <div style={{ fontSize: 18, fontWeight: 900, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>{val}</div>
                  <div style={{ fontSize: 8, color: C.textTer, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700, marginTop: 3 }}>{label}</div>
                </div>
              );
            })}
          </div>

          {/* Chapter list */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 9, fontWeight: 900, color: C.textTer, textTransform: "uppercase", letterSpacing: 3, marginBottom: 14 }}>Chapters</div>
            {selectedTale.chapters.map((ch, i) => (
              <div key={i} style={{ display: "flex", gap: 14, background: C.card, padding: 14, borderRadius: 16, border: `1px solid ${C.border}`, marginBottom: 10 }}>
                {/* Chapter image thumbnail */}
                <div style={{ width: 52, height: 52, borderRadius: 12, overflow: "hidden", flexShrink: 0, border: `1px solid ${C.brand}20` }}>
                  <img src={imgs[i % imgs.length]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 9, fontWeight: 900, color: C.brand, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>CH.{i + 1}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{ch.h}</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.textTer, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{ch.text.slice(0, 80)}...</div>
                  {ch.choices && (
                    <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                      {ch.choices.map((c, ci) => (
                        <span key={ci} style={{ fontSize: 8, padding: "2px 8px", borderRadius: 8, background: `${C.brand}08`, border: `1px solid ${C.brand}15`, color: C.brand, fontWeight: 700 }}>{c}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{ padding: "12px 20px 40px", background: C.bg }}>
          <button onClick={() => {
            if (credits < selectedTale.credits) { setShowPaywall(true); return; }
            setCredits(c => c - selectedTale.credits);
            setProcessingProgress(0); setProcessingStep("");
            go("tale-processing");
          }}
            style={{ width: "100%", padding: "18px 0", background: grad.btn, color: "#000", borderRadius: 20, fontWeight: 900, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", border: "none", cursor: "pointer", boxShadow: `0 12px 28px ${C.brand}30`, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icons.Play size={16} stroke="#000" fill="#000" />
            Start Story · {selectedTale.credits} Credits
          </button>
        </div>
      </div>
    );
  };

  // ─── TALE PROCESSING ──────────────────────────────────────────────────────
  const TaleProcessing = () => {
    const chapterSteps = selectedTale ? selectedTale.chapters.map((ch, i) => `Ch.${i + 1}: ${ch.h}`) : [];
    const allSteps = ["Preparing story...", ...chapterSteps.map(s => `Generating ${s}`), "Composing narrative...", "Final rendering..."];
    useEffect(() => {
      let p = 0;
      let s = 0;
      setProcessingStep(allSteps[0]);
      const interval = setInterval(() => {
        p += Math.random() * 5 + 1.5;
        if (p >= 100) {
          p = 100; clearInterval(interval);
          setTimeout(() => { setTaleChapter(0); setTaleChoice(null); go("tale-reader"); }, 800);
        }
        setProcessingProgress(Math.min(p, 100));
        const newS = Math.min(Math.floor(p / (100 / allSteps.length)), allSteps.length - 1);
        if (newS !== s) { s = newS; setProcessingStep(allSteps[newS]); }
      }, 500);
      return () => clearInterval(interval);
    }, []);
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.bg, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: grad.glow }} />
        {/* Story icon pulse */}
        <div style={{ position: "relative", marginBottom: 28 }}>
          <div style={{ width: 100, height: 100, borderRadius: 28, background: `${C.brand}10`, border: `1px solid ${C.brand}20`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 60px ${C.brand}15`, animation: "pulse 2s ease-in-out infinite" }}>
            <Icons.BookOpen size={44} stroke={C.brand} />
          </div>
        </div>
        <div style={{ position: "relative", textAlign: "center", marginBottom: 28, padding: "0 40px" }}>
          <div style={{ fontSize: 20, fontWeight: 900, fontStyle: "italic", color: C.text, textTransform: "uppercase", letterSpacing: -1, marginBottom: 6, fontFamily: "'Inter', sans-serif" }}>
            Crafting your <span style={{ color: C.brand }}>story</span>
          </div>
          {selectedTale && <div style={{ fontSize: 10, color: C.textTer, letterSpacing: 2, textTransform: "uppercase" }}>{selectedTale.title}</div>}
        </div>
        {/* Chapter progress cards */}
        {selectedTale && (
          <div style={{ position: "relative", width: 280, marginBottom: 24 }}>
            {selectedTale.chapters.map((ch, i) => {
              const chProgress = Math.max(0, Math.min(100, (processingProgress - (i * (100 / selectedTale.chapters.length))) * (selectedTale.chapters.length)));
              const done = chProgress >= 100;
              const active = chProgress > 0 && chProgress < 100;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, opacity: chProgress > 0 ? 1 : 0.3, transition: "opacity 0.5s" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: done ? `${C.brand}20` : active ? `${C.brand}10` : C.card, border: `1px solid ${done ? C.brand + "40" : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.3s" }}>
                    {done ? <Icons.Check size={12} stroke={C.brand} /> : <span style={{ fontSize: 10, fontWeight: 900, color: active ? C.brand : C.textTer, fontFamily: "'JetBrains Mono', monospace" }}>{i + 1}</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: done ? C.text : active ? C.textSec : C.textTer }}>{ch.h}</div>
                    {active && (
                      <div style={{ width: "100%", height: 2, borderRadius: 1, background: C.card, marginTop: 4 }}>
                        <div style={{ width: `${chProgress}%`, height: "100%", borderRadius: 1, background: C.brand, transition: "width 0.4s ease" }} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {/* Overall progress */}
        <div style={{ position: "relative", width: 240 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 9, color: C.textTer, letterSpacing: 2, fontFamily: "'JetBrains Mono', monospace" }}>{processingStep}</span>
            <span style={{ fontSize: 11, fontWeight: 900, color: C.brand, fontFamily: "'JetBrains Mono', monospace" }}>{Math.round(processingProgress)}%</span>
          </div>
          <div style={{ width: "100%", height: 4, borderRadius: 2, background: C.card }}>
            <div style={{ width: `${processingProgress}%`, height: "100%", borderRadius: 2, background: grad.hero, transition: "width 0.4s ease" }} />
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 50, fontSize: 9, color: C.textTer, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 2, opacity: 0.5 }}>GEMINI_AI · STORY_ENGINE v1.0</div>
      </div>
    );
  };

  // ─── GLOW PROCESSING (FlexLocket enhancement) — Redesigned Premium ────────
  const GlowProcessing = () => {
    const steps = [
      { label: "Analyzing face structure", icon: "✦", color: "#F9A8D4" },
      { label: "Balancing skin tone", icon: "✦", color: "#FBBF24" },
      { label: "Correcting lighting", icon: "☀", color: "#F59E0B" },
      { label: "Smoothing texture", icon: "◆", color: "#A855F7" },
      { label: "Applying vibe filter", icon: "♫", color: "#3B82F6" },
      { label: "Final polish", icon: "✦", color: "#10B981" },
    ];
    const [activeStepIdx, setActiveStepIdx] = useState(0);

    useEffect(() => {
      let p = 0;
      let s = 0;
      setProcessingStep(steps[0].label);
      setActiveStepIdx(0);
      const interval = setInterval(() => {
        p += Math.random() * 8 + 3;
        if (p >= 100) { p = 100; clearInterval(interval); setTimeout(() => go("glow-result"), 600); }
        setProcessingProgress(Math.min(p, 100));
        const newS = Math.min(Math.floor(p / (100 / steps.length)), steps.length - 1);
        if (newS !== s) { s = newS; setProcessingStep(steps[newS].label); setActiveStepIdx(newS); }
      }, 400);
      return () => clearInterval(interval);
    }, []);

    const pct = Math.round(processingProgress);

    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg, position: "relative", overflow: "hidden" }}>
        {/* ── Ambient background layers ── */}
        <div style={{ position: "absolute", inset: 0, background: grad.glow }} />
        {/* Blurred image ambient */}
        <div style={{ position: "absolute", inset: -40, opacity: 0.12 }}>
          <img src="/assets/images/onboarding/gold_locket.png" alt="" style={{ width: "calc(100% + 80px)", height: "calc(100% + 80px)", objectFit: "cover", filter: "blur(50px) brightness(0.6)" }} />
        </div>
        {/* Rotating gold ring ambient */}
        <div style={{ position: "absolute", top: "28%", left: "50%", width: 340, height: 340, transform: "translate(-50%,-50%)", borderRadius: "50%", border: `1px solid ${C.brand}06`, animation: "glowSpin 12s linear infinite" }} />
        <div style={{ position: "absolute", top: "28%", left: "50%", width: 380, height: 380, transform: "translate(-50%,-50%)", borderRadius: "50%", border: `1px dashed ${C.brand}04`, animation: "glowSpin 20s linear infinite reverse" }} />

        {/* ── Top: Cancel button ── */}
        <div style={{ position: "relative", padding: "54px 20px 0", zIndex: 5 }}>
          <button onClick={back} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.06)", backdropFilter: "blur(10px)", border: `1px solid ${C.borderMed}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icons.X size={16} stroke={C.textTer} />
          </button>
        </div>

        {/* ── Center: Photo + circular progress ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 5, marginTop: -20 }}>
          {/* Photo circle with ring progress */}
          <div style={{ position: "relative", width: 220, height: 220, marginBottom: 32 }}>
            {/* SVG circular progress ring */}
            <svg width="220" height="220" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
              <circle cx="110" cy="110" r="104" fill="none" stroke={`${C.brand}10`} strokeWidth="3" />
              <circle cx="110" cy="110" r="104" fill="none" stroke={C.brand} strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 104}`}
                strokeDashoffset={`${2 * Math.PI * 104 * (1 - pct / 100)}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.4s ease", filter: `drop-shadow(0 0 6px ${C.brand}60)` }} />
            </svg>
            {/* Photo */}
            <div style={{ position: "absolute", inset: 14, borderRadius: "50%", overflow: "hidden", border: `2px solid ${C.card}`, boxShadow: `0 0 50px ${C.brand}10` }}>
              <img src="/assets/images/onboarding/gold_locket.png" style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
              {/* Gold sweep line */}
              <div style={{
                position: "absolute", inset: 0,
                background: `linear-gradient(${90 + pct * 1.8}deg, transparent 40%, ${C.brand}20 50%, transparent 60%)`,
                transition: "background 0.5s ease",
              }} />
              {/* Darkened "before" half fading out */}
              <div style={{
                position: "absolute", inset: 0,
                background: `linear-gradient(90deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.25) ${100 - pct}%, transparent ${100 - pct}%)`,
                transition: "background 0.4s ease",
              }} />
            </div>
            {/* Pulse rings */}
            <div style={{ position: "absolute", inset: -6, borderRadius: "50%", border: `1.5px solid ${C.brand}15`, animation: "pulse 2.5s ease-in-out infinite" }} />
            <div style={{ position: "absolute", inset: -14, borderRadius: "50%", border: `1px solid ${C.brand}08`, animation: "pulse 2.5s ease-in-out infinite 0.8s" }} />
            {/* Percentage overlay */}
            <div style={{
              position: "absolute", bottom: -4, right: -4, width: 48, height: 48, borderRadius: "50%",
              background: C.bg, border: `2px solid ${C.brand}40`, boxShadow: `0 4px 16px rgba(0,0,0,0.5)`,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 14, fontWeight: 900, color: C.brand, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{pct}</span>
              <span style={{ fontSize: 6, fontWeight: 700, color: C.textTer, letterSpacing: 0.5 }}>%</span>
            </div>
          </div>

          {/* Title + current step */}
          <div style={{ textAlign: "center", marginBottom: 28, position: "relative" }}>
            <div style={{ fontSize: 22, fontWeight: 900, fontStyle: "italic", color: C.text, letterSpacing: -0.5, marginBottom: 6 }}>
              <span style={{ color: C.brand }}>Glow</span> Enhancement
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 20 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: steps[activeStepIdx].color, boxShadow: `0 0 8px ${steps[activeStepIdx].color}60`, animation: "pulse 1s ease-in-out infinite" }} />
              <span style={{ fontSize: 12, color: C.brand400, fontWeight: 600 }}>{processingStep}</span>
            </div>
            <div style={{ fontSize: 10, color: C.textTer, marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <Icons.Palette size={10} stroke={C.textTer} />
              Vibe: <span style={{ color: vibes.find(v => v.id === selectedVibe)?.color || C.textSec, fontWeight: 700 }}>{vibes.find(v => v.id === selectedVibe)?.name || "Original+"}</span>
            </div>
          </div>

          {/* ── Step timeline — vertical checklist ── */}
          <div style={{ width: 260, position: "relative" }}>
            {steps.map((st, i) => {
              const done = i < activeStepIdx;
              const active = i === activeStepIdx;
              const pending = i > activeStepIdx;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i < steps.length - 1 ? 4 : 0, position: "relative" }}>
                  {/* Vertical connector */}
                  {i < steps.length - 1 && (
                    <div style={{ position: "absolute", left: 11, top: 24, bottom: -4, width: 1, background: done ? `${C.brand}30` : `${C.borderMed}` }} />
                  )}
                  {/* Step indicator */}
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                    background: done ? `${C.green}20` : active ? `${st.color}15` : "transparent",
                    border: done ? `1.5px solid ${C.green}50` : active ? `1.5px solid ${st.color}60` : `1px solid ${C.borderMed}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: active ? `0 0 10px ${st.color}30` : "none",
                    transition: "all 0.3s",
                  }}>
                    {done ? (
                      <Icons.Check size={10} stroke={C.green} />
                    ) : active ? (
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: st.color, animation: "pulse 1s ease-in-out infinite" }} />
                    ) : (
                      <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.textTer, opacity: 0.3 }} />
                    )}
                  </div>
                  {/* Step label */}
                  <span style={{
                    fontSize: 10, fontWeight: active ? 700 : 500, letterSpacing: 0.2,
                    color: done ? C.green : active ? st.color : C.textTer,
                    opacity: pending ? 0.35 : 1,
                    transition: "all 0.3s",
                  }}>{st.label}</span>
                  {/* Done checkmark text */}
                  {done && <span style={{ fontSize: 7, color: C.green, fontWeight: 700, marginLeft: "auto", opacity: 0.6 }}>DONE</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Bottom: Branding + tip ── */}
        <div style={{ position: "relative", zIndex: 5, padding: "0 20px 40px", textAlign: "center" }}>
          <div style={{ padding: "10px 16px", borderRadius: 14, background: `rgba(255,255,255,0.03)`, border: `1px solid ${C.border}`, display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Icons.Shield size={12} stroke={C.green} />
            <span style={{ fontSize: 9, color: C.textTer, fontWeight: 600 }}>Subtle & undetectable — your secret is safe</span>
          </div>
          <div style={{ fontSize: 8, color: C.textTer, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 2, opacity: 0.3, marginTop: 10 }}>FLEXLOCKET_AI · ENHANCE_ENGINE v2.0</div>
        </div>
      </div>
    );
  };

  // ─── WOW INTRO — Feature Detail Page ────────────────────────────────────────
  const WowIntro = () => {
    const demoImgs = [
      "/assets/images/templates/gold/t1_paris_eiffel.png",
      "/assets/images/templates/gold/t9_bali_sunset.png",
      "/assets/images/templates/gold/t6_yacht_life.png",
    ];
    const heroIdx = useAutoSlide(demoImgs, 2800);

    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
        {/* Hero image area */}
        <div style={{ position: "relative", height: 280, flexShrink: 0, overflow: "hidden" }}>
          {demoImgs.map((src, i) => (
            <img key={src} src={src} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: i === heroIdx ? 1 : 0, transform: i === heroIdx ? "scale(1.05)" : "scale(1.15)", transition: "opacity 1.2s ease, transform 7s ease-out" }} />
          ))}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(5,5,5,0.3) 0%, rgba(5,5,5,0.1) 30%, rgba(5,5,5,0.85) 70%, rgba(5,5,5,1) 100%)" }} />
          {/* Top gold line */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${C.brand}, transparent)`, opacity: 0.6 }} />
          {/* Back button */}
          <button onClick={back} style={{ position: "absolute", top: 52, left: 18, width: 40, height: 40, borderRadius: "50%", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", border: `1px solid ${C.borderMed}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
            <Icons.ArrowLeft size={18} stroke="#fff" />
          </button>
          {/* VIP badge */}
          <div style={{ position: "absolute", top: 56, right: 18, padding: "5px 12px", borderRadius: 12, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", border: `1px solid ${C.brand}40`, display: "flex", alignItems: "center", gap: 6, zIndex: 10 }}>
            <Icons.Crown size={12} stroke={C.brand} />
            <span style={{ fontSize: 9, fontWeight: 900, color: C.brand, letterSpacing: 2 }}>VIP</span>
          </div>
          {/* Bottom content over gradient */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 20px 20px", zIndex: 5 }}>
            <div style={{ display: "inline-block", padding: "4px 10px", borderRadius: 8, background: `${C.brand}20`, border: `1px solid ${C.brand}30`, marginBottom: 8 }}>
              <span style={{ fontSize: 8, fontWeight: 900, color: C.brand, letterSpacing: 3 }}>FLEXTALE · PREMIUM</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, fontStyle: "italic", color: "#fff", letterSpacing: -1, textTransform: "uppercase", textShadow: "0 2px 20px rgba(0,0,0,0.5)", lineHeight: 1.1 }}>
              MAKE ME WOW<br />EVERYDAY
            </div>
          </div>
          {/* Slide dots */}
          <div style={{ position: "absolute", bottom: 24, right: 20, display: "flex", gap: 4, zIndex: 10 }}>
            {demoImgs.map((_, i) => (
              <div key={i} style={{ width: i === heroIdx ? 16 : 5, height: 5, borderRadius: 3, background: i === heroIdx ? C.brand : "rgba(255,255,255,0.3)", transition: "all 0.4s" }} />
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", padding: "0 20px 20px" }}>

          {/* ── Subscription badge ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 20, marginBottom: 16 }}>
            <div style={{ padding: "6px 14px", borderRadius: 12, background: `${C.purple}12`, border: `1px solid ${C.purple}30`, display: "flex", alignItems: "center", gap: 6 }}>
              <Icons.Crown size={12} stroke={C.purple} />
              <span style={{ fontSize: 10, fontWeight: 900, color: C.purple, letterSpacing: 1.5 }}>SUBSCRIPTION</span>
            </div>
            <div style={{ padding: "6px 12px", borderRadius: 12, background: `${C.green}12`, border: `1px solid ${C.green}30` }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: C.green, letterSpacing: 1 }}>NO CREDITS</span>
            </div>
          </div>

          {/* ── What is this? ── */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: C.brand, letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>What is this?</div>
            <div style={{ fontSize: 14, color: C.textSec, lineHeight: 1.8 }}>
              <span style={{ color: C.text, fontWeight: 700 }}>Make Me WOW</span> is a <span style={{ color: C.brand, fontWeight: 700 }}>VIP subscription</span> — your personal AI content factory. Upload your face once, pick a topic you love, and every single day we deliver <span style={{ color: C.brand, fontWeight: 700 }}>4 ready-to-post photos</span> straight to your inbox — with captions, hashtags, and platform-optimized sizes. No credits needed. One subscription, unlimited daily magic.
            </div>
          </div>

          {/* ── How it works — 4 steps ── */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: C.brand, letterSpacing: 3, textTransform: "uppercase", marginBottom: 14 }}>How it works</div>
            {[
              { step: "1", icon: "Camera", title: "Upload your face", desc: "One selfie — AI remembers you. Solo or couple mode." },
              { step: "2", icon: "Palette", title: "Pick a topic", desc: "Travel, Fashion, Fitness, Romance... 8 vibes to choose from." },
              { step: "3", icon: "Moon", title: "Set your schedule", desc: "Pick delivery time — morning, noon, evening, or night." },
              { step: "4", icon: "Sparkles", title: "Get WOW daily", desc: "4 AI photos delivered every day. Share to IG, TikTok, FB in 1 tap." },
            ].map((item, i) => {
              const IC = Icons[item.icon];
              return (
                <div key={i} style={{ display: "flex", gap: 14, marginBottom: i < 3 ? 16 : 0, position: "relative" }}>
                  {/* Connector line */}
                  {i < 3 && <div style={{ position: "absolute", top: 40, left: 18, width: 2, height: "calc(100% - 20px)", background: `${C.brand}15` }} />}
                  {/* Step circle */}
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: `${C.brand}12`, border: `1px solid ${C.brand}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 2 }}>
                    <IC size={16} stroke={C.brand} />
                  </div>
                  <div style={{ flex: 1, paddingTop: 2 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 2 }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: C.textTer, lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── What you get ── */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: C.brand, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>What you get</div>
            <div style={{ background: C.card, borderRadius: 18, padding: "16px", border: `1px solid ${C.border}` }}>
              {[
                { emoji: "📸", text: "4 AI-generated photos every day" },
                { emoji: "✍️", text: "Ready-made captions + trending hashtags" },
                { emoji: "📐", text: "Optimized ratios for IG, TikTok, Facebook" },
                { emoji: "🔄", text: "Redo any photo unlimited times" },
                { emoji: "🎯", text: "AI picks best styles for your topic" },
                { emoji: "⏰", text: "Delivered on your schedule, every day" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < 5 ? `1px solid ${C.border}` : "none" }}>
                  <span style={{ fontSize: 16 }}>{item.emoji}</span>
                  <span style={{ fontSize: 12, color: C.textSec, fontWeight: 500 }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Sample delivery preview ── */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: C.brand, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>Sample delivery</div>
            <div style={{ background: C.card, borderRadius: 18, padding: "14px", border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ padding: "3px 10px", borderRadius: 8, background: `${C.blue}15`, border: `1px solid ${C.blue}25` }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: C.blue }}>✈️ Travel</span>
                </div>
                <span style={{ fontSize: 10, color: C.textTer }}>Day 5 of 7 — Santorini</span>
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                {wowDeliveryMock.photos.map((p, i) => (
                  <div key={i} style={{ flex: 1, aspectRatio: "1", borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}` }}>
                    <img src={p.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: C.textSec, fontStyle: "italic", lineHeight: 1.5 }}>"{wowDeliveryMock.photos[0].caption}"</div>
              <div style={{ fontSize: 9, color: C.purple, fontWeight: 600, marginTop: 4 }}>{wowDeliveryMock.photos[0].hashtags}</div>
            </div>
          </div>

        </div>

        {/* Bottom CTA — sticky */}
        <div style={{ padding: "12px 20px 40px", background: C.bg, borderTop: `1px solid ${C.border}` }}>
          <button onClick={() => { resetWowWizard(); go("wow-setup"); }}
            style={{ width: "100%", padding: "18px 0", background: "linear-gradient(135deg, #7C3AFF 0%, #F59E0B 50%, #EC4899 100%)", backgroundSize: "200% 200%", animation: "wowGlow 4s ease infinite", color: "#fff", borderRadius: 20, fontWeight: 900, fontSize: 14, letterSpacing: 1, border: "none", cursor: "pointer", boxShadow: "0 12px 28px rgba(124,58,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icons.Crown size={18} stroke="#fff" />
            Start My WOW
          </button>
          <div style={{ textAlign: "center", marginTop: 10, fontSize: 10, color: C.textTer, letterSpacing: 0.5 }}>
            3-day free trial · Cancel anytime · No hidden fees
          </div>
        </div>
      </div>
    );
  };

  // ─── WOW SETUP WIZARD (5 steps in 1 component) ────────────────────────────
  const WowSetup = () => {
    const progress = (wowStep / 5) * 100;
    const canNext = wowStep === 1 ? wowFaces[0] !== null : wowStep === 2 ? wowTopic !== null : wowStep === 3 ? true : wowStep === 4 ? true : true;
    const selectedTopicObj = wowTopics.find(t => t.id === wowTopic);
    const selectedDurationObj = wowPricing.find(p => p.id === wowDuration);
    const selectedTimeObj = wowTimeSlots.find(t => t.id === wowTime);

    const handleBack = () => {
      if (wowStep > 1) setWowStep(wowStep - 1);
      else back();
    };
    const handleNext = () => {
      if (wowStep < 5) setWowStep(wowStep + 1);
    };
    const handleSubscribe = () => {
      setWowActive(true);
      setWowDeliveryDay(5);
      showToast("WOW activated! First delivery tomorrow");
      go("wow-dashboard");
    };

    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
        {/* Top bar */}
        <div style={{ padding: "52px 20px 12px", display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={handleBack} style={{ width: 40, height: 40, borderRadius: "50%", background: C.card, border: `1px solid ${C.borderMed}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icons.ArrowLeft size={18} stroke={C.text} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.brand, letterSpacing: 2, marginBottom: 6 }}>STEP {wowStep} OF 5</div>
            <div style={{ width: "100%", height: 4, borderRadius: 2, background: C.input }}>
              <div style={{ width: `${progress}%`, height: "100%", borderRadius: 2, background: C.brand, transition: "width 0.4s ease" }} />
            </div>
          </div>
          {/* Step dots */}
          <div style={{ display: "flex", gap: 4 }}>
            {[1,2,3,4,5].map(s => (
              <div key={s} style={{ width: s === wowStep ? 14 : 6, height: 6, borderRadius: 3, background: s <= wowStep ? C.brand : C.textTer + '30', transition: "all 0.3s" }} />
            ))}
          </div>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>

          {/* ── STEP 1: Face Upload ── */}
          {wowStep === 1 && (
            <div style={{ padding: "8px 20px 20px" }}>
              <div style={{ fontSize: 22, fontWeight: 900, fontStyle: "italic", color: C.text, letterSpacing: -0.5, marginBottom: 4 }}>Upload your face</div>
              <div style={{ fontSize: 12, color: C.textSec, marginBottom: 20, lineHeight: 1.6 }}>AI needs your face to create personalized content daily.</div>

              {/* Solo / Couple toggle */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
                {[{ id: "solo", label: "Solo", icon: "User", desc: "Just me" }, { id: "couple", label: "Couple", icon: "Heart", desc: "Me + bae" }].map(m => {
                  const active = wowMode === m.id;
                  const IC = Icons[m.icon];
                  return (
                    <button key={m.id} onClick={() => { setWowMode(m.id); if (m.id === "solo") setWowFaces([wowFaces[0], null]); }}
                      style={{ padding: "18px 14px", borderRadius: 18, background: active ? `${C.brand}10` : C.card, border: active ? `2px solid ${C.brand}` : `1px solid ${C.borderMed}`, cursor: "pointer", textAlign: "center", transition: "all 0.3s", boxShadow: active ? `0 0 0 4px ${C.brand}08` : "none" }}>
                      <IC size={24} stroke={active ? C.brand : C.textTer} />
                      <div style={{ fontSize: 14, fontWeight: 800, color: active ? C.text : C.textTer, marginTop: 8 }}>{m.label}</div>
                      <div style={{ fontSize: 10, color: active ? C.brand : C.textTer, marginTop: 2 }}>{m.desc}</div>
                    </button>
                  );
                })}
              </div>

              {/* Upload circles */}
              <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 24 }}>
                {[0, ...(wowMode === "couple" ? [1] : [])].map(i => (
                  <div key={i} onClick={() => { const f = [...wowFaces]; f[i] = "/assets/images/templates/gold/t10_gym_beast.png"; setWowFaces(f); }}
                    style={{ width: 120, height: 120, borderRadius: "50%", border: wowFaces[i] ? `3px solid ${C.brand}` : `2px dashed ${C.brand}40`, background: wowFaces[i] ? "transparent" : `${C.brand}06`, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative", boxShadow: wowFaces[i] ? `0 0 30px ${C.brand}20` : "none", transition: "all 0.3s" }}>
                    {wowFaces[i] ? (
                      <>
                        <img src={wowFaces[i]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <div style={{ position: "absolute", bottom: 4, right: 4, width: 24, height: 24, borderRadius: "50%", background: C.brand, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${C.bg}` }}>
                          <Icons.Check size={12} stroke="#fff" />
                        </div>
                      </>
                    ) : (
                      <>
                        <Icons.Camera size={28} stroke={C.brand + '60'} />
                        <div style={{ fontSize: 9, color: C.textTer, marginTop: 6, fontWeight: 700, letterSpacing: 1 }}>{i === 0 ? "YOUR FACE" : "BAE'S FACE"}</div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Tips */}
              <div style={{ background: `${C.brand}08`, borderRadius: 16, padding: "14px 16px", border: `1px solid ${C.brand}15` }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: C.brand, letterSpacing: 2, marginBottom: 8 }}>TIPS FOR BEST RESULTS</div>
                {["Clear, front-facing selfie", "Good lighting, no sunglasses", "Neutral expression works best"].map(tip => (
                  <div key={tip} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <Icons.Check size={10} stroke={C.brand} />
                    <span style={{ fontSize: 11, color: C.textSec }}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 2: Pick Topic ── */}
          {wowStep === 2 && (
            <div style={{ padding: "8px 20px 20px" }}>
              <div style={{ fontSize: 22, fontWeight: 900, fontStyle: "italic", color: C.text, letterSpacing: -0.5, marginBottom: 4 }}>Pick your vibe</div>
              <div style={{ fontSize: 12, color: C.textSec, marginBottom: 20, lineHeight: 1.6 }}>Choose a topic for your daily WOW content.</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {wowTopics.map(topic => {
                  const active = wowTopic === topic.id;
                  return (
                    <button key={topic.id} onClick={() => setWowTopic(topic.id)}
                      style={{ padding: "18px 14px", borderRadius: 18, background: active ? `${topic.color}12` : C.card, border: active ? `2px solid ${topic.color}` : `1px solid ${C.borderMed}`, cursor: "pointer", textAlign: "left", transition: "all 0.3s", boxShadow: active ? `0 0 20px ${topic.color}15, 0 0 0 4px ${topic.color}08` : "none", position: "relative", overflow: "hidden" }}>
                      {active && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: topic.color }} />}
                      <div style={{ fontSize: 24, marginBottom: 8 }}>{topic.emoji}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: active ? C.text : C.textSec }}>{topic.name}</div>
                      <div style={{ fontSize: 10, color: active ? topic.color : C.textTer, marginTop: 2 }}>{topic.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── STEP 3: Pick Source ── */}
          {wowStep === 3 && (
            <div style={{ padding: "8px 20px 20px" }}>
              <div style={{ fontSize: 22, fontWeight: 900, fontStyle: "italic", color: C.text, letterSpacing: -0.5, marginBottom: 4 }}>How should we pick?</div>
              <div style={{ fontSize: 12, color: C.textSec, marginBottom: 20, lineHeight: 1.6 }}>Let AI surprise you or hand-pick your story packs.</div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Surprise option */}
                <button onClick={() => { setWowSource("surprise"); setWowPickedPacks([]); }}
                  style={{ padding: "20px 18px", borderRadius: 20, background: wowSource === "surprise" ? "linear-gradient(135deg, rgba(124,58,255,0.12), rgba(245,158,11,0.08))" : C.card, border: wowSource === "surprise" ? `2px solid ${C.purple}` : `1px solid ${C.borderMed}`, cursor: "pointer", textAlign: "left", transition: "all 0.3s", position: "relative", overflow: "hidden" }}>
                  {wowSource === "surprise" && <div style={{ position: "absolute", top: 10, right: 12, padding: "3px 10px", borderRadius: 10, background: C.purple, fontSize: 8, fontWeight: 900, color: "#fff", letterSpacing: 1 }}>RECOMMENDED</div>}
                  <div style={{ fontSize: 24, marginBottom: 8 }}>🎲</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 4 }}>Surprise me daily</div>
                  <div style={{ fontSize: 11, color: C.textSec, lineHeight: 1.5 }}>AI picks the best templates and styles for your topic each day. Maximum variety, zero effort.</div>
                </button>

                {/* Pick packs option */}
                <button onClick={() => setWowSource("pick")}
                  style={{ padding: "20px 18px", borderRadius: 20, background: wowSource === "pick" ? `${C.brand}08` : C.card, border: wowSource === "pick" ? `2px solid ${C.brand}` : `1px solid ${C.borderMed}`, cursor: "pointer", textAlign: "left", transition: "all 0.3s" }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>📦</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 4 }}>Choose story packs</div>
                  <div style={{ fontSize: 11, color: C.textSec, lineHeight: 1.5 }}>Hand-pick specific story packs to rotate through.</div>
                </button>
              </div>

              {/* Pack selector (visible when "pick" chosen) */}
              {wowSource === "pick" && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: C.textTer, letterSpacing: 2, marginBottom: 10 }}>SELECT PACKS</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {tales.filter(t => !wowTopic || t.type === "travel" || t.cat.toLowerCase() === (selectedTopicObj?.name || "").toLowerCase()).slice(0, 5).map(tale => {
                      const selected = wowPickedPacks.includes(tale.id);
                      return (
                        <button key={tale.id} onClick={() => setWowPickedPacks(prev => selected ? prev.filter(id => id !== tale.id) : [...prev, tale.id])}
                          style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, background: selected ? `${C.brand}08` : C.card, border: selected ? `1.5px solid ${C.brand}40` : `1px solid ${C.borderMed}`, cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}>
                          <img src={tale.img} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tale.title}</div>
                            <div style={{ fontSize: 9, color: C.textTer }}>{tale.pics} images · {tale.cat}</div>
                          </div>
                          <div style={{ width: 22, height: 22, borderRadius: 6, background: selected ? C.brand : "transparent", border: selected ? "none" : `2px solid ${C.borderMed}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
                            {selected && <Icons.Check size={12} stroke="#fff" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 4: Schedule ── */}
          {wowStep === 4 && (
            <div style={{ padding: "8px 20px 20px" }}>
              <div style={{ fontSize: 22, fontWeight: 900, fontStyle: "italic", color: C.text, letterSpacing: -0.5, marginBottom: 4 }}>Set your schedule</div>
              <div style={{ fontSize: 12, color: C.textSec, marginBottom: 20, lineHeight: 1.6 }}>How long and when should we deliver your WOW?</div>

              {/* Duration chips */}
              <div style={{ fontSize: 10, fontWeight: 800, color: C.textTer, letterSpacing: 2, marginBottom: 10 }}>DURATION</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
                {wowPricing.map(p => {
                  const active = wowDuration === p.id;
                  return (
                    <button key={p.id} onClick={() => setWowDuration(p.id)}
                      style={{ padding: "16px 14px", borderRadius: 16, background: active ? `${C.brand}10` : C.card, border: active ? `2px solid ${C.brand}` : `1px solid ${C.borderMed}`, cursor: "pointer", textAlign: "center", transition: "all 0.3s", position: "relative", overflow: "hidden" }}>
                      {p.badge && <div style={{ position: "absolute", top: 8, right: 8, padding: "2px 8px", borderRadius: 8, background: p.badge === "POPULAR" ? C.brand : p.badge === "VIP" ? C.purple : C.green, fontSize: 7, fontWeight: 900, color: "#fff", letterSpacing: 1 }}>{p.badge}</div>}
                      <div style={{ fontSize: 22, fontWeight: 900, color: active ? C.text : C.textSec, fontFamily: "'JetBrains Mono', monospace" }}>{p.days}{p.days !== "∞" ? "d" : ""}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: active ? C.brand : C.textTer, marginTop: 4 }}>{p.price}{p.sub || ""}</div>
                      <div style={{ fontSize: 9, color: C.textTer, marginTop: 2 }}>{p.perDay}/day</div>
                    </button>
                  );
                })}
              </div>

              {/* Time slots */}
              <div style={{ fontSize: 10, fontWeight: 800, color: C.textTer, letterSpacing: 2, marginBottom: 10 }}>DELIVERY TIME</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
                {wowTimeSlots.map(slot => {
                  const active = wowTime === slot.id;
                  return (
                    <button key={slot.id} onClick={() => setWowTime(slot.id)}
                      style={{ padding: "14px 12px", borderRadius: 14, background: active ? `${C.brand}10` : C.card, border: active ? `2px solid ${C.brand}` : `1px solid ${C.borderMed}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "all 0.3s" }}>
                      <span style={{ fontSize: 20 }}>{slot.emoji}</span>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: active ? C.text : C.textSec }}>{slot.label}</div>
                        <div style={{ fontSize: 10, color: active ? C.brand : C.textTer, fontFamily: "'JetBrains Mono', monospace" }}>{slot.time}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Preview */}
              <div style={{ background: `${C.brand}08`, borderRadius: 14, padding: "12px 16px", border: `1px solid ${C.brand}15`, display: "flex", alignItems: "center", gap: 10 }}>
                <Icons.Zap size={16} stroke={C.brand} />
                <span style={{ fontSize: 12, color: C.textSec, fontWeight: 600 }}>Your first WOW drops: <span style={{ color: C.brand, fontWeight: 800 }}>Tomorrow at {selectedTimeObj?.time || "8:00 AM"}</span></span>
              </div>
            </div>
          )}

          {/* ── STEP 5: Confirm & Subscribe ── */}
          {wowStep === 5 && (
            <div style={{ padding: "8px 20px 20px" }}>
              <div style={{ fontSize: 22, fontWeight: 900, fontStyle: "italic", color: C.text, letterSpacing: -0.5, marginBottom: 4 }}>Review & subscribe</div>
              <div style={{ fontSize: 12, color: C.textSec, marginBottom: 16, lineHeight: 1.6 }}>Double check your WOW setup before we start.</div>

              {/* Subscription badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <div style={{ padding: "5px 12px", borderRadius: 10, background: `${C.purple}12`, border: `1px solid ${C.purple}30`, display: "flex", alignItems: "center", gap: 5 }}>
                  <Icons.Crown size={11} stroke={C.purple} />
                  <span style={{ fontSize: 9, fontWeight: 900, color: C.purple, letterSpacing: 1.5 }}>SUBSCRIPTION</span>
                </div>
                <div style={{ padding: "5px 10px", borderRadius: 10, background: `${C.green}12`, border: `1px solid ${C.green}30` }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: C.green, letterSpacing: 1 }}>NO CREDITS NEEDED</span>
                </div>
              </div>

              {/* Summary card */}
              <div style={{ background: C.card, borderRadius: 20, padding: "18px 16px", border: `1px solid ${C.borderMed}`, marginBottom: 16 }}>
                {[
                  { label: "Plan", value: "WOW Subscription" },
                  { label: "Mode", value: wowMode === "solo" ? "Solo" : "Couple" },
                  { label: "Topic", value: selectedTopicObj ? `${selectedTopicObj.emoji} ${selectedTopicObj.name}` : "—" },
                  { label: "Source", value: wowSource === "surprise" ? "AI Surprise" : `${wowPickedPacks.length} packs` },
                  { label: "Duration", value: `${selectedDurationObj?.days || 7} days` },
                  { label: "Time", value: selectedTimeObj ? `${selectedTimeObj.emoji} ${selectedTimeObj.time}` : "8:00 AM" },
                  { label: "Starts", value: "Tomorrow" },
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < 6 ? `1px solid ${C.border}` : "none" }}>
                    <span style={{ fontSize: 12, color: C.textTer, fontWeight: 600 }}>{row.label}</span>
                    <span style={{ fontSize: 12, color: i === 0 ? C.brand : C.text, fontWeight: 700 }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Price display */}
              <div style={{ textAlign: "center", marginBottom: 20, background: C.card, borderRadius: 20, padding: "20px 16px", border: `1px solid ${C.brand}20` }}>
                <div style={{ fontSize: 9, fontWeight: 900, color: C.brand, letterSpacing: 3, marginBottom: 8 }}>SUBSCRIPTION PRICE</div>
                <div style={{ fontSize: 36, fontWeight: 900, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>{selectedDurationObj?.price || "$4.99"}</div>
                <div style={{ fontSize: 12, color: C.textTer, marginTop: 4 }}>{selectedDurationObj?.perDay || "$0.71"} per day · Cancel anytime</div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, background: `${C.green}10`, border: `1px solid ${C.green}20`, marginTop: 10 }}>
                  <Icons.Check size={10} stroke={C.green} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.green }}>No credits deducted — flat subscription fee</span>
                </div>
              </div>

              {/* VIP perks */}
              <div style={{ background: `${C.brand}08`, borderRadius: 16, padding: "14px 16px", border: `1px solid ${C.brand}15`, marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: C.brand, letterSpacing: 2, marginBottom: 10 }}>YOUR SUBSCRIPTION INCLUDES</div>
                {[
                  "4 ready-to-post photos delivered daily",
                  "Captions + hashtags + platform-optimized ratios",
                  "1-tap share to Instagram, TikTok, Facebook",
                  "Redo any photo unlimited times",
                  "No credit usage — everything included in plan",
                ].map(perk => (
                  <div key={perk} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Icons.CheckCircle size={14} stroke={C.brand} />
                    <span style={{ fontSize: 11, color: C.textSec, fontWeight: 500 }}>{perk}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div style={{ padding: "12px 20px 40px", background: C.bg }}>
          {wowStep < 5 ? (
            <button onClick={handleNext} disabled={!canNext}
              style={{ width: "100%", padding: "18px 0", background: canNext ? grad.btn : C.input, color: canNext ? "#000" : C.textTer, borderRadius: 20, fontWeight: 900, fontSize: 13, letterSpacing: 1, border: "none", cursor: canNext ? "pointer" : "default", boxShadow: canNext ? `0 12px 28px ${C.brand}30` : "none", transition: "all 0.3s" }}>
              {wowStep === 4 ? "Review & Subscribe" : "Next"}
            </button>
          ) : (
            <button onClick={handleSubscribe}
              style={{ width: "100%", padding: "18px 0", background: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #B45309 100%)", color: "#fff", borderRadius: 20, fontWeight: 900, fontSize: 13, letterSpacing: 1, border: "none", cursor: "pointer", boxShadow: `0 12px 28px ${C.brand}40`, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Icons.Crown size={18} stroke="#fff" />
              Subscribe & Start WOW
            </button>
          )}
        </div>
      </div>
    );
  };

  // ─── WOW DASHBOARD ──────────────────────────────────────────────────────────
  const WowDashboard = () => {
    const durationObj = wowPricing.find(p => p.id === wowDuration);
    const totalDays = durationObj?.days || 7;
    const timeObj = wowTimeSlots.find(t => t.id === wowTime);
    const topicObj = wowTopics.find(t => t.id === wowTopic);

    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
        {/* Header */}
        <div style={{ padding: "52px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={back} style={{ width: 40, height: 40, borderRadius: "50%", background: C.card, border: `1px solid ${C.borderMed}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icons.ArrowLeft size={18} stroke={C.text} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Icons.Crown size={16} stroke={C.brand} />
            <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>My WOW</span>
          </div>
          <IconBtn icon="Settings" onClick={() => setShowWowSettings(!showWowSettings)} />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 20px", scrollbarWidth: "none" }}>
          {/* Hero status */}
          <div style={{ background: "linear-gradient(135deg, rgba(124,58,255,0.1), rgba(245,158,11,0.08))", borderRadius: 24, padding: "22px 20px", border: `1px solid ${C.brand}20`, marginBottom: 16, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, background: `radial-gradient(circle, ${C.brand}15 0%, transparent 70%)`, borderRadius: "50%" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: C.brand, letterSpacing: 3, marginBottom: 4 }}>YOUR JOURNEY</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: C.text, fontFamily: "'JetBrains Mono', monospace", letterSpacing: -1 }}>DAY {wowDeliveryDay} <span style={{ fontSize: 16, color: C.textTer, fontWeight: 600 }}>of {totalDays}</span></div>
              </div>
              {topicObj && (
                <div style={{ padding: "8px 14px", borderRadius: 14, background: `${topicObj.color}15`, border: `1px solid ${topicObj.color}25` }}>
                  <span style={{ fontSize: 16 }}>{topicObj.emoji}</span>
                  <span style={{ fontSize: 10, fontWeight: 800, color: topicObj.color, marginLeft: 6 }}>{topicObj.name}</span>
                </div>
              )}
            </div>
            {/* Progress bar */}
            <div style={{ width: "100%", height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", marginBottom: 8 }}>
              <div style={{ width: `${(wowDeliveryDay / totalDays) * 100}%`, height: "100%", borderRadius: 3, background: grad.hero, transition: "width 0.5s ease", boxShadow: `0 0 12px ${C.brand}40` }} />
            </div>
            <div style={{ fontSize: 10, color: C.textTer }}>Next delivery: <span style={{ color: C.brand, fontWeight: 700 }}>Today at {timeObj?.time || "8:00 AM"}</span></div>
          </div>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
            {[
              { label: "Days", value: wowDeliveryDay, icon: "Flame" },
              { label: "Photos", value: wowDeliveryDay * 4, icon: "Image" },
              { label: "Shares", value: Math.floor(wowDeliveryDay * 2.3), icon: "Share" },
            ].map(stat => {
              const IC = Icons[stat.icon];
              return (
                <div key={stat.label} style={{ background: C.card, borderRadius: 16, padding: "14px 10px", textAlign: "center", border: `1px solid ${C.border}` }}>
                  <IC size={16} stroke={C.brand400} style={{ marginBottom: 6 }} />
                  <div style={{ fontSize: 20, fontWeight: 900, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>{stat.value}</div>
                  <div style={{ fontSize: 8, color: C.textTer, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700, marginTop: 2 }}>{stat.label}</div>
                </div>
              );
            })}
          </div>

          {/* Today's delivery card */}
          <div style={{ background: C.card, borderRadius: 20, padding: "16px", border: `1px solid ${C.brand}15`, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>Today's Delivery</div>
              <div style={{ padding: "3px 10px", borderRadius: 10, background: `${C.green}15`, border: `1px solid ${C.green}25` }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: C.green, letterSpacing: 1 }}>READY</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {wowDeliveryMock.photos.map((p, i) => (
                <div key={i} style={{ flex: 1, aspectRatio: "1", borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}` }}>
                  <img src={p.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
            <button onClick={() => go("wow-delivery")}
              style={{ width: "100%", padding: "14px 0", background: grad.btn, color: "#000", borderRadius: 14, fontWeight: 800, fontSize: 12, letterSpacing: 1, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: `0 8px 20px ${C.brand}25` }}>
              <Icons.Eye size={16} stroke="#000" /> View & Share
            </button>
          </div>

          {/* Upcoming schedule */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.textTer, letterSpacing: 2, marginBottom: 10 }}>UPCOMING</div>
            {[
              { day: wowDeliveryDay + 1, status: "Generating..." },
              { day: wowDeliveryDay + 2, status: "Scheduled" },
              { day: wowDeliveryDay + 3, status: "Scheduled" },
            ].filter(d => typeof totalDays === "string" || d.day <= totalDays).map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: C.card, padding: "12px 14px", borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C.brand}10`, border: `1px solid ${C.brand}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 900, color: C.brand, fontFamily: "'JetBrains Mono', monospace" }}>{item.day}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Day {item.day}</div>
                  <div style={{ fontSize: 10, color: C.textTer }}>{timeObj?.time || "8:00 AM"}</div>
                </div>
                <span style={{ fontSize: 10, color: i === 0 ? C.brand : C.textTer, fontWeight: 600 }}>{item.status}</span>
              </div>
            ))}
          </div>

          {/* Subscription info */}
          <div style={{ background: C.card, borderRadius: 16, padding: "14px 16px", border: `1px solid ${C.border}`, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icons.Crown size={12} stroke={C.brand} />
                <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>WOW Subscription</span>
              </div>
              <span style={{ fontSize: 11, color: C.brand, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>{durationObj?.price || "$4.99"}{durationObj?.sub || ""}</span>
            </div>
            <div style={{ fontSize: 10, color: C.textTer, marginBottom: 10 }}>Flat fee · No credits used · All features included</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => showToast("Subscription paused")}
                style={{ flex: 1, padding: "10px 0", background: C.input, borderRadius: 12, border: `1px solid ${C.borderMed}`, color: C.textSec, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                Pause
              </button>
              <button onClick={() => { resetWowWizard(); setWowStep(2); go("wow-setup"); }}
                style={{ flex: 1, padding: "10px 0", background: `${C.brand}10`, borderRadius: 12, border: `1px solid ${C.brand}25`, color: C.brand, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                Change topic
              </button>
            </div>
          </div>

          {/* Settings bottom sheet */}
          {showWowSettings && (
            <div style={{ background: C.card, borderRadius: 16, padding: "14px 16px", border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.textTer, letterSpacing: 2, marginBottom: 10 }}>MANAGE</div>
              {[
                { label: "Change delivery time", action: () => { resetWowWizard(); setWowStep(4); go("wow-setup"); } },
                { label: "Update my face photo", action: () => { resetWowWizard(); setWowStep(1); go("wow-setup"); } },
                { label: "Cancel subscription", action: () => { setWowActive(false); setShowWowSettings(false); showToast("WOW cancelled"); back(); }, danger: true },
              ].map((item, i) => (
                <button key={i} onClick={item.action}
                  style={{ width: "100%", textAlign: "left", padding: "12px 0", borderBottom: i < 2 ? `1px solid ${C.border}` : "none", background: "none", border: i < 2 ? undefined : "none", borderLeft: "none", borderRight: "none", borderTop: "none", color: item.danger ? C.red : C.textSec, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                  {item.danger && <Icons.X size={12} stroke={C.red} />}
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── WOW DELIVERY SCREEN ───────────────────────────────────────────────────
  const WowDelivery = () => {
    const durationObj = wowPricing.find(p => p.id === wowDuration);
    const totalDays = durationObj?.days || 7;
    const topicObj = wowTopics.find(t => t.id === wowTopic);
    const mock = wowDeliveryMock;

    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
        {/* Header */}
        <div style={{ padding: "52px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={back} style={{ width: 40, height: 40, borderRadius: "50%", background: C.card, border: `1px solid ${C.borderMed}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icons.ArrowLeft size={18} stroke={C.text} />
          </button>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Today's WOW</div>
            <div style={{ fontSize: 9, color: C.textTer, letterSpacing: 2, fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>{mock.date}</div>
          </div>
          <div style={{ width: 40 }} />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px", scrollbarWidth: "none" }}>
          {/* Day counter hero */}
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 42, fontWeight: 900, color: C.brand, fontFamily: "'JetBrains Mono', monospace", letterSpacing: -2 }}>DAY {mock.day}</div>
            <div style={{ fontSize: 12, color: C.textTer }}>of {totalDays} · {mock.date}</div>
            {topicObj && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 20, background: `${topicObj.color}12`, border: `1px solid ${topicObj.color}25`, marginTop: 8 }}>
                <span style={{ fontSize: 14 }}>{topicObj.emoji}</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: topicObj.color, letterSpacing: 1 }}>{topicObj.name}</span>
              </div>
            )}
          </div>

          {/* Photo cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 12 }}>
            {mock.photos.map((photo, i) => (
              <div key={i} style={{ background: C.card, borderRadius: 20, overflow: "hidden", border: `1px solid ${C.border}`, boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
                {/* Image */}
                <div style={{ aspectRatio: "4/3", position: "relative", overflow: "hidden" }}>
                  <img src={photo.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 40%)" }} />
                  <div style={{ position: "absolute", top: 10, left: 10, padding: "3px 10px", borderRadius: 10, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", border: `1px solid rgba(255,255,255,0.1)` }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", letterSpacing: 1 }}>{photo.ratio} · {photo.platform}</span>
                  </div>
                  <div style={{ position: "absolute", top: 10, right: 10, padding: "3px 10px", borderRadius: 10, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: C.brand, letterSpacing: 1 }}>#{i + 1}</span>
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: "14px 16px" }}>
                  {/* Caption */}
                  <div style={{ fontSize: 13, color: C.textSec, fontStyle: "italic", lineHeight: 1.6, marginBottom: 8 }}>"{photo.caption}"</div>
                  {/* Hashtags */}
                  <div style={{ fontSize: 10, color: C.purple, fontWeight: 600, marginBottom: 12, lineHeight: 1.6 }}>{photo.hashtags}</div>

                  {/* Platform share buttons */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    {[
                      { name: "IG", color: "#E1306C", bg: "#E1306C15" },
                      { name: "FB", color: "#1877F2", bg: "#1877F215" },
                      { name: "TikTok", color: "#fff", bg: "rgba(255,255,255,0.06)" },
                    ].map(plat => (
                      <button key={plat.name} onClick={() => showToast(`Shared to ${plat.name}!`)}
                        style={{ flex: 1, padding: "10px 0", borderRadius: 12, background: plat.bg, border: `1px solid ${plat.color}25`, cursor: "pointer", fontSize: 10, fontWeight: 800, color: plat.color, letterSpacing: 0.5 }}>
                        {plat.name}
                      </button>
                    ))}
                  </div>

                  {/* Action row */}
                  <div style={{ display: "flex", gap: 6 }}>
                    {[
                      { icon: "Edit", label: "Copy", action: () => showToast("Caption copied!") },
                      { icon: "Download", label: "Save", action: () => showToast("Photo saved!") },
                      { icon: "RefreshCw", label: "Redo", action: () => showToast("Regenerating...") },
                    ].map(act => {
                      const IC = Icons[act.icon];
                      return (
                        <button key={act.label} onClick={act.action}
                          style={{ flex: 1, padding: "8px 0", borderRadius: 10, background: "transparent", border: `1px solid ${C.borderMed}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 9, fontWeight: 700, color: C.textTer }}>
                          <IC size={11} stroke={C.textTer} /> {act.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom sticky */}
        <div style={{ padding: "12px 20px 40px", background: C.bg, borderTop: `1px solid ${C.border}`, display: "flex", gap: 10 }}>
          <button onClick={() => showToast("All photos saved!")}
            style={{ flex: 1, padding: "16px 0", background: grad.btn, color: "#000", borderRadius: 16, fontWeight: 900, fontSize: 11, letterSpacing: 1, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: `0 8px 20px ${C.brand}25` }}>
            <Icons.Download size={16} stroke="#000" /> Download all
          </button>
          <button onClick={() => showToast("Carousel created!")}
            style={{ flex: 1, padding: "16px 0", background: C.card, color: C.text, borderRadius: 16, fontWeight: 800, fontSize: 11, letterSpacing: 1, border: `1px solid ${C.borderMed}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icons.Layers size={16} stroke={C.textSec} /> Share as carousel
          </button>
        </div>
      </div>
    );
  };

  // ─── OVERLAYS ──────────────────────────────────────────────────────────────

  const NotifPanel = () => (
    <div style={{ position: "absolute", inset: 0, zIndex: 700, background: C.bg, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "52px 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text, fontFamily: "'Inter', sans-serif" }}>Notifications</div>
        <IconBtn icon="X" onClick={() => setShowNotif(false)} />
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10, scrollbarWidth: "none" }}>
        {notifs.map((n, i) => {
          const IC = Icons[n.icon];
          return (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, background: C.card, padding: "14px 16px", borderRadius: 16, border: `1px solid ${C.border}` }}>
              <div style={{ width: 40, height: 40, background: C.input, borderRadius: 12, border: `1px solid ${C.borderMed}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <IC size={16} stroke={n.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: C.text, fontWeight: 500, lineHeight: 1.5 }}>{n.text}</div>
                <div style={{ fontSize: 9, color: C.textTer, letterSpacing: 1.5, fontWeight: 700, marginTop: 4 }}>{n.time} ago</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const SettingsPanel = () => (
    <div style={{ position: "absolute", inset: 0, zIndex: 700, background: C.bg, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "52px 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text, fontFamily: "'Inter', sans-serif" }}>Settings</div>
        <IconBtn icon="X" onClick={() => setShowSettings(false)} />
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", scrollbarWidth: "none" }}>
        {[
          { icon: "User", label: "Account Info", desc: "Alex Neo · @alex.neo" },
          { icon: "CreditCard", label: "Manage Credits", desc: `${credits} credits remaining` },
          { icon: "Shield", label: "Privacy", desc: "Public account" },
          { icon: "Bell", label: "Notifications", desc: "All enabled" },
          { icon: "Help", label: "Help & Feedback", desc: "support@flexmenow.com" },
        ].map(({ icon, label, desc }) => {
          const IC = Icons[icon];
          return (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 14, background: C.card, padding: "14px 16px", borderRadius: 16, border: `1px solid ${C.border}`, marginBottom: 10, cursor: "pointer" }}>
              <div style={{ width: 40, height: 40, background: C.input, borderRadius: 12, border: `1px solid ${C.borderMed}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <IC size={16} stroke={C.textTer} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{label}</div>
                <div style={{ fontSize: 10, color: C.textTer, marginTop: 2 }}>{desc}</div>
              </div>
              <Icons.ChevronRight size={16} stroke={C.textTer} />
            </div>
          );
        })}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.card, padding: "14px 16px", borderRadius: 16, border: `1px solid ${C.border}`, marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, background: C.input, borderRadius: 12, border: `1px solid ${C.borderMed}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icons.Moon size={16} stroke={C.textTer} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Dark Mode</div>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} style={{ width: 48, height: 26, borderRadius: 13, background: darkMode ? C.brand : C.textTer, border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
            <div style={{ position: "absolute", top: 3, [darkMode ? "right" : "left"]: 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "all 0.2s" }} />
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, background: `${C.red}08`, padding: "14px 16px", borderRadius: 16, border: `1px solid ${C.red}15`, cursor: "pointer" }}>
          <div style={{ width: 40, height: 40, background: `${C.red}10`, borderRadius: 12, border: `1px solid ${C.red}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icons.LogOut size={16} stroke={C.red} />
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.red }}>Log Out</div>
        </div>
      </div>
    </div>
  );

  const Paywall = () => (
    <div style={{ position: "absolute", inset: 0, zIndex: 800, background: C.bg, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "52px 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 9, color: C.brand400, fontWeight: 800, textTransform: "uppercase", letterSpacing: 4 }}>FlexMe Pro</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: -1, fontFamily: "'Inter', sans-serif" }}>Choose your plan</div>
        </div>
        <IconBtn icon="X" onClick={() => setShowPaywall(false)} />
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 20px", scrollbarWidth: "none" }}>
        {[
          { id: "starter", name: "Starter", price: "$2.99", credits: "10 Credits", color: C.borderMed, badge: null, features: ["10 credits/month", "FlexShot access", "HD export", "Basic AI"] },
          { id: "pro", name: "Pro", price: "$7.99", credits: "50 Credits", color: C.brand, badge: "POPULAR", features: ["50 credits/month", "All features", "4K export", "Priority AI", "Pro badge"] },
          { id: "elite", name: "Elite", price: "$19.99", credits: "Unlimited", color: C.brand400, badge: "BEST VALUE", features: ["Unlimited credits", "Early access", "Creator tools", "Custom AI style", "Dedicated support"] },
        ].map(p => (
          <button key={p.id} onClick={() => setPlan(p.id)}
            style={{ width: "100%", textAlign: "left", borderRadius: 20, border: `2px solid ${plan === p.id ? p.color : C.borderMed}`, background: plan === p.id ? `${p.color}08` : C.card, padding: "18px 20px", marginBottom: 12, position: "relative", overflow: "hidden", cursor: "pointer", transition: "all 0.2s" }}>
            {p.badge && <div style={{ position: "absolute", top: 14, right: 14, padding: "3px 10px", borderRadius: 20, background: plan === p.id ? p.color : C.textTer, fontSize: 8, fontWeight: 800, color: "#fff", letterSpacing: 1 }}>{p.badge}</div>}
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: C.text, fontFamily: "'Inter', sans-serif" }}>{p.price}</span>
              <span style={{ fontSize: 11, color: C.textTer }}>/month</span>
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.textTer, marginBottom: 12 }}>{p.name} · {p.credits}</div>
            {p.features.map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <Icons.Check size={11} stroke={plan === p.id ? C.brand400 : C.textTer} />
                <span style={{ fontSize: 11, color: C.textSec, fontWeight: 500 }}>{f}</span>
              </div>
            ))}
          </button>
        ))}
      </div>
      <div style={{ padding: "12px 20px 40px" }}>
        <button onClick={() => { setShowPaywall(false); const add = plan === "starter" ? 10 : plan === "pro" ? 50 : 99; setCredits(c => c + add); showToast(`Subscribed! +${add} credits`); }}
          style={{ width: "100%", padding: "18px 0", background: grad.hero, color: "#fff", borderRadius: 16, fontWeight: 800, fontSize: 13, letterSpacing: 1, border: "none", cursor: "pointer", boxShadow: `0 8px 24px ${C.brand}40` }}>
          Subscribe {plan === "starter" ? "$2.99" : plan === "pro" ? "$7.99" : "$19.99"}/mo
        </button>
        <div style={{ textAlign: "center", fontSize: 10, color: C.textTer, marginTop: 10, letterSpacing: 1 }}>Cancel anytime · No hidden fees</div>
      </div>
    </div>
  );

  const AIChat = () => (
    <div style={{ position: "absolute", inset: 0, zIndex: 900, background: `${C.bg}F8`, backdropFilter: "blur(20px)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "52px 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, background: C.card, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${C.brand}20`, boxShadow: `0 0 20px rgba(245,158,11,0.15)` }}>
            <Icons.Zap size={20} stroke={C.brand} fill={`${C.brand}30`} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>AI Assistant</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green }} />
              <span style={{ fontSize: 9, color: C.textTer, letterSpacing: 2 }}>Online</span>
            </div>
          </div>
        </div>
        <IconBtn icon="X" onClick={() => setShowAI(false)} />
      </div>
      <div ref={msgRef} style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14, scrollbarWidth: "none" }}>
        {aiMsgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "85%", borderRadius: 16, padding: "12px 16px", background: m.role === "user" ? C.brand : C.card, border: m.role === "ai" ? `1px solid ${C.border}` : "none" }}>
              <div style={{ fontSize: 12, lineHeight: 1.7, color: m.role === "user" ? "#fff" : C.textSec, fontWeight: m.role === "user" ? 600 : 400 }}>{m.text}</div>
            </div>
          </div>
        ))}
        {aiLoading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ background: C.card, borderRadius: 16, padding: "14px 18px", border: `1px solid ${C.border}`, display: "flex", gap: 5 }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: C.brand400, animation: `bounce 1s infinite ${i * 0.15}s` }} />)}
            </div>
          </div>
        )}
      </div>
      <div style={{ padding: "12px 20px 36px", borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10, overflowX: "auto", scrollbarWidth: "none" }}>
          {["Style suggestion", "Write caption", "Photo tips", "Concept ideas"].map(q => (
            <button key={q} onClick={() => { setAiInput(q); aiRef.current?.focus(); }}
              style={{ flexShrink: 0, padding: "6px 12px", background: C.card, borderRadius: 20, border: `1px solid ${C.borderMed}`, fontSize: 10, fontWeight: 700, color: C.textTer, cursor: "pointer" }}>
              {q}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.card, borderRadius: 16, border: `1px solid ${C.borderMed}`, padding: "4px 4px 4px 14px" }}>
          <input ref={aiRef} value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendAI()}
            placeholder="Ask AI anything..." style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 12, color: C.text, padding: "10px 0", fontFamily: "inherit" }} />
          <button onClick={sendAI} disabled={!aiInput.trim() || aiLoading}
            style={{ width: 40, height: 40, borderRadius: 12, background: aiInput.trim() && !aiLoading ? C.brand : C.input, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
            <Icons.Send size={15} stroke={aiInput.trim() && !aiLoading ? "#fff" : C.textTer} />
          </button>
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════
  // MAIN LAYOUT
  // ═══════════════════════════════════════════════

  const MainScreen = () => (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
        {tab === "glow" && <GlowTab />}
        {tab === "create" && <CreateTab />}
        {tab === "story" && <StoryTab />}
        {tab === "me" && <MeTab />}
      </div>
      <BottomNav />
      {!showAI && !showNotif && !showSettings && !showPaywall && (
        <button onClick={() => setShowAI(true)} style={{ position: "absolute", bottom: 88, right: 20, width: 52, height: 52, borderRadius: 16, background: C.brand, border: `3px solid ${C.bg}`, boxShadow: `0 15px 30px rgba(245,158,11,0.3)`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 250 }}>
          <Icons.Zap size={22} stroke="#000" fill="#000" />
        </button>
      )}
    </div>
  );

  // ═══════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#050505", padding: 16, fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <div style={{ width: 390, height: 844, background: C.bg, borderRadius: 52, border: `12px solid #000000`, overflow: "hidden", position: "relative", boxShadow: "0 50px 100px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.05)" }}>
        {/* Dynamic Island */}
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 126, height: 34, background: "#000000", borderRadius: "0 0 20px 20px", zIndex: 999 }} />

        {screen === "splash" && <Splash />}
        {screen === "tour" && <Tour />}
        {screen === "personalize" && <Personalize />}
        {screen === "login" && <LoginScreen />}
        {screen === "main" && <MainScreen />}
        {screen === "shot-detail" && <ShotDetail />}
        {screen === "photo-upload" && <PhotoUpload />}
        {screen === "shot-processing" && <ShotProcessing />}
        {screen === "shot-result" && <ShotResult />}
        {screen === "tale-preview" && <TalePreview />}
        {screen === "tale-processing" && <TaleProcessing />}
        {screen === "tale-reader" && <TaleReader />}
        {screen === "glow-processing" && <GlowProcessing />}
        {screen === "glow-result" && <GlowResult />}
        {screen === "wow-intro" && <WowIntro />}
        {screen === "wow-setup" && <WowSetup />}
        {screen === "wow-dashboard" && <WowDashboard />}
        {screen === "wow-delivery" && <WowDelivery />}

        {showNotif && <NotifPanel />}
        {showSettings && <SettingsPanel />}
        {showPaywall && <Paywall />}
        {showAI && <AIChat />}

        {toast && (
          <div style={{ position: "absolute", bottom: 100, left: "50%", transform: "translateX(-50%)", background: C.brand, color: "#fff", padding: "10px 20px", borderRadius: 14, fontSize: 12, fontWeight: 700, boxShadow: `0 8px 24px ${C.brand}40`, zIndex: 999, whiteSpace: "nowrap", letterSpacing: 0.5 }}>
            {toast}
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@700;800&family=JetBrains+Mono:wght@500&display=swap');
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes glowPulse { 0%,100%{box-shadow:0 0 60px rgba(245,158,11,0.4), 0 0 120px rgba(245,158,11,0.15)} 50%{box-shadow:0 0 80px rgba(245,158,11,0.6), 0 0 160px rgba(245,158,11,0.25)} }
        @keyframes shimmerLine { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        @keyframes wowGlow { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes crownFloat { 0%,100%{transform:translateY(0) rotate(-5deg)} 50%{transform:translateY(-4px) rotate(5deg)} }
        @keyframes glowSpin { from{transform:translate(-50%,-50%) rotate(0deg)} to{transform:translate(-50%,-50%) rotate(360deg)} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input { font-family: inherit; }
        ::-webkit-scrollbar { display: none; }
        button { font-family: inherit; }
      `}</style>
    </div>
  );
}
