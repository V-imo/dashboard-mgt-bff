import {
  Entity,
  item,
  string,
  number,
  InputItem,
  list,
  map,
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
