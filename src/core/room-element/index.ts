import { RoomElementEntity, RoomElementEntityType } from "./room-element.entity";
import { DashboardMgtBffTable } from "../dynamodb";
import { DeleteItemCommand, GetItemCommand, QueryCommand, UpdateAttributesCommand } from "dynamodb-toolbox";

export namespace RoomElement {
  export async function update(roomElement: RoomElementEntityType) {
    RoomElementEntity.build(UpdateAttributesCommand)
      .item(roomElement)
      .options({
        condition: {
          or: [
            { attr: "oplock", exists: false },
            { attr: "oplock", lte: roomElement.oplock },
          ],
        },
      })
      .send();
  }

  export async function get(propertyId: string, roomId: string, elementId: string) {
    return RoomElementEntity.build(GetItemCommand)
      .key({ propertyId, roomId, elementId })
      .send();
  }

  export async function getAllByRoom(propertyId: string, roomId: string) {
    return DashboardMgtBffTable.build(QueryCommand)
      .query({ partition: `PROPERTY#${propertyId}`, range: { beginsWith: `ROOM#${roomId}` } })
      .options({ maxPages: Infinity })
      .entities(RoomElementEntity)
      .send();
  }

  export async function getAllByProperty(propertyId: string) {
    return DashboardMgtBffTable.build(QueryCommand)
      .query({ partition: `PROPERTY#${propertyId}` })
      .options({ maxPages: Infinity })
      .entities(RoomElementEntity)
      .send();
  }

  export async function del(propertyId: string, roomId: string, elementId: string) {
    return RoomElementEntity.build(DeleteItemCommand)
      .key({ propertyId, roomId, elementId })
      .send();
  }
}