import fs from "fs";
import {
  ServerlessSpyListener,
  createServerlessSpyListener,
} from "serverless-spy";
import {
  PropertyCreatedEventEnvelope,
  PropertyCreatedEvent,
  PropertyDeletedEventEnvelope,
  PropertyDeletedEvent,
  PropertyUpdatedEventEnvelope,
  PropertyUpdatedEvent,
} from "vimo-events";
import { ServerlessSpyEvents } from "../spy";
import { eventualAssertion } from "../utils";
import { ApiClient } from "../utils/api";
import { generateProperty } from "../utils/generator";
import { createEmployee } from "../utils/auth";

const { ApiUrl, ServerlessSpyWsUrl, UserPoolId, UserPoolClientId } = Object.values(
  JSON.parse(fs.readFileSync("test.output.json", "utf8"))
)[0] as Record<string, string>;

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

test("should create a property", async () => {
  const property = generateProperty();
  const user = await createEmployee({
    userPoolId: UserPoolId,
    clientId: UserPoolClientId,
    agencyId: property.agencyId,
  });
  const apiClient = new ApiClient(ApiUrl, user.idToken);
  const propertyId = await apiClient.createProperty(property);
  expect(propertyId).toBeDefined();

  const eventPropertyCreated = (
    await serverlessSpyListener.waitForEventBridgeEventBus<PropertyCreatedEventEnvelope>(
      {
        condition: ({ detail }) =>
          detail.type === PropertyCreatedEvent.type &&
          detail.data.propertyId === propertyId,
      }
    )
  ).getData();
  expect(eventPropertyCreated.detail.data.agencyId).toEqual(property.agencyId);

  await eventualAssertion(
    async () => {
      const res = await apiClient.getProperty(propertyId);
      return res;
    },
    async (json) => {
      expect(json).toEqual({ ...property, propertyId });
    }
  );
});

test("should delete a property", async () => {
  const property = generateProperty();
  const user = await createEmployee({
    userPoolId: UserPoolId,
    clientId: UserPoolClientId,
    agencyId: property.agencyId,
  });
  const apiClient = new ApiClient(ApiUrl, user.idToken);
  const propertyId = await apiClient.createProperty(property);
  expect(propertyId).toBeDefined();

  await apiClient.deleteProperty(propertyId);

  const eventPropertyDeleted = (
    await serverlessSpyListener.waitForEventBridgeEventBus<PropertyDeletedEventEnvelope>(
      {
        condition: ({ detail }) =>
          detail.type === PropertyDeletedEvent.type &&
          detail.data.propertyId === propertyId,
      }
    )
  ).getData();
  expect(eventPropertyDeleted.detail.data.propertyId).toEqual(propertyId);
  await eventualAssertion(
    async () => {
      const res = await apiClient.getProperty(propertyId);
      return res;
    },
    async (json) => {
      expect((json as unknown as { message: string }).message).toBeDefined();
    }
  );
});

test("should update a property", async () => {
  let property = generateProperty();
  const user = await createEmployee({
    userPoolId: UserPoolId,
    clientId: UserPoolClientId,
    agencyId: property.agencyId,
  });
  const apiClient = new ApiClient(ApiUrl, user.idToken);
  const propertyId = await apiClient.createProperty(property);
  expect(propertyId).toBeDefined();

  const newProperty = generateProperty({
    agencyId: property.agencyId,
    propertyId,
  });
  await apiClient.updateProperty(newProperty);

  await eventualAssertion(
    async () => {
      const res = await apiClient.getProperty(propertyId);
      return res;
    },
    async (json) => {
      expect(json).toEqual(newProperty);
    }
  );
  const eventPropertyUpdated = (
    await serverlessSpyListener.waitForEventBridgeEventBus<PropertyUpdatedEventEnvelope>(
      {
        condition: ({ detail }) =>
          detail.type === PropertyUpdatedEvent.type &&
          detail.data.agencyId === property.agencyId &&
          detail.data.propertyId === propertyId,
      }
    )
  ).getData();
  expect(eventPropertyUpdated.detail.data.propertyId).toEqual(propertyId);
});

test("should query properties", async () => {
  const property = generateProperty();
  const user = await createEmployee({
    userPoolId: UserPoolId,
    clientId: UserPoolClientId,
    agencyId: property.agencyId,
  });
  const apiClient = new ApiClient(ApiUrl, user.idToken);
  const anotherProperty = generateProperty({ agencyId: property.agencyId });
  const stillAnotherProperty = generateProperty({
    agencyId: property.agencyId,
  });

  const [propertyId, anotherPropertyId, stillAnotherPropertyId] =
    await Promise.all([
      apiClient.createProperty(property),
      apiClient.createProperty(anotherProperty),
      apiClient.createProperty(stillAnotherProperty),
    ]);
  expect(propertyId).toBeDefined();
  expect(anotherPropertyId).toBeDefined();
  expect(stillAnotherPropertyId).toBeDefined();

  await eventualAssertion(
    async () => {
      const res = await apiClient.getProperties();
      return res;
    },
    async (json) => {
      expect(json.length).toEqual(3);
      expect(json.map((p) => p.propertyId)).toEqual(
        expect.arrayContaining([
          propertyId,
          anotherPropertyId,
          stillAnotherPropertyId,
        ])
      );
    }
  );
});
