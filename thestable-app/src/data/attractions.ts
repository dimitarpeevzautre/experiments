import type { Attraction } from '@/core/attractions';

/**
 * Seed catalogue of Bulgarian attractions for drive-mode narration and the
 * explore tab. Coordinates are approximate points of interest, not parking
 * spots. In production this moves to a CMS/API with professionally recorded
 * audio; the `narration` field is the TTS fallback script.
 */
export const ATTRACTIONS: Attraction[] = [
  {
    id: 'rila-monastery',
    name: 'Rila Monastery',
    nameBg: 'Рилски манастир',
    category: 'monastery',
    region: 'Rila Mountains',
    coords: { latitude: 42.1335, longitude: 23.3403 },
    blurb: "Bulgaria's most famous monastery, a UNESCO site deep in the Rila Mountains.",
    narration:
      'Founded in the tenth century by followers of the hermit Saint Ivan of Rila, the monastery grew into the spiritual heart of Bulgaria. The candy-striped arches and vivid frescoes you see today date from the National Revival of the eighteen hundreds, after a great fire. Look for the Hrelyo Tower, the only building that survived from the medieval complex. The monastery is a UNESCO World Heritage Site and still home to monks today.',
    visitMinutes: 120,
    camperNotes:
      'Large paid parking below the monastery fits campers. Overnighting is possible at nearby Zodiac campsite in the valley.',
  },
  {
    id: 'boyana-church',
    name: 'Boyana Church',
    nameBg: 'Боянска църква',
    category: 'monastery',
    region: 'Sofia',
    coords: { latitude: 42.6446, longitude: 23.2665 },
    blurb: 'A tiny medieval church with frescoes 200 years ahead of the Renaissance.',
    narration:
      'The Boyana Church at the foot of Vitosha mountain hides some of the most remarkable medieval art in Europe. Its frescoes, painted in twelve fifty nine, show lifelike human faces and emotion almost two centuries before the Italian Renaissance. The portraits of the local ruler Kaloyan and his wife Desislava are considered among the oldest realistic portraits in European art. Visits run in small timed groups, so book ahead in summer.',
    visitMinutes: 60,
  },
  {
    id: 'alexander-nevsky',
    name: 'Alexander Nevsky Cathedral',
    nameBg: 'Храм-паметник „Св. Александър Невски“',
    category: 'monument',
    region: 'Sofia',
    coords: { latitude: 42.6957, longitude: 23.3327 },
    blurb: "Sofia's gold-domed landmark and one of the largest Orthodox cathedrals.",
    narration:
      'The Alexander Nevsky Cathedral crowns the centre of Sofia with gold-plated domes you can spot from the mountain. It was built in the early twentieth century to honour the Russian soldiers who died in the war that liberated Bulgaria from Ottoman rule. Inside there is space for ten thousand people, Italian marble, and alabaster from Brazil. The crypt holds one of the finest icon collections in the Orthodox world.',
    visitMinutes: 45,
    camperNotes: 'Central Sofia is tight for campers — park at a guarded lot on the ring and use the metro.',
  },
  {
    id: 'plovdiv-old-town',
    name: 'Plovdiv Old Town & Ancient Theatre',
    nameBg: 'Стар Пловдив и Античният театър',
    category: 'old-town',
    region: 'Plovdiv',
    coords: { latitude: 42.1471, longitude: 24.7513 },
    blurb: 'Cobbled Revival-era streets above a working Roman theatre.',
    narration:
      'Plovdiv claims to be one of the oldest continuously inhabited cities in Europe, older than Rome or Athens. Its old town spills over three hills, lined with brightly painted merchant houses from the Bulgarian Revival. At its heart sits a Roman theatre from the first century, rediscovered by a landslide in the nineteen seventies and still hosting concerts under the stars. Wander down to the Kapana quarter afterwards for galleries and cafés.',
    visitMinutes: 180,
    camperNotes: 'Use the paid lots by the rowing canal or Maritsa river bank; the old town itself is pedestrian.',
  },
  {
    id: 'bachkovo-monastery',
    name: 'Bachkovo Monastery',
    nameBg: 'Бачковски манастир',
    category: 'monastery',
    region: 'Rhodope Mountains',
    coords: { latitude: 41.9436, longitude: 24.8494 },
    blurb: "Bulgaria's second-largest monastery, guarding the Rhodope gorge since 1083.",
    narration:
      'Bachkovo Monastery was founded in ten eighty three by two Georgian brothers serving the Byzantine empire. Tucked into the gorge of the Chepelare river, it is the second largest monastery in Bulgaria and a working one — you may hear the monks chanting at vespers. Its miraculous icon of the Virgin Mary draws pilgrims year round, and the ossuary preserves rare eleventh century frescoes.',
    visitMinutes: 90,
  },
  {
    id: 'buzludzha',
    name: 'Buzludzha Monument',
    nameBg: 'Паметник Бузлуджа',
    category: 'monument',
    region: 'Central Balkan',
    coords: { latitude: 42.7358, longitude: 25.3934 },
    blurb: 'The abandoned flying-saucer monument on a Balkan peak.',
    narration:
      'On the crest of the Balkan range sits what looks like a crash-landed flying saucer. Buzludzha was opened in nineteen eighty one as the ceremonial house of the Bulgarian Communist Party, its hall lined with mosaics of Marx, Engels and Lenin. Abandoned after nineteen eighty nine, it became one of the most photographed ruins in Europe. Entry inside is not permitted, but the walk to the plateau and the views over the Valley of Roses are worth the detour alone.',
    visitMinutes: 60,
    camperNotes: 'Steep, exposed access road — use low gear down and expect wind on the plateau.',
  },
  {
    id: 'shipka-church',
    name: 'Shipka Memorial Church',
    nameBg: 'Храм-паметник „Рождество Христово“, Шипка',
    category: 'monument',
    region: 'Valley of Roses',
    coords: { latitude: 42.7196, longitude: 25.3213 },
    blurb: 'Golden onion domes commemorating the battles for Shipka Pass.',
    narration:
      'The gilded domes of the Shipka Memorial Church rise above the rose fields at the foot of the mountain pass of the same name. It was built in Russian style at the turn of the twentieth century to honour the Russian and Bulgarian soldiers who held Shipka Pass in the war of liberation. The bells were cast from the cartridges collected on the battlefield. Combine it with the Freedom Monument on the pass above for the full story.',
    visitMinutes: 45,
  },
  {
    id: 'tsarevets',
    name: 'Tsarevets Fortress, Veliko Tarnovo',
    nameBg: 'Царевец, Велико Търново',
    category: 'fortress',
    region: 'Veliko Tarnovo',
    coords: { latitude: 43.0836, longitude: 25.6522 },
    blurb: 'The hilltop citadel of the medieval Bulgarian tsars.',
    narration:
      'Veliko Tarnovo was the capital of the Second Bulgarian Empire, and Tsarevets hill was its citadel. Behind these restored walls stood the palaces of the tsars and the patriarch, whose church still crowns the summit. Legend says traitors were pushed from Execution Rock into the river Yantra below. If you stay into the evening, the fortress hosts a spectacular sound-and-light show over the old town.',
    visitMinutes: 120,
    camperNotes: 'Camping Veliko Tarnovo in nearby Dragizhevo is a well-reviewed camper base for the city.',
  },
  {
    id: 'madara-rider',
    name: 'Madara Rider',
    nameBg: 'Мадарски конник',
    category: 'monument',
    region: 'Shumen',
    coords: { latitude: 43.2767, longitude: 27.1188 },
    blurb: 'A 1,300-year-old horseman carved into a sheer cliff — UNESCO listed.',
    narration:
      'High on a cliff face near Shumen, a horseman spears a lion while his dog runs behind — a relief carved around the year seven hundred ten, at the dawn of the Bulgarian state. The Madara Rider is the only rock relief of its kind in Europe and a UNESCO World Heritage Site. Bulgarians voted it the symbol to appear on their euro and older stotinki coins. Climb the steps above for the cliff-top fortress and caves.',
    visitMinutes: 75,
  },
  {
    id: 'belogradchik-rocks',
    name: 'Belogradchik Rocks & Fortress',
    nameBg: 'Белоградчишки скали и крепост Калето',
    category: 'nature',
    region: 'Northwest Bulgaria',
    coords: { latitude: 43.6262, longitude: 22.6798 },
    blurb: 'Red sandstone towers woven into a Roman-to-Ottoman fortress.',
    narration:
      'Two hundred million years of wind and rain sculpted the Belogradchik Rocks into red towers with names like the Schoolgirl, the Bear and the Horseman. Romans, Byzantines, Bulgarians and Ottomans in turn wove the Kaleto fortress directly into the rocks, needing walls on only one side. The view from the top gun platform stretches across the whole northwest. Sunset light turns the sandstone deep crimson — photographers, plan accordingly.',
    visitMinutes: 120,
  },
  {
    id: 'seven-rila-lakes',
    name: 'Seven Rila Lakes',
    nameBg: 'Седемте рилски езера',
    category: 'nature',
    region: 'Rila Mountains',
    coords: { latitude: 42.2033, longitude: 23.3213 },
    blurb: 'A staircase of seven glacial lakes above 2,100 metres.',
    narration:
      'The Seven Rila Lakes are a staircase of glacial cirques with names like the Tear, the Eye and the Kidney, each mirroring the peaks above. A chairlift from the Pionerska hut takes you most of the way; from there a circuit of three to five hours links all seven. Start early — afternoon storms build fast in Rila. Even in August, keep a fleece in your pack.',
    visitMinutes: 300,
    camperNotes: 'Park campers at the Pionerska lift base lot near Panichishte; the mountain road is paved but narrow.',
  },
  {
    id: 'nesebar',
    name: 'Nesebar Old Town',
    nameBg: 'Стар Несебър',
    category: 'coast',
    region: 'Black Sea',
    coords: { latitude: 42.659, longitude: 27.735 },
    blurb: 'A UNESCO peninsula town of Byzantine churches and wooden houses.',
    narration:
      'Nesebar sits on a rocky peninsula tied to the mainland by a narrow causeway, three thousand years of history stacked on a few hundred metres. Thracians, Greeks, Romans and Byzantines all left their mark, and in the Middle Ages it held more churches per head than anywhere in the empire — a dozen still stand in various states of lace-like brick ruin. The wooden fishermen houses above stone ground floors are classic Black Sea Revival style.',
    visitMinutes: 150,
    camperNotes: 'Do not drive onto the peninsula — use the big lots before the causeway.',
  },
  {
    id: 'sozopol',
    name: 'Sozopol Old Town',
    nameBg: 'Стар Созопол',
    category: 'coast',
    region: 'Black Sea',
    coords: { latitude: 42.418, longitude: 27.698 },
    blurb: 'Ancient Apollonia — cobbled lanes, fig trees and fishing boats.',
    narration:
      'Sozopol began as Apollonia, a Greek colony founded twenty six centuries ago, and it has never stopped being a port. The old town clings to a peninsula of cobbled lanes shaded by fig trees, with weathered wooden houses leaning over the street. Painters and poets adopted it long ago, and the Apollonia arts festival takes over every September. Try the fish restaurants above the southern harbour at sunset.',
    visitMinutes: 150,
    camperNotes: 'Several campsites south towards Kavatsite and Smokinya beach take motorhomes.',
  },
  {
    id: 'krushuna-falls',
    name: 'Krushuna Waterfalls',
    nameBg: 'Крушунски водопади',
    category: 'nature',
    region: 'Lovech',
    coords: { latitude: 43.2452, longitude: 24.966 },
    blurb: 'Turquoise travertine cascades in a green karst gorge.',
    narration:
      'The Krushuna Waterfalls tumble down terraces of golden travertine, the water tinted turquoise by dissolved limestone. A looping wooden path climbs past pool after pool to the spring in a cave at the top — bring shoes with grip, the mist keeps everything slick. Locals swear the mineral water has healing powers. Pair it with Devetashka Cave, fifteen minutes away, for a perfect half day.',
    visitMinutes: 90,
  },
  {
    id: 'devetashka-cave',
    name: 'Devetashka Cave',
    nameBg: 'Деветашка пещера',
    category: 'cave',
    region: 'Lovech',
    coords: { latitude: 43.2334, longitude: 24.8858 },
    blurb: 'A colossal cave mouth with skylights, herons and 30,000 bats.',
    narration:
      'Devetashka is less a cave than a cathedral — an entrance sixty metres high opening into a hall pierced by two huge skylights, with the river Osam flowing through the middle. People have sheltered here since the Stone Age, and the communist state once used it as a secret fuel depot. Today it belongs to some thirty thousand bats, which is why parts close in winter while they hibernate. Scenes from The Expendables 2 were filmed under these vaults.',
    visitMinutes: 60,
  },
  {
    id: 'prohodna-cave',
    name: 'Prohodna Cave — Eyes of God',
    nameBg: 'Проходна — Очите на Бога',
    category: 'cave',
    region: 'Lovech',
    coords: { latitude: 43.1785, longitude: 24.0692 },
    blurb: 'Twin skylights stare down like giant eyes from the cave roof.',
    narration:
      'Prohodna is a natural rock tunnel almost three hundred metres long, and in its ceiling two perfectly matched openings gaze down — locals call them the Eyes of God. When it rains, the eyes appear to weep. The flat floor and easy walk-through make it one of the most accessible caves in Bulgaria, and at dusk climbers dangle from the arches. It is free and unlit, so bring a torch if you come late.',
    visitMinutes: 45,
  },
  {
    id: 'kaliakra',
    name: 'Cape Kaliakra',
    nameBg: 'Нос Калиакра',
    category: 'coast',
    region: 'Northern Black Sea',
    coords: { latitude: 43.361, longitude: 28.4664 },
    blurb: 'Red cliffs plunging 70 metres into a dolphin-rich sea.',
    narration:
      'Cape Kaliakra thrusts two kilometres into the Black Sea on cliffs of rust-red limestone seventy metres high. Its name means beautiful headland, and fortresses stood here from the Thracians to the Ottomans. Legend tells of forty maidens who tied their braids together and leapt into the sea rather than surrender. Watch the water below the point — dolphins pass close in, and cormorants nest on the ledges.',
    visitMinutes: 75,
  },
  {
    id: 'melnik',
    name: 'Melnik & the Sand Pyramids',
    nameBg: 'Мелник и Мелнишките пирамиди',
    category: 'old-town',
    region: 'Pirin',
    coords: { latitude: 41.5244, longitude: 23.396 },
    blurb: "Bulgaria's smallest town, famous for wine cellars under sandstone pyramids.",
    narration:
      'Melnik is officially the smallest town in Bulgaria, a couple of hundred residents among towering sandstone pyramids at the foot of Pirin. It grew rich on wine — Winston Churchill is said to have ordered barrels of Melnik red every year. Revival-era houses hide cellars dug straight into the sand rock, where the broad-leaved Melnik grape matures. Walk up to the Kordopulov House, the grandest wine merchant home on the Balkans.',
    visitMinutes: 150,
  },
  {
    id: 'koprivshtitsa',
    name: 'Koprivshtitsa',
    nameBg: 'Копривщица',
    category: 'old-town',
    region: 'Sredna Gora',
    coords: { latitude: 42.6376, longitude: 24.3597 },
    blurb: 'A museum town of painted Revival houses and April Uprising history.',
    narration:
      'Koprivshtitsa looks like a Bulgarian Revival painting come to life: bridges over a mountain stream, stone walls, and houses in deep blues, reds and ochres. Here the April Uprising against Ottoman rule broke out in eighteen seventy six, announced by the famous bloody letter. Six of the finest houses are museums, kept as their merchant and poet owners left them. Come for the folklore festival if your trip lines up — it happens every five years on the meadows above town.',
    visitMinutes: 180,
  },
  {
    id: 'asenova-fortress',
    name: "Asen's Fortress",
    nameBg: 'Асенова крепост',
    category: 'fortress',
    region: 'Rhodope Mountains',
    coords: { latitude: 41.9878, longitude: 24.8728 },
    blurb: 'A cliff-perched chapel and fortress guarding the Rhodope road.',
    narration:
      "Asen's Fortress guards the gorge road into the Rhodopes from a knife-edge ridge above Asenovgrad. Thracians fortified the rock first, but the walls you see are medieval, renewed by Tsar Ivan Asen the Second in the thirteenth century. The two-storey Church of the Holy Mother of God still stands complete on the cliff edge, its frescoes faded by seven centuries of mountain light. The climb is short but steep — sturdy shoes help.",
    visitMinutes: 60,
  },
];

export function getAttraction(id: string): Attraction | undefined {
  return ATTRACTIONS.find((a) => a.id === id);
}
