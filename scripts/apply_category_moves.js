const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '..', 'public', 'config', 'flexshot_templates.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

// 28 moves (excluding t157 Proposal=romance, t166 Bridal=romance, t051 Barcelona=travel)
const moves = {
  t020: 'creative',    // Y2K Harajuku: beauty -> creative
  t181: 'creative',    // Romanticize My Morning: beauty -> creative
  t191: 'lifestyle',   // Boba Bestie Moment: beauty -> lifestyle
  t069: 'luxury',      // Designer Store: beauty -> luxury
  t021: 'beauty',      // Korean ID Portrait: career -> beauty
  t029: 'beauty',      // Spotlight Portrait: career -> beauty
  t035: 'beauty',      // Magazine Cover: career -> beauty
  t071: 'luxury',      // Luxury Watch: career -> luxury
  t006: 'beauty',      // Jirai Kei Dream: creative -> beauty
  t018: 'beauty',      // Greenhouse Dream: creative -> beauty
  t118: 'creative',    // Fairy Tale: culture -> creative
  t148: 'creative',    // Smoke & Espresso: emotion -> creative
  t031: 'creative',    // Youth Yearbook: lifestyle -> creative
  t086: 'culture',     // Music Festival: lifestyle -> culture
  t096: 'creative',    // Vinyl Record: lifestyle -> creative
  t097: 'creative',    // Pottery Studio: lifestyle -> creative
  t192: 'creative',    // Thrift Find Flex: lifestyle -> creative
  t195: 'creative',    // Main Character Walk: lifestyle -> creative
  t005: 'travel',      // Blue Hour City: lifestyle -> travel
  t068: 'lifestyle',   // Champagne Rooftop: luxury -> lifestyle
  t170: 'beauty',      // Vogue Cover Star: luxury -> beauty
  t187: 'career',      // Delulu CEO: luxury -> career
  t160: 'emotion',     // Candlelit Gaze: luxury -> emotion
  t121: 'creative',    // Underwater Dream: romance -> creative
  t123: 'creative',    // Ghibli Forest: romance -> creative
  t126: 'creative',    // Lo-Fi Study: romance -> creative
  t124: 'culture',     // Renaissance: romance -> culture
  t091: 'travel',      // Road Trip: romance -> travel
};

let changed = 0;
for (const t of data.templates) {
  if (moves[t.id]) {
    const oldCat = t.category;
    t.category = moves[t.id];
    console.log(t.id + ' | ' + (t.name?.en || '?') + ' | ' + oldCat + ' -> ' + t.category);
    changed++;
  }
}

// Update timestamp
data.updatedAt = new Date().toISOString();

fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');
console.log('\nUpdated ' + changed + ' templates in JSON file.');

// Print new category counts
const counts = {};
for (const t of data.templates) {
  counts[t.category] = (counts[t.category] || 0) + 1;
}
console.log('\nNew category distribution:');
for (const [cat, count] of Object.entries(counts).sort()) {
  console.log('  ' + cat + ': ' + count);
}
