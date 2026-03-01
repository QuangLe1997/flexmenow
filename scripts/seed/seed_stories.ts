/**
 * seed_stories.ts
 *
 * Generates 5 sample FlexTale story packs with chapters (3 chapters each),
 * i18n support. Uploads the result to GCS as flextale_stories.json.
 *
 * Usage:
 *   npx ts-node seed/seed_stories.ts [--dry-run] [--out <path>]
 *
 * Options:
 *   --dry-run   Print JSON to stdout instead of uploading to GCS
 *   --out       Write JSON to a local file path
 */

import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface I18nString {
  en: string;
  vi: string;
  es: string;
  pt: string;
  ja: string;
  ko: string;
}

interface StoryScene {
  sceneNumber: number;
  title: I18nString;
  caption: I18nString;
  hashtags: string[];
  suggestedPostTime: string;
  aiPrompt: string;
}

interface StoryChapter {
  chapterNumber: number;
  title: I18nString;
  scenes: StoryScene[];
}

interface FlexTaleStory {
  id: string;
  name: I18nString;
  description: I18nString;
  category: string;
  totalPhotos: number;
  credits: number;
  rating: number;
  uses: number;
  style: string;
  chapters: StoryChapter[];
  tags: string[];
  premium: boolean;
  badge: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Story data
// ---------------------------------------------------------------------------

const stories: FlexTaleStory[] = [
  {
    id: "tale_paris_7days",
    name: {
      en: "Paris 7 Days",
      vi: "Paris 7 Ngay",
      es: "Paris 7 Dias",
      pt: "Paris 7 Dias",
      ja: "パリ7日間",
      ko: "파리 7일",
    },
    description: {
      en: "A 7-day journey through Paris -- from the airport to Eiffel Tower, through Louvre and along the Seine.",
      vi: "Hanh trinh 7 ngay qua Paris -- tu san bay den thap Eiffel, qua Louvre va doc song Seine.",
      es: "Un viaje de 7 dias por Paris -- desde el aeropuerto hasta la Torre Eiffel, por el Louvre y a lo largo del Sena.",
      pt: "Uma viagem de 7 dias por Paris -- do aeroporto ate a Torre Eiffel, pelo Louvre e ao longo do Sena.",
      ja: "パリ7日間の旅 -- 空港からエッフェル塔、ルーヴルを通りセーヌ川沿いへ。",
      ko: "파리 7일 여행 -- 공항에서 에펠탑까지, 루브르를 거쳐 센강을 따라.",
    },
    category: "Travel",
    totalPhotos: 9,
    credits: 8,
    rating: 4.7,
    uses: 3456,
    style: "Realistic",
    premium: false,
    badge: "HOT",
    chapters: [
      {
        chapterNumber: 1,
        title: {
          en: "Arrival",
          vi: "Den Noi",
          es: "Llegada",
          pt: "Chegada",
          ja: "到着",
          ko: "도착",
        },
        scenes: [
          {
            sceneNumber: 1,
            title: {
              en: "Airport check-in",
              vi: "Lam thu tuc tai san bay",
              es: "Registro en aeropuerto",
              pt: "Check-in no aeroporto",
              ja: "空港チェックイン",
              ko: "공항 체크인",
            },
            caption: {
              en: "Let's go! Paris here I come! 12-hour flight but totally worth it!",
              vi: "Di thoi! Paris toi den day! 12 gio bay nhung hoan toan xung dang!",
              es: "Vamos! Paris alla voy! 12 horas de vuelo pero totalmente vale la pena!",
              pt: "Vamos! Paris ai vou eu! 12 horas de voo mas totalmente vale a pena!",
              ja: "出発!パリ、行くよ!12時間のフライトだけど絶対価値がある!",
              ko: "출발! 파리 간다! 12시간 비행이지만 완전 가치있어!",
            },
            hashtags: ["Paris", "Travel", "Adventure"],
            suggestedPostTime: "8:00 AM",
            aiPrompt:
              "Portrait of {subject} at an international airport terminal, rolling a stylish suitcase, departure board showing Paris CDG, excited expression, travel outfit, bright terminal lighting",
          },
          {
            sceneNumber: 2,
            title: {
              en: "Landing at CDG",
              vi: "Ha canh tai CDG",
              es: "Aterrizaje en CDG",
              pt: "Pouso em CDG",
              ja: "CDG着陸",
              ko: "CDG 착륙",
            },
            caption: {
              en: "Made it to Paris safe and sound! Cold but happy.",
              vi: "Da den Paris binh an! Lanh nhung vui!",
              es: "Llegue a Paris sano y salvo! Frio pero feliz.",
              pt: "Cheguei em Paris sao e salvo! Frio mas feliz.",
              ja: "パリに無事到着!寒いけど幸せ!",
              ko: "파리에 무사히 도착! 춥지만 행복해!",
            },
            hashtags: ["Paris", "Arrived", "Excited"],
            suggestedPostTime: "8:00 PM",
            aiPrompt:
              "Portrait of {subject} walking out of Charles de Gaulle airport, wearing a winter coat, Parisian architecture visible outside, evening light, happy expression",
          },
          {
            sceneNumber: 3,
            title: {
              en: "Hotel with Eiffel view",
              vi: "Khach san nhin thap Eiffel",
              es: "Hotel con vista Eiffel",
              pt: "Hotel com vista Eiffel",
              ja: "エッフェル塔が見えるホテル",
              ko: "에펠탑 뷰 호텔",
            },
            caption: {
              en: "The view from my room is unreal...",
              vi: "Khung canh tu phong toi that khong that...",
              es: "La vista desde mi habitacion es irreal...",
              pt: "A vista do meu quarto e irreal...",
              ja: "部屋からの景色が信じられない...",
              ko: "방에서 보는 풍경이 비현실적...",
            },
            hashtags: ["EiffelTower", "HotelView", "Paris"],
            suggestedPostTime: "9:00 PM",
            aiPrompt:
              "Portrait of {subject} standing by a hotel window at night, Eiffel Tower sparkling in the background, cozy hotel room, warm ambient lighting, awe-struck expression",
          },
        ],
      },
      {
        chapterNumber: 2,
        title: {
          en: "Exploration",
          vi: "Kham Pha",
          es: "Exploracion",
          pt: "Exploracao",
          ja: "探索",
          ko: "탐험",
        },
        scenes: [
          {
            sceneNumber: 4,
            title: {
              en: "Eiffel Tower",
              vi: "Thap Eiffel",
              es: "Torre Eiffel",
              pt: "Torre Eiffel",
              ja: "エッフェル塔",
              ko: "에펠탑",
            },
            caption: {
              en: "Standing here, can't believe it's real...",
              vi: "Dung o day, khong the tin la that...",
              es: "Parado aqui, no puedo creer que sea real...",
              pt: "De pe aqui, nao acredito que e real...",
              ja: "ここに立って、本当だと信じられない...",
              ko: "여기 서 있는데, 실감이 안 나...",
            },
            hashtags: ["EiffelTower", "Dream", "Paris"],
            suggestedPostTime: "10:00 AM",
            aiPrompt:
              "Portrait of {subject} standing at the base of the Eiffel Tower looking up, Champ de Mars in background, morning light, amazed expression, tourist outfit",
          },
          {
            sceneNumber: 5,
            title: {
              en: "Parisian cafe",
              vi: "Quan cafe Paris",
              es: "Cafe parisino",
              pt: "Cafe parisiense",
              ja: "パリのカフェ",
              ko: "파리지앵 카페",
            },
            caption: {
              en: "Croissant and cafe au lait. Living the dream.",
              vi: "Croissant va cafe au lait. Song trong giac mo.",
              es: "Croissant y cafe con leche. Viviendo el sueno.",
              pt: "Croissant e cafe com leite. Vivendo o sonho.",
              ja: "クロワッサンとカフェオレ。夢のよう。",
              ko: "크루아상과 카페오레. 꿈을 살고 있어.",
            },
            hashtags: ["ParisianLife", "Coffee", "Croissant"],
            suggestedPostTime: "2:00 PM",
            aiPrompt:
              "Portrait of {subject} sitting at a classic Parisian sidewalk cafe, croissant and coffee on marble table, cobblestone street, afternoon sun, relaxed smile",
          },
          {
            sceneNumber: 6,
            title: {
              en: "Louvre Museum",
              vi: "Bao Tang Louvre",
              es: "Museo del Louvre",
              pt: "Museu do Louvre",
              ja: "ルーヴル美術館",
              ko: "루브르 박물관",
            },
            caption: {
              en: "Face to face with Mona Lisa. Smaller than I thought!",
              vi: "Doi mat voi Mona Lisa. Nho hon toi tuong!",
              es: "Cara a cara con la Mona Lisa. Mas pequena de lo que pensaba!",
              pt: "Cara a cara com a Mona Lisa. Menor do que eu pensava!",
              ja: "モナ・リザと対面。思ったより小さい!",
              ko: "모나리자와 대면. 생각보다 작아!",
            },
            hashtags: ["Louvre", "MonaLisa", "Art"],
            suggestedPostTime: "11:00 AM",
            aiPrompt:
              "Portrait of {subject} inside the Louvre Museum, glass pyramid visible through window, grand gallery hall, art on walls, cultured expression, museum lighting",
          },
        ],
      },
      {
        chapterNumber: 3,
        title: {
          en: "Farewell",
          vi: "Chia Tay",
          es: "Despedida",
          pt: "Despedida",
          ja: "お別れ",
          ko: "작별",
        },
        scenes: [
          {
            sceneNumber: 7,
            title: {
              en: "Seine River cruise",
              vi: "Du thuyen song Seine",
              es: "Crucero por el Sena",
              pt: "Cruzeiro no Sena",
              ja: "セーヌ川クルーズ",
              ko: "센강 크루즈",
            },
            caption: {
              en: "Sunset on the Seine. Pure magic.",
              vi: "Hoang hon tren song Seine. Phep mau thuan tuy.",
              es: "Atardecer en el Sena. Pura magia.",
              pt: "Por do sol no Sena. Pura magia.",
              ja: "セーヌ川の夕焼け。純粋な魔法。",
              ko: "센강의 일몰. 순수한 마법.",
            },
            hashtags: ["Seine", "Sunset", "Cruise"],
            suggestedPostTime: "6:00 PM",
            aiPrompt:
              "Portrait of {subject} on a Seine River cruise boat at sunset, Notre-Dame silhouette in background, golden orange sky, wind in hair, romantic atmosphere",
          },
          {
            sceneNumber: 8,
            title: {
              en: "Eiffel at night",
              vi: "Eiffel ve dem",
              es: "Eiffel de noche",
              pt: "Eiffel a noite",
              ja: "夜のエッフェル",
              ko: "밤의 에펠",
            },
            caption: {
              en: "The tower sparkles every hour. I'll never forget this.",
              vi: "Thap lung linh moi gio. Toi se khong bao gio quen dieu nay.",
              es: "La torre brilla cada hora. Nunca olvidare esto.",
              pt: "A torre brilha a cada hora. Nunca vou esquecer isso.",
              ja: "毎時タワーが輝く。一生忘れない。",
              ko: "매시간 타워가 반짝여. 절대 잊지 못할 거야.",
            },
            hashtags: ["EiffelNight", "Sparkle", "Magic"],
            suggestedPostTime: "10:00 PM",
            aiPrompt:
              "Portrait of {subject} standing on Trocadero plaza at night, Eiffel Tower fully illuminated and sparkling behind, city lights, dreamy expression, night photography",
          },
          {
            sceneNumber: 9,
            title: {
              en: "Flying home",
              vi: "Bay ve nha",
              es: "Volando a casa",
              pt: "Voando para casa",
              ja: "帰国フライト",
              ko: "귀국 비행",
            },
            caption: {
              en: "Au revoir Paris. You've changed me forever.",
              vi: "Au revoir Paris. Ban da thay doi toi mai mai.",
              es: "Au revoir Paris. Me has cambiado para siempre.",
              pt: "Au revoir Paris. Voce me mudou para sempre.",
              ja: "さようならパリ。永遠に変わった。",
              ko: "Au revoir 파리. 영원히 나를 변화시켰어.",
            },
            hashtags: ["AuRevoir", "Paris", "Memories"],
            suggestedPostTime: "6:00 AM",
            aiPrompt:
              "Portrait of {subject} looking out of an airplane window at sunrise, clouds below, bittersweet smile, travel pillow, emotional farewell mood",
          },
        ],
      },
    ],
    tags: ["paris", "travel", "europe", "france", "romantic"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tale_got_a_bae",
    name: {
      en: "Got a Bae",
      vi: "Co Nguoi Yeu Roi",
      es: "Tengo Pareja",
      pt: "Arrumei um Amor",
      ja: "恋人ゲット",
      ko: "애인 생겼어",
    },
    description: {
      en: "The cutest couple story -- from first date to forever.",
      vi: "Cau chuyen cap doi de thuong nhat -- tu buoi hen dau tien den mai mai.",
      es: "La historia de pareja mas tierna -- desde la primera cita hasta siempre.",
      pt: "A historia de casal mais fofa -- do primeiro encontro ate para sempre.",
      ja: "最もかわいいカップルストーリー -- 初デートから永遠まで。",
      ko: "가장 귀여운 커플 이야기 -- 첫 데이트부터 영원히.",
    },
    category: "Romance",
    totalPhotos: 9,
    credits: 6,
    rating: 4.8,
    uses: 5600,
    style: "Realistic",
    premium: false,
    badge: "HOT",
    chapters: [
      {
        chapterNumber: 1,
        title: {
          en: "First Meeting",
          vi: "Lan Dau Gap",
          es: "Primer Encuentro",
          pt: "Primeiro Encontro",
          ja: "初めての出会い",
          ko: "첫 만남",
        },
        scenes: [
          {
            sceneNumber: 1,
            title: {
              en: "First date",
              vi: "Buoi hen dau",
              es: "Primera cita",
              pt: "Primeiro encontro",
              ja: "初デート",
              ko: "첫 데이트",
            },
            caption: {
              en: "Butterflies everywhere...",
              vi: "Buom bay khap noi...",
              es: "Mariposas por todos lados...",
              pt: "Borboletas por toda parte...",
              ja: "胸がドキドキ...",
              ko: "설레는 마음...",
            },
            hashtags: ["FirstDate", "Love"],
            suggestedPostTime: "7:00 PM",
            aiPrompt:
              "Portrait of {subject} sitting across from someone at a romantic restaurant table, candlelight, nervous but happy smile, elegant outfit, soft warm lighting",
          },
          {
            sceneNumber: 2,
            title: {
              en: "Holding hands",
              vi: "Nam tay",
              es: "Tomados de la mano",
              pt: "De maos dadas",
              ja: "手をつなぐ",
              ko: "손잡기",
            },
            caption: {
              en: "This feels so right.",
              vi: "Cam giac that dung.",
              es: "Esto se siente tan bien.",
              pt: "Isso parece tao certo.",
              ja: "とても自然な感じ。",
              ko: "이게 맞는 느낌이야.",
            },
            hashtags: ["Couple", "Love"],
            suggestedPostTime: "8:00 PM",
            aiPrompt:
              "Close-up portrait of {subject} walking hand-in-hand with partner on a city street at dusk, string lights overhead, genuine smile, romantic atmosphere",
          },
          {
            sceneNumber: 3,
            title: {
              en: "Dinner together",
              vi: "An toi cung nhau",
              es: "Cena juntos",
              pt: "Jantar juntos",
              ja: "一緒にディナー",
              ko: "함께 저녁 식사",
            },
            caption: {
              en: "Best dinner of my life.",
              vi: "Bua toi ngon nhat doi toi.",
              es: "La mejor cena de mi vida.",
              pt: "O melhor jantar da minha vida.",
              ja: "人生最高のディナー。",
              ko: "인생 최고의 저녁 식사.",
            },
            hashtags: ["DateNight", "Dinner"],
            suggestedPostTime: "8:30 PM",
            aiPrompt:
              "Portrait of {subject} at an upscale restaurant, beautifully plated food on table, sharing a laugh with partner across the table, warm ambient lighting, happy expression",
          },
        ],
      },
      {
        chapterNumber: 2,
        title: {
          en: "Growing Closer",
          vi: "Gan Gui Hon",
          es: "Acercandose",
          pt: "Aproximando-se",
          ja: "近づく二人",
          ko: "가까워지는 사이",
        },
        scenes: [
          {
            sceneNumber: 4,
            title: {
              en: "Night walk",
              vi: "Di dao dem",
              es: "Paseo nocturno",
              pt: "Caminhada noturna",
              ja: "夜の散歩",
              ko: "밤 산책",
            },
            caption: {
              en: "Walking under the stars with you.",
              vi: "Di dao duoi anh sao voi ban.",
              es: "Caminando bajo las estrellas contigo.",
              pt: "Caminhando sob as estrelas com voce.",
              ja: "あなたと星空の下を歩く。",
              ko: "별 아래 당신과 걷기.",
            },
            hashtags: ["NightWalk", "Romance"],
            suggestedPostTime: "10:00 PM",
            aiPrompt:
              "Portrait of {subject} walking along a moonlit riverbank with city lights reflecting on water, starry sky, romantic silhouette, peaceful expression",
          },
          {
            sceneNumber: 5,
            title: {
              en: "Selfie together",
              vi: "Selfie chung",
              es: "Selfie juntos",
              pt: "Selfie juntos",
              ja: "一緒にセルフィー",
              ko: "함께 셀카",
            },
            caption: {
              en: "Our first photo together!",
              vi: "Buc anh dau tien cua chung ta!",
              es: "Nuestra primera foto juntos!",
              pt: "Nossa primeira foto juntos!",
              ja: "一緒の初めての写真!",
              ko: "우리의 첫 사진!",
            },
            hashtags: ["Couple", "Selfie"],
            suggestedPostTime: "10:30 PM",
            aiPrompt:
              "Selfie-style portrait of {subject} with partner, big smiles, cute pose, city nightlife background, warm happy energy, casual outfit",
          },
          {
            sceneNumber: 6,
            title: {
              en: "Surprise gift",
              vi: "Qua bat ngo",
              es: "Regalo sorpresa",
              pt: "Presente surpresa",
              ja: "サプライズプレゼント",
              ko: "깜짝 선물",
            },
            caption: {
              en: "You remembered...",
              vi: "Ban nho...",
              es: "Recordaste...",
              pt: "Voce lembrou...",
              ja: "覚えてたんだ...",
              ko: "기억하고 있었구나...",
            },
            hashtags: ["Surprise", "Gift"],
            suggestedPostTime: "11:00 AM",
            aiPrompt:
              "Portrait of {subject} receiving a beautifully wrapped gift box with a bow, surprised and emotional expression, cozy indoor setting, morning light",
          },
        ],
      },
      {
        chapterNumber: 3,
        title: {
          en: "Forever",
          vi: "Mai Mai",
          es: "Para Siempre",
          pt: "Para Sempre",
          ja: "永遠に",
          ko: "영원히",
        },
        scenes: [
          {
            sceneNumber: 7,
            title: {
              en: "Cooking together",
              vi: "Nau an cung nhau",
              es: "Cocinando juntos",
              pt: "Cozinhando juntos",
              ja: "一緒に料理",
              ko: "함께 요리",
            },
            caption: {
              en: "Kitchen chaos but so fun.",
              vi: "Bep bua nhung vui qua.",
              es: "Caos en la cocina pero tan divertido.",
              pt: "Caos na cozinha mas tao divertido.",
              ja: "キッチンは大混乱でも楽しい。",
              ko: "부엌은 엉망이지만 너무 재밌어.",
            },
            hashtags: ["CookingTogether", "Home"],
            suggestedPostTime: "6:00 PM",
            aiPrompt:
              "Portrait of {subject} cooking in a modern kitchen, flour on face, laughing, partner in background, warm kitchen lighting, domestic bliss atmosphere",
          },
          {
            sceneNumber: 8,
            title: {
              en: "Sunset together",
              vi: "Hoang hon cung nhau",
              es: "Atardecer juntos",
              pt: "Por do sol juntos",
              ja: "一緒の夕焼け",
              ko: "함께하는 일몰",
            },
            caption: {
              en: "Every sunset is better with you.",
              vi: "Moi hoang hon deu dep hon khi co ban.",
              es: "Cada atardecer es mejor contigo.",
              pt: "Todo por do sol e melhor com voce.",
              ja: "あなたと見る夕焼けは格別。",
              ko: "당신과 함께하는 일몰은 더 아름다워.",
            },
            hashtags: ["Sunset", "Couple", "Love"],
            suggestedPostTime: "6:30 PM",
            aiPrompt:
              "Portrait of {subject} watching sunset from a rooftop, partner silhouette beside, golden hour light, city skyline, peaceful romantic expression",
          },
          {
            sceneNumber: 9,
            title: {
              en: "Anniversary",
              vi: "Ky niem",
              es: "Aniversario",
              pt: "Aniversario",
              ja: "記念日",
              ko: "기념일",
            },
            caption: {
              en: "Here's to us and forever.",
              vi: "Chuc mung chung ta va mai mai.",
              es: "Por nosotros y para siempre.",
              pt: "Brindemos a nos e para sempre.",
              ja: "私たちと永遠に乾杯。",
              ko: "우리와 영원을 위하여.",
            },
            hashtags: ["Anniversary", "Love", "Forever"],
            suggestedPostTime: "7:00 PM",
            aiPrompt:
              "Portrait of {subject} at an anniversary dinner, champagne toast, elegant outfit, roses on table, warm candlelight, celebrating expression, romantic fine dining setting",
          },
        ],
      },
    ],
    tags: ["romance", "couple", "love", "date", "relationship"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tale_ceo_day",
    name: {
      en: "CEO for a Day",
      vi: "Lam CEO Mot Ngay",
      es: "CEO por un Dia",
      pt: "CEO por um Dia",
      ja: "1日CEO体験",
      ko: "하루 CEO",
    },
    description: {
      en: "One day as a CEO -- morning routine to evening gala.",
      vi: "Mot ngay lam CEO -- tu buoi sang den da tiec toi.",
      es: "Un dia como CEO -- desde la rutina matutina hasta la gala nocturna.",
      pt: "Um dia como CEO -- da rotina matinal ate a gala noturna.",
      ja: "CEOの1日 -- 朝のルーティンから夜のガラまで。",
      ko: "CEO의 하루 -- 아침 루틴부터 저녁 갈라까지.",
    },
    category: "Career",
    totalPhotos: 9,
    credits: 5,
    rating: 4.5,
    uses: 2100,
    style: "Corporate",
    premium: false,
    badge: null,
    chapters: [
      {
        chapterNumber: 1,
        title: {
          en: "Morning Hustle",
          vi: "Buoi Sang Ban Ron",
          es: "Ajetreo Matutino",
          pt: "Correria Matinal",
          ja: "朝の奮闘",
          ko: "아침 허슬",
        },
        scenes: [
          {
            sceneNumber: 1,
            title: {
              en: "Morning routine",
              vi: "Buoi sang",
              es: "Rutina matutina",
              pt: "Rotina matinal",
              ja: "朝のルーティン",
              ko: "아침 루틴",
            },
            caption: {
              en: "5 AM. Coffee. Ready to conquer.",
              vi: "5 gio sang. Ca phe. San sang chinh phuc.",
              es: "5 AM. Cafe. Listo para conquistar.",
              pt: "5 AM. Cafe. Pronto para conquistar.",
              ja: "朝5時。コーヒー。征服の準備完了。",
              ko: "오전 5시. 커피. 정복할 준비 완료.",
            },
            hashtags: ["CEO", "Morning"],
            suggestedPostTime: "5:00 AM",
            aiPrompt:
              "Portrait of {subject} in a luxury penthouse kitchen at dawn, wearing a premium robe, holding a coffee cup, city skyline through floor-to-ceiling windows, determined focused expression",
          },
          {
            sceneNumber: 2,
            title: {
              en: "Corner office",
              vi: "Van phong goc",
              es: "Oficina esquina",
              pt: "Escritorio de canto",
              ja: "コーナーオフィス",
              ko: "코너 오피스",
            },
            caption: {
              en: "This view never gets old.",
              vi: "Khung canh nay khong bao gio cu.",
              es: "Esta vista nunca se vuelve vieja.",
              pt: "Essa vista nunca envelhece.",
              ja: "この景色は飽きない。",
              ko: "이 풍경은 질리지 않아.",
            },
            hashtags: ["Office", "CEO"],
            suggestedPostTime: "8:00 AM",
            aiPrompt:
              "Portrait of {subject} in a modern corner office, tailored suit, standing at floor-to-ceiling windows overlooking a major city skyline, confident powerful stance, morning sun",
          },
          {
            sceneNumber: 3,
            title: {
              en: "Board meeting",
              vi: "Hop hoi dong",
              es: "Reunion de directiva",
              pt: "Reuniao de diretoria",
              ja: "取締役会",
              ko: "이사회",
            },
            caption: {
              en: "Leading with vision.",
              vi: "Dan dat bang tam nhin.",
              es: "Liderando con vision.",
              pt: "Liderando com visao.",
              ja: "ビジョンで導く。",
              ko: "비전으로 이끌다.",
            },
            hashtags: ["Business", "Leadership"],
            suggestedPostTime: "10:00 AM",
            aiPrompt:
              "Portrait of {subject} at the head of a modern boardroom table, presenting to executives, large screen with charts behind, commanding presence, corporate photography",
          },
        ],
      },
      {
        chapterNumber: 2,
        title: {
          en: "Power Moves",
          vi: "Hanh Dong Quyen Luc",
          es: "Movimientos Poderosos",
          pt: "Jogadas de Poder",
          ja: "パワームーブ",
          ko: "파워 무브",
        },
        scenes: [
          {
            sceneNumber: 4,
            title: {
              en: "Power lunch",
              vi: "An trua quyen luc",
              es: "Almuerzo de poder",
              pt: "Almoco de poder",
              ja: "パワーランチ",
              ko: "파워 런치",
            },
            caption: {
              en: "Closing deals over lunch.",
              vi: "Chot deal trong bua trua.",
              es: "Cerrando acuerdos durante el almuerzo.",
              pt: "Fechando negocios no almoco.",
              ja: "ランチでディールを決める。",
              ko: "점심에 딜 클로징.",
            },
            hashtags: ["PowerLunch", "Business"],
            suggestedPostTime: "12:00 PM",
            aiPrompt:
              "Portrait of {subject} at a high-end restaurant business lunch, shaking hands across the table, expensive wine, tailored suit, confident smile, upscale dining setting",
          },
          {
            sceneNumber: 5,
            title: {
              en: "Media interview",
              vi: "Phong van bao chi",
              es: "Entrevista mediatica",
              pt: "Entrevista de midia",
              ja: "メディアインタビュー",
              ko: "미디어 인터뷰",
            },
            caption: {
              en: "Sharing our vision with the world.",
              vi: "Chia se tam nhin voi the gioi.",
              es: "Compartiendo nuestra vision con el mundo.",
              pt: "Compartilhando nossa visao com o mundo.",
              ja: "世界にビジョンを共有。",
              ko: "세상에 비전을 공유하다.",
            },
            hashtags: ["Interview", "CEO", "Media"],
            suggestedPostTime: "3:00 PM",
            aiPrompt:
              "Portrait of {subject} being interviewed by media, professional studio lighting, camera crew in background, confident articulate expression, wearing executive attire",
          },
          {
            sceneNumber: 6,
            title: {
              en: "Supercar exit",
              vi: "Ra ve bang sieu xe",
              es: "Salida en superdeportivo",
              pt: "Saida de superesportivo",
              ja: "スーパーカーで退社",
              ko: "슈퍼카 퇴근",
            },
            caption: {
              en: "Another day, another win.",
              vi: "Them mot ngay, them mot chien thang.",
              es: "Otro dia, otra victoria.",
              pt: "Mais um dia, mais uma vitoria.",
              ja: "また1日、また1つの勝利。",
              ko: "또 하루, 또 하나의 승리.",
            },
            hashtags: ["Supercar", "Luxury"],
            suggestedPostTime: "6:00 PM",
            aiPrompt:
              "Portrait of {subject} stepping into a luxury supercar in an underground parking garage, suit jacket over shoulder, evening light, victorious satisfied expression",
          },
        ],
      },
      {
        chapterNumber: 3,
        title: {
          en: "Evening Celebration",
          vi: "Buoi Toi Le Hoi",
          es: "Celebracion Nocturna",
          pt: "Celebracao Noturna",
          ja: "夜のお祝い",
          ko: "저녁 축하",
        },
        scenes: [
          {
            sceneNumber: 7,
            title: {
              en: "Evening gala",
              vi: "Da tiec toi",
              es: "Gala nocturna",
              pt: "Gala noturna",
              ja: "イブニングガラ",
              ko: "이브닝 갈라",
            },
            caption: {
              en: "Tonight we celebrate success.",
              vi: "Toi nay chung ta an mung thanh cong.",
              es: "Esta noche celebramos el exito.",
              pt: "Hoje a noite celebramos o sucesso.",
              ja: "今夜、成功を祝う。",
              ko: "오늘 밤 성공을 축하하다.",
            },
            hashtags: ["Gala", "Success"],
            suggestedPostTime: "8:00 PM",
            aiPrompt:
              "Portrait of {subject} at a black-tie gala event, tuxedo or evening gown, champagne in hand, grand ballroom with chandeliers, elegant guests in background",
          },
          {
            sceneNumber: 8,
            title: {
              en: "Award speech",
              vi: "Bai phat bieu nhan giai",
              es: "Discurso de premiacion",
              pt: "Discurso de premiacao",
              ja: "授賞スピーチ",
              ko: "수상 연설",
            },
            caption: {
              en: "This one is for the team.",
              vi: "Giai nay danh cho ca doi.",
              es: "Este es para el equipo.",
              pt: "Este e para a equipe.",
              ja: "これはチームのために。",
              ko: "이건 팀을 위한 것.",
            },
            hashtags: ["Award", "Leadership", "Team"],
            suggestedPostTime: "9:00 PM",
            aiPrompt:
              "Portrait of {subject} giving a speech at a podium, award trophy on lectern, spotlight, audience applauding, confident grateful expression, formal event setting",
          },
          {
            sceneNumber: 9,
            title: {
              en: "Rooftop reflection",
              vi: "Suy tu tren san thuong",
              es: "Reflexion en la azotea",
              pt: "Reflexao no terrace",
              ja: "屋上での振り返り",
              ko: "옥상 회고",
            },
            caption: {
              en: "Built from nothing. This is just the beginning.",
              vi: "Xay tu con so khong. Day chi la bat dau.",
              es: "Construido de la nada. Esto es solo el comienzo.",
              pt: "Construido do nada. Isso e apenas o comeco.",
              ja: "ゼロから築いた。これはまだ始まりに過ぎない。",
              ko: "아무것도 없이 시작했다. 이것은 시작일 뿐.",
            },
            hashtags: ["Success", "Vision", "CEO"],
            suggestedPostTime: "11:00 PM",
            aiPrompt:
              "Portrait of {subject} standing alone on a luxury rooftop at night, city lights panorama below, loosened tie, reflective contemplative expression, dramatic night sky",
          },
        ],
      },
    ],
    tags: ["career", "ceo", "business", "luxury", "success"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tale_tokyo_5days",
    name: {
      en: "Tokyo 5 Days",
      vi: "Tokyo 5 Ngay",
      es: "Tokio 5 Dias",
      pt: "Toquio 5 Dias",
      ja: "東京5日間",
      ko: "도쿄 5일",
    },
    description: {
      en: "Neon lights, ramen streets, and ancient temples.",
      vi: "Den neon, pho ramen va den chua co.",
      es: "Luces de neon, calles de ramen y templos antiguos.",
      pt: "Luzes neon, ruas de ramen e templos antigos.",
      ja: "ネオン、ラーメン横丁、そして古寺。",
      ko: "네온, 라멘 거리, 고대 사원.",
    },
    category: "Travel",
    totalPhotos: 9,
    credits: 8,
    rating: 4.6,
    uses: 4200,
    style: "Cinematic",
    premium: false,
    badge: null,
    chapters: [
      {
        chapterNumber: 1,
        title: {
          en: "Arrival in Tokyo",
          vi: "Den Tokyo",
          es: "Llegada a Tokio",
          pt: "Chegada em Toquio",
          ja: "東京到着",
          ko: "도쿄 도착",
        },
        scenes: [
          {
            sceneNumber: 1,
            title: {
              en: "Narita arrival",
              vi: "Den Narita",
              es: "Llegada a Narita",
              pt: "Chegada em Narita",
              ja: "成田到着",
              ko: "나리타 도착",
            },
            caption: {
              en: "Konnichiwa Tokyo!",
              vi: "Konnichiwa Tokyo!",
              es: "Konnichiwa Tokio!",
              pt: "Konnichiwa Toquio!",
              ja: "こんにちは東京!",
              ko: "곤니치와 도쿄!",
            },
            hashtags: ["Tokyo", "Japan"],
            suggestedPostTime: "4:00 PM",
            aiPrompt:
              "Portrait of {subject} at Narita airport arrival hall, Japanese signage, excited expression, travel outfit with suitcase, bright airport terminal",
          },
          {
            sceneNumber: 2,
            title: {
              en: "Shibuya crossing",
              vi: "Giao lo Shibuya",
              es: "Cruce de Shibuya",
              pt: "Cruzamento Shibuya",
              ja: "渋谷交差点",
              ko: "시부야 횡단보도",
            },
            caption: {
              en: "The most famous crossing in the world.",
              vi: "Giao lo noi tieng nhat the gioi.",
              es: "El cruce mas famoso del mundo.",
              pt: "O cruzamento mais famoso do mundo.",
              ja: "世界で最も有名な交差点。",
              ko: "세상에서 가장 유명한 횡단보도.",
            },
            hashtags: ["Shibuya", "Tokyo"],
            suggestedPostTime: "7:00 PM",
            aiPrompt:
              "Portrait of {subject} walking across Shibuya crossing at night, neon billboards, crowds of people, iconic Tokyo atmosphere, cinematic wide shot",
          },
          {
            sceneNumber: 3,
            title: {
              en: "Ramen alley",
              vi: "Hem ramen",
              es: "Callejon de ramen",
              pt: "Beco de ramen",
              ja: "ラーメン横丁",
              ko: "라멘 골목",
            },
            caption: {
              en: "Best ramen of my life.",
              vi: "To ramen ngon nhat doi toi.",
              es: "El mejor ramen de mi vida.",
              pt: "O melhor ramen da minha vida.",
              ja: "人生最高のラーメン。",
              ko: "인생 라멘.",
            },
            hashtags: ["Ramen", "JapanFood"],
            suggestedPostTime: "8:00 PM",
            aiPrompt:
              "Portrait of {subject} slurping ramen at a tiny Tokyo ramen counter, steam rising from bowl, red lanterns, authentic Japanese ramen shop atmosphere, happy expression",
          },
        ],
      },
      {
        chapterNumber: 2,
        title: {
          en: "Culture & Fun",
          vi: "Van Hoa & Vui Choi",
          es: "Cultura y Diversion",
          pt: "Cultura e Diversao",
          ja: "文化と楽しみ",
          ko: "문화와 재미",
        },
        scenes: [
          {
            sceneNumber: 4,
            title: {
              en: "Sensoji Temple",
              vi: "Chua Sensoji",
              es: "Templo Sensoji",
              pt: "Templo Sensoji",
              ja: "浅草寺",
              ko: "센소지 절",
            },
            caption: {
              en: "Finding peace in the chaos.",
              vi: "Tim binh yen giua hon loan.",
              es: "Encontrando paz en el caos.",
              pt: "Encontrando paz no caos.",
              ja: "混沌の中に平和を見つける。",
              ko: "혼돈 속에서 평화를 찾다.",
            },
            hashtags: ["Sensoji", "Temple"],
            suggestedPostTime: "9:00 AM",
            aiPrompt:
              "Portrait of {subject} at Sensoji Temple gate, giant red lantern overhead, incense smoke, traditional architecture, morning light, contemplative peaceful expression",
          },
          {
            sceneNumber: 5,
            title: {
              en: "Akihabara",
              vi: "Akihabara",
              es: "Akihabara",
              pt: "Akihabara",
              ja: "秋葉原",
              ko: "아키하바라",
            },
            caption: {
              en: "Anime paradise!",
              vi: "Thien duong anime!",
              es: "Paraiso del anime!",
              pt: "Paraiso do anime!",
              ja: "アニメの楽園!",
              ko: "애니메 천국!",
            },
            hashtags: ["Akihabara", "Anime"],
            suggestedPostTime: "2:00 PM",
            aiPrompt:
              "Portrait of {subject} in Akihabara electric town, colorful anime billboards, manga shops, bright neon signs, excited geeky expression, afternoon energy",
          },
          {
            sceneNumber: 6,
            title: {
              en: "Shinjuku Garden",
              vi: "Vuon Shinjuku",
              es: "Jardin Shinjuku",
              pt: "Jardim Shinjuku",
              ja: "新宿御苑",
              ko: "신주쿠 정원",
            },
            caption: {
              en: "Cherry blossoms in full bloom.",
              vi: "Hoa anh dao no ro.",
              es: "Cerezos en plena floracion.",
              pt: "Cerejeiras em plena floracao.",
              ja: "桜が満開。",
              ko: "벚꽃이 만개.",
            },
            hashtags: ["CherryBlossom", "Shinjuku"],
            suggestedPostTime: "10:00 AM",
            aiPrompt:
              "Portrait of {subject} standing under cherry blossom trees in Shinjuku Gyoen, pink petals falling, traditional Japanese garden, dreamy soft light, blissful expression",
          },
        ],
      },
      {
        chapterNumber: 3,
        title: {
          en: "Farewell Japan",
          vi: "Chia Tay Nhat Ban",
          es: "Despedida de Japon",
          pt: "Adeus Japao",
          ja: "日本とのお別れ",
          ko: "일본과의 작별",
        },
        scenes: [
          {
            sceneNumber: 7,
            title: {
              en: "Mt. Fuji day trip",
              vi: "Du lich nui Phu Si",
              es: "Excursion al Monte Fuji",
              pt: "Passeio ao Monte Fuji",
              ja: "富士山日帰り",
              ko: "후지산 당일치기",
            },
            caption: {
              en: "Fuji-san in all its glory.",
              vi: "Nui Phu Si trong tat ca ve dep.",
              es: "Fuji-san en toda su gloria.",
              pt: "Fuji-san em toda a sua gloria.",
              ja: "富士山の壮大な姿。",
              ko: "후지산의 장엄한 모습.",
            },
            hashtags: ["MtFuji", "Japan"],
            suggestedPostTime: "7:00 AM",
            aiPrompt:
              "Portrait of {subject} at Lake Kawaguchi with Mt. Fuji snow-capped peak perfectly reflected in still water, morning light, Japanese countryside, awestruck expression",
          },
          {
            sceneNumber: 8,
            title: {
              en: "Meiji Shrine",
              vi: "Den Meiji",
              es: "Santuario Meiji",
              pt: "Santuario Meiji",
              ja: "明治神宮",
              ko: "메이지 신궁",
            },
            caption: {
              en: "Tradition meets modernity.",
              vi: "Truyen thong gap hien dai.",
              es: "La tradicion se encuentra con la modernidad.",
              pt: "Tradicao encontra modernidade.",
              ja: "伝統と現代の融合。",
              ko: "전통과 현대의 만남.",
            },
            hashtags: ["MeijiShrine", "Tokyo"],
            suggestedPostTime: "8:00 AM",
            aiPrompt:
              "Portrait of {subject} walking through the giant torii gate at Meiji Shrine, towering forest trees, gravel path, traditional serene atmosphere, respectful expression",
          },
          {
            sceneNumber: 9,
            title: {
              en: "Sayonara",
              vi: "Sayonara",
              es: "Sayonara",
              pt: "Sayonara",
              ja: "さようなら",
              ko: "사요나라",
            },
            caption: {
              en: "Until next time, Tokyo.",
              vi: "Hen gap lai, Tokyo.",
              es: "Hasta la proxima, Tokio.",
              pt: "Ate a proxima, Toquio.",
              ja: "また会う日まで、東京。",
              ko: "다음에 또 만나, 도쿄.",
            },
            hashtags: ["Sayonara", "Tokyo", "Memories"],
            suggestedPostTime: "11:00 AM",
            aiPrompt:
              "Portrait of {subject} waving goodbye at the airport gate, Japanese flag visible, bittersweet smile, travel backpack, nostalgic farewell mood",
          },
        ],
      },
    ],
    tags: ["tokyo", "japan", "travel", "asia", "culture"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tale_fitness_journey",
    name: {
      en: "Fitness Journey",
      vi: "Hanh Trinh The Duc",
      es: "Viaje Fitness",
      pt: "Jornada Fitness",
      ja: "フィットネスジャーニー",
      ko: "피트니스 여정",
    },
    description: {
      en: "From day one at the gym to crushing your goals -- a transformation story.",
      vi: "Tu ngay dau tai phong gym den chinh phuc muc tieu -- cau chuyen thay doi.",
      es: "Desde el primer dia en el gimnasio hasta alcanzar tus metas -- una historia de transformacion.",
      pt: "Do primeiro dia na academia ate esmagar suas metas -- uma historia de transformacao.",
      ja: "ジム初日から目標達成まで -- 変身ストーリー。",
      ko: "헬스장 첫날부터 목표 달성까지 -- 변신 스토리.",
    },
    category: "Sports",
    totalPhotos: 9,
    credits: 5,
    rating: 4.6,
    uses: 3800,
    style: "Dynamic",
    premium: false,
    badge: "NEW",
    chapters: [
      {
        chapterNumber: 1,
        title: {
          en: "Getting Started",
          vi: "Bat Dau",
          es: "Comenzando",
          pt: "Comecando",
          ja: "スタート",
          ko: "시작하기",
        },
        scenes: [
          {
            sceneNumber: 1,
            title: {
              en: "Day one at the gym",
              vi: "Ngay dau tai gym",
              es: "Primer dia en el gym",
              pt: "Primeiro dia na academia",
              ja: "ジム初日",
              ko: "헬스장 첫날",
            },
            caption: {
              en: "Everyone starts somewhere. This is my day one.",
              vi: "Ai cung bat dau tu dau do. Day la ngay dau cua toi.",
              es: "Todos empiezan en algun lugar. Este es mi dia uno.",
              pt: "Todo mundo comeca em algum lugar. Esse e meu dia um.",
              ja: "誰もがどこかで始める。これが私のDay 1。",
              ko: "모두 어딘가에서 시작해. 이것이 나의 첫날.",
            },
            hashtags: ["DayOne", "Fitness", "Motivation"],
            suggestedPostTime: "6:00 AM",
            aiPrompt:
              "Portrait of {subject} standing at the entrance of a modern gym, determined expression, workout clothes, gym equipment in background, morning light through windows",
          },
          {
            sceneNumber: 2,
            title: {
              en: "First workout",
              vi: "Buoi tap dau",
              es: "Primer entrenamiento",
              pt: "Primeiro treino",
              ja: "初トレーニング",
              ko: "첫 운동",
            },
            caption: {
              en: "Muscles I didn't know existed are screaming.",
              vi: "Co bap toi khong biet co dang keu la.",
              es: "Musculos que no sabia que existian estan gritando.",
              pt: "Musculos que eu nem sabia que existiam estao gritando.",
              ja: "知らなかった筋肉が悲鳴を上げてる。",
              ko: "몰랐던 근육이 비명을 지르고 있어.",
            },
            hashtags: ["Workout", "NoPain", "NoGain"],
            suggestedPostTime: "7:00 AM",
            aiPrompt:
              "Portrait of {subject} doing dumbbell curls in the gym, focused determined expression, sweat on forehead, gym mirror reflection, dramatic gym lighting",
          },
          {
            sceneNumber: 3,
            title: {
              en: "Meal prep",
              vi: "Chuan bi bua an",
              es: "Preparacion de comidas",
              pt: "Preparacao de refeicoes",
              ja: "食事準備",
              ko: "식단 준비",
            },
            caption: {
              en: "If it doesn't challenge you, it doesn't change you.",
              vi: "Neu no khong thach thuc ban, no khong thay doi ban.",
              es: "Si no te desafia, no te cambia.",
              pt: "Se nao te desafia, nao te muda.",
              ja: "挑戦しなければ、変われない。",
              ko: "도전하지 않으면 변하지 않아.",
            },
            hashtags: ["MealPrep", "HealthyEating"],
            suggestedPostTime: "12:00 PM",
            aiPrompt:
              "Portrait of {subject} in a clean kitchen preparing healthy meal containers, grilled chicken and vegetables, protein shake, organized meal prep setup, proud expression",
          },
        ],
      },
      {
        chapterNumber: 2,
        title: {
          en: "Building Momentum",
          vi: "Tang Toc",
          es: "Ganando Impulso",
          pt: "Ganhando Impulso",
          ja: "勢いをつける",
          ko: "가속도 붙이기",
        },
        scenes: [
          {
            sceneNumber: 4,
            title: {
              en: "Personal best",
              vi: "Ky luc ca nhan",
              es: "Marca personal",
              pt: "Recorde pessoal",
              ja: "自己ベスト",
              ko: "개인 기록",
            },
            caption: {
              en: "New PR! The grind is paying off.",
              vi: "Ky luc moi! No luc dang duoc den dap.",
              es: "Nuevo record! El esfuerzo esta dando frutos.",
              pt: "Novo recorde! O esforco esta valendo a pena.",
              ja: "新記録!努力が報われてる。",
              ko: "새 기록! 노력이 보상받고 있어.",
            },
            hashtags: ["PersonalBest", "PR", "Strength"],
            suggestedPostTime: "7:00 AM",
            aiPrompt:
              "Portrait of {subject} celebrating after a deadlift PR, chalk on hands, barbell on floor, gym crowd cheering in background, triumphant victorious expression",
          },
          {
            sceneNumber: 5,
            title: {
              en: "Morning run",
              vi: "Chay bo buoi sang",
              es: "Carrera matutina",
              pt: "Corrida matinal",
              ja: "朝ランニング",
              ko: "아침 달리기",
            },
            caption: {
              en: "The city is mine at 5 AM.",
              vi: "Thanh pho la cua toi luc 5 gio sang.",
              es: "La ciudad es mia a las 5 AM.",
              pt: "A cidade e minha as 5 AM.",
              ja: "朝5時、街は私のもの。",
              ko: "새벽 5시, 도시는 나의 것.",
            },
            hashtags: ["MorningRun", "Cardio"],
            suggestedPostTime: "5:30 AM",
            aiPrompt:
              "Portrait of {subject} running through empty city streets at dawn, golden sunrise light, athletic wear, dynamic motion blur, energetic powerful stride",
          },
          {
            sceneNumber: 6,
            title: {
              en: "Progress photo",
              vi: "Anh tien trinh",
              es: "Foto de progreso",
              pt: "Foto de progresso",
              ja: "経過写真",
              ko: "진행 사진",
            },
            caption: {
              en: "30 days in. Starting to see changes.",
              vi: "30 ngay roi. Bat dau thay su thay doi.",
              es: "30 dias. Empezando a ver cambios.",
              pt: "30 dias. Comecando a ver mudancas.",
              ja: "30日目。変化が見え始めた。",
              ko: "30일차. 변화가 보이기 시작해.",
            },
            hashtags: ["Progress", "30Days", "Transformation"],
            suggestedPostTime: "8:00 AM",
            aiPrompt:
              "Portrait of {subject} taking a mirror selfie in gym, athletic physique showing progress, confident proud expression, clean modern gym mirror, good lighting",
          },
        ],
      },
      {
        chapterNumber: 3,
        title: {
          en: "Transformation Complete",
          vi: "Bien Doi Hoan Thanh",
          es: "Transformacion Completa",
          pt: "Transformacao Completa",
          ja: "変身完了",
          ko: "변신 완료",
        },
        scenes: [
          {
            sceneNumber: 7,
            title: {
              en: "Competition day",
              vi: "Ngay thi dau",
              es: "Dia de competencia",
              pt: "Dia de competicao",
              ja: "大会当日",
              ko: "대회 날",
            },
            caption: {
              en: "All that training led to this moment.",
              vi: "Tat ca nhung buoi tap dan den khoanh khac nay.",
              es: "Todo ese entrenamiento llevo a este momento.",
              pt: "Todo aquele treino levou a esse momento.",
              ja: "全てのトレーニングがこの瞬間のために。",
              ko: "모든 훈련이 이 순간을 위해.",
            },
            hashtags: ["Competition", "GameDay"],
            suggestedPostTime: "9:00 AM",
            aiPrompt:
              "Portrait of {subject} backstage at a fitness competition, pumped up physique, competition number pinned, focused intense expression, dramatic stage lighting",
          },
          {
            sceneNumber: 8,
            title: {
              en: "Medal moment",
              vi: "Khoanh khac huy chuong",
              es: "Momento de medalla",
              pt: "Momento da medalha",
              ja: "メダルの瞬間",
              ko: "메달의 순간",
            },
            caption: {
              en: "Hard work beats talent when talent doesn't work hard.",
              vi: "No luc thang tai nang khi tai nang khong no luc.",
              es: "El trabajo duro supera al talento cuando el talento no trabaja duro.",
              pt: "Trabalho duro supera talento quando talento nao trabalha duro.",
              ja: "努力は才能に勝る。才能が努力しなければ。",
              ko: "노력은 재능을 이긴다. 재능이 노력하지 않으면.",
            },
            hashtags: ["Winner", "Medal", "Dedication"],
            suggestedPostTime: "2:00 PM",
            aiPrompt:
              "Portrait of {subject} on a podium holding up a gold medal, triumphant pose, crowd cheering, confetti falling, spotlight, pure joy expression",
          },
          {
            sceneNumber: 9,
            title: {
              en: "New chapter",
              vi: "Chuong moi",
              es: "Nuevo capitulo",
              pt: "Novo capitulo",
              ja: "新しい章",
              ko: "새로운 장",
            },
            caption: {
              en: "This isn't the end. It's just the beginning of a new chapter.",
              vi: "Day khong phai la ket thuc. Day chi la bat dau cua chuong moi.",
              es: "Esto no es el final. Es solo el comienzo de un nuevo capitulo.",
              pt: "Isso nao e o fim. E apenas o comeco de um novo capitulo.",
              ja: "これは終わりじゃない。新しい章の始まりだ。",
              ko: "이건 끝이 아니야. 새로운 장의 시작일 뿐.",
            },
            hashtags: ["NewBeginning", "Fitness", "Journey"],
            suggestedPostTime: "6:00 PM",
            aiPrompt:
              "Portrait of {subject} standing on a mountain peak at sunset, athletic build silhouetted against golden sky, arms raised in victory, epic landscape, inspirational atmosphere",
          },
        ],
      },
    ],
    tags: ["fitness", "gym", "transformation", "sports", "motivation"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs(): { dryRun: boolean; outPath: string | null } {
  const args = process.argv.slice(2);
  let dryRun = false;
  let outPath: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--dry-run") {
      dryRun = true;
    } else if (args[i] === "--out" && args[i + 1]) {
      outPath = args[++i];
    }
  }

  return { dryRun, outPath };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { dryRun, outPath } = parseArgs();
  const jsonData = JSON.stringify(stories, null, 2);

  console.log(`[seed_stories] Generated ${stories.length} FlexTale story packs`);
  stories.forEach((s) => {
    const totalScenes = s.chapters.reduce((acc, ch) => acc + ch.scenes.length, 0);
    console.log(
      `  - ${s.name.en}: ${s.chapters.length} chapters, ${totalScenes} scenes, ${s.credits} credits`
    );
  });

  // Write to local file if --out specified
  if (outPath) {
    const resolvedPath = path.resolve(outPath);
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    fs.writeFileSync(resolvedPath, jsonData, "utf-8");
    console.log(`[seed_stories] Written to ${resolvedPath}`);
  }

  // Print to stdout and exit if --dry-run
  if (dryRun) {
    console.log(jsonData);
    return;
  }

  // Upload to GCS
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "flexmenow.firebasestorage.app",
      });
    }

    const bucket = admin.storage().bucket();
    const filePath = "config/flextale_stories.json";
    const file = bucket.file(filePath);

    await file.save(jsonData, {
      contentType: "application/json",
      metadata: {
        cacheControl: "public, max-age=300",
        metadata: {
          generatedBy: "seed_stories",
          generatedAt: new Date().toISOString(),
          storyCount: String(stories.length),
        },
      },
    });

    console.log(`[seed_stories] Uploaded to gs://${bucket.name}/${filePath}`);
    console.log("[seed_stories] Done.");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[seed_stories] Upload failed: ${message}`);
    console.error(
      "[seed_stories] Ensure GOOGLE_APPLICATION_CREDENTIALS is set or Firebase default credentials are available."
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[seed_stories] Fatal error:", err);
  process.exit(1);
});
