import {
  boolean,
  Entity,
  item,
  string,
  InputItem,
  number,
  any,
} from "dynamodb-toolbox"
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
    rooms: any().optional(),

    deleted: boolean().optional(),
    oplock: number(),
    ttl: number().optional(),
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
    SK: `HOUSING#${propertyId}#INSPECTION#${inspectionId}`,
  }),
  table: DashboardMgtBffTable,
})
export type InspectionEntityType = Omit<
  InputItem<typeof InspectionEntity>,
  "created" | "entity" | "modified"
>
