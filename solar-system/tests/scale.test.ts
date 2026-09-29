// Visual-proportion sanity checks: if someone retunes config/scale.ts, these
// catch the ordering and "big vs small" relationships the brief requires.
import { describe, expect, it } from "vitest";
import * as S from "../src/config/scale.ts";
import { BODIES, getBody, moonsOf } from "../src/data/bodies.ts";

const radius = (id: string) => {
  const b = getBody(id)!;
  const r = S.bodyRadius(b.diameterKm);
  return b.type === "star" ? Math.min(r, S.SUN_RADIUS_MAX) : r;
};
const planets = BODIES.filter((b) => b.type === "planet");
const moonOrbit = (id: string) => {
  const m = getBody(id)!;
  const p = getBody(m.parentId!)!;
  return S.moonOrbitRadius(m.orbitRadiusReal, p.diameterKm, radius(p.id));
};
const systemRadius = (id: string) => Math.max(0, ...moonsOf(id).map((m) => moonOrbit(m.id)));

describe("body sizes", () => {
  it("Jupiter is the largest planet and Mercury the smallest", () => {
    const sorted = [...planets].sort((a, b) => radius(b.id) - radius(a.id));
    expect(sorted[0].id).toBe("jupiter");
    expect(sorted.at(-1)!.id).toBe("mercury");
  });

  it("Earth and Venus are near-twins", () => {
    expect(radius("venus") / radius("earth")).toBeGreaterThan(0.95);
  });

  it("gas giants clearly dwarf rocky planets", () => {
    for (const giant of ["jupiter", "saturn", "uranus", "neptune"]) {
      expect(radius(giant) / radius("earth")).toBeGreaterThan(1.6);
    }
    expect(radius("jupiter") / radius("mars")).toBeGreaterThan(3);
  });

  it("the Sun is capped but still biggest by a wide margin", () => {
    expect(radius("sun")).toBe(S.SUN_RADIUS_MAX);
    expect(radius("sun") / radius("jupiter")).toBeGreaterThan(1.8);
  });

  it("moon sizes keep their real ordering", () => {
    expect(radius("ganymede")).toBeGreaterThan(radius("moon"));
    expect(radius("titan")).toBeGreaterThan(radius("mercury"));
    expect(radius("phobos")).toBeLessThan(0.1);
    expect(radius("deimos")).toBeLessThan(radius("phobos"));
    expect(radius("charon") / radius("pluto")).toBeGreaterThan(0.7);
  });
});

describe("orbits", () => {
  it("planets stay in order out from the Sun, clear of the Sun", () => {
    const tops = BODIES.filter((b) => b.type === "planet" || b.type === "dwarf-planet").sort(
      (a, b) => a.orbitRadiusReal - b.orbitRadiusReal,
    );
    const r = tops.map((b) => S.planetOrbitRadius(b.orbitRadiusReal));
    for (let i = 1; i < r.length; i++) expect(r[i]).toBeGreaterThan(r[i - 1]);
    expect(r[0]).toBeGreaterThan(radius("sun") * 5);
  });

  it("outer planets are far apart and inner ones tightly packed", () => {
    const gap = (a: string, b: string) =>
      S.planetOrbitRadius(getBody(b)!.orbitRadiusReal) - S.planetOrbitRadius(getBody(a)!.orbitRadiusReal);
    expect(gap("uranus", "neptune")).toBeGreaterThan(gap("venus", "earth") * 4);
  });

  it("every moon orbits outside its parent (and outside Saturn's rings), in real order", () => {
    for (const parent of BODIES.filter((b) => moonsOf(b.id).length)) {
      const moons = moonsOf(parent.id).sort((a, b) => a.orbitRadiusReal - b.orbitRadiusReal);
      const ringEdge = parent.id === "saturn" ? S.SATURN_RING.outer : parent.hasRings ? S.URANUS_RING.outer : 1;
      let prev = radius(parent.id) * ringEdge;
      for (const m of moons) {
        const r = moonOrbit(m.id);
        expect(r - radius(m.id), `${m.id} clears ${parent.id}`).toBeGreaterThan(prev);
        prev = r;
      }
    }
  });

  it("Io is closest to Jupiter and Callisto furthest", () => {
    const js = ["io", "europa", "ganymede", "callisto"].map(moonOrbit);
    expect([...js].sort((a, b) => a - b)).toEqual(js);
  });

  it("neighbouring moon systems never overlap", () => {
    const tops = BODIES.filter((b) => !b.parentId && b.type !== "star").sort(
      (a, b) => a.orbitRadiusReal - b.orbitRadiusReal,
    );
    for (let i = 1; i < tops.length; i++) {
      const a = tops[i - 1], b = tops[i];
      const gap = S.planetOrbitRadius(b.orbitRadiusReal) - S.planetOrbitRadius(a.orbitRadiusReal);
      expect(systemRadius(a.id) + systemRadius(b.id), `${a.id}/${b.id}`).toBeLessThan(gap);
    }
  });

  it("the asteroid belt sits between Mars's and Jupiter's systems", () => {
    expect(S.planetOrbitRadius(S.ASTEROID_BELT.innerAu)).toBeGreaterThan(
      S.planetOrbitRadius(1.524) + systemRadius("mars"),
    );
    expect(S.planetOrbitRadius(S.ASTEROID_BELT.outerAu)).toBeLessThan(
      S.planetOrbitRadius(5.203) - systemRadius("jupiter"),
    );
  });
});

describe("speeds", () => {
  it("closer bodies go round faster", () => {
    const tops = [...planets].sort((a, b) => a.orbitRadiusReal - b.orbitRadiusReal);
    const p = tops.map((b) => S.planetPeriodSeconds(b.orbitalPeriodDays));
    for (let i = 1; i < p.length; i++) expect(p[i]).toBeGreaterThan(p[i - 1]);
    expect(S.moonPeriodSeconds(getBody("io")!.orbitalPeriodDays)).toBeLessThan(
      S.moonPeriodSeconds(getBody("callisto")!.orbitalPeriodDays),
    );
  });

  it("retrograde spin stays negative", () => {
    expect(S.spinPeriodSeconds(-5832.5)).toBeLessThan(0);
  });
});

describe("true scale", () => {
  it("shows how empty space is", () => {
    const earth = S.trueScaleKm(S.EARTH_DIAMETER_KM / 2);
    const earthOrbit = S.TRUE_SCALE_UNITS_PER_AU;
    expect(earthOrbit / earth).toBeGreaterThan(20_000);
  });

  it("logLerp hits both ends", () => {
    expect(S.logLerp(2, 1e-4, 0)).toBeCloseTo(2);
    expect(S.logLerp(2, 1e-4, 1)).toBeCloseTo(1e-4);
  });
});
