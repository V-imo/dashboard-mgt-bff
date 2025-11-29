import {
  DeleteItemCommand,
  GetItemCommand,
  QueryCommand,
  UpdateAttributesCommand,
} from "dynamodb-toolbox";
import { InspectionEntity, InspectionEntityType } from "./inspection.entity";
import { DashboardMgtBffTable } from "../dynamodb";
import { ignoreOplockError } from "../utils";

export namespace Inspection {
  export async function update(inspection: InspectionEntityType) {
    InspectionEntity.build(UpdateAttributesCommand)
      .item(inspection)
      .options({
        condition: {
          or: [
            { attr: "oplock", exists: false },
            { attr: "oplock", lte: inspection.oplock },
          ],
        },
      })
      .send()
      .catch(ignoreOplockError);
  }

  export async function getAllByAgency(agencyId: string) {
    return DashboardMgtBffTable.build(QueryCommand)
      .query({ partition: `INSPECTION#${agencyId}` })
      .options({ maxPages: Infinity })
      .entities(InspectionEntity)
      .send();
  }

  export async function del(
    inspectionId: string,
    agencyId: string,
    propertyId: string
  ) {
    return InspectionEntity.build(DeleteItemCommand)
      .key({ inspectionId, agencyId, propertyId })
      .send();
  }

  export async function getAllByAgencyAndProperty(
    agencyId: string,
    propertyId: string
  ) {
    return DashboardMgtBffTable.build(QueryCommand)
      .query({
        partition: `INSPECTION#${agencyId}`,
        range: { beginsWith: `PROPERTY#${propertyId}` },
      })
      .options({ maxPages: Infinity })
      .entities(InspectionEntity)
      .send();
  }

  export async function get(
    agencyId: string,
    propertyId: string,
    inspectionId: string
  ) {
    return InspectionEntity.build(GetItemCommand)
      .key({ agencyId, propertyId, inspectionId })
      .send();
  }
}
