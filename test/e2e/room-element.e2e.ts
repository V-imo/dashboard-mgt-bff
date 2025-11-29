import fs from "fs";
import {
  ServerlessSpyListener,
  createServerlessSpyListener,
} from "serverless-spy";
import {
  RoomElementCreatedEventEnvelope,
  RoomElementCreatedEvent,
  RoomElementDeletedEventEnvelope,
  RoomElementDeletedEvent,
  RoomElementUpdatedEventEnvelope,
  RoomElementUpdatedEvent,
} from "vimo-events";
import { ServerlessSpyEvents } from "../spy";
import { eventualAssertion } from "../utils";
import { ApiClient } from "../utils/api";
import { generateRoomElement } from "../utils/generator";

const { ApiUrl, ServerlessSpyWsUrl } = Object.values(
  JSON.parse(fs.readFileSync("test.output.json", "utf8"))
)[0] as Record<string, string>;

const apiClient = new ApiClient(ApiUrl);

let serverlessSpyListener: ServerlessSpyListener<ServerlessSpyEvents>;
beforeEach(async () => {
  serverlessSpyListener =
    await createServerlessSpyListener<ServerlessSpyEvents>({
      serverlessSpyWsUrl: ServerlessSpyWsUrl,
    });
}, 10000);

afterEach(async () => {
  serverlessSpyListener.stop();
});

jest.setTimeout(60000);

test("should create a room element", async () => {
  const roomElement = generateRoomElement();
  const elementId = await apiClient.createRoomElement(roomElement);
  expect(elementId).toBeDefined();

  const eventRoomElementCreated = (
    await serverlessSpyListener.waitForEventBridgeEventBus<RoomElementCreatedEventEnvelope>(
      {
        condition: ({ detail }) =>
          detail.type === RoomElementCreatedEvent.type &&
          detail.data.elementId === elementId,
      }
    )
  ).getData();
  expect(eventRoomElementCreated.detail.data.agencyId).toEqual(
    roomElement.agencyId
  );
});

test("should update a room element", async () => {
  const roomElement = generateRoomElement();
  const elementId = await apiClient.createRoomElement(roomElement);
  expect(elementId).toBeDefined();

  const newRoomElement = generateRoomElement({
    agencyId: roomElement.agencyId,
    propertyId: roomElement.propertyId,
    roomId: roomElement.roomId,
    elementId,
  });
  await apiClient.updateRoomElement(newRoomElement);
  const eventRoomElementUpdated = (
    await serverlessSpyListener.waitForEventBridgeEventBus<RoomElementUpdatedEventEnvelope>(
      {
        condition: ({ detail }) =>
          detail.type === RoomElementUpdatedEvent.type &&
          detail.data.elementId === elementId,
      }
    )
  ).getData();
  expect(eventRoomElementUpdated.detail.data.name).toEqual(newRoomElement.name);
});

test("should delete a room element", async () => {
  const roomElement = generateRoomElement();
  const elementId = await apiClient.createRoomElement(roomElement);
  expect(elementId).toBeDefined();

  await apiClient.deleteRoomElement(
    roomElement.propertyId,
    roomElement.roomId,
    elementId
  );
  const eventRoomElementDeleted = (
    await serverlessSpyListener.waitForEventBridgeEventBus<RoomElementDeletedEventEnvelope>(
      {
        condition: ({ detail }) =>
          detail.type === RoomElementDeletedEvent.type &&
          detail.data.elementId === elementId,
      }
    )
  ).getData();
  expect(eventRoomElementDeleted.detail.data.propertyId).toEqual(roomElement.propertyId);
});

test("should get a room element", async () => {
  const roomElement = generateRoomElement();
  const elementId = await apiClient.createRoomElement(roomElement);
  expect(elementId).toBeDefined();

  const res = await apiClient.getRoomElement(
    roomElement.propertyId,
    roomElement.roomId,
    elementId
  );
  expect(res).toEqual({ ...roomElement, elementId });
});

test("should get all room elements by property", async () => {
  const roomElement1 = generateRoomElement();
  const roomElement2 = generateRoomElement({
    propertyId: roomElement1.propertyId,
  });
  const roomElement3 = generateRoomElement({
    propertyId: roomElement1.propertyId,
  });
  const elementIds = await Promise.all([
    apiClient.createRoomElement(roomElement1),
    apiClient.createRoomElement(roomElement2),
    apiClient.createRoomElement(roomElement3),
  ]);

  await eventualAssertion(
    async () => {
      const res = await apiClient.getRoomElementsByProperty(
        roomElement1.propertyId
      );
      return res;
    },
    async (json) => {
      expect(json.length).toEqual(3)
      expect(json.map((r) => r.elementId)).toEqual(
        expect.arrayContaining(elementIds)
      )
    }
  );
});
