import { faker } from "@faker-js/faker"
import { AgencyInput, InspectionInput } from "./api"

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
export const generateAgency = (): AgencyInput => {
  return {
    name: faker.company.name(),
    contactMail: faker.internet.email(),
    contactPhone: faker.phone.number(),
    address: {
      number: faker.location.buildingNumber(),
      street: faker.location.street(),
      city: faker.location.city(),
      zipCode: faker.location.zipCode(),
      country: faker.location.country(),
    },
  }
}