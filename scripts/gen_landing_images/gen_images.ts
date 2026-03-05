/**
 * FlexMe Landing Page Image Generator
 *
 * Uses Gemini 3.1 Flash Image Preview to create all images
 * needed for the landing page. Saves to public/assets/landing/
 *
 * Usage:
 *   GEMINI_API_KEY=your_key npx ts-node scripts/gen_landing_images/gen_images.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";

// ─── Config ───
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("❌ Set GEMINI_API_KEY environment variable");
  process.exit(1);
}

const MODEL = "gemini-3.1-flash-image-preview";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
const OUTPUT_DIR = path.resolve(__dirname, "../../public/assets/landing");

// ─── Image Definitions ───
interface ImageDef {
  name: string;
  prompt: string;
  aspectRatio: string; // "1:1" | "3:2" | "16:9" | "21:9" | "4:3" | "9:16" etc.
}

const IMAGES: ImageDef[] = [
  // ═══════════════════════════════════════════════════════════════════
  // 1. HERO — The most important image. Floating phones showcase.
  // ═══════════════════════════════════════════════════════════════════
  {
    name: "hero_mockup",
    aspectRatio: "16:9",
    prompt: `Ultra-premium product photography for a mobile app landing page. The scene: exactly three modern iPhones (iPhone 15 Pro, titanium dark finish) floating in mid-air at dynamic tilted angles — the center phone is slightly larger and facing forward, the left and right phones are rotated 15-20 degrees sideways, all three overlapping slightly to create depth.

CENTER PHONE SCREEN: A breathtaking AI-enhanced portrait of a young woman (early 20s, Gen-Z aesthetic) — her skin glows with warm golden-hour lighting, soft bokeh background, the kind of effortlessly perfect selfie that gets 10K likes. The enhancement is subtle and natural-looking.

LEFT PHONE SCREEN: A stunning AI-generated art piece — a young man reimagined in a dreamy cyberpunk anime style with neon purple and teal accents, glowing city backdrop, ultra-stylish and viral-worthy.

RIGHT PHONE SCREEN: A cinematic visual story panel — a dramatic fantasy landscape at golden hour with a silhouetted figure on a cliff overlooking a vast magical valley, movie-poster quality.

ENVIRONMENT: Pure deep black background (#09090B). Behind the phones, a large soft diffused amber-gold light source (#F59E0B) creates a premium halo glow that wraps around the edges of all three devices. Subtle golden light particles and tiny bokeh orbs float in the space between phones. The phones cast faint reflections on a glossy invisible surface below them.

LIGHTING: Dramatic Rembrandt-style key light from upper right in warm amber. Subtle rim light on phone edges in gold. The overall mood is luxurious, exclusive, high-end — like an Apple product launch crossed with a luxury fashion campaign.

QUALITY: 8K render quality, photorealistic CGI, studio product photography with shallow depth of field. No hands, no text overlays, no UI elements beyond what's on the screens. Absolutely no watermarks.`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // 2. FLEXLOCKET — Before/After subtle AI enhancement
  // ═══════════════════════════════════════════════════════════════════
  {
    name: "feature_glow",
    aspectRatio: "3:2",
    prompt: `A professional before-and-after comparison image for an AI photo enhancement app, designed for a dark-themed landing page.

COMPOSITION: A single wide image split vertically into two halves by a thin glowing golden line (#F59E0B, 2px wide) running down the center. The left half is labeled-concept "BEFORE", the right half "AFTER". Both halves show the EXACT SAME photo of the SAME person from the SAME angle — only the quality and lighting differ.

THE SUBJECT: A confident young Gen-Z woman (early 20s, mixed ethnicity for universal appeal) taking a casual selfie-style portrait. She has a natural, relaxed expression — slight smile, looking directly at camera. She's wearing a simple trendy outfit (oversized hoodie or casual top). Background is a cozy indoor setting — cafe or bedroom with soft ambient light.

LEFT HALF (BEFORE): The photo looks like a typical phone camera shot in mediocre lighting. Slightly flat and underexposed. Skin tone is a bit uneven and dull. Under-eye shadows visible. Hair lacks definition and shine. The background is slightly noisy and muddy. Color temperature is slightly too cool/blue. Overall: it's a decent photo but clearly an unedited phone snap. Nothing special.

RIGHT HALF (AFTER): The IDENTICAL composition but now magically transformed — skin appears smooth, healthy, and luminous with a warm golden glow as if lit by perfect golden-hour sunlight streaming through a window. Eyes are brighter and more defined with a subtle catchlight sparkle. Hair has visible individual strand detail and a silky sheen. The background has a creamy, professional-quality bokeh blur. Color grading is warm and cinematic with rich amber tones. Subtle vignette draws attention to the face. Overall: the photo now looks like it was shot by a professional photographer with perfect lighting and a $3000 lens — yet the enhancement is completely undetectable as AI. It looks naturally perfect, not filtered or processed.

The KEY difference should be lighting quality, skin luminosity, color richness, and background separation — NOT face reshaping, body editing, or heavy makeup effects. The philosophy is "your best self in the best light" not "a different person."

TECHNICAL: Dark background (#09090B) framing the comparison. Rounded corners on the overall image (24px radius). Photorealistic photography, not illustration. No text overlays. No watermarks.`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // 3. FLEXSHOT — Template-based AI art transformation
  // ═══════════════════════════════════════════════════════════════════
  {
    name: "feature_create",
    aspectRatio: "3:2",
    prompt: `A visually stunning showcase image demonstrating AI template-based photo transformation, designed for a dark landing page of a creative app targeting Gen-Z.

COMPOSITION: A dynamic, asymmetric collage layout showing ONE person transformed into 4 completely different artistic styles. The images are arranged in an overlapping, Pinterest-board-style mosaic with slight 3D perspective tilt — like floating polaroid cards fanned out. Each card has rounded corners and a subtle drop shadow.

THE ORIGINAL SUBJECT (implied, not shown separately): A trendy young person (early 20s, stylish, Gen-Z aesthetic).

CARD 1 (largest, center-left, slightly overlapping others):
ANIME/MANGA STYLE — The person reimagined as a stunning anime character. Vibrant cel-shaded art with bold outlines. Huge expressive eyes with detailed iris reflections. Dynamic wind-blown hair with individual colored strands in purple and pink gradient. Cherry blossom petals floating. Background: a neon-lit Tokyo streetscape at night. Style reference: high-quality modern anime like Makoto Shinkai's films. Ultra detailed.

CARD 2 (upper-right, tilted 5 degrees):
RENAISSANCE OIL PAINTING — The same person reimagined as a subject of a classical Renaissance portrait. Rich oil painting texture with visible brushstrokes. Dramatic Caravaggio-style chiaroscuro lighting — deep shadows, warm candlelight on face. Wearing period-appropriate luxurious clothing (velvet, gold embroidery). Dark moody background with subtle classical column architecture. Timeless, majestic quality.

CARD 3 (lower-right):
CYBERPUNK/NEON — The person in a futuristic cyberpunk world. Glowing neon face tattoos and holographic accessories. Hair with fiber-optic light strands in electric blue and hot pink. Rain-slicked city background with massive holographic billboards. Dramatic purple (#A78BFA) and electric teal lighting. Chrome and glass reflections. Blade Runner meets Gen-Z TikTok aesthetic.

CARD 4 (lower-left, peeking from behind):
WATERCOLOR DREAM — Soft, ethereal watercolor portrait. Gentle washes of pastel colors bleeding into each other — soft gold, dusty rose, mint green. The person's features dissolve at the edges into abstract paint splashes. Delicate ink line details. Flower elements growing from the hair. Dreamlike, ASMR-calming quality.

ENVIRONMENT: Pure dark background (#09090B). Subtle purple glow (#A78BFA at 10% opacity) emanating from behind the collage. Tiny floating sparkle particles in gold between the cards. The overall effect should scream "creative possibilities are endless" and make a Gen-Z user immediately want to try it.

QUALITY: Ultra high-definition. Each card style should be genuinely impressive as standalone art — not cheap or gimmicky. No text. No watermarks. No UI elements.`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // 4. FLEXTALE — Flex Your Trip (PORTRAIT — vertical staggered layout)
  // ═══════════════════════════════════════════════════════════════════
  {
    name: "feature_story",
    aspectRatio: "9:16",
    prompt: `A vertical poster-style travel story series for a premium dark app. Portrait orientation.

ARTISTIC LAYOUT: 3 photo panels arranged vertically in a STAGGERED DIAGONAL cascade — the top panel is shifted slightly left, the middle panel centered, the bottom panel shifted slightly right. Each panel is a different size: top is wide landscape, middle is square, bottom is tall portrait. They overlap slightly (10-15%) creating depth with subtle drop shadows between them. Thin dark gaps (#09090B) visible where they don't overlap. All panels have rounded corners (16px).

A stylish Gen-Z traveler (early 20s, streetwear, bucket hat, gold chain) appears across all 3 scenes.

TOP PANEL (landscape, shifted left): Airport departure at sunrise — the traveler walking through a modern terminal with dramatic golden light streaming through glass walls. A massive airplane visible outside. Cinematic wide shot, warm amber tones, lens flare.

MIDDLE PANEL (square, centered, largest): Bali infinity pool at golden hour — the traveler stands at the pool edge overlooking lush jungle and rice terraces. Arms slightly spread, living the dream. Volumetric golden sunlight through palm trees. Pool reflects vivid sunset colors. This is THE hero shot.

BOTTOM PANEL (tall portrait, shifted right): Tokyo/Bangkok neon night scene — the traveler at a vibrant street market, neon signs in purple and teal reflecting on rain-wet streets. String lights, colorful food stalls, electric nightlife energy. Cinematic bokeh from city lights.

BACKGROUND: Pure dark (#09090B). Subtle golden particle dust floating between panels. A soft amber glow emanates from behind the panels creating a warm halo. Very faint diagonal golden lines connecting the panels suggesting a journey path.

QUALITY: Photorealistic, cinematic color grading. Each panel looks like a pro travel photographer's portfolio piece. No text, no watermarks. The diagonal cascade layout should feel dynamic and artistic — not a boring grid.`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // 4A2. FLEXTALE — Flex Anything (PORTRAIT — explosive mosaic)
  // ═══════════════════════════════════════════════════════════════════
  {
    name: "story_anything",
    aspectRatio: "9:16",
    prompt: `A vertical portrait mega-collage poster showing INFINITE story possibilities. Designed for a dark-themed premium app.

COMPOSITION: A spiraling vortex of 30+ tiny image cards/panels arranged in a dynamic SPIRAL pattern radiating outward from the center. The center cards are larger and crystal-clear, cards get progressively smaller, more tilted, and slightly blurred toward the edges — creating a 3D tunnel/vortex effect that pulls the eye inward. Cards are various sizes and aspect ratios, some overlapping, some tilted 5-15 degrees, creating organized beautiful chaos.

THE CARDS SHOW every possible story type — maximum variety:
- Couple kissing under cherry blossoms (romance)
- Someone surfing at sunset (adventure)
- Cat wearing a tiny crown on a throne (pet flex)
- Graduation with confetti (milestone)
- Sushi platter close-up (foodie)
- DJ with laser lights (party)
- Mountain meditation at sunrise (wellness)
- Luxury supercar on cliff road (lifestyle)
- Friends jumping on beach (squad)
- Makeup glam close-up (beauty)
- Skateboarding in neon tunnel (urban)
- Cozy bookshelf with coffee (aesthetic)
- Dog in wildflowers (pet)
- Concert crowd with lights (music)
- Fashion flat-lay (style)
- Baby hand holding finger (family)
- Underwater coral reef (explore)
- Brunch spread (food)
- Gaming RGB setup (gaming)
- Wedding first dance (love)
- Milky way camping (nature)
- Boxing gym workout (fitness)
- Street art mural (creative)
- Rainy city night (mood)

BACKGROUND: Pure dark (#09090B). Golden sparkle particles (#F59E0B) scattered between cards. Multi-colored light leaks — amber, purple, teal, rose — emanate from cards creating a beautiful ambient glow. The spiral creates a sense of infinite depth and endless possibilities.

QUALITY: Ultra-detailed. Each mini-card identifiable. The vortex/spiral layout is the KEY — it should feel like an explosion of creativity, like the universe of possibilities is expanding outward. Maximalist, abundant, mesmerizing. No text, no watermarks.`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // 4B. FLEXTALE — Flex Your Bae (PORTRAIT — romantic split layout)
  // ═══════════════════════════════════════════════════════════════════
  {
    name: "story_girlfriend",
    aspectRatio: "9:16",
    prompt: `A flat-lay photograph taken from directly above, looking DOWN at a dark matte black table surface. On this table are exactly 4 printed photographs arranged in a 2x2 grid layout. Each printed photo has a visible white border like a Fujifilm Instax print. There are small gaps of dark table visible between each photo. Each photo shows a COMPLETELY DIFFERENT romantic scene:

Photo top-left: A couple taking a golden-hour rooftop selfie. She is in front with wind-blown hair, he is behind with arms around her. City skyline sunset background. Warm amber glow and lens flare.

Photo top-right: The same couple at an outdoor candlelit restaurant. String lights overhead, tropical plants. They are laughing across the table with aesthetic food and cocktails visible. Warm romantic lighting.

Photo bottom-left: The same couple at a beach during sunset. She is on his back piggyback-style, both laughing joyfully. Purple-pink-orange sky, waves at their feet.

Photo bottom-right: The same couple walking hand-in-hand through a lavender field at golden hour, shot from behind. Romantic cinematic wide angle.

The 4 printed photos sit on the dark table with small decorative elements scattered around: dried rose petals, a small golden ring, fairy lights. Each photo is a separate physical printed picture with clear white borders — they do NOT blend into each other. The camera is looking straight down at the table. No text anywhere.`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // 4C. FLEXTALE — Flex Your Body (PORTRAIT — vertical triptych)
  // ═══════════════════════════════════════════════════════════════════
  {
    name: "story_body",
    aspectRatio: "9:16",
    prompt: `A flat-lay photograph taken from directly above, looking DOWN at a dark matte black table surface. On this table are exactly 4 printed photographs arranged in a vertical staggered layout — two photos side by side on top, two photos side by side on bottom, slightly offset. Each printed photo has a thin golden metallic border frame. There are dark gaps of table visible between each photo. Each photo shows a COMPLETELY DIFFERENT scene of the same sexy confident woman:

Photo top-left: A stunning fit young woman (early 20s, long legs, slim waist, toned body) in a black sports bra and high-waisted leggings, posing confidently in a dark gym with dramatic golden rim lighting outlining her silhouette. Mirror reflections behind her. One hand on hip, weight shifted to one leg. Powerful and sexy.

Photo top-right: Same woman in a tiny bikini at an infinity pool, sitting at the edge with her back to camera, looking over her shoulder seductively. Long wet hair. Tropical sunset behind, palm tree silhouettes. Crystal clear turquoise water. Her reflection visible. Luxury vacation vibes.

Photo bottom-left: Same woman on a rooftop at golden hour, mid-dance pose with hair flowing, wearing a crop top and high-waisted shorts showing off long toned legs. Shot from low angle. City skyline sunset (amber, rose, purple). Volumetric golden light rays. Nike campaign energy.

Photo bottom-right: Same woman in elegant form-fitting dress, walking on a beach at sunset, wind blowing the dress to show her figure. Barefoot in the water's edge. Dramatic sky reflected in wet sand. High-fashion editorial shot.

The 4 printed photos sit on the dark table. Small decorative elements scattered: a small dumbbell charm, golden confetti. Each photo is a separate physical printed picture with clear borders — they do NOT blend into each other. The camera is looking straight down at the table. No text anywhere.`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // 4D. FLEXTALE — Flex Your Mood (PORTRAIT — overlapping polaroids)
  // ═══════════════════════════════════════════════════════════════════
  {
    name: "story_emotion",
    aspectRatio: "9:16",
    prompt: `A flat-lay photograph taken from directly above, looking DOWN at a dark wooden table surface. On this table are exactly 5 Polaroid instant photos (Fujifilm Instax style with thick white borders, extra thick at the bottom) scattered casually as if someone tossed them on the table. The polaroids overlap each other slightly and each is rotated at a different random angle. Each polaroid contains a COMPLETELY DIFFERENT scene:

Polaroid 1 (top area, tilted -10°): A dreamy Gen-Z girl (early 20s, oversized cream sweater) sitting cross-legged on a bed, holding a steaming mug, morning golden light through sheer curtains. Peaceful, warm honey tones.

Polaroid 2 (upper right, tilted +8°): Same girl sitting at a rainy cafe window, hand on a latte, gazing at rain streaks on the glass. Edison bulbs, exposed brick wall. Blue-cool light outside, warm amber inside.

Polaroid 3 (center, on top of others, tilted -3°): Same girl spinning in the rain on an empty neon-lit city street at night, arms spread wide, joyful and free. Street lights create a halo. Neon purple and teal reflections on wet pavement. This polaroid is the LARGEST and sits on top of all others.

Polaroid 4 (lower left, tilted +6°): Same girl standing at a lake's edge at golden hour sunset, back to camera, arms slightly raised. Amber-gold-lavender sky reflected perfectly in still water.

Polaroid 5 (bottom right, tilted -7°): Same girl laughing with 3 friends around sparklers at night. Fairy string lights. Warm candid joy. Group photo energy.

Around the polaroids on the dark wood table: a dried pressed flower, a small curl of film negative, 2 coffee ring stains, pieces of washi tape. The camera looks STRAIGHT DOWN at the table — this is a birds-eye flat-lay composition. Each polaroid is a separate physical object with thick white borders clearly visible. No text anywhere.`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // 5. HOW IT WORKS — Step 1: Upload
  // ═══════════════════════════════════════════════════════════════════
  {
    name: "step_upload",
    aspectRatio: "1:1",
    prompt: `A sleek, modern 3D rendered illustration for a "How It Works" section of a premium dark-themed app landing page. Step 1: Upload your photo.

SCENE: A modern iPhone floating at a slight angle (10 degrees) in an empty dark void (#09090B background). The phone screen displays a clean, minimal camera interface — a viewfinder showing a beautiful photo being captured: a young person striking a confident pose in warm golden sunlight. The shutter button is prominent and glowing gold (#F59E0B).

Around the phone, 3-4 small thumbnail photos are floating outward from the phone in a gentle arc — like photos being selected from a gallery. Each thumbnail shows a different type of photo: a group selfie, a landscape sunset, a close-up portrait, a pet photo. The thumbnails have rounded corners and subtle glass-morphism frosted edges with a golden border glow.

LIGHTING: Single dramatic amber-gold point light source (#F59E0B) positioned behind and slightly above the phone, creating a premium halo/backlight effect. The phone edges catch this light creating a thin golden rim light. Subtle golden dust particles float in the beam of light. Very dark everywhere else — the phone and photos emerge from pure darkness.

STYLE: Clean 3D product render quality (like Apple's marketing material). Minimal, elegant, generous negative space. NOT cartoon or flat illustration — this should look like a real premium product shot with subtle 3D depth. No hands, no text, no arrows, no numbers. The visual should intuitively communicate "pick/capture your photo" through composition alone.

MOOD: Simple, inviting, effortless — "this is so easy to start." Premium but approachable.`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // 6. HOW IT WORKS — Step 2: AI Magic
  // ═══════════════════════════════════════════════════════════════════
  {
    name: "step_magic",
    aspectRatio: "1:1",
    prompt: `A mesmerizing abstract visualization of AI image transformation in progress, designed for a dark-themed landing page. Step 2: AI does the magic.

SCENE: At the center of a pure black void (#09090B), a photograph is in the middle of being magically transformed. The left side of the photo shows the original — a normal casual portrait photo. The right side is being reconstructed pixel-by-pixel into a stunning AI-enhanced version with dramatically better lighting and artistic quality.

THE TRANSFORMATION ZONE: Where original meets enhanced, there's a vertical band of pure creative energy — thousands of tiny golden (#F59E0B) and amber luminous particles are flowing, swirling, and reorganizing. These particles look like fireflies or golden stardust, creating organic flowing streams that spiral around the image. Some particles are carrying tiny pixel fragments from the "before" side to the "after" side.

SURROUNDING ELEMENTS: Orbiting around the central transformation, there are faint holographic geometric shapes — circles, hexagons, thin connection lines — suggesting neural network processing. These shapes are rendered in very subtle amber-gold wireframes with slight transparency. A large soft golden energy aura radiates outward from the transformation zone, creating warm volumetric light rays that fade into the darkness.

PARTICLE DETAILS: The golden particles vary in size — some are tiny pinpoints, some are larger with soft bokeh glow. They flow in organic, non-linear paths like a murmuration of starlings. Some particles leave short motion-blur trails. A few particles at the edges transition to subtle purple (#A78BFA) and teal (#34D399) tones, suggesting the diverse creative possibilities.

QUALITY: Ultra high-resolution, photorealistic rendering of the photo elements combined with ethereal, magical particle effects. The overall feeling should be: "something extraordinary is happening here" — alchemy, transformation, magic. Think Doctor Strange visual effects meets premium tech marketing. No text, no UI elements, no watermarks. Pure visual storytelling.`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // 7. HOW IT WORKS — Step 3: Share & Go Viral
  // ═══════════════════════════════════════════════════════════════════
  {
    name: "step_share",
    aspectRatio: "1:1",
    prompt: `A celebratory, energetic visualization of social media success for a dark-themed app landing page. Step 3: Share and watch the engagement explode.

SCENE: A modern iPhone floating center-frame against a pure dark background (#09090B), tilted very slightly forward. On the phone screen: a beautiful social media profile grid (Instagram-like layout with 3 columns) showing 6-9 stunning AI-generated photos — a mix of enhanced selfies, artistic template transformations, and cinematic story panels. All the photos on screen are visually stunning, colorful, and scroll-stopping.

THE EXPLOSION OF ENGAGEMENT: Erupting outward from the phone in all directions are dozens of floating social media engagement indicators, creating a dynamic explosion of success:

— Floating heart/like icons in various sizes (some large, some tiny), glowing in rose-pink (#FB7185) and gold (#F59E0B), tumbling and rotating at different angles
— Small circular notification badges showing numbers like "2.4K", "847", "12K" in a clean modern font, each with a soft glass-morphism frosted background and golden border
— Subtle emoji reactions floating among them: fire emoji, heart-eyes, sparkle stars, 100 emoji — all rendered as small glowing 3D objects
— Thin golden connection lines linking some of the floating elements, suggesting viral spread and network effects
— At the very edges, the engagement icons become smaller and more numerous, fading into a constellation of tiny golden dots — suggesting infinite reach

LIGHTING: The phone screen is the primary light source, casting a warm multi-colored glow onto the floating elements. Behind everything, a very subtle golden radial gradient emanates from center. Tiny golden confetti particles and sparkle-stars fill the gaps between larger elements.

MOOD: Pure dopamine. The feeling of posting something amazing and watching your phone blow up with notifications. Excitement, validation, viral success. It should make a Gen-Z viewer think "I want THAT feeling."

STYLE: 3D rendered with a premium editorial quality — not cartoony. The floating elements should feel physical and tangible with proper shadows and light interaction, but with a touch of magical unreality in how they float and glow. No real brand logos (no Instagram logo). No readable usernames. No text overlays. No watermarks.`,
  },
];

// ─── Gemini API Call ───
async function generateImage(prompt: string, aspectRatio: string): Promise<Buffer | null> {
  const body = JSON.stringify({
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio: aspectRatio,
      },
    },
  });

  return new Promise((resolve, reject) => {
    const url = new URL(API_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk: string) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);

          if (json.error) {
            console.error(`  API Error: ${json.error.message}`);
            resolve(null);
            return;
          }

          // Find image part in response
          const candidates = json.candidates || [];
          for (const candidate of candidates) {
            const parts = candidate.content?.parts || [];
            for (const part of parts) {
              if (part.inlineData?.mimeType?.startsWith("image/")) {
                const buffer = Buffer.from(part.inlineData.data, "base64");
                resolve(buffer);
                return;
              }
            }
          }

          console.error("  No image data in response");
          // Log what we got for debugging
          const textParts = candidates[0]?.content?.parts?.filter((p: any) => p.text) || [];
          if (textParts.length > 0) {
            console.error(`  Got text instead: ${textParts[0].text.substring(0, 200)}`);
          }
          resolve(null);
        } catch (e) {
          console.error(`  Parse error: ${e}`);
          resolve(null);
        }
      });
    });

    req.on("error", (e) => {
      console.error(`  Request error: ${e.message}`);
      resolve(null);
    });

    req.setTimeout(120000, () => {
      req.destroy();
      console.error("  Request timeout (120s)");
      resolve(null);
    });

    req.write(body);
    req.end();
  });
}

// ─── Main ───
async function main() {
  console.log("🎨 FlexMe Landing Page Image Generator");
  console.log(`📁 Output: ${OUTPUT_DIR}`);
  console.log(`🤖 Model: ${MODEL}`);
  console.log(`📷 Images to generate: ${IMAGES.length}\n`);

  // Create output dir
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let success = 0;
  let failed = 0;

  for (let i = 0; i < IMAGES.length; i++) {
    const img = IMAGES[i];
    const outPath = path.join(OUTPUT_DIR, `${img.name}.png`);

    // Skip if already exists
    if (fs.existsSync(outPath)) {
      console.log(`⏭️  [${i + 1}/${IMAGES.length}] ${img.name} — already exists, skipping`);
      success++;
      continue;
    }

    console.log(`🖼️  [${i + 1}/${IMAGES.length}] Generating ${img.name}...`);
    console.log(`   Prompt: ${img.prompt.substring(0, 80)}...`);

    const maxRetries = 3;
    let imageBuffer: Buffer | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      if (attempt > 1) {
        console.log(`   Retry ${attempt}/${maxRetries}...`);
        // Wait before retry (exponential backoff)
        await new Promise((r) => setTimeout(r, attempt * 5000));
      }

      imageBuffer = await generateImage(img.prompt, img.aspectRatio);
      if (imageBuffer) break;
    }

    if (imageBuffer) {
      fs.writeFileSync(outPath, imageBuffer);
      const sizeKB = (imageBuffer.length / 1024).toFixed(0);
      console.log(`   ✅ Saved ${img.name}.png (${sizeKB} KB)\n`);
      success++;
    } else {
      console.log(`   ❌ Failed to generate ${img.name}\n`);
      failed++;
    }

    // Rate limit: wait 3s between requests
    if (i < IMAGES.length - 1) {
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  console.log("─".repeat(40));
  console.log(`✅ Success: ${success} | ❌ Failed: ${failed} | Total: ${IMAGES.length}`);

  if (success > 0) {
    console.log(`\n📁 Images saved to: ${OUTPUT_DIR}`);
    console.log("🚀 Next: run 'firebase deploy --only hosting' to publish");
  }
}

main().catch(console.error);
