import { EventBridgeClient } from "@aws-sdk/client-eventbridge"
import { unmarshall } from "@aws-sdk/util-dynamodb"
import type { DynamoDBStreamEvent, DynamoDBStreamRecord } from "aws-lambda"
import { EntityParser } from "dynamodb-toolbox"
import {
  InspectionCreatedEvent,
  InspectionDeletedEvent,
  InspectionUpdatedEvent,
  AgencyCreatedEvent,
  AgencyDeletedEvent,
  AgencyUpdatedEvent,
  PropertyCreatedEvent,
  PropertyDeletedEvent,
  PropertyUpdatedEvent,
} from "vimo-events"
import { AgencyEntity } from "../core/agency/agency.entity"
import { InspectionEntity } from "../core/inspection/inspection.entity"
import { PropertyEntity } from "../core/property/property.entity"
import { tracer } from "../core/utils"

const eventBridge = tracer.captureAWSv3Client(new EventBridgeClient())

// TODO: faire un package pour simplifier tout ça
export const handler = async (event: DynamoDBStreamEvent) => {
  await Promise.all(
    event.Records.map(async (record: DynamoDBStreamRecord) => {
      const object = record.dynamodb?.NewImage || record.dynamodb?.OldImage

      if (object._et.S === InspectionEntity.entityName) {
        const { item } = InspectionEntity.build(EntityParser).parse(
          unmarshall(object),
        )
        if (record.eventName === "INSERT") {
          await eventBridge.send(InspectionCreatedEvent.build(item))
        } else if (record.eventName === "REMOVE") {
          await eventBridge.send(InspectionDeletedEvent.build(item))
        } else if (record.eventName === "MODIFY") {
          await eventBridge.send(InspectionUpdatedEvent.build(item))
        }
      } else if (object._et.S === AgencyEntity.entityName) {
        const { item } = AgencyEntity.build(EntityParser).parse(
          unmarshall(object),
        )
        if (record.eventName === "INSERT") {
          await eventBridge.send(AgencyCreatedEvent.build(item))
        } else if (record.eventName === "REMOVE") {
          await eventBridge.send(AgencyDeletedEvent.build(item))
        } else if (record.eventName === "MODIFY") {
          await eventBridge.send(AgencyUpdatedEvent.build(item))
        }
      } else if (object._et.S === PropertyEntity.entityName) {
        const { item } = PropertyEntity.build(EntityParser).parse(
          unmarshall(object),
        )
        if (record.eventName === "INSERT") {
          await eventBridge.send(PropertyCreatedEvent.build(item))
        } else if (record.eventName === "REMOVE") {
          await eventBridge.send(PropertyDeletedEvent.build(item))
        } else if (record.eventName === "MODIFY") {
          await eventBridge.send(PropertyUpdatedEvent.build(item))
        }
      }
    }),
  )
}
