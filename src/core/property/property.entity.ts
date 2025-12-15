import {
  Entity,
  item,
  string,
  number,
  map,
  InputItem,
  list,
  boolean,
} from "dynamodb-toolbox";
import { DashboardMgtBffTable } from "../dynamodb";

export const RoomsSchema = list(
  map({
    name: string(),
    area: number().optional(),
    description: string().optional(),
    elements: list(
      map({
        name: string(),
        description: string().optional(),
        images: list(string()).optional(),
        type: string().enum(
          "FURNITURE",
          "STRUCTURAL",
          "ELECTRICAL",
          "PLUMBING",
          "VENTILATION",
          "SURFACE",
          "OTHER"
        ),
      })
    ),
  })
)

export const PropertyEntity = new Entity({
  name: "Property",
  schema: item({
    propertyId: string().key(),
    agencyId: string().key(),

    address: map({
      number: string(),
      street: string(),
      city: string(),
      country: string(),
      zipCode: string(),
    }),

    owner: map({
      firstName: string(),
      lastName: string(),
      mail: string().optional(),
      phoneNumber: string().optional(),
    }).optional(),

    rooms: RoomsSchema,

    oplock: number(),
    latched: boolean().optional(),
  }),

  computeKey: ({
    propertyId,
    agencyId,
  }: {
    propertyId: string;
    agencyId: string;
  }) => ({
    PK: `AGENCY#${agencyId}`,
    SK: `PROPERTY#${propertyId}`,
  }),

  table: DashboardMgtBffTable,
});

export type PropertyEntityType = Omit<
  InputItem<typeof PropertyEntity>,
  "created" | "entity" | "modified"
>;
