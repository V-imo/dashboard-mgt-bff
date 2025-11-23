import {
  Entity,
  item,
  string,
  number,
  InputItem,
} from "dynamodb-toolbox";
import { DashboardMgtBffTable } from "../dynamodb";
import { RoomsSchema } from "../property/property.entity";

export const ModelEntity = new Entity({
  name: "Model",
  schema: item({
    agencyId: string().key(),
    modelId: string().key(),
    name: string(),

    rooms: RoomsSchema,

    oplock: number(),
  }),

  computeKey: ({
    modelId,
    agencyId,
  }: {
    modelId: string;
    agencyId: string;
  }) => ({
    PK: `MODEL#${agencyId}`,
    SK: `MODEL#${modelId}`,
  }),

  table: DashboardMgtBffTable,
});

export type ModelEntityType = Omit<
  InputItem<typeof ModelEntity>,
  "created" | "entity" | "modified"
>;
