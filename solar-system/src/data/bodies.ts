/**
 * Every body in the scene, in one typed file.
 *
 * Numbers: mean diameters, semi-major axes and sidereal periods from NASA's
 * planetary and satellite fact sheets (nssdc.gsfc.nasa.gov/planetary/factsheet,
 * ssd.jpl.nasa.gov/sats/elem & /phys_par), rounded. Facts were written for a
 * general audience and checked against NASA Science pages; claims that are
 * estimates, contested, or likely to change are marked `UNCERTAIN:` in a comment.
 *
 * keyStats is derived from the numbers below (see buildKeyStats) so figures are
 * never typed twice.
 */

export type BodyType = "star" | "planet" | "dwarf-planet" | "moon";

/** How the procedural texture is painted when no texture map is supplied. */
export type SurfaceStyle = "star" | "rocky" | "earth" | "banded" | "icy" | "hazy";

export interface KeyStat {
  label: string;
  value: string;
}

export interface BodyEntry {
  id: string;
  name: string;
  type: BodyType;
  /** Moons point to their planet; planets and dwarf planets orbit the Sun (omitted). */
  parentId?: string;
  diameterKm: number;
  /** AU for planets and dwarf planets, km for moons. 0 for the Sun. */
  orbitRadiusReal: number;
  orbitalPeriodDays: number;
  /** Orbits backwards relative to its parent's spin (Triton). */
  retrograde?: boolean;
  axialTiltDeg?: number;
  /**
   * Sidereal rotation, in hours. Negative means it spins backwards (Venus,
   * Uranus, Pluto). Omitted for moons that are tidally locked.
   */
  rotationPeriodHours?: number;
  /** Orbit tilt, degrees: to the ecliptic for planets, to the parent's equator for moons. */
  inclinationDeg?: number;
  /** Moon orbits the parent near the ecliptic rather than its equator (Earth's Moon). */
  eclipticOrbit?: boolean;
  /** Fallback material colour. */
  color: string;
  /** Colours for the procedural texture. */
  palette: string[];
  surface: SurfaceStyle;
  hasRings?: boolean;
  /** One-line "notable feature" for the stats strip. */
  notable: string;
  /** 3-5 short, interesting facts. */
  facts: string[];
  /** Exactly 3 question chips. */
  suggestedQuestions: string[];
  /** One paragraph of context passed to the chat system prompt. */
  blurb: string;
}

export interface Body extends BodyEntry {
  keyStats: KeyStat[];
}

const ENTRIES: BodyEntry[] = [
  // -------------------------------------------------------------------------
  // Star
  // -------------------------------------------------------------------------
  {
    id: "sun",
    name: "Sun",
    type: "star",
    diameterKm: 1_391_400,
    orbitRadiusReal: 0,
    orbitalPeriodDays: 0,
    // Equatorial rotation; the poles take ~35 days.
    rotationPeriodHours: 609.1,
    axialTiltDeg: 7.25,
    color: "#ffcc55",
    palette: ["#fff4c2", "#ffd66b", "#ff9a2e"],
    surface: "star",
    notable: "Holds about 99.8% of the Solar System's mass",
    facts: [
      "The Sun contains about 99.8% of all the mass in the Solar System.",
      "Sunlight leaving the Sun's surface takes about 8 minutes 20 seconds to reach Earth.",
      // UNCERTAIN: published estimates for the photon random walk range from ~10,000 to ~170,000 years.
      "Energy made in the core can take tens of thousands of years to work its way out to the surface.",
      "About 1.3 million Earths would fit inside it.",
      "It spins faster at its equator (about 25 days) than near its poles (about 35 days), because it is a ball of gas, not a solid.",
    ],
    suggestedQuestions: [
      "How does the Sun make its energy?",
      "What will happen when the Sun dies?",
      "What are sunspots and solar flares?",
    ],
    blurb:
      "The Sun is a G-type main-sequence star (often called a yellow dwarf) about 4.6 billion years old, at the centre of the Solar System. In its core, at around 15 million °C, it fuses hydrogen into helium, turning about 4 million tonnes of matter into energy every second. Its visible surface (the photosphere) is about 5,500 °C, while its thin outer atmosphere, the corona, is over a million degrees, a long-standing puzzle. It drives the solar wind, space weather and auroras. In roughly 5 billion years it will swell into a red giant and eventually leave behind a white dwarf. It orbits the centre of the Milky Way about 26,000 light-years away, taking roughly 230 million years per lap.",
  },

  // -------------------------------------------------------------------------
  // Planets
  // -------------------------------------------------------------------------
  {
    id: "mercury",
    name: "Mercury",
    type: "planet",
    diameterKm: 4879,
    orbitRadiusReal: 0.387,
    orbitalPeriodDays: 88.0,
    rotationPeriodHours: 1407.6,
    axialTiltDeg: 0.03,
    inclinationDeg: 7.0,
    color: "#9c9591",
    palette: ["#8a8480", "#b3aca6", "#6f6a66"],
    surface: "rocky",
    notable: "Temperatures swing by about 600 °C between day and night",
    facts: [
      "Mercury is the smallest planet, only a little larger than Earth's Moon.",
      "From one sunrise to the next takes about 176 Earth days on Mercury: two of its years.",
      "Its surface ranges from about 430 °C in the day to about −180 °C at night.",
      "Despite being closest to the Sun, it has water ice hiding in permanently shadowed craters near its poles.",
      "Averaged over time, Mercury is the closest planet to Earth, and to every other planet too.",
    ],
    suggestedQuestions: [
      "Why is Mercury both so hot and so cold?",
      "How can there be ice on Mercury?",
      "Could we ever land on Mercury?",
    ],
    blurb:
      "Mercury is the innermost and smallest planet. It has almost no atmosphere (only a thin exosphere), so it cannot hold heat: days are scorching and nights are frigid. It is heavily cratered, like the Moon, and has a very large iron core that makes up much of its volume, plus a weak magnetic field. It is locked in a 3:2 spin-orbit resonance, rotating three times for every two orbits. NASA's MESSENGER orbited it from 2011 to 2015, and the ESA/JAXA BepiColombo mission is on its way to orbit it.",
  },
  {
    id: "venus",
    name: "Venus",
    type: "planet",
    diameterKm: 12104,
    orbitRadiusReal: 0.723,
    orbitalPeriodDays: 224.7,
    rotationPeriodHours: -5832.5,
    axialTiltDeg: 177.4,
    inclinationDeg: 3.4,
    color: "#e3c68f",
    palette: ["#e8cf9a", "#d9b46e", "#f1e0b8"],
    surface: "hazy",
    notable: "Hottest planet: about 465 °C at the surface",
    facts: [
      "A day on Venus (one spin, about 243 Earth days) is longer than its year (about 225 Earth days).",
      "It spins backwards compared with most planets, so the Sun rises in the west.",
      "Its surface is about 465 °C, hot enough to melt lead, making it hotter than Mercury.",
      "The air pressure on the ground is about 90 times Earth's, like being nearly a kilometre underwater.",
      "It is nearly the same size as Earth, which is why it's called Earth's twin.",
    ],
    suggestedQuestions: [
      "Why is Venus hotter than Mercury?",
      "Could anything live in Venus's clouds?",
      "Has any spacecraft landed on Venus?",
    ],
    blurb:
      "Venus is the second planet from the Sun and almost Earth's size, but wrapped in a crushing carbon-dioxide atmosphere with clouds of sulfuric acid. A runaway greenhouse effect makes it the hottest planet. It rotates very slowly and backwards (retrograde). The Soviet Venera landers reached the surface in the 1970s and 80s and survived only for up to about two hours. Its surface has been mapped by radar (notably NASA's Magellan) and shows volcanoes and lava plains; there is evidence of recent volcanic activity. Upcoming missions include NASA's VERITAS and DAVINCI and ESA's EnVision.",
  },
  {
    id: "earth",
    name: "Earth",
    type: "planet",
    diameterKm: 12742,
    orbitRadiusReal: 1.0,
    orbitalPeriodDays: 365.26,
    rotationPeriodHours: 23.93,
    axialTiltDeg: 23.44,
    inclinationDeg: 0,
    color: "#3a7bd5",
    palette: ["#1d4f91", "#3f8f4e", "#a08a5a", "#f4f7fa"],
    surface: "earth",
    notable: "The only world known to have life",
    facts: [
      "Earth is the only place in the universe known to have life.",
      "About 71% of its surface is covered by liquid-water oceans.",
      "It is the densest planet in the Solar System.",
      // UNCERTAIN: day-length reconstructions vary; ~21-22 h around 600 million years ago is typical.
      "Days used to be shorter: around 600 million years ago a day lasted only about 22 hours, because the Moon's tides slowly brake Earth's spin.",
      "Its magnetic field deflects the solar wind, and the leftover particles light up the auroras.",
    ],
    suggestedQuestions: [
      "Why is Earth the only planet with life?",
      "What would happen if we had no Moon?",
      "Why do we have seasons?",
    ],
    blurb:
      "Earth is the third planet from the Sun and the largest of the four rocky planets. Its nitrogen-oxygen atmosphere, liquid-water oceans, plate tectonics and protective magnetic field make it the only world known to host life. Its 23.4° axial tilt gives it seasons. It has one large natural satellite, the Moon, which stabilises that tilt and drives most of the ocean tides.",
  },
  {
    id: "mars",
    name: "Mars",
    type: "planet",
    diameterKm: 6779,
    orbitRadiusReal: 1.524,
    orbitalPeriodDays: 687.0,
    rotationPeriodHours: 24.62,
    axialTiltDeg: 25.19,
    inclinationDeg: 1.85,
    color: "#c1440e",
    palette: ["#b5451b", "#d97a4a", "#8a3413", "#f2e6dc"],
    surface: "rocky",
    notable: "Olympus Mons, the biggest known volcano",
    facts: [
      "Olympus Mons is about 22 km high, roughly two and a half times the height of Mount Everest.",
      "Mars looks red because its dust is rich in iron oxide: it is literally rusty.",
      "The Valles Marineris canyon system is about 4,000 km long, as wide as the United States.",
      "It has seasons like Earth, because its axis is tilted by a similar amount.",
      "Sunsets on Mars look blue, because fine dust scatters blue light forward.",
    ],
    suggestedQuestions: [
      "Could humans live on Mars?",
      "Was there ever water on Mars?",
      "Why is Mars red?",
    ],
    blurb:
      "Mars is the fourth planet, a cold desert world with a thin carbon-dioxide atmosphere (under 1% of Earth's surface pressure), polar ice caps of water and CO2 ice, giant volcanoes and deep canyons. Dried river valleys, lake beds and minerals show that liquid water flowed on its surface billions of years ago; water ice still exists underground and at the poles. It is the most explored planet after Earth, with rovers such as Curiosity and Perseverance (which carried the Ingenuity helicopter) and many orbiters. It has two small moons, Phobos and Deimos.",
  },
  {
    id: "jupiter",
    name: "Jupiter",
    type: "planet",
    diameterKm: 139_822,
    orbitRadiusReal: 5.203,
    orbitalPeriodDays: 4331,
    rotationPeriodHours: 9.93,
    axialTiltDeg: 3.13,
    inclinationDeg: 1.3,
    color: "#d8a878",
    palette: ["#e8d2b0", "#c48a5a", "#f3e7d3", "#a8683f", "#d9b38c"],
    surface: "banded",
    hasRings: false, // Jupiter's rings are real but far too faint to show here.
    notable: "The Great Red Spot, a storm wider than Earth",
    facts: [
      "Jupiter is more than twice as massive as all the other planets put together.",
      "The Great Red Spot is a storm wider than Earth that has been raging for at least 150 years.",
      "It has the shortest day of any planet: under 10 hours.",
      "It does have rings, but they are thin and dusty; Voyager 1 discovered them in 1979.",
      "Its four big moons were discovered by Galileo in 1610, the first moons found orbiting another planet.",
    ],
    suggestedQuestions: [
      "Could a spacecraft fly through Jupiter?",
      "What is the Great Red Spot?",
      "Why is Jupiter striped?",
    ],
    blurb:
      "Jupiter is the fifth planet and by far the largest, a gas giant made mostly of hydrogen and helium with no solid surface. Its stripes are belts and zones of clouds (ammonia and other compounds) driven by powerful jet streams. Deep inside, hydrogen becomes a metallic liquid that generates the strongest planetary magnetic field in the Solar System. It has dozens of known moons, including the four large Galilean moons Io, Europa, Ganymede and Callisto, and a faint ring system. NASA's Juno has orbited it since 2016; Europa Clipper and ESA's JUICE are on the way.",
  },
  {
    id: "saturn",
    name: "Saturn",
    type: "planet",
    diameterKm: 116_464,
    orbitRadiusReal: 9.537,
    orbitalPeriodDays: 10_747,
    rotationPeriodHours: 10.66,
    axialTiltDeg: 26.73,
    inclinationDeg: 2.5,
    color: "#e3cf9a",
    palette: ["#efe0b5", "#d6bd82", "#f6ecd0", "#c2a86e"],
    surface: "banded",
    hasRings: true,
    notable: "Bright rings of ice, ~270,000 km across",
    facts: [
      "Saturn's average density is lower than water's.",
      "Its main rings are about 270,000 km across but usually only around 10 metres thick.",
      "The rings are mostly chunks of water ice, from dust grains to boulders as big as a house.",
      "A six-sided jet stream, the hexagon, circles its north pole.",
      // UNCERTAIN: moon counts change often; 274 as of the March 2025 announcement.
      "It has more known moons than any other planet: over 270 as of 2025.",
    ],
    suggestedQuestions: [
      "What are Saturn's rings made of?",
      "Will Saturn's rings last forever?",
      "What causes the hexagon?",
    ],
    blurb:
      "Saturn is the sixth planet, a gas giant mostly of hydrogen and helium, famous for its broad, bright ring system made mostly of water ice. The rings may be relatively young (perhaps a few hundred million years, though this is debated) and are slowly raining onto the planet. Saturn has a huge family of moons, including Titan, with its thick atmosphere and methane lakes, and Enceladus, which vents water from an underground ocean. NASA's Cassini orbited Saturn from 2004 to 2017 and ended by plunging into its atmosphere.",
  },
  {
    id: "uranus",
    name: "Uranus",
    type: "planet",
    diameterKm: 50_724,
    orbitRadiusReal: 19.19,
    orbitalPeriodDays: 30_589,
    rotationPeriodHours: -17.24,
    axialTiltDeg: 97.77,
    inclinationDeg: 0.8,
    color: "#9fd8e0",
    palette: ["#a9dfe6", "#8fcbd6", "#bfe8ec"],
    surface: "hazy",
    hasRings: true,
    notable: "Tipped on its side, tilted by about 98°",
    facts: [
      "Uranus is tipped over by about 98°, so it rolls around the Sun on its side.",
      "Each pole gets about 42 years of sunlight followed by about 42 years of darkness.",
      "It was the first planet found with a telescope, by William Herschel in 1781.",
      "It holds the record for the coldest temperature measured in a planet's atmosphere, about −224 °C.",
      "Methane in its atmosphere absorbs red light, which gives it its blue-green colour.",
    ],
    suggestedQuestions: [
      "Why is Uranus tipped on its side?",
      "What is inside Uranus?",
      "Why is Uranus blue-green?",
    ],
    blurb:
      "Uranus is the seventh planet, an ice giant: beneath a hydrogen-helium-methane atmosphere it is thought to be mostly a hot, dense fluid of water, methane and ammonia 'ices' around a small rocky core. Its extreme tilt is often explained by a giant collision early in its history, though that is not certain. It has 13 known faint rings and 28 or more known moons, named after characters from Shakespeare and Alexander Pope. Only Voyager 2 has visited, flying past in 1986.",
  },
  {
    id: "neptune",
    name: "Neptune",
    type: "planet",
    diameterKm: 49_244,
    orbitRadiusReal: 30.07,
    orbitalPeriodDays: 59_800,
    rotationPeriodHours: 16.11,
    axialTiltDeg: 28.32,
    inclinationDeg: 1.8,
    color: "#3f63d8",
    palette: ["#3e66d6", "#2b4bb0", "#6d8ff0", "#dfe8ff"],
    surface: "hazy",
    notable: "Fastest winds in the Solar System",
    facts: [
      "Neptune's winds reach about 2,000 km/h, the fastest measured on any planet.",
      "It was found by maths: astronomers predicted its position from tugs on Uranus's orbit, and it was spotted in 1846.",
      "A year on Neptune is about 165 Earth years; it finished its first orbit since discovery in 2011.",
      "Only one spacecraft has ever visited: Voyager 2, in 1989.",
    ],
    suggestedQuestions: [
      "Why is Neptune so windy?",
      "How was Neptune discovered?",
      "Does it really rain diamonds on Neptune?",
    ],
    blurb:
      "Neptune is the eighth and farthest planet, an ice giant similar in make-up to Uranus but a deeper blue. Despite receiving little sunlight, it has a very active atmosphere with dark storms (like the Great Dark Spot seen by Voyager 2, which later vanished) and supersonic winds. It radiates more heat than it gets from the Sun. It has faint rings and at least 16 moons; the largest, Triton, orbits backwards and is probably a captured Kuiper Belt object. Laboratory experiments suggest carbon could form diamonds deep inside ice giants, but this has not been observed directly.",
  },

  // -------------------------------------------------------------------------
  // Dwarf planets
  // -------------------------------------------------------------------------
  {
    id: "ceres",
    name: "Ceres",
    type: "dwarf-planet",
    diameterKm: 939,
    orbitRadiusReal: 2.77,
    orbitalPeriodDays: 1682,
    rotationPeriodHours: 9.07,
    axialTiltDeg: 4,
    inclinationDeg: 10.6,
    color: "#8c8680",
    palette: ["#7d7872", "#9a948d", "#e8e4dc"],
    surface: "rocky",
    notable: "Largest object in the asteroid belt",
    facts: [
      "Ceres is the largest object in the asteroid belt, and the only dwarf planet in the inner Solar System.",
      "It was the first asteroid ever found, by Giuseppe Piazzi in 1801, and was counted as a planet for about 50 years.",
      "The bright spots in Occator crater are salt deposits left behind by salty water from below.",
      // UNCERTAIN: estimates range from about 25% to about 40% depending on the belt-mass estimate used.
      "It holds roughly a quarter to a third of the whole asteroid belt's mass.",
      "NASA's Dawn spacecraft orbited Ceres from 2015 to 2018.",
    ],
    suggestedQuestions: [
      "What are the bright spots on Ceres?",
      "Could Ceres have an ocean?",
      "What's the difference between an asteroid and a dwarf planet?",
    ],
    blurb:
      "Ceres is a dwarf planet in the main asteroid belt between Mars and Jupiter. It is round, made of rock and ice, and NASA's Dawn mission found evidence of a deep layer of brine (salty water) that may still exist in places, as well as salt deposits and organic compounds on the surface. It was classified as a dwarf planet in 2006, alongside Pluto.",
  },
  {
    id: "pluto",
    name: "Pluto",
    type: "dwarf-planet",
    diameterKm: 2377,
    orbitRadiusReal: 39.48,
    orbitalPeriodDays: 90_560,
    rotationPeriodHours: -153.3,
    axialTiltDeg: 122.5,
    inclinationDeg: 17.2,
    color: "#d9bfa0",
    palette: ["#d8c1a2", "#b48e6b", "#f3e9dc", "#7a5a44"],
    surface: "icy",
    notable: "A heart-shaped plain of nitrogen ice",
    facts: [
      "Pluto was reclassified from planet to dwarf planet in 2006.",
      "It is smaller than Earth's Moon.",
      "In 2015 NASA's New Horizons flew past and found a vast heart-shaped plain of nitrogen ice, Sputnik Planitia.",
      "Pluto and its moon Charon always show each other the same face.",
      "Its orbit is so stretched that it is sometimes closer to the Sun than Neptune; the last time was 1979 to 1999.",
    ],
    suggestedQuestions: [
      "Why isn't Pluto a planet any more?",
      "What is the heart on Pluto?",
      "How cold is it on Pluto?",
    ],
    blurb:
      "Pluto is a dwarf planet in the Kuiper Belt, the icy region beyond Neptune. Discovered by Clyde Tombaugh in 1930, it was reclassified in 2006 when the IAU defined 'planet'. New Horizons revealed a surprisingly active world: nitrogen-ice glaciers, water-ice mountains several kilometres high, a thin hazy atmosphere, and possibly a subsurface ocean. Surface temperatures are around −230 °C. Its orbit is eccentric and tilted, and it is in a 3:2 resonance with Neptune, so the two never come close. It has five known moons; Charon is by far the largest.",
  },

  // -------------------------------------------------------------------------
  // Moons
  // -------------------------------------------------------------------------
  {
    id: "moon",
    name: "Moon",
    type: "moon",
    parentId: "earth",
    diameterKm: 3475,
    orbitRadiusReal: 384_400,
    orbitalPeriodDays: 27.32,
    eclipticOrbit: true,
    inclinationDeg: 5.1,
    color: "#b8b5b0",
    palette: ["#a9a6a1", "#cfccc6", "#77746f"],
    surface: "rocky",
    notable: "The only other world humans have walked on",
    facts: [
      "The Moon drifts about 3.8 cm farther from Earth every year.",
      "It always shows the same face to Earth, because it spins exactly once per orbit.",
      "Twelve astronauts walked on it between 1969 and 1972.",
      "It probably formed from debris after a Mars-sized body smashed into the young Earth.",
    ],
    suggestedQuestions: [
      "How did the Moon form?",
      "Why do we only see one side of the Moon?",
      "When will people go back to the Moon?",
    ],
    blurb:
      "The Moon is Earth's only natural satellite and the fifth-largest moon in the Solar System. Its dark 'seas' (maria) are ancient lava plains; its bright highlands are heavily cratered. It has almost no atmosphere, and water ice exists in permanently shadowed craters near its poles. It is tidally locked to Earth, raises most of Earth's tides, and helps stabilise Earth's tilt. NASA's Artemis programme aims to return astronauts to the Moon.",
  },
  {
    id: "phobos",
    name: "Phobos",
    type: "moon",
    parentId: "mars",
    diameterKm: 22.5,
    orbitRadiusReal: 9376,
    orbitalPeriodDays: 0.319,
    inclinationDeg: 1.1,
    color: "#7d7064",
    palette: ["#6f645a", "#8e8175", "#554c44"],
    surface: "rocky",
    notable: "Orbits Mars three times a day",
    facts: [
      "Phobos goes round Mars about three times a day, so from Mars it rises in the west and sets in the east.",
      // UNCERTAIN: estimates are typically 30-50 million years.
      "It is slowly spiralling inward and will be torn apart or crash into Mars in roughly 30 to 50 million years.",
      "Its largest crater, Stickney, is about 9 km wide, a big bite out of a moon only about 22 km across.",
      "Its name means 'fear' in Greek; Mars's other moon, Deimos, means 'dread'.",
    ],
    suggestedQuestions: [
      "Why is Phobos shaped like a potato?",
      "Will Phobos really crash into Mars?",
      "Where did Mars's moons come from?",
    ],
    blurb:
      "Phobos is the larger and inner of Mars's two small moons, an irregular, lumpy body about 27 × 22 × 18 km. It orbits only about 6,000 km above the Martian surface, closer than any other known moon to its planet, and tides are slowly dragging it inward. It is covered in grooves and craters. Its origin (a captured asteroid or debris from a giant impact on Mars) is still debated; JAXA's Martian Moons eXploration (MMX) mission plans to return a sample from Phobos.",
  },
  {
    id: "deimos",
    name: "Deimos",
    type: "moon",
    parentId: "mars",
    diameterKm: 12.4,
    orbitRadiusReal: 23_463,
    orbitalPeriodDays: 1.263,
    inclinationDeg: 0.9,
    color: "#9a8d7e",
    palette: ["#8f8374", "#a89b8b", "#766b5f"],
    surface: "rocky",
    notable: "One of the smallest known moons",
    facts: [
      "Deimos is only about 12 km across, one of the smallest moons known.",
      "From the surface of Mars it would look like a bright star rather than a disc.",
      "It was discovered in 1877 by Asaph Hall, a week before he found Phobos.",
      "A layer of loose dust fills in its craters, giving it a smooth look.",
    ],
    suggestedQuestions: [
      "How small is Deimos compared with a city?",
      "Could you jump off Deimos?",
      "Where did Deimos come from?",
    ],
    blurb:
      "Deimos is the smaller and outer moon of Mars, an irregular body about 15 × 12 × 11 km. Its gravity is so weak that escape velocity is only about 5.6 m/s, so a strong jump could, in principle, send a person into orbit around Mars or away. Like Phobos, its origin (captured asteroid or impact debris) is uncertain. It is slowly drifting outward.",
  },
  {
    id: "io",
    name: "Io",
    type: "moon",
    parentId: "jupiter",
    diameterKm: 3643,
    orbitRadiusReal: 421_700,
    orbitalPeriodDays: 1.769,
    inclinationDeg: 0.05,
    color: "#e0c85a",
    palette: ["#e8d56b", "#c9a33e", "#f3eab0", "#8a4a22"],
    surface: "rocky",
    notable: "The most volcanically active body in the Solar System",
    facts: [
      "Io is the most volcanically active body in the Solar System, with over 400 active volcanoes.",
      "Its volcanoes are powered by tides: Jupiter's gravity squeezes and flexes Io as it orbits.",
      "Volcanic plumes can shoot sulfur-rich gas and dust hundreds of kilometres above the surface.",
      "Its yellow, orange and red colours come mostly from sulfur and sulfur dioxide frost.",
    ],
    suggestedQuestions: [
      "Why does Io have so many volcanoes?",
      "What would it be like to stand on Io?",
      "Why is Io so colourful?",
    ],
    blurb:
      "Io is the innermost of Jupiter's four large Galilean moons, slightly larger than Earth's Moon. An orbital resonance with Europa and Ganymede keeps its orbit slightly oval, so Jupiter's tides constantly flex it, generating the internal heat that drives intense volcanism, including lava lakes and lava hotter than on Earth today. It sits inside Jupiter's intense radiation belts and feeds a ring of charged particles (the Io plasma torus) around Jupiter. It has very few impact craters because eruptions constantly resurface it.",
  },
  {
    id: "europa",
    name: "Europa",
    type: "moon",
    parentId: "jupiter",
    diameterKm: 3122,
    orbitRadiusReal: 671_034,
    orbitalPeriodDays: 3.551,
    inclinationDeg: 0.47,
    color: "#d9cdb8",
    palette: ["#e6dccb", "#c7b394", "#a4704a"],
    surface: "icy",
    notable: "A hidden ocean under an icy shell",
    facts: [
      "Beneath Europa's icy shell lies a salty ocean that may hold about twice as much water as all of Earth's oceans.",
      "That ocean makes it one of the best places to search for life beyond Earth.",
      "Its surface is among the smoothest in the Solar System, criss-crossed by long reddish cracks.",
      "NASA's Europa Clipper launched in October 2024 and is due to reach Jupiter in 2030.",
    ],
    suggestedQuestions: [
      "Could there be life in Europa's ocean?",
      "How do we know there's an ocean under the ice?",
      "What will Europa Clipper look for?",
    ],
    blurb:
      "Europa is the smallest of Jupiter's four Galilean moons, a little smaller than Earth's Moon. Its bright surface of water ice is young and lightly cratered, streaked with ridges and cracks. Magnetic measurements by the Galileo spacecraft strongly suggest a global liquid-water ocean beneath an ice shell estimated to be about 15 to 25 km thick (the thickness is uncertain), kept liquid by tidal heating. Possible water plumes have been reported but not confirmed. Europa Clipper will study whether it could be habitable.",
  },
  {
    id: "ganymede",
    name: "Ganymede",
    type: "moon",
    parentId: "jupiter",
    diameterKm: 5268,
    orbitRadiusReal: 1_070_412,
    orbitalPeriodDays: 7.155,
    inclinationDeg: 0.2,
    color: "#a39a8d",
    palette: ["#8f877c", "#b8b0a3", "#6a635a", "#d8d2c8"],
    surface: "icy",
    notable: "Largest moon in the Solar System",
    facts: [
      "Ganymede is the largest moon in the Solar System, bigger than the planet Mercury.",
      "It is the only moon known to make its own magnetic field.",
      "It probably hides a salty underground ocean holding more water than Earth's oceans.",
      "ESA's JUICE spacecraft is due to go into orbit around Ganymede in the 2030s, the first time any moon other than ours is orbited.",
    ],
    suggestedQuestions: [
      "How can a moon be bigger than a planet?",
      "Why does Ganymede have a magnetic field?",
      "What will JUICE discover?",
    ],
    blurb:
      "Ganymede is Jupiter's largest moon and the largest in the Solar System, about 8% wider than Mercury but only about half as massive. It has a mix of dark, ancient cratered terrain and lighter, grooved terrain. It has an iron-rich core that generates a magnetic field, producing its own auroras, and Hubble observations of how those auroras shift support the idea of a salty ocean deep beneath the ice. ESA's JUICE mission, launched in 2023, is planned to orbit it in the mid-2030s.",
  },
  {
    id: "callisto",
    name: "Callisto",
    type: "moon",
    parentId: "jupiter",
    diameterKm: 4821,
    orbitRadiusReal: 1_882_709,
    orbitalPeriodDays: 16.69,
    inclinationDeg: 0.2,
    color: "#6e6558",
    palette: ["#5e564b", "#7d7366", "#cfc7b8"],
    surface: "rocky",
    notable: "One of the most heavily cratered surfaces known",
    facts: [
      "Callisto has one of the most heavily cratered surfaces in the Solar System, around 4 billion years old.",
      "It is almost exactly the size of Mercury.",
      "It orbits outside Jupiter's worst radiation, so it has been suggested as a site for a future human base.",
      "Its giant impact basin, Valhalla, is surrounded by rings spreading out to about 1,900 km across.",
    ],
    suggestedQuestions: [
      "Why has Callisto barely changed in billions of years?",
      "Could people ever live on Callisto?",
      "Does Callisto have an ocean too?",
    ],
    blurb:
      "Callisto is the outermost of Jupiter's Galilean moons and the third-largest moon in the Solar System. Its dark, ancient surface is saturated with craters, suggesting little geological activity. Unlike its siblings it is not in the tidal resonance, so it gets little tidal heating. Magnetic data from Galileo hint at a salty ocean deep below the surface, although this is less certain than for Europa or Ganymede.",
  },
  {
    id: "mimas",
    name: "Mimas",
    type: "moon",
    parentId: "saturn",
    diameterKm: 396,
    orbitRadiusReal: 185_539,
    orbitalPeriodDays: 0.942,
    inclinationDeg: 1.6,
    color: "#b9b6b0",
    palette: ["#aeaba5", "#cdcac4", "#8b8883"],
    surface: "icy",
    notable: "Giant Herschel crater (the 'Death Star' moon)",
    facts: [
      "A huge crater, Herschel, makes Mimas look remarkably like the Death Star from Star Wars.",
      "Herschel is about 130 km wide, about a third of Mimas's own width.",
      "Mimas's gravity helps clear the Cassini Division, the biggest gap in Saturn's rings.",
      // UNCERTAIN: based on Cassini orbital data (Lainey et al., Nature 2024); not directly observed.
      "Tiny wobbles in its orbit suggest a young ocean may be hidden beneath its icy crust.",
    ],
    suggestedQuestions: [
      "How did Mimas survive such a big impact?",
      "Could Mimas really have an ocean?",
      "How do moons make gaps in Saturn's rings?",
    ],
    blurb:
      "Mimas is the smallest and innermost of Saturn's major round moons, made mostly of water ice. It is dominated by the enormous Herschel crater; an impact much larger would probably have shattered it. Its orbital resonance shapes the Cassini Division in Saturn's rings. A 2024 analysis of Cassini data proposed a young internal ocean, which surprised scientists because its surface looks inactive; this is still being tested.",
  },
  {
    id: "enceladus",
    name: "Enceladus",
    type: "moon",
    parentId: "saturn",
    diameterKm: 504,
    orbitRadiusReal: 237_948,
    orbitalPeriodDays: 1.370,
    inclinationDeg: 0.01,
    color: "#f2f6fa",
    palette: ["#f4f7fb", "#dce6f0", "#b9cde0"],
    surface: "icy",
    notable: "Sprays water from an underground ocean into space",
    facts: [
      "Enceladus sprays jets of water vapour and ice into space from cracks near its south pole.",
      "Those jets supply the material for Saturn's faint E ring.",
      "It reflects almost all the sunlight that hits it, making it one of the brightest objects in the Solar System.",
      "Cassini flew through the plumes and found salts, silica and organic molecules, signs of hot water meeting rock below.",
    ],
    suggestedQuestions: [
      "Could there be life inside Enceladus?",
      "What powers Enceladus's geysers?",
      "Why is Enceladus so bright?",
    ],
    blurb:
      "Enceladus is a small icy moon of Saturn, only about 500 km across, with a global salty ocean beneath its ice shell. Tidal heating keeps the ocean liquid and powers plumes that erupt from four long fractures near the south pole called the 'tiger stripes'. Cassini sampled the plumes and detected water, salts, silica nanoparticles, molecular hydrogen, phosphates and organic compounds, which suggest hydrothermal activity on the seafloor. That combination makes it a leading target in the search for life.",
  },
  {
    id: "tethys",
    name: "Tethys",
    type: "moon",
    parentId: "saturn",
    diameterKm: 1062,
    orbitRadiusReal: 294_619,
    orbitalPeriodDays: 1.888,
    inclinationDeg: 1.1,
    color: "#dcdad6",
    palette: ["#d8d6d2", "#eeece8", "#b0aeaa"],
    surface: "icy",
    notable: "Ithaca Chasma, a canyon about 2,000 km long",
    facts: [
      "Tethys is made almost entirely of water ice; its density is barely more than water's.",
      "The Ithaca Chasma canyon runs about 2,000 km, most of the way from pole to pole.",
      "Its giant crater Odysseus is about 450 km wide, around two-fifths of the moon's width.",
      "Two tiny moons, Telesto and Calypso, share its orbit, one leading and one trailing.",
    ],
    suggestedQuestions: [
      "How can two moons share an orbit?",
      "What made the huge canyon on Tethys?",
      "Why is Tethys so icy?",
    ],
    blurb:
      "Tethys is a mid-sized moon of Saturn made mostly of water ice with little rock. Its surface is heavily cratered and marked by the vast Odysseus crater and the long Ithaca Chasma rift, which may have formed as an early interior ocean froze and expanded. It has two small 'trojan' companion moons at stable points ahead of and behind it in its orbit.",
  },
  {
    id: "dione",
    name: "Dione",
    type: "moon",
    parentId: "saturn",
    diameterKm: 1123,
    orbitRadiusReal: 377_396,
    orbitalPeriodDays: 2.737,
    inclinationDeg: 0.02,
    color: "#cfcbc4",
    palette: ["#c8c4bd", "#e6e2dc", "#9e9a94"],
    surface: "icy",
    notable: "Bright ice cliffs hundreds of metres high",
    facts: [
      "The bright 'wispy' streaks on Dione turned out to be ice cliffs, some hundreds of metres high.",
      "Like Tethys, it shares its orbit with two small trojan moons, Helene and Polydeuces.",
      "Cassini detected a very thin trace of oxygen around it.",
      // UNCERTAIN: inferred from gravity data (Beuthe et al., 2016).
      "Gravity measurements hint at a deep ocean beneath its crust.",
    ],
    suggestedQuestions: [
      "What are Dione's wispy lines?",
      "Could Dione have an ocean?",
      "What are trojan moons?",
    ],
    blurb:
      "Dione is a mid-sized icy moon of Saturn, denser than Tethys and so containing more rock. Its trailing hemisphere is crossed by bright fractures and ice cliffs, and its leading side is heavily cratered. Cassini data suggest a possible subsurface ocean, and an extremely thin exosphere containing oxygen ions has been detected.",
  },
  {
    id: "rhea",
    name: "Rhea",
    type: "moon",
    parentId: "saturn",
    diameterKm: 1528,
    orbitRadiusReal: 527_108,
    orbitalPeriodDays: 4.518,
    inclinationDeg: 0.35,
    color: "#c4c0ba",
    palette: ["#bcb8b2", "#dad6d0", "#908c86"],
    surface: "icy",
    notable: "Saturn's second-largest moon",
    facts: [
      "Rhea is Saturn's second-largest moon, about 1,500 km across.",
      "It is a cold ball of ice and rock with a surface covered in craters.",
      "Cassini found a whisper-thin atmosphere of oxygen and carbon dioxide around it.",
      "In 2008 scientists thought Rhea might have its own rings, but later searches found no sign of them.",
    ],
    suggestedQuestions: [
      "How does a small icy moon get an atmosphere?",
      "Does Rhea have rings?",
      "Why are Saturn's moons so icy?",
    ],
    blurb:
      "Rhea is Saturn's second-largest moon, an icy body with some rock, and one of the most heavily cratered of Saturn's moons. Cassini detected a tenuous exosphere of oxygen and carbon dioxide, likely created as Saturn's magnetic field bombards its icy surface. Early hints of a ring system were not confirmed by later observations. It appears to be geologically quiet.",
  },
  {
    id: "titan",
    name: "Titan",
    type: "moon",
    parentId: "saturn",
    diameterKm: 5150,
    orbitRadiusReal: 1_221_870,
    orbitalPeriodDays: 15.95,
    inclinationDeg: 0.35,
    color: "#d9a64a",
    palette: ["#e0ac4e", "#c98e36", "#edc676"],
    surface: "hazy",
    notable: "Thick atmosphere and seas of liquid methane",
    facts: [
      "Titan is the only moon with a thick atmosphere; the air pressure on the ground is about 1.5 times Earth's.",
      "It has rivers, lakes and seas, but they are made of liquid methane and ethane, not water.",
      "In 2005 the Huygens probe landed on Titan, the most distant landing ever made.",
      "NASA's Dragonfly, a car-sized drone, is due to launch in 2028 and fly between sites on Titan.",
      "It is bigger than the planet Mercury.",
    ],
    suggestedQuestions: [
      "Could humans fly on Titan?",
      "Could life exist in Titan's methane lakes?",
      "What did Huygens see when it landed?",
    ],
    blurb:
      "Titan is Saturn's largest moon and the second-largest moon in the Solar System. Its dense nitrogen atmosphere, with an orange haze of organic molecules, hides the surface; it has a methane cycle like Earth's water cycle, with clouds, rain, rivers and polar seas of liquid hydrocarbons at about −180 °C. Beneath its icy crust is thought to be an ocean of salty water. With low gravity and thick air, a person could in principle fly by flapping strapped-on wings. Cassini mapped it by radar, and Huygens landed there in 2005.",
  },
  {
    id: "iapetus",
    name: "Iapetus",
    type: "moon",
    parentId: "saturn",
    diameterKm: 1469,
    orbitRadiusReal: 3_560_820,
    orbitalPeriodDays: 79.32,
    inclinationDeg: 15.5, // relative to Saturn's equator (it orbits close to the Laplace plane)
    color: "#8c7c68",
    palette: ["#e8e2d6", "#2b221b"],
    surface: "icy",
    notable: "Two-tone: one side dark as coal, one bright as snow",
    facts: [
      "Iapetus is two-toned: one hemisphere is as dark as coal and the other is as bright as snow.",
      "A mountain ridge up to about 20 km high runs along much of its equator, giving it a walnut shape.",
      "Its orbit is tilted, so it would have the best view of Saturn's rings of any major moon.",
      "Giovanni Cassini discovered it in 1671, and noticed it was only visible on one side of Saturn.",
    ],
    suggestedQuestions: [
      "Why is Iapetus two different colours?",
      "How did Iapetus get its equatorial ridge?",
      "What would Saturn look like from Iapetus?",
    ],
    blurb:
      "Iapetus is Saturn's third-largest moon, orbiting far out at about 3.6 million km. Its leading hemisphere is coated in dark material, thought to be dust swept up from the outer moon Phoebe that then warms the ice so it sublimates and refreezes on the bright side, exaggerating the contrast. Its equatorial ridge is a mystery; proposals include a collapsed ring or its early rapid spin. Its orbit is inclined about 15° to Saturn's equator.",
  },
  {
    id: "miranda",
    name: "Miranda",
    type: "moon",
    parentId: "uranus",
    diameterKm: 472,
    orbitRadiusReal: 129_390,
    orbitalPeriodDays: 1.413,
    inclinationDeg: 4.3,
    color: "#a8a7a4",
    palette: ["#9d9c99", "#c3c2bf", "#6d6c69"],
    surface: "icy",
    notable: "Verona Rupes, possibly the tallest cliff known",
    facts: [
      "Miranda looks like a patchwork, with huge grooved regions called coronae next to old cratered ground.",
      // UNCERTAIN: height estimates for Verona Rupes range from about 5 to 20 km.
      "Its cliff Verona Rupes may be up to about 20 km tall, possibly the tallest cliff known in the Solar System.",
      "Uranus's moons are named after characters from Shakespeare and Alexander Pope; Miranda comes from The Tempest.",
      "Voyager 2 photographed it in 1986, the only close-up images we have.",
    ],
    suggestedQuestions: [
      "Why does Miranda look so jumbled?",
      "How long would it take to fall off Verona Rupes?",
      "Why are Uranus's moons named after Shakespeare characters?",
    ],
    blurb:
      "Miranda is the smallest and innermost of Uranus's five major moons. Voyager 2 revealed a bizarre surface of mismatched terrains, with giant oval 'coronae' and enormous cliffs; ideas for its origin include tidal heating in the past, upwelling of warmer ice, or re-assembly after a shattering impact. It was discovered by Gerard Kuiper in 1948.",
  },
  {
    id: "ariel",
    name: "Ariel",
    type: "moon",
    parentId: "uranus",
    diameterKm: 1158,
    orbitRadiusReal: 191_020,
    orbitalPeriodDays: 2.520,
    inclinationDeg: 0.04,
    color: "#c2c0bc",
    palette: ["#bdbbb7", "#dcdad6", "#8b8985"],
    surface: "icy",
    notable: "Brightest and youngest surface of Uranus's big moons",
    facts: [
      "Ariel has the brightest and probably youngest surface of Uranus's five large moons.",
      "It is crossed by long canyons that may have formed as its interior froze and expanded.",
      "Smooth plains inside the canyons suggest icy material once welled up from below.",
      "It was discovered in 1851 by William Lassell, together with Umbriel.",
    ],
    suggestedQuestions: [
      "Why does Ariel look younger than its neighbours?",
      "Could Ariel have had an ocean?",
      "What are seasons like on Uranus's moons?",
    ],
    blurb:
      "Ariel is the fourth-largest of Uranus's moons, a mix of water ice and rock. Its relatively few craters and its network of fault valleys and smooth floors suggest it was geologically active in the past, possibly warmed by tides when its orbit was different. Because Uranus is tipped on its side, its moons have extreme seasons, with decades-long polar days and nights.",
  },
  {
    id: "umbriel",
    name: "Umbriel",
    type: "moon",
    parentId: "uranus",
    diameterKm: 1169,
    orbitRadiusReal: 266_300,
    orbitalPeriodDays: 4.144,
    inclinationDeg: 0.13,
    color: "#6b6a68",
    palette: ["#5f5e5c", "#777674", "#d8d6cf"],
    surface: "rocky",
    notable: "Darkest of Uranus's large moons",
    facts: [
      "Umbriel is the darkest of Uranus's five large moons.",
      "A mysterious bright ring sits on the floor of Wunda crater, near its equator.",
      "Its old, heavily cratered surface suggests it has been quiet for billions of years.",
      "Its name comes from a gloomy sprite in Alexander Pope's poem The Rape of the Lock.",
    ],
    suggestedQuestions: [
      "Why is Umbriel so dark?",
      "What is the bright ring on Umbriel?",
      "How were Uranus's moons discovered?",
    ],
    blurb:
      "Umbriel is Uranus's third-largest moon, almost the same size as Ariel but much darker and more heavily cratered, suggesting an ancient, inactive surface. The bright ring in Wunda crater, about 130 km across, is unexplained; it might be frost deposits. It was discovered by William Lassell in 1851.",
  },
  {
    id: "titania",
    name: "Titania",
    type: "moon",
    parentId: "uranus",
    diameterKm: 1577,
    orbitRadiusReal: 435_910,
    orbitalPeriodDays: 8.706,
    inclinationDeg: 0.08,
    color: "#b3aca4",
    palette: ["#aaa39b", "#c9c3bb", "#7e7870"],
    surface: "icy",
    notable: "Largest moon of Uranus",
    facts: [
      "Titania is the largest moon of Uranus and the eighth-largest moon in the Solar System.",
      "Canyons such as Messina Chasma stretch for well over 1,000 km across its surface.",
      "It was discovered by William Herschel in 1787, six years after he found Uranus itself.",
      "Its name comes from the queen of the fairies in A Midsummer Night's Dream.",
    ],
    suggestedQuestions: [
      "What formed Titania's canyons?",
      "Could Titania have an ocean?",
      "What would Uranus look like from Titania?",
    ],
    blurb:
      "Titania is Uranus's largest moon, made of roughly equal parts ice and rock. Its surface shows impact craters and a system of huge fault canyons, likely formed as its interior expanded long ago. Some models allow for a thin layer of liquid water between its core and icy mantle, but this is uncertain. Discovered by William Herschel in 1787, it was imaged up close only by Voyager 2 in 1986.",
  },
  {
    id: "oberon",
    name: "Oberon",
    type: "moon",
    parentId: "uranus",
    diameterKm: 1523,
    orbitRadiusReal: 583_520,
    orbitalPeriodDays: 13.46,
    inclinationDeg: 0.07,
    color: "#a0978d",
    palette: ["#958c82", "#b4aba1", "#5d4a3f"],
    surface: "rocky",
    notable: "Outermost of Uranus's big moons",
    facts: [
      "Oberon is the outermost and second-largest of Uranus's five major moons.",
      "Its ancient surface is heavily cratered, with dark material on some crater floors.",
      // UNCERTAIN: height estimated from a single Voyager 2 limb profile.
      "Voyager 2 spotted a mountain on its edge that may be about 11 km high.",
      "It was discovered by William Herschel in 1787, on the same night as Titania.",
    ],
    suggestedQuestions: [
      "Why is Oberon so cratered?",
      "What is the dark material on Oberon?",
      "Who was Oberon in Shakespeare?",
    ],
    blurb:
      "Oberon is Uranus's second-largest moon and the farthest out of its five major moons. It is made of ice and rock and has an old, cratered surface with some faults, and dark patches on crater floors whose composition is unknown. It is named after the king of the fairies in A Midsummer Night's Dream. It spends part of its orbit outside Uranus's magnetosphere.",
  },
  {
    id: "triton",
    name: "Triton",
    type: "moon",
    parentId: "neptune",
    diameterKm: 2707,
    orbitRadiusReal: 354_759,
    orbitalPeriodDays: 5.877,
    retrograde: true,
    // Real inclination is ~157° to Neptune's equator (i.e. 23° plus retrograde); retrograde is handled by the flag.
    inclinationDeg: 23,
    color: "#d8c9c0",
    palette: ["#e2d4cc", "#c9a89c", "#f0e8e2"],
    surface: "icy",
    notable: "Orbits backwards: probably a captured Kuiper Belt object",
    facts: [
      "Triton orbits Neptune backwards, the only large moon in the Solar System to do so.",
      "That backwards orbit suggests Neptune captured it from the Kuiper Belt.",
      "Voyager 2 saw geysers of nitrogen gas erupting from its surface in 1989.",
      "Its surface is one of the coldest ever measured, about −235 °C.",
      // UNCERTAIN: timescale estimates vary (commonly quoted ~3.6 billion years).
      "Tides are slowly dragging it inward; in billions of years it may be torn apart into a ring.",
    ],
    suggestedQuestions: [
      "How did Neptune capture Triton?",
      "What are Triton's geysers?",
      "Will Triton really become a ring?",
    ],
    blurb:
      "Triton is Neptune's largest moon, slightly smaller than Earth's Moon, and the only large moon with a retrograde orbit, strong evidence that it was captured from the Kuiper Belt; it may be similar to Pluto. Its young surface of nitrogen, water and CO2 ice includes 'cantaloupe terrain' and dark plume streaks from active nitrogen geysers. It has a thin nitrogen atmosphere. Only Voyager 2 has visited, in 1989.",
  },
  {
    id: "charon",
    name: "Charon",
    type: "moon",
    parentId: "pluto",
    diameterKm: 1212,
    orbitRadiusReal: 19_596,
    orbitalPeriodDays: 6.387,
    inclinationDeg: 0,
    color: "#a39d97",
    palette: ["#9e9892", "#bcb6af", "#6e3f2e"],
    surface: "icy",
    notable: "Half Pluto's size: the largest moon relative to its parent",
    facts: [
      "Charon is about half as wide as Pluto, the biggest moon compared with its parent world.",
      "Pluto and Charon orbit a point in space between them, so they are sometimes called a double dwarf planet.",
      "Its reddish north polar cap, nicknamed Mordor Macula, is made from gas that escaped from Pluto and froze onto Charon.",
      "It was discovered in 1978 by James Christy, from a bump on a photo of Pluto.",
    ],
    suggestedQuestions: [
      "Is Charon a moon or a dwarf planet?",
      "Why does Charon have a red cap?",
      "What would Pluto look like from Charon?",
    ],
    blurb:
      "Charon is Pluto's largest moon, about 1,212 km across. It is so massive relative to Pluto that the centre of mass of the pair lies in space between them, and both are tidally locked, always showing each other the same face. New Horizons in 2015 revealed a huge belt of canyons and smooth plains suggesting a past subsurface ocean that froze, and a reddish north pole made of organic material formed from methane escaping Pluto. It probably formed from a giant collision, like Earth's Moon.",
  },
];

// ---------------------------------------------------------------------------
// Derived key stats
// ---------------------------------------------------------------------------

const nf = (n: number, digits = 0) =>
  n.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits });

function formatDiameter(km: number): string {
  const vsEarth = km / 12742;
  const rel = vsEarth >= 0.1 ? ` (${nf(vsEarth, vsEarth >= 10 ? 0 : 2)}× Earth)` : "";
  return `${nf(km, km < 100 ? 1 : 0)} km${rel}`;
}

function formatPeriod(days: number): string {
  if (days < 2) return `${nf(days * 24, 1)} hours`;
  if (days < 1000) return `${nf(days, days < 20 ? 1 : 0)} days`;
  return `${nf(days / 365.25, 1)} years`;
}

function formatRotation(hours: number): string {
  const abs = Math.abs(hours);
  const base = abs < 72 ? `${nf(abs, 1)} hours` : `${nf(abs / 24, 1)} days`;
  return hours < 0 ? `${base} (backwards)` : base;
}

function buildKeyStats(b: BodyEntry, byId: Map<string, BodyEntry>): KeyStat[] {
  const stats: KeyStat[] = [{ label: "Diameter", value: formatDiameter(b.diameterKm) }];
  if (b.type === "star") {
    stats.push(
      { label: "Distance from galactic centre", value: "~26,000 light-years" },
      { label: "Orbit around the Milky Way", value: "~230 million years" },
    );
  } else if (b.parentId) {
    const parent = byId.get(b.parentId)!;
    stats.push(
      { label: `Distance from ${parent.name}`, value: `${nf(b.orbitRadiusReal)} km` },
      {
        label: "Orbital period",
        value: formatPeriod(b.orbitalPeriodDays) + (b.retrograde ? " (retrograde)" : ""),
      },
    );
  } else {
    const km = b.orbitRadiusReal * 149.598;
    stats.push(
      {
        label: "Distance from Sun",
        value: `${nf(b.orbitRadiusReal, b.orbitRadiusReal < 10 ? 2 : 1)} AU (${nf(km, km < 1000 ? 1 : 0)} million km)`,
      },
      { label: "Orbital period (year)", value: formatPeriod(b.orbitalPeriodDays) },
    );
  }
  if (b.rotationPeriodHours !== undefined) {
    stats.push({ label: "Rotation period", value: formatRotation(b.rotationPeriodHours) });
  } else if (b.parentId) {
    const parent = byId.get(b.parentId)!;
    stats.push({ label: "Rotation", value: `Tidally locked to ${parent.name}` });
  }
  stats.push({ label: "Notable", value: b.notable });
  return stats;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

const entryById = new Map(ENTRIES.map((e) => [e.id, e]));

export const BODIES: readonly Body[] = ENTRIES.map((e) => ({
  ...e,
  keyStats: buildKeyStats(e, entryById),
}));

export const BODY_BY_ID: ReadonlyMap<string, Body> = new Map(BODIES.map((b) => [b.id, b]));

export function getBody(id: string): Body | undefined {
  return BODY_BY_ID.get(id);
}

export function moonsOf(id: string): Body[] {
  return BODIES.filter((b) => b.parentId === id);
}

export function parentOf(body: Body): Body | undefined {
  return body.parentId ? BODY_BY_ID.get(body.parentId) : undefined;
}

export const TYPE_LABEL: Record<BodyType, string> = {
  star: "Star",
  planet: "Planet",
  "dwarf-planet": "Dwarf planet",
  moon: "Moon",
};
