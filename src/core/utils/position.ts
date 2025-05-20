export type ValidPosition<ArgType> = {
  latitude: ArgType extends string ? ArgType : number;
  longitude: ArgType extends string ? ArgType : number;
  altitude: ArgType extends string ? ArgType : number;
};

type Direction = "get" | "update";

export function formatLatLong(
  positionInput: ValidPosition<number>,
  direction: Direction = "get",
): ValidPosition<number> {
  const { latitude, longitude, altitude } = positionInput;

  const scale = direction === "get" ? 1e-7 : 1e7;
  if (direction === "get") {
    return {
      latitude: Math.round(latitude / scale),
      longitude: Math.round(longitude / scale),
      altitude: Math.round(altitude / 1000),
    };
  }

  return {
    latitude: Math.round(latitude * scale),
    longitude: Math.round(longitude * scale),
    altitude: Math.round(altitude * 1000),
  };
}
