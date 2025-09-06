import { hc } from "hono/client"
import type { Routes } from "../../src/functions/api"

export type InspectionInput = {
  inspectionId: string
  housingId: string
  agencyId: string
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  inspectorId: string
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
    housingId: string,
  ) {
    const response = await this.client.inspection[":inspectionId"].$delete({
      param: { inspectionId },
      query: { agencyId, housingId },
    })
    return response.json()
  }
}
