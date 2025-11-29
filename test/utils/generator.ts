import { faker } from "@faker-js/faker";
import {
  AgencyInput,
  InspectionInput,
  ModelInput,
  PropertyInput,
  RoomInput,
  RoomElementInput,
} from "./api";

export const InspectionStatus = {
  TO_DO: "TO_DO",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
  CANCELED: "CANCELED",
} as const;

export const RoomElementTypes = [
  "FURNITURE",
  "STRUCTURAL",
  "ELECTRICAL",
  "PLUMBING",
  "VENTILATION",
  "SURFACE",
  "OTHER",
] as const;

export const InspectionElementStatus = [
  "GOOD",
  "BAD",
  "NEW",
  "BROKEN",
] as const;

const makeGenerator =
  <T>(generator: () => T) =>
  (overrides: Partial<T> = {}) => ({ ...generator(), ...overrides });

export const generateInspection = makeGenerator<InspectionInput>(() => {
  return {
    inspectionId: faker.string.uuid(),
    propertyId: faker.string.uuid(),
    agencyId: faker.string.uuid(),
    status: faker.helpers.enumValue(InspectionStatus),
    inspectorId: faker.string.uuid(),
    date: faker.date.soon().toISOString(),
    elements: generateInspectionElements(),
  };
});
const generateInspectionElements = () => {
  return Array.from({ length: faker.number.int({ min: 0, max: 5 }) }, () => ({
    elementId: faker.string.uuid(),
    name: faker.lorem.word(),
    description: faker.lorem.sentence(),
    state: InspectionElementStatus[
      Math.floor(Math.random() * InspectionElementStatus.length)
    ] as (typeof InspectionElementStatus)[number],
  }));
};
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
  };
});
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
  };
});
export const generateModel = makeGenerator<ModelInput & { modelId: string }>(
  () => {
    return {
      modelId: faker.string.uuid(),
      agencyId: faker.string.uuid(),
      name: faker.company.name(),
      rooms: generateRooms(),
    };
  }
);

export const generateRooms = () => {
  const roomCount = faker.number.int({ min: 1, max: 10 });
  return Array.from({ length: roomCount }, () => {
    const elementCount = faker.number.int({ min: 0, max: 5 });
    return {
      name: faker.helpers.arrayElement([
        "Living Room",
        "Bedroom",
        "Kitchen",
        "Bathroom",
        "Dining Room",
        "Office",
        "Basement",
        "Attic",
        "Garage",
        "Hallway",
      ]),
      area: faker.helpers.maybe(() =>
        faker.number.float({ min: 5, max: 100, fractionDigits: 2 })
      ),
      description: faker.helpers.maybe(() => faker.lorem.sentence()),
      elements: Array.from({ length: elementCount }, () => ({
        name: faker.helpers.arrayElement([
          "Window",
          "Door",
          "Wall",
          "Floor",
          "Ceiling",
          "Light Fixture",
          "Outlet",
          "Sink",
          "Cabinet",
          "Appliance",
        ]),
        description: faker.helpers.maybe(() => faker.lorem.sentence()),
        images: faker.helpers.maybe(() =>
          Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () =>
            faker.image.url()
          )
        ),
        type: RoomElementTypes[
          Math.floor(Math.random() * RoomElementTypes.length)
        ],
      })),
    };
  });
};
export const generateRoom = makeGenerator<RoomInput & { roomId: string }>(
  () => {
    return {
      roomId: faker.string.uuid(),
      agencyId: faker.string.uuid(),
      propertyId: faker.string.uuid(),
      name: faker.string.uuid(),
      description: faker.lorem.sentence(),
      area: faker.number.float({ min: 5, max: 100, fractionDigits: 2 }),
    };
  }
);
export const generateRoomElement = makeGenerator<
  RoomElementInput & { elementId: string }
>(() => {
  return {
    elementId: faker.string.uuid(),
    propertyId: faker.string.uuid(),
    roomId: faker.string.uuid(),
    agencyId: faker.string.uuid(),
    name: faker.lorem.word(),
    description: faker.lorem.sentence(),
    type: RoomElementTypes[
      Math.floor(Math.random() * RoomElementTypes.length)
    ] as (typeof RoomElementTypes)[number],
  };
});
