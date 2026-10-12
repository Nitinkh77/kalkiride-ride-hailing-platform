/**
 * @file components/map/vehicle-svg.ts
 * @description Top-down vehicle illustrations for map markers (pure strings, no Leaflet).
 * All vehicles face UP (north); rotate the wrapper by the route bearing.
 * Shared look: brand indigo/saffron livery, white or ink outline for contrast on
 * both light and dark basemaps, and a soft ground shadow.
 */

export type MapVehicleType = "bike" | "auto" | "cab" | "carpool";

const INK = "#22212a";
const TYRE = "#1b1824";
const GLASS = "#2b3a55";
const LAMP = "#fff3c4";

interface VehicleArt {
  w: number;
  h: number;
  body: string;
}

function bike(): VehicleArt {
  return {
    w: 28,
    h: 64,
    body: `
<ellipse cx="14" cy="36" rx="11" ry="27" fill="#000" opacity=".2"/>
<rect x="11.5" y="3" width="5" height="14" rx="2.5" fill="${TYRE}" stroke="#fff" stroke-opacity=".55" stroke-width=".8"/>
<rect x="11.5" y="47" width="5" height="14" rx="2.5" fill="${TYRE}" stroke="#fff" stroke-opacity=".55" stroke-width=".8"/>
<rect x="8.5" y="16" width="11" height="36" rx="5.5" fill="#30264a" stroke="#fff" stroke-width="1.2"/>
<rect x="2" y="14" width="24" height="3.4" rx="1.7" fill="${INK}"/>
<circle cx="3.2" cy="12" r="1.7" fill="#716d7a"/><circle cx="24.8" cy="12" r="1.7" fill="#716d7a"/>
<path d="M8.5 34 L4.5 17 M19.5 34 L23.5 17" stroke="#5e4c8e" stroke-width="3.4" stroke-linecap="round"/>
<ellipse cx="14" cy="37" rx="8" ry="4.8" fill="#5e4c8e" stroke="#fff" stroke-width="1"/>
<circle cx="14" cy="31.5" r="5.4" fill="#f4b544" stroke="#fff" stroke-width="1.2"/>
<path d="M10.2 29.4 Q14 27 17.8 29.4" stroke="${INK}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".55"/>
<circle cx="14" cy="8" r="2" fill="${LAMP}"/>
<rect x="12" y="55" width="4" height="1.8" rx=".9" fill="#e5484d"/>`,
  };
}

function auto(): VehicleArt {
  return {
    w: 40,
    h: 62,
    body: `
<ellipse cx="20" cy="35" rx="17" ry="27" fill="#000" opacity=".2"/>
<rect x="17.5" y="3" width="5" height="11" rx="2.5" fill="${TYRE}" stroke="#fff" stroke-opacity=".55" stroke-width=".8"/>
<rect x="1.5" y="36" width="5" height="14" rx="2.5" fill="${TYRE}" stroke="#fff" stroke-opacity=".55" stroke-width=".8"/>
<rect x="33.5" y="36" width="5" height="14" rx="2.5" fill="${TYRE}" stroke="#fff" stroke-opacity=".55" stroke-width=".8"/>
<path d="M12 12 H28 L31 22 H35 V54 Q35 59 30 59 H10 Q5 59 5 54 V22 H9 Z" fill="#30264a" stroke="#fff" stroke-width="1.2"/>
<path d="M14 7 H26 L28 14 H12 Z" fill="#3f3260" stroke="#fff" stroke-width="1"/>
<circle cx="20" cy="9.5" r="2" fill="${LAMP}"/>
<rect x="8" y="23" width="24" height="33" rx="5" fill="#f4b544" stroke="#b97f12" stroke-width=".8"/>
<rect x="11" y="26" width="18" height="3" rx="1.5" fill="#fff" opacity=".4"/>
<path d="M11 40 H29 M11 48 H29" stroke="#b97f12" stroke-width=".8" opacity=".6"/>
<path d="M11 17 H29 L28 23 H12 Z" fill="${GLASS}" opacity=".92"/>
<rect x="3" y="19" width="3.2" height="2.2" rx="1" fill="${INK}"/><rect x="33.8" y="19" width="3.2" height="2.2" rx="1" fill="${INK}"/>
<rect x="14" y="57" width="12" height="1.8" rx=".9" fill="#e5484d"/>`,
  };
}

function car(kind: "cab" | "carpool"): VehicleArt {
  const isCab = kind === "cab";
  const bodyFill = isCab ? "#fff9f0" : "#30264a";
  const roofFill = isCab ? "#eae5f4" : "#3f3260";
  const stroke = isCab ? "rgba(34,33,42,.55)" : "#fff";
  return {
    w: 36,
    h: 66,
    body: `
<ellipse cx="18" cy="36" rx="16" ry="30" fill="#000" opacity=".22"/>
<rect x="1" y="13" width="5" height="11" rx="2" fill="${TYRE}" stroke="#fff" stroke-opacity=".55" stroke-width=".8"/><rect x="30" y="13" width="5" height="11" rx="2" fill="${TYRE}" stroke="#fff" stroke-opacity=".55" stroke-width=".8"/>
<rect x="1" y="44" width="5" height="11" rx="2" fill="${TYRE}" stroke="#fff" stroke-opacity=".55" stroke-width=".8"/><rect x="30" y="44" width="5" height="11" rx="2" fill="${TYRE}" stroke="#fff" stroke-opacity=".55" stroke-width=".8"/>
<rect x="4" y="4" width="28" height="58" rx="11" fill="${bodyFill}" stroke="${stroke}" stroke-width="1.2"/>
<path d="M8 18 Q18 14 28 18" stroke="#000" stroke-width="1" fill="none" opacity=".18"/>
<path d="M9 24 L27 24 L25 33 L11 33 Z" fill="${GLASS}" opacity=".92"/>
<rect x="9" y="33" width="18" height="14" rx="3.5" fill="${roofFill}"/>
<path d="M11 47 L25 47 L26 54 L10 54 Z" fill="${GLASS}" opacity=".92"/>
<rect x="1.5" y="26" width="3.5" height="2.2" rx="1" fill="${INK}"/><rect x="31" y="26" width="3.5" height="2.2" rx="1" fill="${INK}"/>
<circle cx="9.5" cy="7.5" r="2" fill="${LAMP}"/><circle cx="26.5" cy="7.5" r="2" fill="${LAMP}"/>
<rect x="8" y="58.2" width="6" height="1.8" rx=".9" fill="#e5484d"/><rect x="22" y="58.2" width="6" height="1.8" rx=".9" fill="#e5484d"/>
<rect x="14" y="38" width="8" height="3" rx="1.2" fill="#f4b544"/>`,
  };
}

export function getVehicleArt(type: MapVehicleType): VehicleArt {
  switch (type) {
    case "bike":
      return bike();
    case "auto":
      return auto();
    case "carpool":
      return car("carpool");
    default:
      return car("cab");
  }
}

/** Normalises ids used around the app ("car", "cab", "carpool", ...) to a marker type. */
export function toMapVehicleType(id: string | undefined | null): MapVehicleType {
  if (id === "bike" || id === "auto" || id === "carpool") return id;
  return "cab";
}

export function vehicleSvg(type: MapVehicleType, scale = 1): string {
  const { w, h, body } = getVehicleArt(type);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${Math.round(w * scale)}" height="${Math.round(h * scale)}" aria-hidden="true" focusable="false">${body}</svg>`;
}
