import {
  Entity,
  item,
  string,
  number,
  map,
  InputItem,
} from "dynamodb-toolbox";
import { DashboardMgtBffTable } from "../dynamodb";



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

    oplock: number(),
  }),

  computeKey: ({
    propertyId,
    agencyId,
  }: {
    propertyId: string;
    agencyId: string;
  }) => ({
    PK: `PROPERTY#${agencyId}`,
    SK: `PROPERTY#${propertyId}`,
  }),

  table: DashboardMgtBffTable,
});

export type PropertyEntityType = Omit<
  InputItem<typeof PropertyEntity>,
  "created" | "entity" | "modified"
>;
