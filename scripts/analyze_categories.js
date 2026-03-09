const fs = require('fs');
const data = JSON.parse(fs.readFileSync(__dirname + '/../public/config/flexshot_templates.json', 'utf-8'));
const cats = {};
for (const t of data.templates) {
  if (!cats[t.category]) cats[t.category] = [];
  cats[t.category].push({ id: t.id, name: t.name?.en || '?', prompt: (t.prompt?.en || '').substring(0, 150) });
}
for (const [cat, items] of Object.entries(cats).sort()) {
  console.log('\n=== ' + cat.toUpperCase() + ' (' + items.length + ') ===');
  for (const t of items) {
    console.log(t.id + ' | ' + t.name + ' | ' + t.prompt);
  }
}
