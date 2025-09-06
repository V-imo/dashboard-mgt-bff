import { faker } from "@faker-js/faker"
import { InspectionInput } from "./api"

export const InspectionStatus = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const

export const generateInspection = () : InspectionInput => {
  return {
    inspectionId: faker.string.uuid(),
    housingId: faker.string.uuid(),
    agencyId: faker.string.uuid(),
    status: faker.helpers.enumValue(InspectionStatus),
    inspectorId: faker.string.uuid(),
  }
}
