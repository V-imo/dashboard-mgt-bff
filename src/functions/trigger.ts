import { EventBridgeClient } from "@aws-sdk/client-eventbridge"
import { unmarshall } from "@aws-sdk/util-dynamodb"
import type { DynamoDBStreamEvent, DynamoDBStreamRecord } from "aws-lambda"
import { EntityParser } from "dynamodb-toolbox"
import {
  InspectionCreatedEvent,
  InspectionDeletedEvent,
  InspectionUpdatedEvent,
} from "vimo-events"
import {
  InspectionEntity,
  InspectionEntityType,
} from "../core/inspection/inspection.entity"
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
          await InspectionCreatedHandler(item)
        }
        if (record.eventName === "REMOVE") {
          await InspectionDeletedHandler(item)
        }
        if (record.eventName === "MODIFY") {
          await InspectionUpdatedHandler(item)
        }
      }
    }),
  )
}

const InspectionCreatedHandler = async (item: InspectionEntityType) => {
  await eventBridge.send(InspectionCreatedEvent.build(item))
}

const InspectionDeletedHandler = async (item: InspectionEntityType) => {
  await eventBridge.send(InspectionDeletedEvent.build(item))
}

const InspectionUpdatedHandler = async (item: InspectionEntityType) => {
  await eventBridge.send(InspectionUpdatedEvent.build(item))
}
