import { faker } from "@faker-js/faker"
import { AgencyInput, InspectionInput, PropertyInput } from "./api"

export const InspectionStatus = {
  TO_DO: "TO_DO",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
  CANCELED: "CANCELED",
} as const

const makeGenerator =
  <T>(generator: () => T) =>
  (overrides: Partial<T> = {}) => ({ ...generator(), ...overrides })

export const generateInspection = makeGenerator<InspectionInput>(() => {
  return {
    inspectionId: faker.string.uuid(),
    propertyId: faker.string.uuid(),
    agencyId: faker.string.uuid(),
    status: faker.helpers.enumValue(InspectionStatus),
    inspectorId: faker.string.uuid(),
    date: faker.date.soon().toISOString(),
  }
})
export const generateAgency = makeGenerator<AgencyInput>(() => {
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
})
export const generateProperty = makeGenerator<
  PropertyInput & { propertyId: string }
>(() => {
  return {
    propertyId: faker.string.uuid(),
    agencyId: faker.string.uuid(),
    address: {
      number: faker.location.buildingNumber(),
      street: faker.location.street(),
      city: faker.location.city(),
      zipCode: faker.location.zipCode(),
      country: faker.location.country(),
    },
    owner: {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      mail: faker.internet.email(),
      phoneNumber: faker.phone.number(),
    },
    rooms: faker.helpers.arrayElement([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
  }
})
