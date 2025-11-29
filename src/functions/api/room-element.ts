import { z } from "zod";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { getUnixTime } from "date-fns";
import { v4 as uuid } from "uuid";
import { RoomElement } from "../../core/room-element";

export const RoomElementSchema = z
  .object({
    agencyId: z.string(),
    propertyId: z.string(),
    roomId: z.string(),
    elementId: z.string(),
    name: z.string(),
    description: z.string().optional(),
    type: z.enum([
      "FURNITURE",
      "STRUCTURAL",
      "ELECTRICAL",
      "PLUMBING",
      "VENTILATION",
      "SURFACE",
      "OTHER",
    ]),
  })
  .openapi("RoomElement");

export const route = new OpenAPIHono()
  .openapi(
    createRoute({
      method: "post",
      path: "/",
      request: {
        body: {
          content: {
            "application/json": {
              schema: RoomElementSchema.omit({ elementId: true }),
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.string(),
            },
          },
          description: "Create a room element",
        },
      },
    }),
    async (c) => {
      const roomElement = await c.req.json();
      const elementId = `room_element_${uuid()}`;
      await RoomElement.update({
        ...roomElement,
        elementId,
        oplock: getUnixTime(new Date()),
      });
      return c.json(elementId, 200);
    }
  )
  .openapi(
    createRoute({
      method: "get",
      path: "/{propertyId}/{roomId}/{elementId}",
      request: {
        params: z.object({
          propertyId: z.string(),
          roomId: z.string(),
          elementId: z.string(),
        }),
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: RoomElementSchema,
            },
          },
          description: "Get a room element",
        },
        404: {
          content: {
            "application/json": {
              schema: z.object({ message: z.string() }),
            },
          },
          description: "Room element not found",
        },
      },
    }),
    async (c) => {
      const { propertyId, roomId, elementId } = c.req.valid("param");
      const { Item: roomElement } = await RoomElement.get(
        propertyId,
        roomId,
        elementId
      );
      if (!roomElement) {
        return c.json({ message: "Room element not found" }, 404);
      }
      return c.json(RoomElementSchema.parse(roomElement), 200);
    }
  )
  .openapi(
    createRoute({
      method: "get",
      path: "/{propertyId}/{roomId}",
      request: {
        params: z.object({ propertyId: z.string(), roomId: z.string() }),
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.array(RoomElementSchema),
            },
          },
          description: "Get all room elements of a room",
        },
      },
    }),
    async (c) => {
      const { propertyId, roomId } = c.req.valid("param");
      const { Items: roomElements } = await RoomElement.getAllByRoom(
        propertyId,
        roomId
      );
      return c.json(z.array(RoomElementSchema).parse(roomElements || []), 200);
    }
  )
  .openapi(
    createRoute({
      method: "get",
      path: "/{propertyId}",
      request: {
        params: z.object({ propertyId: z.string() }),
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.array(RoomElementSchema),
            },
          },
          description: "Get all room elements of a property",
        },
      },
    }),
    async (c) => {
      const { propertyId } = c.req.valid("param");
      const { Items: roomElements } = await RoomElement.getAllByProperty(
        propertyId
      );
      return c.json(z.array(RoomElementSchema).parse(roomElements || []), 200);
    }
  )
  .openapi(
    createRoute({
      method: "delete",
      path: "/{propertyId}/{roomId}/{elementId}",
      request: {
        params: z.object({
          propertyId: z.string(),
          roomId: z.string(),
          elementId: z.string(),
        }),
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.string(),
            },
          },
          description: "Delete a room element",
        },
      },
    }),
    async (c) => {
      const { propertyId, roomId, elementId } = c.req.valid("param");
      await RoomElement.del(propertyId, roomId, elementId);
      return c.json("Room element deleted", 200);
    }
  )
  .openapi(
    createRoute({
      method: "patch",
      path: "/",
      request: {
        body: {
          content: {
            "application/json": {
              schema: RoomElementSchema,
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.string(),
            },
          },
          description: "Update a room element",
        },
      },
    }),
    async (c) => {
      const roomElement = await c.req.json();
      await RoomElement.update({
        ...roomElement,
        oplock: getUnixTime(new Date()),
      });
      return c.json("Room element updated", 200);
    }
  );
