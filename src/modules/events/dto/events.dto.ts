import { EventMode, EventStatus } from '@prisma/client';
import { z } from 'zod';

export { EventMode, EventStatus };

// ─── GeoJSON Polygon ────────────────────────────────────────────────────────
// We accept the standard 2D form: [longitude, latitude]. Altitude (3rd element)
// is rejected — keeps zone/missions math simpler. Validation matches RFC 7946:
// at least one ring (exterior), each ring has >=4 positions and is closed.

const longitudeSchema = z.number().min(-180).max(180);
const latitudeSchema = z.number().min(-90).max(90);
const positionSchema = z.tuple([longitudeSchema, latitudeSchema]);

const linearRingSchema = z
  .array(positionSchema)
  .min(4, 'a linear ring needs at least 4 positions (with first == last)')
  .refine(
    (ring) => {
      const first = ring[0];
      const last = ring[ring.length - 1];
      return first[0] === last[0] && first[1] === last[1];
    },
    { message: 'first and last positions of a ring must match (closed ring)' },
  );

export const polygonSchema = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(linearRingSchema).min(1, 'a Polygon must have at least the exterior ring'),
});

export type GeoPolygon = z.infer<typeof polygonSchema>;

// ─── Event DTOs ─────────────────────────────────────────────────────────────

const NAME_MIN = 2;
const NAME_MAX = 120;
const DESCRIPTION_MAX = 2000;

const nameSchema = z.string().trim().min(NAME_MIN).max(NAME_MAX);
const descriptionSchema = z.string().trim().max(DESCRIPTION_MAX);

export const createEventSchema = z.object({
  name: nameSchema,
  description: descriptionSchema.optional(),
  mode: z.nativeEnum(EventMode),
  operationalArea: polygonSchema,
});

export const updateEventSchema = z
  .object({
    name: nameSchema.optional(),
    description: descriptionSchema.nullable().optional(),
    mode: z.nativeEnum(EventMode).optional(),
    operationalArea: polygonSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'PATCH body must contain at least one field.',
  });

export const eventIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const eventListQuerySchema = z.object({
  status: z.nativeEnum(EventStatus).optional(),
  mode: z.nativeEnum(EventMode).optional(),
});

export type CreateEventDto = z.infer<typeof createEventSchema>;
export type UpdateEventDto = z.infer<typeof updateEventSchema>;
export type EventListQuery = z.infer<typeof eventListQuerySchema>;

export interface EventView {
  id: string;
  name: string;
  description: string | null;
  mode: EventMode;
  status: EventStatus;
  operationalArea: GeoPolygon;
  startsAt: string | null;
  endsAt: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}
