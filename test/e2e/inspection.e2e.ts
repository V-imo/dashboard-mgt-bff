import fs from "fs";
import {
  ServerlessSpyListener,
  createServerlessSpyListener,
} from "serverless-spy";
import {
  InspectionCreatedEvent,
  InspectionCreatedEventEnvelope,
  InspectionUpdatedEvent,
  InspectionUpdatedEventEnvelope,
  InspectionDeletedEvent,
  InspectionDeletedEventEnvelope,
} from "vimo-events";
import { ServerlessSpyEvents } from "../spy";
import { eventualAssertion } from "../utils";
import { ApiClient } from "../utils/api";
import { generateInspection } from "../utils/generator";

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

test("should create an inspection", async () => {
  const inspection = generateInspection();

  const inspectionId = await apiClient.createInspection(inspection);

  const eventInspectionCreated = (
    await serverlessSpyListener.waitForEventBridgeEventBus<InspectionCreatedEventEnvelope>(
      {
        condition: ({ detail }) =>
          detail.type === InspectionCreatedEvent.type &&
          detail.data.inspectionId === inspectionId,
        timoutMs: 30000,
      }
    )
  ).getData();
  expect(eventInspectionCreated.detail.data.date).toMatch(inspection.date);
});

test("should modify an inspection", async () => {
  const inspection = generateInspection();
  const inspectionId = await apiClient.createInspection(inspection);

  const newInspection = {
    ...inspection,
    inspectionId,
    agencyId: inspection.agencyId,
    status: "IN_PROGRESS" as const,
  };

  await eventualAssertion(
    async () => {
      const res = await apiClient.updateInspection(newInspection);
      return res;
    },
    async (res) => {
      expect(res).toBe("Inspection updated");
    }
  );

  const eventInspectionUpdated = (
    await serverlessSpyListener.waitForEventBridgeEventBus<InspectionUpdatedEventEnvelope>(
      {
        condition: ({ detail }) =>
          detail.type === InspectionUpdatedEvent.type &&
          detail.data.inspectionId === inspectionId,
        timoutMs: 30000,
      }
    )
  ).getData();
  expect(eventInspectionUpdated.detail.data.status).toEqual(
    newInspection.status
  );
  expect(eventInspectionUpdated.detail.data.inspectorId).toEqual(
    newInspection.inspectorId
  );
});

test("should delete an inspection", async () => {
  const inspection = generateInspection();

  const inspectionId = await apiClient.createInspection(inspection);

  await eventualAssertion(
    async () => {
      const res = await apiClient.deleteInspection(
        inspectionId,
        inspection.agencyId,
        inspection.propertyId
      );
      return res;
    },
    async (res) => {
      expect(res).toBe("Inspection deleted");
    }
  );

  const eventInspectionDeleted = (
    await serverlessSpyListener.waitForEventBridgeEventBus<InspectionDeletedEventEnvelope>(
      {
        condition: ({ detail }) =>
          detail.type === InspectionDeletedEvent.type &&
          detail.data.inspectionId === inspectionId,
        timoutMs: 30000,
      }
    )
  ).getData();
  expect(eventInspectionDeleted.detail.data.inspectionId).toEqual(inspectionId);
});

test("should get a lot of inspections", async () => {
  const inspection1 = generateInspection();
  const inspection2 = generateInspection({
    agencyId: inspection1.agencyId,
    propertyId: inspection1.propertyId,
  });
  const inspection3 = generateInspection({
    agencyId: inspection1.agencyId,
    propertyId: inspection1.propertyId,
  });
  const inspection4 = generateInspection({ agencyId: inspection1.agencyId });
  const inspection5 = generateInspection({
    agencyId: inspection1.agencyId,
    propertyId: inspection4.propertyId,
  });

  const inspectionIds = await Promise.all([
    apiClient.createInspection(inspection1),
    apiClient.createInspection(inspection2),
    apiClient.createInspection(inspection3),
    apiClient.createInspection(inspection4),
    apiClient.createInspection(inspection5),
  ]);

  await eventualAssertion(
    async () => {
      const res = await apiClient.getInspections(inspection1.agencyId);
      return res;
    },
    async (json) => {
      expect(json.length).toEqual(5);
    }
  );
  await eventualAssertion(
    async () => {
      const res = await apiClient.getInspectionsByAgencyAndProperty(
        inspection1.agencyId,
        inspection1.propertyId
      );
      return res;
    },
    async (json) => {
      expect(json.length).toEqual(3);
    }
  );
  await eventualAssertion(
    async () => {
      const res = await apiClient.getInspection(
        inspection1.agencyId,
        inspection1.propertyId,
        inspectionIds[0]
      );
      return res;
    },
    async (json) => {
      expect(json).toEqual({...inspection1, inspectionId: inspectionIds[0]});
    }
  );
});
