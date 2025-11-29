import fs from "fs"
import {
  ServerlessSpyListener,
  createServerlessSpyListener,
} from "serverless-spy"
import {
  RoomCreatedEventEnvelope,
  RoomCreatedEvent,
  RoomDeletedEventEnvelope,
  RoomDeletedEvent,
  RoomUpdatedEventEnvelope,
  RoomUpdatedEvent,
} from "vimo-events"
import { ServerlessSpyEvents } from "../spy"
import { eventualAssertion } from "../utils"
import { ApiClient } from "../utils/api"
import { generateRoom } from "../utils/generator"

const { ApiUrl, ServerlessSpyWsUrl } = Object.values(
  JSON.parse(fs.readFileSync("test.output.json", "utf8")),
)[0] as Record<string, string>

const apiClient = new ApiClient(ApiUrl)

let serverlessSpyListener: ServerlessSpyListener<ServerlessSpyEvents>
beforeEach(async () => {
  serverlessSpyListener =
    await createServerlessSpyListener<ServerlessSpyEvents>({
      serverlessSpyWsUrl: ServerlessSpyWsUrl,
    })
}, 10000)

afterEach(async () => {
  serverlessSpyListener.stop()
})

jest.setTimeout(60000)

test("should create a room", async () => {
  const room = generateRoom()
  const roomId = await apiClient.createRoom(room)
  expect(roomId).toBeDefined()

  const eventRoomCreated = (
    await serverlessSpyListener.waitForEventBridgeEventBus<RoomCreatedEventEnvelope>(
      {
        condition: ({ detail }) =>
          detail.type === RoomCreatedEvent.type &&
          detail.data.roomId === roomId,
      }
    )
  ).getData()
  expect(eventRoomCreated.detail.data.agencyId).toEqual(room.agencyId)
})

test("should update a room", async () => {
  const room = generateRoom()
  const roomId = await apiClient.createRoom(room)
  expect(roomId).toBeDefined()

  const newRoom = generateRoom({
    agencyId: room.agencyId,
    propertyId: room.propertyId,
    roomId,
  })
  await apiClient.updateRoom(newRoom)

  await eventualAssertion(
    async () => {
      const res = await apiClient.getRoom(room.propertyId, roomId)
      return res
    },
    async (json) => {
      expect(json).toEqual({ ...newRoom, roomId })
    }
  )
  const eventRoomUpdated = (
    await serverlessSpyListener.waitForEventBridgeEventBus<RoomUpdatedEventEnvelope>(
      {
        condition: ({ detail }) =>
          detail.type === RoomUpdatedEvent.type &&
          detail.data.roomId === roomId,
      }
    )
  ).getData()
  expect(eventRoomUpdated.detail.data.name).toEqual(newRoom.name)
})

test("should delete a room", async () => {
  const room = generateRoom()
  const roomId = await apiClient.createRoom(room)
  expect(roomId).toBeDefined()

  await apiClient.deleteRoom(room.propertyId, roomId)

  const eventRoomDeleted = (
    await serverlessSpyListener.waitForEventBridgeEventBus<RoomDeletedEventEnvelope>(
      {
        condition: ({ detail }) =>
          detail.type === RoomDeletedEvent.type &&
          detail.data.roomId === roomId,
      }
    )
  ).getData()
  expect(eventRoomDeleted.detail.data.roomId).toEqual(roomId)
})

test("should get a room", async () => {
  const room = generateRoom()
  const roomId = await apiClient.createRoom(room)
  expect(roomId).toBeDefined()

  const res = await apiClient.getRoom(room.propertyId, roomId)
  expect(res).toEqual({ ...room, roomId })
})

test("should get all rooms", async () => {
  const room1 = generateRoom()
  const room2 = generateRoom({ propertyId: room1.propertyId })
  const room3 = generateRoom({ propertyId: room1.propertyId })
  const roomIds = await Promise.all([
    apiClient.createRoom(room1),
    apiClient.createRoom(room2),
    apiClient.createRoom(room3),
  ])

  await eventualAssertion(
    async () => {
      const res = await apiClient.getRooms(room1.propertyId)
      return res
    },
    async (json) => {
      expect(json.length).toEqual(3)
      expect(json.map((r) => r.roomId)).toEqual(
        expect.arrayContaining(roomIds)
      )
    }
  )
})