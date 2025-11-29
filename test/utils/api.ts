import { hc } from "hono/client";
import { z } from "zod";
import type { Routes } from "../../src/functions/api";
import { AgencySchema } from "../../src/functions/api/agency";
import { PropertySchema } from "../../src/functions/api/property";
import { InspectionSchema } from "../../src/functions/api/inspection";
import { ModelSchema } from "../../src/functions/api/model";
import { RoomSchema } from "../../src/functions/api/room";
import { RoomElementSchema } from "../../src/functions/api/room-element";

export type InspectionInput = Omit<
  z.infer<typeof InspectionSchema>,
  "inspectionId"
>;
export type AgencyInput = Omit<z.infer<typeof AgencySchema>, "agencyId">;
export type PropertyInput = Omit<z.infer<typeof PropertySchema>, "propertyId">;
export type ModelInput = Omit<z.infer<typeof ModelSchema>, "modelId">;
export type RoomInput = Omit<z.infer<typeof RoomSchema>, "roomId">;
export type RoomElementInput = Omit<
  z.infer<typeof RoomElementSchema>,
  "elementId"
>;

export class ApiClient {
  client: ReturnType<typeof hc<Routes>>;

  constructor(baseUrl: string) {
    this.client = hc<Routes>(baseUrl);
  }

  async getInspections(agencyId: string) {
    const response = await this.client.inspection[":agencyId"].$get({
      param: { agencyId },
    });
    return response.json();
  }

  async getInspectionsByAgencyAndProperty(
    agencyId: string,
    propertyId: string
  ) {
    const response = await this.client.inspection[":agencyId"][
      ":propertyId"
    ].$get({
      param: { agencyId, propertyId },
    });
    return response.json();
  }

  async getInspection(
    agencyId: string,
    propertyId: string,
    inspectionId: string
  ) {
    const response = await this.client.inspection[":agencyId"][":propertyId"][
      ":inspectionId"
    ].$get({
      param: { agencyId, propertyId, inspectionId },
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

  async deleteInspection(
    inspectionId: string,
    agencyId: string,
    propertyId: string
  ) {
    const response = await this.client.inspection[":inspectionId"].$delete({
      param: { inspectionId },
      query: { agencyId, propertyId },
    });
    return response.json();
  }

  async createAgency(agency: Omit<AgencyInput, "agencyId">) {
    const response = await this.client.agency.$post({
      json: agency,
    });
    return response.json();
  }

  async deleteAgency(agencyId: string) {
    const response = await this.client.agency[":agencyId"].$delete({
      param: { agencyId },
    });
    return response.json();
  }

  async getAgency(agencyId: string) {
    const response = await this.client.agency[":agencyId"].$get({
      param: { agencyId },
    });
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

  async deleteProperty(agencyId: string, propertyId: string) {
    const response = await this.client.property[":agencyId"][
      ":propertyId"
    ].$delete({
      param: { agencyId, propertyId },
    });
    return response.json();
  }

  async getProperty(agencyId: string, propertyId: string) {
    const response = await this.client.property[":agencyId"][
      ":propertyId"
    ].$get({
      param: { agencyId, propertyId },
    });
    return response.json();
  }

  async updateProperty(property: PropertyInput & { propertyId: string }) {
    const response = await this.client.property.$patch({
      json: property,
    });
    return response.json();
  }

  async getProperties(agencyId: string) {
    const response = await this.client.property[":agencyId"].$get({
      param: { agencyId },
    });
    return response.json();
  }

  async createModel(model: ModelInput) {
    const response = await this.client.model.$post({
      json: model,
    });
    return response.json();
  }

  async deleteModel(agencyId: string, modelId: string) {
    const response = await this.client.model[":agencyId"][":modelId"].$delete({
      param: { agencyId, modelId },
    });
    return response.json();
  }

  async getModel(agencyId: string, modelId: string) {
    const response = await this.client.model[":agencyId"][":modelId"].$get({
      param: { agencyId, modelId },
    });
    return response.json();
  }

  async updateModel(model: ModelInput & { modelId: string }) {
    const response = await this.client.model.$patch({
      json: model,
    });
    return response.json();
  }

  async getModels(agencyId: string) {
    const response = await this.client.model[":agencyId"].$get({
      param: { agencyId },
    });
    return response.json();
  }

  async createRoom(room: RoomInput) {
    const response = await this.client.room.$post({
      json: room,
    });
    return response.json();
  }

  async deleteRoom(propertyId: string, roomId: string) {
    const response = await this.client.room[":propertyId"][":roomId"].$delete({
      param: { propertyId, roomId },
    });
    return response.json();
  }

  async getRoom(propertyId: string, roomId: string) {
    const response = await this.client.room[":propertyId"][":roomId"].$get({
      param: { propertyId, roomId },
    });
    return response.json();
  }

  async updateRoom(room: RoomInput & { roomId: string }) {
    const response = await this.client.room.$patch({
      json: room,
    });
    return response.json();
  }

  async getRooms(propertyId: string) {
    const response = await this.client.room[":propertyId"].$get({
      param: { propertyId },
    });
    return response.json();
  }

  async createRoomElement(roomElement: RoomElementInput) {
    const response = await this.client["room-element"].$post({
      json: roomElement,
    });
    return response.json();
  }

  async deleteRoomElement(
    propertyId: string,
    roomId: string,
    elementId: string
  ) {
    const response = await this.client["room-element"][":propertyId"][
      ":roomId"
    ][":elementId"].$delete({
      param: { propertyId, roomId, elementId },
    });
    return response.json();
  }

  async getRoomElement(propertyId: string, roomId: string, elementId: string) {
    const response = await this.client["room-element"][":propertyId"][
      ":roomId"
    ][":elementId"].$get({
      param: { propertyId, roomId, elementId },
    });
    return response.json();
  }

  async updateRoomElement(
    roomElement: RoomElementInput & { elementId: string }
  ) {
    const response = await this.client["room-element"].$patch({
      json: roomElement,
    });
    return response.json();
  }

  async getRoomElements(propertyId: string, roomId: string) {
    const response = await this.client["room-element"][":propertyId"][
      ":roomId"
    ].$get({
      param: { propertyId, roomId },
    });
    return response.json();
  }

  async getRoomElementsByProperty(propertyId: string) {
    const response = await this.client["room-element"][":propertyId"].$get({
      param: { propertyId },
    });
    return response.json();
  }
}
