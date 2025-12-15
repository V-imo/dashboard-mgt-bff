import { hc } from "hono/client";
import { z } from "zod";
import type { Routes } from "../../src/functions/api";
import { AgencySchema } from "../../src/functions/api/agency";
import { PropertySchema } from "../../src/functions/api/property";
import { InspectionSchema } from "../../src/functions/api/inspection";
import { ModelSchema } from "../../src/functions/api/model";

export type InspectionInput = Omit<
  z.infer<typeof InspectionSchema>,
  "inspectionId"
>;
export type AgencyInput = Omit<z.infer<typeof AgencySchema>, "agencyId">;
export type PropertyInput = Omit<z.infer<typeof PropertySchema>, "propertyId">;
export type ModelInput = Omit<z.infer<typeof ModelSchema>, "modelId">;

export class ApiClient {
  client: ReturnType<typeof hc<Routes>>;

  constructor(baseUrl: string, userId?: string) {
    this.client = hc<Routes>(baseUrl, {
      headers: { Authorization: userId ?? "" },
    });
  }

  async getInspections() {
    const response = await this.client.inspection.$get();
    return response.json();
  }

  async getInspectionsByProperty(propertyId: string) {
    const response = await this.client.inspection[":propertyId"].$get({
      param: { propertyId },
    });
    return response.json();
  }

  async getInspection(propertyId: string, inspectionId: string) {
    const response = await this.client.inspection[":propertyId"][
      ":inspectionId"
    ].$get({
      param: { propertyId, inspectionId },
    });
    return response.json();
  }

  async createInspection(inspection: InspectionInput) {
    const response = await this.client.inspection.$post({
      json: inspection,
    });
    return response.json();
  }

  async updateInspection(
    inspection: InspectionInput & { inspectionId: string }
  ) {
    const response = await this.client.inspection.$patch({
      json: inspection,
    });
    return response.json();
  }

  async deleteInspection(inspectionId: string, propertyId: string) {
    const response = await this.client.inspection[":inspectionId"].$delete({
      param: { inspectionId },
      query: { propertyId },
    });
    return response.json();
  }

  async getAgency() {
    const response = await this.client.agency.$get();
    return response.json();
  }

  async updateAgency(agency: z.infer<typeof AgencySchema>) {
    const response = await this.client.agency.$patch({
      json: agency,
    });
    return response.json();
  }

  async createProperty(property: PropertyInput) {
    const response = await this.client.property.$post({
      json: property,
    });
    return response.json();
  }

  async deleteProperty(propertyId: string) {
    const response = await this.client.property[":propertyId"].$delete({
      param: { propertyId },
    });
    return response.json();
  }

  async getProperty(propertyId: string) {
    const response = await this.client.property[":propertyId"].$get({
      param: { propertyId },
    });
    return response.json();
  }

  async updateProperty(property: PropertyInput & { propertyId: string }) {
    const response = await this.client.property.$patch({
      json: property,
    });
    return response.json();
  }

  async getProperties() {
    const response = await this.client.property.$get();
    return response.json();
  }

  async createModel(model: ModelInput) {
    const response = await this.client.model.$post({
      json: model,
    });
    return response.json();
  }

  async deleteModel(modelId: string) {
    const response = await this.client.model[":modelId"].$delete({
      param: { modelId },
    });
    return response.json();
  }

  async getModel(modelId: string) {
    const response = await this.client.model[":modelId"].$get({
      param: { modelId },
    });
    return response.json();
  }

  async updateModel(model: ModelInput & { modelId: string }) {
    const response = await this.client.model.$patch({
      json: model,
    });
    return response.json();
  }

  async getModels() {
    const response = await this.client.model.$get();
    return response.json();
  }
}
