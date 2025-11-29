import { RoomEntity, RoomEntityType } from "./room.entity";
import { ignoreOplockError } from "../utils";
import {
  DeleteItemCommand,
  GetItemCommand,
  QueryCommand,
  UpdateAttributesCommand,
} from "dynamodb-toolbox";
import { DashboardMgtBffTable } from "../dynamodb";

export namespace Room {
  export async function update(room: RoomEntityType) {
    RoomEntity.build(UpdateAttributesCommand)
      .item(room)
      .options({
        condition: {
          or: [
            { attr: "oplock", exists: false },
            { attr: "oplock", lte: room.oplock },
          ],
        },
      })
      .send()
      .catch(ignoreOplockError);
  }

  export async function get(roomId: string, propertyId: string) {
    return RoomEntity.build(GetItemCommand).key({ roomId, propertyId }).send();
  }

  export async function getAllByProperty(propertyId: string) {
    return DashboardMgtBffTable.build(QueryCommand)
      .query({ partition: `PROPERTY#${propertyId}` })
      .options({ maxPages: Infinity })
      .entities(RoomEntity)
      .send();
  }

  export async function del(roomId: string, propertyId: string) {
    return RoomEntity.build(DeleteItemCommand)
      .key({ roomId, propertyId })
      .send();
  }
}
