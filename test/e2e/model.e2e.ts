import fs from "fs";
import {
  ServerlessSpyListener,
  createServerlessSpyListener,
} from "serverless-spy";
import {
  ModelCreatedEventEnvelope,
  ModelCreatedEvent,
  ModelDeletedEventEnvelope,
  ModelDeletedEvent,
  ModelUpdatedEventEnvelope,
  ModelUpdatedEvent,
} from "vimo-events";
import { ServerlessSpyEvents } from "../spy";
import { eventualAssertion } from "../utils";
import { ApiClient } from "../utils/api";
import { generateModel } from "../utils/generator";
import { createEmployee } from "../utils/auth";

const { ApiUrl, ServerlessSpyWsUrl, UserPoolId, UserPoolClientId } = Object.values(
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

test("should create a model", async () => {
  const model = generateModel();
  const user = await createEmployee({
    userPoolId: UserPoolId,
    clientId: UserPoolClientId,
    agencyId: model.agencyId,
  });
  const apiClient = new ApiClient(ApiUrl, user.idToken);
  const modelId = await apiClient.createModel(model);
  expect(modelId).toBeDefined();

  const eventModelCreated = (
    await serverlessSpyListener.waitForEventBridgeEventBus<ModelCreatedEventEnvelope>(
      {
        condition: ({ detail }) =>
          detail.type === ModelCreatedEvent.type &&
          detail.data.modelId === modelId,
      }
    )
  ).getData();
  expect(eventModelCreated.detail.data.agencyId).toEqual(model.agencyId);
});

test("should update a model", async () => {
  const model = generateModel();
  const user = await createEmployee({
    userPoolId: UserPoolId,
    clientId: UserPoolClientId,
    agencyId: model.agencyId,
  });
  const apiClient = new ApiClient(ApiUrl, user.idToken);
  const modelId = await apiClient.createModel(model);
  expect(modelId).toBeDefined();

  const newModel = generateModel({
    agencyId: model.agencyId,
    modelId,
  });
  await apiClient.updateModel(newModel);
  await eventualAssertion(
    async () => {
      const res = await apiClient.getModel(modelId);
      return res;
    },
    async (json) => {
      expect(json).toEqual(newModel);
    }
  );
  const eventModelUpdated = (
    await serverlessSpyListener.waitForEventBridgeEventBus<ModelUpdatedEventEnvelope>(
      {
        condition: ({ detail }) =>
          detail.type === ModelUpdatedEvent.type &&
          detail.data.modelId === modelId,
      }
    )
  ).getData();
  expect(eventModelUpdated.detail.data.name).toEqual(newModel.name);
});

test("should delete a model", async () => {
  const model = generateModel();

  const user = await createEmployee({
    userPoolId: UserPoolId,
    clientId: UserPoolClientId,
    agencyId: model.agencyId,
  });
  const apiClient = new ApiClient(ApiUrl, user.idToken);
  const modelId = await apiClient.createModel(model);
  expect(modelId).toBeDefined();

  await apiClient.deleteModel(modelId);
  await eventualAssertion(
    async () => {
      const res = await apiClient.getModel(modelId);
      return res;
    },
    async (json) => {
      expect((json as unknown as { message: string }).message).toBeDefined();
    }
  );
  const eventModelDeleted = (
    await serverlessSpyListener.waitForEventBridgeEventBus<ModelDeletedEventEnvelope>(
      {
        condition: ({ detail }) =>
          detail.type === ModelDeletedEvent.type &&
          detail.data.modelId === modelId,
      }
    )
  ).getData();
  expect(eventModelDeleted.detail.data.modelId).toEqual(modelId);
});

test("should query models", async () => {
  const model = generateModel();
  const model2 = generateModel({ agencyId: model.agencyId });
  const model3 = generateModel({ agencyId: model.agencyId });
  const user = await createEmployee({
    userPoolId: UserPoolId,
    clientId: UserPoolClientId,
    agencyId: model.agencyId,
  });
  const apiClient = new ApiClient(ApiUrl, user.idToken);
  const modelIds = await Promise.all([
    apiClient.createModel(model),
    apiClient.createModel(model2),
    apiClient.createModel(model3),
  ]);
  expect(modelIds.length).toEqual(3);

  await eventualAssertion(
    async () => {
      const res = await apiClient.getModels();
      return res;
    },
    async (json) => {
      expect(json.length).toEqual(3);
      expect(json.map((m) => m.modelId)).toEqual(
        expect.arrayContaining(modelIds)
      );
    }
  );
});
