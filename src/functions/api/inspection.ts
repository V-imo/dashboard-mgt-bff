import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi"
import { v4 as uuid } from "uuid"
import { Inspection } from "../../core/inspection"

export const InspectionSchema = z
  .object({
    inspectionId: z.string().optional(),
    propertyId: z.string(),
    status: z.enum(["TO_DO", "IN_PROGRESS", "DONE", "CANCELED"]),
    inspectorId: z.string().optional(),
    date: z.string(),
    agencyId: z.string(),
  })
  .openapi("Inspection")

export const InspectionsSchema = z
  .array(InspectionSchema)
  .openapi("Inspections")

export const route = new OpenAPIHono()
  .openapi(
    createRoute({
      method: "get",
      path: "/{agencyId}",
      request: {
        params: z.object({
          agencyId: z.string(),
        }),
      },
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
      //TODO: have a function that get the agency from cognito session
      const { agencyId } = c.req.valid("param")
      const { Items } = await Inspection.getAllByAgency(agencyId)

      return c.json(InspectionsSchema.parse(Items || []), 200)
    },
  )
  .openapi(
    createRoute({
      method: "post",
      path: "/",
      request: {
        body: {
          content: {
            "application/json": {
              schema: InspectionSchema,
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
      const inspection = await c.req.json()
      const inspectionId = `inspection_${uuid()}`
      await Inspection.update({
        ...inspection,
        inspectionId,
      })
      return c.json(inspectionId, 200)
    },
  )
  .openapi(
    createRoute({
      method: "patch",
      path: "/",
      request: {
        body: {
          content: {
            "application/json": {
              schema: InspectionSchema,
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
      const inspection = await c.req.json()
      await Inspection.update({ ...inspection })
      return c.json("Inspection updated", 200)
    },
  )
  .openapi(
    createRoute({
      method: "delete",
      path: "/{inspectionId}",
      request: {
        params: z.object({ inspectionId: z.string() }),
        query: z.object({ agencyId: z.string(), propertyId: z.string() }),
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
      const { inspectionId } = c.req.valid("param")
      const { agencyId, propertyId } = c.req.query()
      await Inspection.del(inspectionId, agencyId, propertyId)
      return c.json("Inspection deleted", 200)
    },
  )
