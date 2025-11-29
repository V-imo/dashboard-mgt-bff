import {
  DeleteItemCommand,
  GetItemCommand,
  UpdateAttributesCommand,
  QueryCommand,
} from "dynamodb-toolbox"
import { PropertyEntity, PropertyEntityType } from "./property.entity"
import { DashboardMgtBffTable } from "../dynamodb"
import { ignoreOplockError } from "../utils"

export namespace Property {
  export async function update(property: PropertyEntityType) {
    PropertyEntity.build(UpdateAttributesCommand)
      .item(property)
      .options({
        condition: {
          or: [
            { attr: "oplock", exists: false },
            { attr: "oplock", lte: property.oplock },
          ],
        },
      })
      .send()
      .catch(ignoreOplockError)
  }

  export async function get(propertyId: string, agencyId: string) {
    const { Item } = await PropertyEntity.build(GetItemCommand)
      .key({ propertyId, agencyId })
      .send()
    return Item
  }

  export async function getAllByAgency(agencyId: string) {
    const { Items } = await DashboardMgtBffTable.build(QueryCommand)
      .query({ partition: `PROPERTY#${agencyId}` })
      .options({ maxPages: Infinity })
      .entities(PropertyEntity)
      .send()
    return Items
  }

  export async function del(propertyId: string, agencyId: string) {
    return PropertyEntity.build(DeleteItemCommand)
      .key({ propertyId, agencyId })
      .send()
  }
}
