import { z } from "zod";
import { Protobuf } from "@meshtastic/core";

export const fixedPositionSchema = z.object({
  latitude: z.preprocess(
    (
      val,
    ) => (val === "" || val === null || val === undefined
      ? undefined
      : parseFloat(String(val))),
    z.number({ invalid_type_error: "Latitude must be a valid number." })
      .min(-90, { message: "Latitude must be between -90 and 90." })
      .max(90, { message: "Latitude must be between -90 and 90." })
      .optional(),
  ),
  longitude: z.preprocess(
    (
      val,
    ) => (val === "" || val === null || val === undefined
      ? undefined
      : parseFloat(String(val))),
    z.number({ invalid_type_error: "Longitude must be a valid number." })
      .min(-180, { message: "Longitude must be between -180 and 180." })
      .max(180, { message: "Longitude must be between -180 and 180." })
      .optional(),
  ),
  altitude: z.preprocess(
    (
      val,
    ) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce
      .number({ invalid_type_error: "Altitude must be a valid number." })
      .min(0, { message: "Longitude must be above 0." })
      .max(50000, { message: "Altitide must be between 0 and 50000." })
      .optional(),
  ),
});

export const positionValidationSchema = z.object({
  positionBroadcastSecs: z.number().int({
    message: "positionBroadcastSecs must be an integer.",
  }),
  positionBroadcastSmartEnabled: z.boolean({
    message: "positionBroadcastSmartEnabled must be a boolean.",
  }),
  fixedPosition: z.union([
    z.literal(false),
    fixedPositionSchema,
  ]),
  gpsUpdateInterval: z.number().int({
    message: "gpsUpdateInterval must be an integer.",
  }),
  positionFlags: z.number().int({
    message: "positionFlags must be an integer.",
  }),
  rxGpio: z.number().int({
    message: "rxGpio must be an integer.",
  }),
  txGpio: z.number().int({
    message: "txGpio must be an integer.",
  }),
  broadcastSmartMinimumDistance: z.number().int({
    message: "broadcastSmartMinimumDistance must be an integer.",
  }),
  broadcastSmartMinimumIntervalSecs: z.number().int({
    message: "broadcastSmartMinimumIntervalSecs must be an integer.",
  }),
  gpsEnGpio: z.number().int({
    message: "gpsEnGpio must be an integer.",
  }),
  gpsMode: z.nativeEnum(Protobuf.Config.Config_PositionConfig_GpsMode, {
    message: "Invalid gpsMode value.",
  }),
});

export type PositionValidation = z.infer<typeof positionValidationSchema>;
