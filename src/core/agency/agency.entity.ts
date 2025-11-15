import { Entity, item, string, InputItem, number } from "dynamodb-toolbox"
import { DashboardMgtBffTable } from "../dynamodb"

export const AgencyEntity = new Entity({
  name: "Agency",
  schema: item({
    agencyId: string().key(),
    name: string(),
    contactMail: string(),
    contactPhone: string().optional(),
    address: item({
      number: string(),
      street: string(),
      city: string(),
      zipCode: string(),
      country: string(),
    }),

    oplock: number(),
  }),
  computeKey: ({ agencyId }: { agencyId: string }) => ({
    PK: "AGENCY",
    SK: `AGENCY#${agencyId}`,
  }),
  table: DashboardMgtBffTable,
})
export type AgencyEntityType = Omit<
  InputItem<typeof AgencyEntity>,
  "created" | "entity" | "modified"
>
