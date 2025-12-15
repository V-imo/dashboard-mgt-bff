import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { getUnixTime } from "date-fns";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { Property } from "../../core/property";
import { getUserFromContext } from "./utils";

export const RoomsSchema = z.array(
  z.object({
    name: z.string(),
    area: z.number().optional(),
    description: z.string().optional(),
    elements: z.array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        images: z.array(z.string()).optional(),
        type: z.string(),
      })
    ),
  })
)

export const PropertySchema = z
  .object({
    propertyId: z.string(),
    agencyId: z.string(),
    address: z.object({
      number: z.string(),
      street: z.string(),
      city: z.string(),
      zipCode: z.string(),
      country: z.string(),
    }),
    owner: z
      .object({
        firstName: z.string(),
        lastName: z.string(),
        mail: z.string().optional(),
        phoneNumber: z.string().optional(),
      })
      .optional(),
    rooms: RoomsSchema,
  })
  .openapi("Property");

export const PropertiesSchema = z.array(PropertySchema).openapi("Properties");

export const route = new OpenAPIHono()
  .openapi(
    createRoute({
      method: "get",
      path: "/",
      responses: {
        200: {
          content: {
            "application/json": {
              schema: PropertiesSchema,
            },
          },
          description: "Get all properties of an agency",
        },
      },
    }),
    async (c) => {
      const { agencyId } = getUserFromContext(c);
      const properties = await Property.getAllByAgency(agencyId);
      if (!properties) {
        return c.json([], 200);
      }
      return c.json(
        properties.map((p) => PropertySchema.parse(p)),
        200
      );
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
              schema: PropertySchema,
            },
          },
          description: "Get a property",
        },
        404: {
          content: {
            "application/json": {
              schema: z.object({ message: z.string() }),
            },
          },
          description: "Property not found",
        },
      },
    }),
    async (c) => {
      const { agencyId } = getUserFromContext(c);
      const { propertyId } = c.req.valid("param");
      const property = await Property.get(propertyId, agencyId);
      if (!property) {
        return c.json({ message: "Property not found" }, 404);
      }
      return c.json(PropertySchema.parse(property), 200);
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
              schema: PropertySchema.omit({ propertyId: true }),
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
          description: "Create a property",
        },
      },
    }),
    async (c) => {
      const { agencyId } = getUserFromContext(c);
      const property = await c.req.json();
      const propertyId = `property_${uuid()}`;
      await Property.update({
        ...property,
        agencyId,
        propertyId,
        oplock: getUnixTime(new Date()),
        latched: false,
      });
      return c.json(propertyId, 200);
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
              schema: PropertySchema,
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
          description: "Update a property",
        },
      },
    }),
    async (c) => {
      const { agencyId } = getUserFromContext(c);
      const property = await c.req.json();
      await Property.update({
        ...property,
        agencyId,
        oplock: getUnixTime(new Date()),
        latched: false,
      });
      return c.json("Property updated", 200);
    }
  )
  .openapi(
    createRoute({
      method: "delete",
      path: "/{propertyId}",
      request: {
        params: z.object({ propertyId: z.string() }),
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.string(),
            },
          },
          description: "Delete a property",
        },
      },
    }),
    async (c) => {
      const { agencyId } = getUserFromContext(c);
      const { propertyId } = c.req.valid("param");
      await Property.del(propertyId, agencyId);
      return c.json("Property deleted", 200);
    }
  );
