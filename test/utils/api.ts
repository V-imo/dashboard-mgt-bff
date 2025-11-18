import { hc } from "hono/client"
import { z } from "zod"
import type { Routes } from "../../src/functions/api"
import { AgencySchema } from "../../src/functions/api/agency"
import { PropertySchema } from "../../src/functions/api/property"

export type InspectionInput = {
  inspectionId: string
  propertyId: string
  agencyId: string
  status: "TO_DO" | "IN_PROGRESS" | "DONE" | "CANCELED"
  inspectorId?: string
  date: string
}
export type AgencyInput = Omit<z.infer<typeof AgencySchema>, "agencyId">
export type PropertyInput = Omit<z.infer<typeof PropertySchema>, "propertyId">

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

  async createAgency(agency: Omit<AgencyInput, "agencyId">) {
    const response = await this.client.agency.$post({
      json: agency,
    })
    return response.json()
  }

  async deleteAgency(agencyId: string) {
    const response = await this.client.agency[":agencyId"].$delete({
      param: { agencyId },
    })
    return response.json()
  }

  async getAgency(agencyId: string) {
    const response = await this.client.agency[":agencyId"].$get({
      param: { agencyId },
    })
    return response.json()
  }

  async updateAgency(agency: z.infer<typeof AgencySchema>) {
    const response = await this.client.agency.$patch({
      json: agency,
    })
    return response.json()
  }

  async createProperty(property: PropertyInput) {
    const response = await this.client.property.$post({
      json: property,
    })
    return response.json()
  }

  async deleteProperty(agencyId: string, propertyId: string) {
    const response = await this.client.property[":agencyId"][
      ":propertyId"
    ].$delete({
      param: { agencyId, propertyId },
    })
    return response.json()
  }

  async getProperty(agencyId: string, propertyId: string) {
    const response = await this.client.property[":agencyId"][":propertyId"].$get({
      param: { agencyId, propertyId },
    })
    return response.json()
  }

  async updateProperty(property: PropertyInput & { propertyId: string }) {
    const response = await this.client.property.$patch({
      json: property,
    })
    return response.json()
  }

  async getProperties(agencyId: string) {
    const response = await this.client.property[":agencyId"].$get({
      param: { agencyId },
    })
    return response.json()
  }
}
