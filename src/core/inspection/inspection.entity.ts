import { Entity, item, string, InputItem, number, any, list, map } from "dynamodb-toolbox"
import { DashboardMgtBffTable } from "../dynamodb"

export const InspectionEntity = new Entity({
  name: "Inspection",
  schema: item({
    inspectionId: string().key(),
    propertyId: string().key(),
    agencyId: string().key(),
    status: string().enum("TO_DO", "IN_PROGRESS", "DONE", "CANCELED"),
    inspectorId: string(),
    date: string(),

    rooms: list(map({
      name: string(),
      description: string().optional(),
      elements: list(map({
        name: string(),
        description: string().optional(),
        images: list(string()).optional(),
        state: string().enum("GOOD", "BAD", "NEW", "BROKEN"),
      })),
    })).optional(),

    oplock: number(),
  }),
  computeKey: ({
    inspectionId,
    propertyId,
    agencyId,
  }: {
    inspectionId: string
    propertyId: string
    agencyId: string
  }) => ({
    PK: `AGENCY#${agencyId}`,
    SK: `PROPERTY#${propertyId}#INSPECTION#${inspectionId}`,
  }),
  table: DashboardMgtBffTable,
})
export type InspectionEntityType = Omit<
  InputItem<typeof InspectionEntity>,
  "created" | "entity" | "modified"
>
