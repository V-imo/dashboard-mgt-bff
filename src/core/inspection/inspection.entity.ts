import {
  boolean,
  Entity,
  item,
  string,
  InputItem,
  number,
} from "dynamodb-toolbox"
import { DashboardMgtBffTable } from "../dynamodb"

export const InspectionEntity = new Entity({
  name: "Inspection",
  schema: item({
    inspectionId: string().key(),
    housingId: string().key(),
    agencyId: string().key(),
    status: string().enum("PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"),
    inspectorId: string().optional(),

    deleted: boolean().optional(),
    oplock: number(),
    ttl: number().optional(),
  }),
  computeKey: ({
    inspectionId,
    housingId,
    agencyId,
  }: {
    inspectionId: string
    housingId: string
    agencyId: string
  }) => ({
    PK: `AGENCY#${agencyId}`,
    SK: `HOUSING#${housingId}#INSPECTION#${inspectionId}`,
  }),
  table: DashboardMgtBffTable,
})
export type InspectionEntityType = Omit<
  InputItem<typeof InspectionEntity>,
  "created" | "entity" | "modified"
>
