import {
  Entity,
  item,
  string,
  number,
  InputItem,
} from "dynamodb-toolbox";
import { DashboardMgtBffTable } from "../dynamodb";

export const RoomEntity = new Entity({
  name: "Room",
  schema: item({
    agencyId: string(),
    propertyId: string().key(),
    roomId: string().key(),
    name: string(),
    description: string().optional(),
    area: number().optional(),

    oplock: number(),
  }),

  computeKey: ({
    propertyId,
    roomId,
  }: {
    propertyId: string;
    roomId: string;
  }) => ({
    PK: `PROPERTY#${propertyId}`,
    SK: `ROOM#${roomId}`,
  }),

  table: DashboardMgtBffTable,
});

export type RoomEntityType = Omit<
  InputItem<typeof RoomEntity>,
  "created" | "entity" | "modified"
>;
