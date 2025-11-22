import fs from "fs"
import {
  ServerlessSpyListener,
  createServerlessSpyListener,
} from "serverless-spy"
import {
  AgencyCreatedEvent,
  AgencyCreatedEventEnvelope,
  AgencyUpdatedEvent,
  AgencyUpdatedEventEnvelope,
  AgencyDeletedEvent,
  AgencyDeletedEventEnvelope,
} from "vimo-events"
import { ServerlessSpyEvents } from "../spy"
import { eventualAssertion } from "../utils"
import { ApiClient } from "../utils/api"
import { generateAgency } from "../utils/generator"

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

test("should create an agency", async () => {
  const agency = generateAgency()

  const agencyId = await apiClient.createAgency(agency)

  const eventAgencyCreated = (
    await serverlessSpyListener.waitForEventBridgeEventBus<AgencyCreatedEventEnvelope>(
      {
        condition: ({ detail }) =>
          detail.type === AgencyCreatedEvent.type &&
          detail.data.agencyId === agencyId,
      },
    )
  ).getData()
  expect(eventAgencyCreated.detail.data.name).toEqual(agency.name)

  await eventualAssertion(
    async () => {
      const res = await apiClient.getAgency(agencyId)
      return res
    },
    async (json) => {
      expect(json).toEqual({ ...agency, agencyId })
    },
  )
})

test("should update an agency", async () => {
  const agency = generateAgency()
  const newAgency = generateAgency()

  const agencyId = await apiClient.createAgency(agency)

  await apiClient.updateAgency({ ...newAgency, agencyId })

  const eventAgencyUpdated = (
    await serverlessSpyListener.waitForEventBridgeEventBus<AgencyUpdatedEventEnvelope>(
      {
        condition: ({ detail }) =>
          detail.type === AgencyUpdatedEvent.type &&
          detail.data.agencyId === agencyId,
      },
    )
  ).getData()
  expect(eventAgencyUpdated.detail.data.name).toEqual(newAgency.name)
})

test("should delete an agency", async () => {
  const agency = generateAgency()

  const agencyId = await apiClient.createAgency(agency)

  await apiClient.deleteAgency(agencyId)

  await serverlessSpyListener.waitForEventBridgeEventBus<AgencyDeletedEventEnvelope>(
    {
      condition: ({ detail }) =>
        detail.type === AgencyDeletedEvent.type &&
        detail.data.agencyId === agencyId,
    },
  )
})
