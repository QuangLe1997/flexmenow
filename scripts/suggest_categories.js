const fs = require('fs');
const data = JSON.parse(fs.readFileSync(__dirname + '/../public/config/flexshot_templates.json', 'utf-8'));

// Category definitions for matching
const categoryKeywords = {
  romance: ['wedding', 'bridal', 'couple', 'romantic', 'love', 'valentine', 'proposal', 'kiss', 'heart', 'date night', 'anniversary', 'honeymoon', 'engagement'],
  travel: ['skyline', 'city', 'travel', 'destination', 'landmark', 'aurora', 'beach', 'mountain', 'bridge', 'canal', 'gondola', 'temple', 'ruins', 'safari', 'desert', 'airport', 'flight', 'backpack', 'country', 'dubai', 'santorini', 'iceland', 'maldives', 'nyc', 'london', 'seoul', 'swiss', 'venice', 'singapore', 'barcelona', 'cappadocia', 'morocco', 'kyoto', 'amsterdam', 'rio', 'vegas', 'amalfi', 'petra', 'jordan', 'times square'],
  luxury: ['luxury', 'private jet', 'penthouse', 'casino', 'first class', 'ferrari', 'rolls royce', 'mansion', 'champagne', 'designer', 'vip', 'supercar', 'helicopter', 'diamond', 'gala', 'caviar', 'old money', 'yacht', 'rolex', 'watch collector', 'opulent', 'wealthy', 'rich', 'throne', 'royal', 'crown', 'gold chain', 'bling', 'ceo'],
  creative: ['neon', 'noir', 'film', 'analog', 'retro', 'vintage', 'art', 'artistic', 'surreal', 'abstract', 'vaporwave', 'synthwave', 'steampunk', 'gothic', 'manga', 'anime', 'comic', 'pixel', 'glitch', 'pop art', 'graffiti', 'cyberpunk', 'sci-fi', 'fantasy', 'kodak', 'portra', 'kodachrome', 'balletcore', 'dark academia', 'figurine', 'action figure', 'chibi', 'polaroid', 'plush toy', 'yearbook', 'matrix', 'villain arc', 'astronaut', 'knight', '4-cut', 'photo booth'],
  beauty: ['beauty', 'skincare', 'glow', 'makeup', 'portrait', 'selfie', 'glamour', 'glam', 'clean girl', 'k-pop', 'idol', 'main character', 'that girl', 'mob wife', 'coquette', 'kawaii', 'purikura', 'fresh face', 'muse', 'stunning', 'silk', 'glass skin', 'aesthetic selfie'],
  career: ['professional', 'headshot', 'linkedin', 'graduation', 'business', 'resume', 'corporate', 'office', 'interview', 'magazine cover', 'profile shot', 'id photo', 'studio portrait', 'formal', 'creator studio', 'content creator'],
  emotion: ['sad', 'lonely', 'tears', 'overthink', 'anxiety', 'melancholy', 'nostalgia', 'introspect', 'soul', 'thoughtful', 'empty', 'smoke', 'moody', 'villain era', 'aura', 'hug.*younger', 'self-reflection', '3am', 'espresso thought'],
  culture: ['traditional', 'ao dai', 'hanbok', 'kimono', 'sari', 'cultural', 'festival', 'lunar new year', 'tet', 'diwali', 'eid', 'carnival', 'cherry blossom', 'halloween', 'oil painting', 'watercolor', 'fairy tale', 'renaissance', 'classical', 'autumn leaves', 'seasonal'],
  lifestyle: ['coffee', 'cafe', 'brunch', 'yoga', 'cooking', 'garden', 'dog', 'pet', 'everyday', 'casual', 'chill', 'pool', 'music festival', 'skateboard', 'pottery', 'vinyl', 'street food', 'dessert', 'flower', 'bouquet', 'roses', 'birthday', 'barista', 'rooftop', 'gaming', 'music studio', 'candid', 'iphone', 'thrift', 'digital nomad', 'slow living', 'cottagecore', 'night market', 'golden hour peace'],
  active: ['sport', 'fitness', 'gym', 'running', 'surfing', 'basketball', 'tennis', 'marathon', 'motorcycle', 'extreme', 'athletic', 'workout', 'swimming', 'cycling', 'hiking trail'],
};

const changes = [];
const correct = [];

for (const t of data.templates) {
  const promptStr = typeof t.prompt === 'string' ? t.prompt : JSON.stringify(t.prompt || '');
  const nameStr = (t.name?.en || '').toLowerCase();
  const tagsStr = (t.tags || []).join(' ').toLowerCase();
  const styleStr = (t.style || '').toLowerCase();
  const searchText = (nameStr + ' ' + promptStr + ' ' + tagsStr + ' ' + styleStr).toLowerCase();

  // Score each category
  const scores = {};
  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    let score = 0;
    for (const kw of keywords) {
      const regex = new RegExp(kw, 'gi');
      const matches = searchText.match(regex);
      if (matches) score += matches.length;
    }
    if (score > 0) scores[cat] = score;
  }

  // Find best category
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const bestCat = sorted.length > 0 ? sorted[0][0] : t.category;
  const bestScore = sorted.length > 0 ? sorted[0][1] : 0;
  const currentScore = scores[t.category] || 0;

  // Only suggest change if best score is significantly higher than current
  if (bestCat !== t.category && bestScore > currentScore + 1) {
    changes.push({
      id: t.id,
      name: t.name?.en,
      current: t.category,
      suggested: bestCat,
      currentScore,
      bestScore,
      reason: sorted.slice(0, 3).map(([c, s]) => c + ':' + s).join(', ')
    });
  } else {
    correct.push({ id: t.id, name: t.name?.en, category: t.category });
  }
}

console.log('=== SUGGESTED CATEGORY CHANGES (' + changes.length + ') ===\n');
// Group by current -> suggested
const grouped = {};
for (const c of changes) {
  const key = c.current + ' -> ' + c.suggested;
  if (!grouped[key]) grouped[key] = [];
  grouped[key].push(c);
}

for (const [move, items] of Object.entries(grouped).sort()) {
  console.log('\n--- ' + move.toUpperCase() + ' (' + items.length + ') ---');
  for (const c of items) {
    console.log('  ' + c.id + ' | ' + c.name + ' | scores: ' + c.reason);
  }
}

console.log('\n=== CORRECT (' + correct.length + ') ===');
// Summary by category
const summary = {};
for (const c of correct) {
  summary[c.category] = (summary[c.category] || 0) + 1;
}
for (const [cat, count] of Object.entries(summary).sort()) {
  console.log('  ' + cat + ': ' + count);
}

console.log('\n=== TOTAL: ' + changes.length + ' changes suggested, ' + correct.length + ' correct ===');
