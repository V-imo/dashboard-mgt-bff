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

  await eventualAssertion(async () => {
    const res = await apiClient.getAgency(agencyId)
    return res
  })
})

test("should update an agency", async () => {
  const agency = generateAgency()
  const newAgency = generateAgency()

  const agencyId = await apiClient.createAgency(agency)

  await apiClient.updateAgency({ ...newAgency, agencyId })

  await eventualAssertion(async () => {
    const res = await apiClient.getAgency(agencyId)
    return res
  })
})

test("should delete an agency", async () => {
  const agency = generateAgency()

  const agencyId = await apiClient.createAgency(agency)

  await apiClient.deleteAgency(agencyId)

  await eventualAssertion(
    async () => {
      const res = await apiClient.getAgency(agencyId)
      return res
    },
    async (res) => {
      expect((res as unknown as { message: string }).message).toBeDefined()
    },
  )
})
