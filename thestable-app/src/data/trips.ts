import type { TripPlan } from '@/core/trips';

/**
 * Curated multi-day camper itineraries. Attraction stops link into the
 * narration catalogue via `attractionId`. Restaurant/campsite names are demo
 * content mixing well-known places with placeholders — verify before shipping,
 * and move to a CMS alongside the attractions.
 *
 * Wild-camping stops are spots campers commonly use; the app shows a legal
 * note wherever they appear (tolerated ≠ allowed everywhere; never in
 * national-park core zones or reserves).
 */
export const TRIPS: TripPlan[] = [
  {
    id: 'rila-pirin',
    title: 'Monasteries & Mountains',
    tagline: 'Rila and Pirin in four days: the great monastery, glacial lakes, wine and hot springs.',
    icon: '⛰️',
    regions: ['Rila', 'Pirin', 'Struma valley'],
    days: [
      {
        day: 1,
        title: 'Sofia → Rila Monastery',
        driveKm: 130,
        stops: [
          {
            id: 'rp-boyana',
            type: 'attraction',
            name: 'Boyana Church',
            attractionId: 'boyana-church',
            coords: { latitude: 42.6446, longitude: 23.2665 },
            description: 'Start small: 30 minutes with frescoes two centuries ahead of the Renaissance.',
          },
          {
            id: 'rp-rila-monastery',
            type: 'attraction',
            name: 'Rila Monastery',
            attractionId: 'rila-monastery',
            coords: { latitude: 42.1335, longitude: 23.3403 },
            description: 'The main event of day one — aim to arrive after 15:00 when the tour buses leave.',
          },
          {
            id: 'rp-drushlyavitsa',
            type: 'restaurant',
            name: 'Mehana Drushlyavitsa',
            coords: { latitude: 42.1343, longitude: 23.3435 },
            description: 'Fresh trout and bean soup by the river, two minutes from the monastery gate.',
          },
          {
            id: 'rp-camp-bor',
            type: 'campsite',
            name: 'Camping Bor, Sapareva Banya',
            coords: { latitude: 42.2874, longitude: 23.2645 },
            description: 'Pine-shaded pitches with hookup, under the hottest geyser in the Balkans.',
            camperNotes: '230V hookup, showers, 20 min from tomorrow’s lift.',
            overnight: true,
          },
        ],
      },
      {
        day: 2,
        title: 'Seven Rila Lakes → Predela',
        driveKm: 110,
        stops: [
          {
            id: 'rp-seven-lakes',
            type: 'attraction',
            name: 'Seven Rila Lakes',
            attractionId: 'seven-rila-lakes',
            coords: { latitude: 42.2033, longitude: 23.3213 },
            description: 'First lift up, 3–5 h circuit. Start before 9:00 — afternoon storms are a Rila tradition.',
          },
          {
            id: 'rp-predela',
            type: 'wild-camping',
            name: 'Predela pass meadows',
            coords: { latitude: 41.8783, longitude: 23.3396 },
            description: 'Level meadows on the saddle between Rila and Pirin, a classic camper overnight.',
            camperNotes: 'No facilities. Grill shacks nearby in season. Pack out everything.',
            overnight: true,
          },
        ],
      },
      {
        day: 3,
        title: 'Melnik wine country',
        driveKm: 95,
        stops: [
          {
            id: 'rp-melnik',
            type: 'attraction',
            name: 'Melnik & the Sand Pyramids',
            attractionId: 'melnik',
            coords: { latitude: 41.5244, longitude: 23.396 },
            description: 'Bulgaria’s smallest town. Walk up to the Kordopulov House and its wine cellar.',
          },
          {
            id: 'rp-mencheva',
            type: 'restaurant',
            name: 'Mencheva Kashta, Melnik',
            coords: { latitude: 41.5241, longitude: 23.3955 },
            description: 'Clay-pot classics and the local broad-leaf Melnik red on a vine-covered terrace.',
          },
          {
            id: 'rp-rupite',
            type: 'wild-camping',
            name: 'Rupite thermal springs',
            coords: { latitude: 41.4675, longitude: 23.2565 },
            description: 'Steaming mineral pools in a volcanic crater — campers line up along the poplars.',
            camperNotes: 'Free hot pools; busy at weekends. Respect the church area quiet hours.',
            overnight: true,
          },
        ],
      },
      {
        day: 4,
        title: 'Struma valley → Sofia',
        driveKm: 165,
        stops: [
          {
            id: 'rp-kresna',
            type: 'scenic',
            name: 'Kresna Gorge viewpoint',
            coords: { latitude: 41.7758, longitude: 23.155 },
            description: 'The Struma squeezes between Pirin and Maleshevo — stretch your legs above the rapids.',
          },
          {
            id: 'rp-hadjidraganov',
            type: 'restaurant',
            name: 'Hadjidraganov’s Houses, Sofia',
            coords: { latitude: 42.7016, longitude: 23.3252 },
            description: 'Folk-house feast to close the loop — book a table for the live music evenings.',
          },
        ],
      },
    ],
  },
  {
    id: 'balkan-heartland',
    title: 'Balkan Heartland',
    tagline: 'Five days through Revival towns, Roman Plovdiv, Buzludzha and the old capital.',
    icon: '🏛️',
    regions: ['Sredna Gora', 'Thracian plain', 'Central Balkan', 'Veliko Tarnovo'],
    days: [
      {
        day: 1,
        title: 'Sofia → Koprivshtitsa',
        driveKm: 110,
        stops: [
          {
            id: 'bh-koprivshtitsa',
            type: 'attraction',
            name: 'Koprivshtitsa',
            attractionId: 'koprivshtitsa',
            coords: { latitude: 42.6376, longitude: 24.3597 },
            description: 'Painted Revival houses and April Uprising history — do three house-museums, not six.',
          },
          {
            id: 'bh-dyado-liben',
            type: 'restaurant',
            name: 'Dyado Liben Inn',
            coords: { latitude: 42.6389, longitude: 24.3581 },
            description: '1852 merchant house across the bridge; get the kavarma and the courtyard table.',
          },
          {
            id: 'bh-dushantsi',
            type: 'wild-camping',
            name: 'Dushantsi dam shore',
            coords: { latitude: 42.6552, longitude: 24.2705 },
            description: 'Grassy lakeshore 15 minutes from town, sunrise over the water included.',
            camperNotes: 'Firm ground along the north shore. No services.',
            overnight: true,
          },
        ],
      },
      {
        day: 2,
        title: 'Into Plovdiv',
        driveKm: 90,
        stops: [
          {
            id: 'bh-plovdiv',
            type: 'attraction',
            name: 'Plovdiv Old Town & Ancient Theatre',
            attractionId: 'plovdiv-old-town',
            coords: { latitude: 42.1471, longitude: 24.7513 },
            description: 'Three hills, one Roman theatre, endless galleries. Finish in the Kapana quarter.',
          },
          {
            id: 'bh-pavaj',
            type: 'restaurant',
            name: 'Pavaj, Kapana',
            coords: { latitude: 42.1499, longitude: 24.7508 },
            description: 'The Kapana institution — modern takes on grandma’s recipes; expect a short queue.',
          },
          {
            id: 'bh-rowing-canal',
            type: 'campsite',
            name: 'Rowing canal camper stop',
            coords: { latitude: 42.1418, longitude: 24.7133 },
            description: 'Flat, quiet motorhome parking by Plovdiv’s regatta course, a bike ride from the centre.',
            camperNotes: 'Popular unofficial overnight spot; no hookup — arrive with charged batteries.',
            overnight: true,
          },
        ],
      },
      {
        day: 3,
        title: 'Rhodope gates → Valley of Roses',
        driveKm: 150,
        stops: [
          {
            id: 'bh-asen',
            type: 'attraction',
            name: "Asen's Fortress",
            attractionId: 'asenova-fortress',
            coords: { latitude: 41.9878, longitude: 24.8728 },
            description: 'Short sharp climb to the cliff chapel guarding the Rhodope road.',
          },
          {
            id: 'bh-bachkovo',
            type: 'attraction',
            name: 'Bachkovo Monastery',
            attractionId: 'bachkovo-monastery',
            coords: { latitude: 41.9436, longitude: 24.8494 },
            description: 'Second-largest monastery in the country; catch the ossuary frescoes.',
          },
          {
            id: 'bh-vodopada',
            type: 'restaurant',
            name: 'Vodopada, Bachkovo',
            coords: { latitude: 41.9421, longitude: 24.8503 },
            description: 'Trout under the waterfall wheel on the way out of the monastery lane.',
          },
          {
            id: 'bh-koprinka',
            type: 'wild-camping',
            name: 'Koprinka dam shore',
            coords: { latitude: 42.6249, longitude: 25.3183 },
            description: 'Broad reservoir beaches under the Balkan ridge — tomorrow’s climbs in view.',
            camperNotes: 'South shore tracks are fine for 2WD in dry weather.',
            overnight: true,
          },
        ],
      },
      {
        day: 4,
        title: 'Shipka, Buzludzha → the old capital',
        driveKm: 130,
        stops: [
          {
            id: 'bh-shipka',
            type: 'attraction',
            name: 'Shipka Memorial Church',
            attractionId: 'shipka-church',
            coords: { latitude: 42.7196, longitude: 25.3213 },
            description: 'Gold domes over the rose valley, bells cast from battlefield cartridges.',
          },
          {
            id: 'bh-buzludzha',
            type: 'attraction',
            name: 'Buzludzha Monument',
            attractionId: 'buzludzha',
            coords: { latitude: 42.7358, longitude: 25.3934 },
            description: 'The concrete saucer on the ridge. Windy 20-minute walk from the parking plateau.',
          },
          {
            id: 'bh-shtastliveca',
            type: 'restaurant',
            name: 'Shtastliveca, Veliko Tarnovo',
            coords: { latitude: 43.0827, longitude: 25.6324 },
            description: 'Dinner on the Yantra bend with Tsarevets floodlit across the gorge.',
          },
          {
            id: 'bh-camping-vt',
            type: 'campsite',
            name: 'Camping Veliko Tarnovo, Dragizhevo',
            coords: { latitude: 43.0553, longitude: 25.7178 },
            description: 'Well-run terraced site 15 minutes from the old town; the pool earns its keep in July.',
            camperNotes: 'Hookup, laundry, grey/black water service point.',
            overnight: true,
          },
        ],
      },
      {
        day: 5,
        title: 'Tsarevets & the karst road home',
        driveKm: 240,
        stops: [
          {
            id: 'bh-tsarevets',
            type: 'attraction',
            name: 'Tsarevets Fortress',
            attractionId: 'tsarevets',
            coords: { latitude: 43.0836, longitude: 25.6522 },
            description: 'Walk the citadel of the tsars before the heat; gates open at 8:00.',
          },
          {
            id: 'bh-devetashka',
            type: 'attraction',
            name: 'Devetashka Cave',
            attractionId: 'devetashka-cave',
            coords: { latitude: 43.2334, longitude: 24.8858 },
            description: 'A cathedral of a cave with skylights — 30 minutes off the homeward road.',
          },
          {
            id: 'bh-prohodna',
            type: 'attraction',
            name: 'Prohodna — Eyes of God',
            attractionId: 'prohodna-cave',
            coords: { latitude: 43.1785, longitude: 24.0692 },
            description: 'Last stop: stand under the Eyes at golden hour, then cruise back to Sofia.',
          },
        ],
      },
    ],
  },
  {
    id: 'black-sea-south',
    title: 'Southern Black Sea',
    tagline: 'Four days of old-town peninsulas, wild beaches and fish straight off the boat.',
    icon: '🌊',
    regions: ['Burgas coast', 'Strandzha'],
    days: [
      {
        day: 1,
        title: 'Sofia → Nesebar → Irakli',
        driveKm: 420,
        stops: [
          {
            id: 'bs-nesebar',
            type: 'attraction',
            name: 'Nesebar Old Town',
            attractionId: 'nesebar',
            coords: { latitude: 42.659, longitude: 27.735 },
            description: 'Byzantine churches and wooden houses on the peninsula — park before the causeway.',
          },
          {
            id: 'bs-irakli',
            type: 'wild-camping',
            name: 'Irakli beach',
            coords: { latitude: 42.7482, longitude: 27.8887 },
            description: 'The coast’s iconic wild beach, dunes and river mouth kept blissfully unbuilt.',
            camperNotes: 'Park on the firm ground behind the treeline, not the dunes. No services.',
            overnight: true,
          },
        ],
      },
      {
        day: 2,
        title: 'Sozopol day',
        driveKm: 90,
        stops: [
          {
            id: 'bs-sozopol',
            type: 'attraction',
            name: 'Sozopol Old Town',
            attractionId: 'sozopol',
            coords: { latitude: 42.418, longitude: 27.698 },
            description: 'Ancient Apollonia: fig-shaded lanes, artists’ houses, harbour sunsets.',
          },
          {
            id: 'bs-fish',
            type: 'restaurant',
            name: 'Old harbour fish tavern',
            coords: { latitude: 42.4189, longitude: 27.6947 },
            description: 'Grilled bluefish and mussels above the southern harbour — go where the boats are.',
          },
          {
            id: 'bs-gradina',
            type: 'campsite',
            name: 'Camping Gradina',
            coords: { latitude: 42.4321, longitude: 27.6663 },
            description: 'Legendary beach campsite on Gradina bay; morning swims from your doorstep.',
            camperNotes: 'Hookup and service point; book ahead in August.',
            overnight: true,
          },
        ],
      },
      {
        day: 3,
        title: 'Ropotamo & Strandzha edge',
        driveKm: 70,
        stops: [
          {
            id: 'bs-begliktash',
            type: 'attraction',
            name: 'Begliktash Thracian sanctuary',
            coords: { latitude: 42.2789, longitude: 27.7397 },
            description: 'Megalithic sun sanctuary on a headland of ancient junipers above Primorsko.',
          },
          {
            id: 'bs-ropotamo',
            type: 'scenic',
            name: 'Ropotamo river mouth',
            coords: { latitude: 42.3229, longitude: 27.7519 },
            description: 'Boat trip through the liana forest — the closest Bulgaria gets to a jungle.',
          },
          {
            id: 'bs-veleka',
            type: 'wild-camping',
            name: 'Veleka beach, Sinemorets',
            coords: { latitude: 42.0655, longitude: 27.9797 },
            description: 'The river meets the sea under white cliffs; the far end of the Bulgarian coast.',
            camperNotes: 'Overnight on the gravel lot above the beach; river bank floods after rain.',
            overnight: true,
          },
        ],
      },
      {
        day: 4,
        title: 'Strandzha villages → home',
        driveKm: 440,
        stops: [
          {
            id: 'bs-brashlyan',
            type: 'scenic',
            name: 'Brashlyan village',
            coords: { latitude: 42.0511, longitude: 27.4367 },
            description: 'Oak-timbered Strandzha village lost in the border forest; coffee on the square.',
          },
          {
            id: 'bs-lunch-yambol',
            type: 'restaurant',
            name: 'Roadside grill, Yambol bypass',
            coords: { latitude: 42.4841, longitude: 26.5036 },
            description: 'Honest kebapche-and-salad stop to break the long haul back to Sofia.',
          },
        ],
      },
    ],
  },
];

export function getTrip(id: string): TripPlan | undefined {
  return TRIPS.find((t) => t.id === id);
}
