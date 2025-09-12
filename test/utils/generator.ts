import { faker } from "@faker-js/faker"
import { InspectionInput } from "./api"

export const InspectionStatus = {
  TO_DO: "TO_DO",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
  CANCELED: "CANCELED",
} as const

export const generateInspection = (): InspectionInput => {
  return {
    inspectionId: faker.string.uuid(),
    propertyId: faker.string.uuid(),
    agencyId: faker.string.uuid(),
    status: faker.helpers.enumValue(InspectionStatus),
    inspectorId: faker.string.uuid(),
    date: faker.date.soon().toISOString(),
  }
}
