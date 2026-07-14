/**
 * Shared map collision helper utilities to prevent terrestrial elements
 * (like trees, ores, buildings, and visual clutter) from spawning in water.
 */

export const isPointInLake = (x: number, y: number): boolean => {
  // East Lake: center (3800, 3100), radius 340
  if (Math.hypot(x - 3800, y - 3100) < 340) return true;
  // North-West Lake: center (1300, 1400), radius 245
  if (Math.hypot(x - 1300, y - 1400) < 245) return true;
  return false;
};

export const isNearRiver = (x: number, y: number, threshold = 160): boolean => {
  // Interpolate river x for a given y coordinates
  let rx = 3300;
  if (y < 1000) {
    rx = 3300 + (y / 1000) * (3200 - 3300);
  } else if (y < 1600) {
    rx = 3200 + ((y - 1000) / 600) * (3300 - 3200);
  } else if (y < 2200) {
    rx = 3300 + ((y - 1600) / 600) * (3100 - 3300);
  } else if (y < 2700) {
    rx = 3100 + ((y - 2200) / 500) * (2900 - 3100);
  } else if (y < 3000) {
    rx = 2900 + ((y - 2700) / 300) * (1700 - 2900);
  } else if (y < 3600) {
    rx = 1700 + ((y - 3000) / 600) * (1200 - 1700);
  } else if (y < 4000) {
    rx = 1200 + ((y - 3600) / 400) * (800 - 1200);
  } else {
    rx = 800 + ((y - 4000) / 1000) * (0 - 800);
  }
  return Math.abs(x - rx) < threshold;
};

/**
 * Validates if the given coordinates are valid for ground/terrestrial elements.
 * Returns true if the coordinate is dry land.
 */
export const isValidGroundSpawn = (x: number, y: number, riverThreshold = 140): boolean => {
  return !isPointInLake(x, y) && !isNearRiver(x, y, riverThreshold);
};
