import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { getUnixTime } from "date-fns";
import { v4 as uuid } from "uuid";
import { Inspection } from "../../core/inspection";
import { getUserFromContext } from "./utils";

export const InspectionSchema = z
  .object({
    agencyId: z.string(),
    inspectionId: z.string().optional(),
    propertyId: z.string(),
    status: z.enum(["TO_DO", "IN_PROGRESS", "DONE", "CANCELED"]),
    inspectorId: z.string().optional(),
    date: z.string(),
    rooms: z.array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        elements: z.array(
          z.object({
            name: z.string(),
            description: z.string().optional(),
            images: z.array(z.string()).optional(),
            state: z.enum(["GOOD", "BAD", "NEW", "BROKEN"]),
          })
        ),
      })
    ).optional(),
  })
  .openapi("Inspection");

export const InspectionsSchema = z
  .array(InspectionSchema)
  .openapi("Inspections");

export const route = new OpenAPIHono()
  .openapi(
    createRoute({
      method: "get",
      path: "/",
      responses: {
        200: {
          content: {
            "application/json": {
              schema: InspectionsSchema,
            },
          },
          description: "Retrieve all inspections of an agency",
        },
      },
    }),
    async (c) => {
      const { agencyId } = getUserFromContext(c);
      const { Items } = await Inspection.getAllByAgency(agencyId);

      return c.json(InspectionsSchema.parse(Items || []), 200);
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
              schema: InspectionsSchema,
            },
          },
          description: "Get all inspections of an agency and property",
        },
      },
      description: "Get all inspections of an agency and property",
    }),
    async (c) => {
      const { agencyId } = getUserFromContext(c);
      const { propertyId } = c.req.valid("param");
      const { Items: inspections } = await Inspection.getAllByAgencyAndProperty(
        agencyId,
        propertyId
      );
      return c.json(InspectionsSchema.parse(inspections || []), 200);
    }
  )
  .openapi(
    createRoute({
      method: "get",
      path: "/{propertyId}/{inspectionId}",
      request: {
        params: z.object({
          propertyId: z.string(),
          inspectionId: z.string(),
        }),
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: InspectionSchema,
            },
          },
          description: "Get an inspection",
        },
        404: {
          content: {
            "application/json": {
              schema: z.object({ message: z.string() }),
            },
          },
          description: "Inspection not found",
        },
      },
    }),
    async (c) => {
      const { agencyId } = getUserFromContext(c);
      const { propertyId, inspectionId } = c.req.valid("param");
      const { Item: inspection } = await Inspection.get(
        agencyId,
        propertyId,
        inspectionId
      );
      if (!inspection) {
        return c.json({ message: "Inspection not found" }, 404);
      }
      return c.json(InspectionSchema.parse(inspection), 200);
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
              schema: InspectionSchema.omit({ agencyId: true }),
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
          description: "Create an inspection",
        },
      },
    }),
    async (c) => {
      const { agencyId } = getUserFromContext(c);
      const inspection = await c.req.json();
      const inspectionId = `inspection_${uuid()}`;
      await Inspection.update({
        ...inspection,
        agencyId,
        inspectionId,
        oplock: getUnixTime(new Date()),
        latched: false,
      });
      return c.json(inspectionId, 200);
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
              schema: InspectionSchema.omit({ agencyId: true }),
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
          description: "Update an inspection",
        },
      },
    }),
    async (c) => {
      const { agencyId } = getUserFromContext(c);
      const inspection = await c.req.json();
      await Inspection.update({
        ...inspection,
        agencyId,
        oplock: getUnixTime(new Date()),
        latched: false,
      });
      return c.json("Inspection updated", 200);
    }
  )
  .openapi(
    createRoute({
      method: "delete",
      path: "/{inspectionId}",
      request: {
        params: z.object({ inspectionId: z.string() }),
        query: z.object({ propertyId: z.string() }),
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.string(),
            },
          },
          description: "Delete an inspection",
        },
      },
    }),
    async (c) => {
      const { agencyId } = getUserFromContext(c);
      const { inspectionId } = c.req.valid("param");
      const { propertyId } = c.req.query();
      await Inspection.del(inspectionId, agencyId, propertyId);
      return c.json("Inspection deleted", 200);
    }
  );
