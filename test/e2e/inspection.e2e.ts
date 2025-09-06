import fs from "fs"
import { eventualAssertion } from "../utils"
import { ApiClient } from "../utils/api"
import { generateInspection } from "../utils/generator"

const { ApiUrl } = Object.values(
  JSON.parse(fs.readFileSync("test.output.json", "utf8")),
)[0] as Record<string, string>

const apiClient = new ApiClient(ApiUrl)

jest.setTimeout(120000)

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
      expect(result?.housingId).toEqual(inspection.housingId)
      expect(result?.agencyId).toEqual(inspection.agencyId)
      expect(result?.status).toEqual(inspection.status)
      expect(result?.inspectorId).toEqual(inspection.inspectorId)
    },
  )
})

test("should modify an inspection", async () => {
  const inspection = generateInspection()

  const inspectionId = await apiClient.createInspection(inspection)

  const newInspection = {
    ...inspection,
    inspectionId,
    agencyId: inspection.agencyId,
    housingId: inspection.housingId,
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
})

test("should delete an inspection", async () => {
  const inspection = generateInspection()

  const inspectionId = await apiClient.createInspection(inspection)

  await eventualAssertion(
    async () => {
      const res = await apiClient.deleteInspection(
        inspectionId,
        inspection.agencyId,
        inspection.housingId,
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
