import { describe, expect, it } from "vitest";
import { BODIES, getBody, moonsOf } from "../src/data/bodies.ts";

const REQUIRED: Record<string, string[]> = {
  sun: [],
  mercury: [],
  venus: [],
  earth: ["moon"],
  mars: ["phobos", "deimos"],
  jupiter: ["io", "europa", "ganymede", "callisto"],
  saturn: ["titan", "enceladus", "mimas", "rhea", "iapetus"],
  uranus: ["miranda", "ariel", "umbriel", "titania", "oberon"],
  neptune: ["triton"],
  pluto: ["charon"],
};

describe("body data", () => {
  it("includes every body from the brief", () => {
    for (const [id, moons] of Object.entries(REQUIRED)) {
      expect(getBody(id), id).toBeDefined();
      const actual = moonsOf(id).map((m) => m.id);
      for (const m of moons) expect(actual, `${m} orbits ${id}`).toContain(m);
    }
    expect(getBody("pluto")!.type).toBe("dwarf-planet");
    expect(getBody("saturn")!.hasRings).toBe(true);
    expect(getBody("triton")!.retrograde).toBe(true);
    expect(getBody("uranus")!.axialTiltDeg).toBeGreaterThan(90);
  });

  it("has unique ids and valid parents", () => {
    const ids = BODIES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const b of BODIES) {
      if (b.type === "moon") expect(getBody(b.parentId!), b.id).toBeDefined();
      else expect(b.parentId).toBeUndefined();
    }
  });

  it("gives every body complete panel content", () => {
    for (const b of BODIES) {
      expect(b.facts.length, b.id).toBeGreaterThanOrEqual(3);
      expect(b.facts.length, b.id).toBeLessThanOrEqual(5);
      expect(b.suggestedQuestions, b.id).toHaveLength(3);
      expect(b.blurb.length, b.id).toBeGreaterThan(150);
      expect(b.keyStats.length, b.id).toBeGreaterThanOrEqual(4);
      expect(b.palette.length, b.id).toBeGreaterThanOrEqual(2);
      for (const s of b.keyStats) expect(s.value, `${b.id} ${s.label}`).not.toMatch(/NaN|undefined/);
    }
  });

  it("formats stats readably", () => {
    const stats = Object.fromEntries(getBody("earth")!.keyStats.map((s) => [s.label, s.value]));
    expect(stats["Diameter"]).toBe("12,742 km (1.00× Earth)");
    expect(stats["Distance from Sun"]).toBe("1.00 AU (149.6 million km)");
    const venus = Object.fromEntries(getBody("venus")!.keyStats.map((s) => [s.label, s.value]));
    expect(venus["Rotation period"]).toContain("backwards");
    const phobos = Object.fromEntries(getBody("phobos")!.keyStats.map((s) => [s.label, s.value]));
    expect(phobos["Orbital period"]).toBe("7.7 hours");
    expect(phobos["Rotation"]).toBe("Tidally locked to Mars");
  });
});
