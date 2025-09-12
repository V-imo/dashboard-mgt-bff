import { hc } from "hono/client"
import type { Routes } from "../../src/functions/api"

export type InspectionInput = {
  inspectionId: string
  propertyId: string
  agencyId: string
  status: "TO_DO" | "IN_PROGRESS" | "DONE" | "CANCELED"
  inspectorId?: string
  date: string
}

export class ApiClient {
  client: ReturnType<typeof hc<Routes>>

  constructor(baseUrl: string) {
    this.client = hc<Routes>(baseUrl)
  }

  async getInspections(agencyId: string) {
    const response = await this.client.inspection[":agencyId"].$get({
      param: { agencyId },
    })
    return response.json()
  }

  async createInspection(inspection: Omit<InspectionInput, "inspectionId">) {
    const response = await this.client.inspection.$post({
      json: inspection,
    })
    return response.json()
  }

  async updateInspection(inspection: InspectionInput) {
    const response = await this.client.inspection.$patch({
      json: inspection,
    })
    return response.json()
  }

  async deleteInspection(
    inspectionId: string,
    agencyId: string,
    propertyId: string,
  ) {
    const response = await this.client.inspection[":inspectionId"].$delete({
      param: { inspectionId },
      query: { agencyId, propertyId },
    })
    return response.json()
  }
}
