import { ModelEntity, ModelEntityType } from "./model.entity";
import { ignoreOplockError } from "../utils";
import {
  DeleteItemCommand,
  GetItemCommand,
  QueryCommand,
  UpdateAttributesCommand,
} from "dynamodb-toolbox";
import { DashboardMgtBffTable } from "../dynamodb";

export namespace Model {
  export async function update(model: ModelEntityType) {
    ModelEntity.build(UpdateAttributesCommand)
      .item(model)
      .options({
        condition: {
          or: [
            { attr: "oplock", exists: false },
            { attr: "oplock", lte: model.oplock },
          ],
        },
      })
      .send()
      .catch(ignoreOplockError);
  }

  export async function get(modelId: string, agencyId: string) {
    return ModelEntity.build(GetItemCommand).key({ modelId, agencyId }).send();
  }

  export async function getAllByAgency(agencyId: string) {
    return DashboardMgtBffTable.build(QueryCommand)
      .query({ partition: `MODELS#${agencyId}` })
      .options({ maxPages: Infinity })
      .entities(ModelEntity)
      .send();
  }

  export async function del(modelId: string, agencyId: string) {
    return ModelEntity.build(DeleteItemCommand)
      .key({ modelId, agencyId })
      .send();
  }
}
