import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { getUnixTime } from "date-fns";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { Room } from "../../core/room";

export const RoomSchema = z
  .object({
    roomId: z.string(),
    agencyId: z.string(),
    propertyId: z.string(),
    name: z.string(),
    description: z.string().optional(),
    area: z.number().optional(),
  })
  .openapi("Room");

export const route = new OpenAPIHono()
  .openapi(
    createRoute({
      method: "get",
      path: "/{propertyId}/{roomId}",
      request: {
        params: z.object({
          propertyId: z.string(),
          roomId: z.string(),
        }),
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: RoomSchema,
            },
          },
          description: "Get a room",
        },
        404: {
          content: {
            "application/json": {
              schema: z.object({ message: z.string() }),
            },
          },
          description: "Room not found",
        },
      },
    }),
    async (c) => {
      const { propertyId, roomId } = c.req.valid("param");
      const { Item: room } = await Room.get(roomId, propertyId);
      if (!room) {
        return c.json({ message: "Room not found" }, 404);
      }
      return c.json(RoomSchema.parse(room), 200);
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
              schema: z.array(RoomSchema),
            },
          },
          description: "Get all rooms of a property",
        },
      },
    }),
    async (c) => {
      const { propertyId } = c.req.valid("param");
      const { Items: rooms } = await Room.getAllByProperty(
        propertyId
      );
      return c.json(z.array(RoomSchema).parse(rooms || []), 200);
    }
  )
  .openapi(
    createRoute({
      method: "delete",
      path: "/{propertyId}/{roomId}",
      request: {
        params: z.object({
          propertyId: z.string(),
          roomId: z.string(),
        }),
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.object({ message: z.string() }),
            },
          },
          description: "Room deleted",
        },
      },
    }),
    async (c) => {
      const { propertyId, roomId } = c.req.valid("param");
      await Room.del(roomId, propertyId);
      return c.json({ message: "Room deleted" }, 200);
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
              schema: RoomSchema,
            },
          },
        },
      },

      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.object({ message: z.string() }),
            },
          },
          description: "Room updated",
        },
      },
    }),
    async (c) => {
      const room = await c.req.json();
      await Room.update({
        ...room,
        oplock: getUnixTime(new Date()),
      });
      return c.json({ message: "Room updated" }, 200);
    }
  )
  .openapi(
    createRoute({
      method: "post",
      path: "/",
      request: {
        body: {
          content: {
            "application/json": {
              schema: RoomSchema.omit({ roomId: true }),
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
          description: "Room created",
        },
      },
    }),
    async (c) => {
      const room = await c.req.json();
      const roomId = `room_${uuid()}`;
      await Room.update({
        ...room,
        roomId,
        oplock: getUnixTime(new Date()),
      });
      return c.json(roomId, 200);
    }
  );
