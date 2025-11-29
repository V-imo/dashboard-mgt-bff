import { Entity, item, string, InputItem, number } from "dynamodb-toolbox"
import { DashboardMgtBffTable } from "../dynamodb"

export const RoomElementEntity = new Entity({
  name: "RoomElement",
  schema: item({
    propertyId: string().key(),
    roomId: string().key(),
    elementId: string().key(),
    agencyId: string(),

    name: string(),
    description: string().optional(),
    type: string().enum("FURNITURE", "STRUCTURAL", "ELECTRICAL", "PLUMBING", "VENTILATION", "SURFACE", "OTHER"),

    oplock: number(),
  }),
  computeKey: ({
    propertyId,
    roomId,
    elementId,
  }: {
    propertyId: string
    roomId: string
    elementId: string
  }) => ({
    PK: `PROPERTY#${propertyId}`,
    SK: `ROOM#${roomId}#ELEMENT#${elementId}`,
  }),
  table: DashboardMgtBffTable,
})
export type RoomElementEntityType = Omit<
  InputItem<typeof RoomElementEntity>,
  "created" | "entity" | "modified"
>
