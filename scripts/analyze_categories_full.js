const fs = require('fs');
process.stdout.write('\uFEFF'); // BOM for encoding
const data = JSON.parse(fs.readFileSync(__dirname + '/../public/config/flexshot_templates.json', 'utf-8'));

// Print all templates with full prompt for analysis
for (const t of data.templates) {
  const prompt = t.prompt?.en || t.prompt || '';
  const style = t.style || '';
  console.log(JSON.stringify({
    id: t.id,
    name: t.name?.en || '?',
    category: t.category,
    type: t.type || '',
    style: style,
    prompt: typeof prompt === 'string' ? prompt : JSON.stringify(prompt),
    tags: t.tags || []
  }));
}
