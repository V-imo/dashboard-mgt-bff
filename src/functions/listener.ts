import { EventBridgeEvent } from "aws-lambda";
import { AgencyCreatedEvent } from "vimo-events";
import { Agency } from "../core/agency";

type EventEnvelope = {
  type: string;
  data: Record<string, any>;
  timestamp: number;
  source: string;
  id: string;
};

export const handler = async (
  event: EventBridgeEvent<string, EventEnvelope>
) => {
  if (event["detail-type"] === AgencyCreatedEvent.type) {
    const detail = AgencyCreatedEvent.parse(event.detail);
    await Agency.update({
      ...detail.data,
      oplock: detail.timestamp,
      latched: true,
    });
  }
};
