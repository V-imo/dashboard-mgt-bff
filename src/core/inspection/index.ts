import { getUnixTime } from "date-fns"
import {
  DeleteItemCommand,
  QueryCommand,
  UpdateItemCommand,
} from "dynamodb-toolbox"
import { InspectionEntity, InspectionEntityType } from "./inspection.entity"
import { DashboardMgtBffTable } from "../dynamodb"
import { ignoreOplockError } from "../utils"

export namespace Inspection {
  export async function update(inspection: InspectionEntityType) {
    InspectionEntity.build(UpdateItemCommand)
      .item({ ...inspection, oplock: getUnixTime(new Date()) })
      .options({
        condition: {
          or: [
            { attr: "oplock", exists: false },
            { attr: "oplock", lte: inspection.oplock },
          ],
        },
      })
      .send()
      .catch(ignoreOplockError)
  }

  export async function getAllByAgency(agencyId: string) {
    return DashboardMgtBffTable.build(QueryCommand)
      .query({ partition: `AGENCY#${agencyId}` })
      .options({ maxPages: Infinity })
      .entities(InspectionEntity)
      .send()
  }

  export async function del(
    inspectionId: string,
    agencyId: string,
    propertyId: string,
  ) {
    return InspectionEntity.build(DeleteItemCommand)
      .key({ inspectionId, agencyId, propertyId })
      .send()
  }
}
