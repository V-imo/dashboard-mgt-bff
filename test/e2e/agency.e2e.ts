import fs from "fs";
import {
  ServerlessSpyListener,
  createServerlessSpyListener,
} from "serverless-spy";
import {
  AgencyCreatedEvent,
  AgencyUpdatedEvent,
  AgencyUpdatedEventEnvelope,
} from "vimo-events";
import { ServerlessSpyEvents } from "../spy";
import { EventBridge, eventualAssertion } from "../utils";
import { ApiClient } from "../utils/api";
import { generateAgency } from "../utils/generator";
import { createEmployee } from "../utils/auth";

const {
  ApiUrl,
  ServerlessSpyWsUrl,
  UserPoolId,
  UserPoolClientId,
  EventBusName,
} = Object.values(
  JSON.parse(fs.readFileSync("test.output.json", "utf8"))
)[0] as Record<string, string>;
process.env.EVENT_BUS_NAME = EventBusName;

const eventBridge = new EventBridge(EventBusName);

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

jest.setTimeout(30000);

test("should get the agency", async () => {
  const agency = generateAgency();
  const [user] = await Promise.all([
    createEmployee({
      userPoolId: UserPoolId,
      clientId: UserPoolClientId,
      agencyId: agency.agencyId,
    }),
    eventBridge.send(AgencyCreatedEvent.build(agency)),
  ]);
  const apiClient = new ApiClient(ApiUrl, user.idToken);

  await eventualAssertion(
    async () => await apiClient.getAgency(),
    (res) => {
      expect(res).not.toHaveProperty("message");
      expect((res as { name: string }).name).toEqual(agency.name);
    }
  );
});

test("should update an agency", async () => {
  const agency = generateAgency();
  const newAgency = generateAgency({ agencyId: agency.agencyId });

  const [user] = await Promise.all([
    createEmployee({
      userPoolId: UserPoolId,
      clientId: UserPoolClientId,
      agencyId: agency.agencyId,
    }),
    eventBridge.send(AgencyCreatedEvent.build(agency)),
  ]);
  const apiClient = new ApiClient(ApiUrl, user.idToken);

  await eventualAssertion(
    async () => {
      return await apiClient.updateAgency(newAgency);
    },
    (res) => {
      expect(res).toBe("Agency updated");
    }
  );

  const eventAgencyUpdated = (
    await serverlessSpyListener.waitForEventBridgeEventBus<AgencyUpdatedEventEnvelope>(
      {
        condition: ({ detail }) =>
          detail.type === AgencyUpdatedEvent.type &&
          detail.data.agencyId === agency.agencyId,
      }
    )
  ).getData();
  expect(eventAgencyUpdated.detail.data.name).toEqual(newAgency.name);
});
