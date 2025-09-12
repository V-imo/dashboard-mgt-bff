import fs from "fs"
import {
  ServerlessSpyListener,
  createServerlessSpyListener,
} from "serverless-spy"
import {
  InspectionCreatedEvent,
  InspectionCreatedEventEnvelope,
  InspectionUpdatedEvent,
  InspectionUpdatedEventEnvelope,
  InspectionDeletedEvent,
  InspectionDeletedEventEnvelope,
} from "vimo-events"
import { ServerlessSpyEvents } from "../spy"
import { eventualAssertion } from "../utils"
import { ApiClient } from "../utils/api"
import { generateInspection } from "../utils/generator"

const { ApiUrl, ServerlessSpyWsUrl } = Object.values(
  JSON.parse(fs.readFileSync("test.output.json", "utf8")),
)[0] as Record<string, string>

const apiClient = new ApiClient(ApiUrl)

let serverlessSpyListener: ServerlessSpyListener<ServerlessSpyEvents>
beforeEach(async () => {
  const errors: any[] = []
  serverlessSpyListener =
    await createServerlessSpyListener<ServerlessSpyEvents>({
      serverlessSpyWsUrl: ServerlessSpyWsUrl, // keep as host/scope, no scheme
      debugMode: true,
      connectionOpenReject: (err) => {
        errors.push(err)
      },
    })
}, 10000)

afterEach(async () => {
  serverlessSpyListener.stop()
})

jest.setTimeout(60000)

test("should create an inspection", async () => {
  const inspection = generateInspection()

  const inspectionId = await apiClient.createInspection(inspection)

  await eventualAssertion(
    async () => {
      const res = await apiClient.getInspections(inspection.agencyId)
      return res
    },
    async (json) => {
      const result = json[0]
      expect(result).toBeDefined()
      expect(result?.inspectionId).toEqual(inspectionId)
      expect(result?.propertyId).toEqual(inspection.propertyId)
      expect(result?.agencyId).toEqual(inspection.agencyId)
      expect(result?.status).toEqual(inspection.status)
      expect(result?.inspectorId).toEqual(inspection.inspectorId)
      expect(result?.date).toBeDefined()
    },
  )

  const eventInspectionCreated = (
    await serverlessSpyListener.waitForEventBridgeEventBus<InspectionCreatedEventEnvelope>(
      {
        condition: ({ detail }) =>
          detail.type === InspectionCreatedEvent.type &&
          detail.data.inspectionId === inspectionId,
        timoutMs: 30000,
      },
    )
  ).getData()
  expect(eventInspectionCreated.detail.data.date).toMatch(inspection.date)
})

test("should modify an inspection", async () => {
  const inspection = generateInspection()

  const inspectionId = await apiClient.createInspection(inspection)

  const newInspection = {
    ...inspection,
    inspectionId,
    agencyId: inspection.agencyId,
    propertyId: inspection.propertyId,
    status: "IN_PROGRESS" as const,
  }

  await eventualAssertion(
    async () => {
      const res = await apiClient.updateInspection(newInspection)
      return res
    },
    async (res) => {
      expect(res).toBe("Inspection updated")
    },
  )

  await eventualAssertion(
    async () => {
      const res = await apiClient.getInspections(inspection.agencyId)
      return res
    },
    async (json) => {
      const result = json[0]
      expect(result).toBeDefined()
      expect(result?.status).toEqual(newInspection.status)
      expect(result?.inspectorId).toEqual(newInspection.inspectorId)
    },
  )

  const eventInspectionUpdated = (
    await serverlessSpyListener.waitForEventBridgeEventBus<InspectionUpdatedEventEnvelope>(
      {
        condition: ({ detail }) =>
          detail.type === InspectionUpdatedEvent.type &&
          detail.data.inspectionId === inspectionId,
        timoutMs: 30000,
      },
    )
  ).getData()
  expect(eventInspectionUpdated.detail.data.status).toEqual(newInspection.status)
  expect(eventInspectionUpdated.detail.data.inspectorId).toEqual(newInspection.inspectorId)
})

test("should delete an inspection", async () => {
  const inspection = generateInspection()

  const inspectionId = await apiClient.createInspection(inspection)

  await eventualAssertion(
    async () => {
      const res = await apiClient.deleteInspection(
        inspectionId,
        inspection.agencyId,
        inspection.propertyId,
      )
      return res
    },
    async (res) => {
      expect(res).toBe("Inspection deleted")
    },
  )

  await eventualAssertion(
    async () => {
      const res = await apiClient.getInspections(inspection.agencyId)
      return res
    },
    async (json) => {
      const result = json[0]
      expect(result).toBeUndefined()
    },
  )

  const eventInspectionDeleted = (
    await serverlessSpyListener.waitForEventBridgeEventBus<InspectionDeletedEventEnvelope>(
      {
        condition: ({ detail }) =>
          detail.type === InspectionDeletedEvent.type &&
          detail.data.inspectionId === inspectionId,
        timoutMs: 30000,
      },
    )
  ).getData()
  expect(eventInspectionDeleted.detail.data.inspectionId).toEqual(inspectionId)
})

test("should get a lot of inspections", async () => {
  const inspection = generateInspection()

  await Promise.all([
    apiClient.createInspection(inspection),
    apiClient.createInspection(inspection),
    apiClient.createInspection(inspection),
    apiClient.createInspection(inspection),
    apiClient.createInspection(inspection),
  ])

  await eventualAssertion(
    async () => {
      const res = await apiClient.getInspections(inspection.agencyId)
      return res
    },
    async (json) => {
      expect(json.length).toEqual(5)
    },
  )
})
