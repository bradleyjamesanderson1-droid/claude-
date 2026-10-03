/**
 * Every scale function and tuning constant for the scene lives here.
 *
 * The scene is NOT to scale. Real sizes and distances cannot share one screen
 * (Neptune is ~30 AU out; the Sun is ~109x Earth's width), so everything is
 * passed through compressive functions that keep the ORDER of things and their
 * rough relative magnitude. Tune the constants below; nothing else in the app
 * hard-codes a size, distance or speed.
 *
 * Scene unit: Earth's compressed radius is exactly 1 unit.
 */

// ---------------------------------------------------------------------------
// Body size
// ---------------------------------------------------------------------------

/** Earth's mean diameter, the reference for body sizes. */
export const EARTH_DIAMETER_KM = 12742;

/**
 * radius = (diameter / Earth diameter) ^ SIZE_EXPONENT.
 * 0.4 keeps Jupiter ~2.6x Earth, Mercury ~0.68x, Phobos ~0.08x: ordering and
 * "big vs small" survive, but nothing is sub-pixel or screen-filling.
 */
export const SIZE_EXPONENT = 0.4;

/**
 * The Sun's compressed radius would be ~6.5; cap it so it doesn't crowd
 * Mercury. Still ~2x Jupiter, so it's obviously the biggest thing here.
 */
export const SUN_RADIUS_MAX = 5;

export function bodyRadius(diameterKm: number): number {
  return Math.pow(diameterKm / EARTH_DIAMETER_KM, SIZE_EXPONENT);
}

// ---------------------------------------------------------------------------
// Planet orbit distance
// ---------------------------------------------------------------------------

/** orbit = PLANET_ORBIT_SCALE * AU ^ PLANET_ORBIT_EXPONENT. Earth sits at 70. */
export const PLANET_ORBIT_SCALE = 70;
/** Square root: inner planets packed tight, outer planets clearly spread out. */
export const PLANET_ORBIT_EXPONENT = 0.5;

export function planetOrbitRadius(au: number): number {
  return PLANET_ORBIT_SCALE * Math.pow(au, PLANET_ORBIT_EXPONENT);
}

// ---------------------------------------------------------------------------
// Moon orbit distance
// ---------------------------------------------------------------------------
// Moons are placed relative to the parent's RENDERED radius, measured in
// parent radii, so they always sit outside the planet (and Saturn's rings):
//   moonOrbit = parentRadius * (MOON_ORBIT_BASE + MOON_ORBIT_SPREAD * sqrt(realDistance / realParentRadius))
// Io is still closest to Jupiter and Callisto furthest, with the same rough spread.

export const MOON_ORBIT_BASE = 1;
export const MOON_ORBIT_SPREAD = 1.2;
export const MOON_ORBIT_EXPONENT = 0.5;

export function moonOrbitRadius(
  distanceKm: number,
  parentDiameterKm: number,
  parentRadiusScene: number,
): number {
  const inParentRadii = distanceKm / (parentDiameterKm / 2);
  return (
    parentRadiusScene *
    (MOON_ORBIT_BASE + MOON_ORBIT_SPREAD * Math.pow(inParentRadii, MOON_ORBIT_EXPONENT))
  );
}

// ---------------------------------------------------------------------------
// Orbital and spin speeds (seconds of screen time at "normal" speed)
// ---------------------------------------------------------------------------

/** Earth takes this many seconds to go round the Sun at normal speed. */
export const EARTH_YEAR_SECONDS = 60;
/** Planet periods: EARTH_YEAR_SECONDS * (period / 1 year) ^ 0.6. Neptune takes ~21 minutes. */
export const PLANET_PERIOD_EXPONENT = 0.6;

/** Moon periods: MOON_PERIOD_SCALE * days ^ 0.5. Phobos ~2.3 s, the Moon ~21 s, Iapetus ~36 s. */
export const MOON_PERIOD_SCALE = 4;
export const MOON_PERIOD_EXPONENT = 0.5;

/** Spin: EARTH_DAY_SECONDS * (rotation hours / 24) ^ 0.5. */
export const EARTH_DAY_SECONDS = 4;
export const SPIN_EXPONENT = 0.5;

export function planetPeriodSeconds(periodDays: number): number {
  return EARTH_YEAR_SECONDS * Math.pow(periodDays / 365.25, PLANET_PERIOD_EXPONENT);
}

export function moonPeriodSeconds(periodDays: number): number {
  return MOON_PERIOD_SCALE * Math.pow(periodDays, MOON_PERIOD_EXPONENT);
}

/** Signed: a negative rotation period (retrograde spin) gives a negative result. */
export function spinPeriodSeconds(rotationHours: number): number {
  return Math.sign(rotationHours) * EARTH_DAY_SECONDS * Math.pow(Math.abs(rotationHours) / 24, SPIN_EXPONENT);
}

/** Time-control presets (multipliers on the periods above). */
export const TIME_SPEEDS = [
  { id: "pause", label: "Pause", value: 0 },
  { id: "slow", label: "Slow", value: 0.25 },
  { id: "normal", label: "Normal", value: 1 },
  { id: "fast", label: "Fast", value: 5 },
] as const;

// ---------------------------------------------------------------------------
// "True scale" mode
// ---------------------------------------------------------------------------
// Real sizes and distances with one shared factor. Everything becomes
// sub-pixel, which is the point. Speeds stay compressed so things still move.

export const KM_PER_AU = 149_597_870.7;
/** Scene units per AU in true-scale mode (Neptune ends up ~360 units out). */
export const TRUE_SCALE_UNITS_PER_AU = 12;

export function trueScaleKm(km: number): number {
  return (km / KM_PER_AU) * TRUE_SCALE_UNITS_PER_AU;
}

/** Seconds to morph between compressed and true scale. */
export const TRUE_SCALE_TRANSITION_SECONDS = 2.2;

// ---------------------------------------------------------------------------
// Visibility and level of detail
// ---------------------------------------------------------------------------

/**
 * Minimum on-screen radius (px) for an Earth-sized body in the compressed view.
 * Far away, every body is inflated by the SAME factor so Jupiter still reads
 * 2.6x Earth even when the whole system fits on screen. Up close the factor is 1.
 */
export const MIN_EARTH_PIXEL_RADIUS = 2.6;
/** In true-scale mode each body gets at least this many pixels, so it's a findable dot. */
export const TRUE_SCALE_MIN_PIXEL_RADIUS = 1.2;

/**
 * Moons and their orbit lines fade in as the camera nears the parent.
 * Measured in multiples of the moon system's radius (outermost moon orbit).
 * Fully visible inside NEAR, gone beyond FAR.
 */
export const MOON_FADE_NEAR = 5;
export const MOON_FADE_FAR = 10;

/** Moon labels also need the moon to be at least this far from its parent on screen (px). */
export const MOON_LABEL_MIN_SEPARATION_PX = 14;

/** Generous invisible hit area around bodies, in CSS pixels. */
export const PICK_MIN_RADIUS_PX = 16;
export const PICK_PADDING_PX = 8;

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------

export const CAMERA_FOV = 45;
export const FOCUS_FLIGHT_SECONDS = 1.3;
/** With prefers-reduced-motion, flights are this short (0 = jump). */
export const FOCUS_FLIGHT_SECONDS_REDUCED = 0;
/** Camera distance when focusing a body without moons, in body radii. */
export const FOCUS_DISTANCE_RADII = 6;
/** Camera distance when focusing a planet with moons, in moon-system radii. */
export const FOCUS_DISTANCE_MOON_SYSTEM = 2.3;
/** Elevation of the default "whole system" view, in degrees above the orbital plane. */
export const SYSTEM_VIEW_ELEVATION_DEG = 32;

// ---------------------------------------------------------------------------
// Belts (decorative particles)
// ---------------------------------------------------------------------------

export const ASTEROID_BELT = { innerAu: 2.2, outerAu: 3.3, count: 2600, thicknessAu: 0.12 };
export const KUIPER_BELT = { innerAu: 32, outerAu: 50, count: 1800, thicknessAu: 2 };

// ---------------------------------------------------------------------------
// Rings (in parent radii, from real ring extents)
// ---------------------------------------------------------------------------

/** Saturn's C ring inner edge to A ring outer edge: ~74,500 to ~136,800 km over a 58,232 km radius. */
export const SATURN_RING = { inner: 1.24, outer: 2.35 };
/** Uranus's main rings: ~41,800 to ~51,150 km over a 25,362 km radius. Kept faint. */
export const URANUS_RING = { inner: 1.64, outer: 2.02 };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Interpolate in log space: the right way to morph between wildly different magnitudes. */
export function logLerp(a: number, b: number, t: number): number {
  return Math.exp(lerp(Math.log(a), Math.log(b), t));
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
