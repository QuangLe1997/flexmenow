// FlexShot Templates
export const templates = [
  { id: 't1', name: 'Paris Eiffel', category: 'travel', style: 'Realistic', rating: 4.8, uses: 12345, credits: 1, badge: 'HOT', gp: 'gp-travel' },
  { id: 't2', name: 'Lamborghini Night', category: 'luxury', style: 'Cinematic', rating: 4.9, uses: 9823, credits: 2, badge: 'HOT', gp: 'gp-luxury', premium: true },
  { id: 't3', name: 'CEO Office', category: 'lifestyle', style: 'Corporate', rating: 4.7, uses: 6120, credits: 1, badge: null, gp: 'gp-lifestyle' },
  { id: 't4', name: 'Anime Hero', category: 'art', style: 'Anime', rating: 4.8, uses: 15200, credits: 1, badge: 'NEW', gp: 'gp-art' },
  { id: 't5', name: 'Tokyo Neon', category: 'travel', style: 'Cinematic', rating: 4.6, uses: 8450, credits: 1, badge: null, gp: 'gp-night' },
  { id: 't6', name: 'Yacht Life', category: 'luxury', style: 'Bright', rating: 4.5, uses: 4300, credits: 2, badge: null, gp: 'gp-cool', premium: true },
  { id: 't7', name: 'Coffee Aesthetic', category: 'lifestyle', style: 'Warm', rating: 4.7, uses: 7800, credits: 1, badge: null, gp: 'gp-warm' },
  { id: 't8', name: 'Cyberpunk City', category: 'art', style: 'Cyberpunk', rating: 4.9, uses: 18000, credits: 1, badge: 'HOT', gp: 'gp-cyber' },
  { id: 't9', name: 'Bali Sunset', category: 'travel', style: 'Warm', rating: 4.7, uses: 5600, credits: 1, badge: null, gp: 'gp-golden' },
  { id: 't10', name: 'Gym Beast', category: 'lifestyle', style: 'Strong', rating: 4.6, uses: 4100, credits: 1, badge: null, gp: 'gp-portrait' },
  { id: 't11', name: 'Christmas', category: 'seasonal', style: 'Festive', rating: 4.4, uses: 3200, credits: 1, badge: 'NEW', gp: 'gp-fresh' },
  { id: 't12', name: 'Magazine Cover', category: 'art', style: 'Fashion', rating: 4.8, uses: 11500, credits: 2, badge: null, gp: 'gp-soft', premium: true },
];

// FlexTale Story Packs
export const storyPacks = [
  {
    id: 'paris7', name: 'Paris 7 Days', category: 'Travel', pics: 10, credits: 8,
    rating: 4.7, uses: 3456, gp: 'gp-travel',
    desc: 'A 7-day journey through Paris — from the airport to Eiffel Tower, through Louvre and along the Seine.',
    scenes: [
      { emoji: '🛫', title: 'Airport check-in', caption: "Let's go! Paris here I come! 12-hour flight but totally worth it!", hashtags: ['Paris','Travel','Adventure'], time: '8:00 AM' },
      { emoji: '✈️', title: 'Landing at CDG', caption: 'Made it to Paris safe and sound! Cold but happy.', hashtags: ['Paris','Arrived','Excited'], time: '8:00 PM' },
      { emoji: '🏨', title: 'Hotel with Eiffel view', caption: 'The view from my room is unreal...', hashtags: ['EiffelTower','HotelView','Paris'], time: '9:00 PM' },
      { emoji: '🗼', title: 'Eiffel Tower', caption: "Standing here, can't believe it's real...", hashtags: ['EiffelTower','Dream','Paris'], time: '10:00 AM' },
      { emoji: '☕', title: 'Parisian café', caption: 'Croissant and café au lait. Living the dream.', hashtags: ['ParisianLife','Coffee','Croissant'], time: '2:00 PM' },
      { emoji: '🎨', title: 'Louvre Museum', caption: 'Face to face with Mona Lisa. Smaller than I thought!', hashtags: ['Louvre','MonaLisa','Art'], time: '11:00 AM' },
      { emoji: '🌊', title: 'Seine River cruise', caption: 'Sunset on the Seine. Pure magic.', hashtags: ['Seine','Sunset','Cruise'], time: '6:00 PM' },
      { emoji: '⛪', title: 'Montmartre', caption: 'The streets of Montmartre are pure charm.', hashtags: ['Montmartre','Streets','Art'], time: '3:00 PM' },
      { emoji: '🌃', title: 'Eiffel at night', caption: "The tower sparkles every hour. I'll never forget this.", hashtags: ['EiffelNight','Sparkle','Magic'], time: '10:00 PM' },
      { emoji: '🛬', title: 'Flying home', caption: "Au revoir Paris. You've changed me forever.", hashtags: ['AuRevoir','Paris','Memories'], time: '6:00 AM' },
    ],
  },
  {
    id: 'bae', name: 'Got a Bae', category: 'Romance', pics: 8, credits: 6,
    rating: 4.8, uses: 5600, gp: 'gp-soft',
    desc: 'The cutest couple story — from first date to forever.',
    scenes: [
      { emoji: '💕', title: 'First date', caption: 'Butterflies everywhere...', hashtags: ['FirstDate','Love'], time: '7:00 PM' },
      { emoji: '🤝', title: 'Holding hands', caption: 'This feels so right.', hashtags: ['Couple','Love'], time: '8:00 PM' },
      { emoji: '🍽️', title: 'Dinner together', caption: 'Best dinner of my life.', hashtags: ['DateNight','Dinner'], time: '8:30 PM' },
      { emoji: '🌙', title: 'Night walk', caption: 'Walking under the stars with you.', hashtags: ['NightWalk','Romance'], time: '10:00 PM' },
      { emoji: '📸', title: 'Selfie together', caption: 'Our first photo together!', hashtags: ['Couple','Selfie'], time: '10:30 PM' },
      { emoji: '🎁', title: 'Surprise gift', caption: 'You remembered...', hashtags: ['Surprise','Gift'], time: '11:00 AM' },
      { emoji: '🏠', title: 'Cooking together', caption: 'Kitchen chaos but so fun.', hashtags: ['CookingTogether','Home'], time: '6:00 PM' },
      { emoji: '❤️', title: 'Anniversary', caption: "Here's to us and forever.", hashtags: ['Anniversary','Love','Forever'], time: '7:00 PM' },
    ],
  },
  {
    id: 'ceo', name: 'CEO for a Day', category: 'Career', pics: 6, credits: 5,
    rating: 4.5, uses: 2100, gp: 'gp-lifestyle',
    desc: 'One day as a CEO — morning routine to evening gala.',
    scenes: [
      { emoji: '☀️', title: 'Morning routine', caption: '5 AM. Coffee. Ready to conquer.', hashtags: ['CEO','Morning'], time: '5:00 AM' },
      { emoji: '🏢', title: 'Corner office', caption: 'This view never gets old.', hashtags: ['Office','CEO'], time: '8:00 AM' },
      { emoji: '💼', title: 'Board meeting', caption: 'Leading with vision.', hashtags: ['Business','Leadership'], time: '10:00 AM' },
      { emoji: '🍱', title: 'Power lunch', caption: 'Closing deals over lunch.', hashtags: ['PowerLunch','Business'], time: '12:00 PM' },
      { emoji: '🏎️', title: 'Supercar exit', caption: 'Another day, another win.', hashtags: ['Supercar','Luxury'], time: '6:00 PM' },
      { emoji: '🎭', title: 'Evening gala', caption: "Tonight we celebrate success.", hashtags: ['Gala','Success'], time: '8:00 PM' },
    ],
  },
  {
    id: 'tokyo5', name: 'Tokyo 5 Days', category: 'Travel', pics: 10, credits: 8,
    rating: 4.6, uses: 4200, gp: 'gp-night',
    desc: 'Neon lights, ramen streets, and ancient temples.',
    scenes: [
      { emoji: '🛬', title: 'Narita arrival', caption: 'Konnichiwa Tokyo!', hashtags: ['Tokyo','Japan'], time: '4:00 PM' },
      { emoji: '🌃', title: 'Shibuya crossing', caption: 'The most famous crossing in the world.', hashtags: ['Shibuya','Tokyo'], time: '7:00 PM' },
      { emoji: '🍜', title: 'Ramen alley', caption: 'Best ramen of my life.', hashtags: ['Ramen','JapanFood'], time: '8:00 PM' },
      { emoji: '⛩️', title: 'Sensoji Temple', caption: 'Finding peace in the chaos.', hashtags: ['Sensoji','Temple'], time: '9:00 AM' },
      { emoji: '🎮', title: 'Akihabara', caption: 'Anime paradise!', hashtags: ['Akihabara','Anime'], time: '2:00 PM' },
      { emoji: '🌸', title: 'Shinjuku Garden', caption: 'Cherry blossoms in full bloom.', hashtags: ['CherryBlossom','Shinjuku'], time: '10:00 AM' },
      { emoji: '🗻', title: 'Mt. Fuji day trip', caption: 'Fuji-san in all its glory.', hashtags: ['MtFuji','Japan'], time: '7:00 AM' },
      { emoji: '🛍️', title: 'Harajuku fashion', caption: 'Fashion capital of the world.', hashtags: ['Harajuku','Fashion'], time: '3:00 PM' },
      { emoji: '🏯', title: 'Meiji Shrine', caption: 'Tradition meets modernity.', hashtags: ['MeijiShrine','Tokyo'], time: '8:00 AM' },
      { emoji: '✈️', title: 'Sayonara', caption: 'Until next time, Tokyo.', hashtags: ['Sayonara','Tokyo','Memories'], time: '11:00 AM' },
    ],
  },
];

// Vibes for FlexLocket
export const vibes = [
  { id: 'original', name: 'Original+', color: null },
  { id: 'warm', name: 'Warm', color: '#F59E0B' },
  { id: 'cool', name: 'Cool', color: '#3B82F6' },
  { id: 'golden', name: 'Golden', color: '#FBBF24' },
  { id: 'soft', name: 'Soft Dream', color: '#F9A8D4' },
  { id: 'night', name: 'Night Mood', color: '#6366F1' },
  { id: 'fresh', name: 'Fresh', color: '#34D399' },
];

// Categories
export const shotCategories = ['All', 'Travel', 'Luxury', 'Lifestyle', 'Art & Fun', 'Seasonal'];
export const taleCategories = ['All', 'Travel', 'Romance', 'Career', 'Sports'];

// Gallery items (saved)
export const savedItems = [
  { id: 's1', type: 'glow', gp: 'gp-face', date: 'Today' },
  { id: 's2', type: 'create', gp: 'gp-travel', date: 'Today' },
  { id: 's3', type: 'glow', gp: 'gp-warm', date: 'Today' },
  { id: 's4', type: 'create', gp: 'gp-luxury', date: 'Today' },
  { id: 's5', type: 'glow', gp: 'gp-cool', date: 'Today' },
  { id: 's6', type: 'story', gp: 'gp-night', date: 'Today', count: 10 },
  { id: 's7', type: 'create', gp: 'gp-art', date: 'Yesterday' },
  { id: 's8', type: 'glow', gp: 'gp-golden', date: 'Yesterday' },
  { id: 's9', type: 'create', gp: 'gp-lifestyle', date: 'Yesterday' },
  { id: 's10', type: 'glow', gp: 'gp-soft', date: 'Yesterday' },
  { id: 's11', type: 'create', gp: 'gp-fresh', date: 'Yesterday' },
  { id: 's12', type: 'story', gp: 'gp-portrait', date: 'Yesterday', count: 8 },
];

// Generating steps
export const genSteps = [
  { pct: 0, text: 'Starting...' },
  { pct: 20, text: 'Analyzing your face...' },
  { pct: 40, text: 'Optimizing AI prompt...' },
  { pct: 60, text: 'Generating background...' },
  { pct: 80, text: 'Blending your face...' },
  { pct: 90, text: 'Adding final touches...' },
  { pct: 100, text: 'Done!' },
];
