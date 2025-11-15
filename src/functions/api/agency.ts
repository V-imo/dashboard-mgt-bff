import { createRoute, OpenAPIHono } from "@hono/zod-openapi"
import { getUnixTime } from "date-fns"
import { v4 as uuid } from "uuid"
import { z } from "zod"
import { Agency } from "../../core/agency"

export const AgencySchema = z.object({
  agencyId: z.string(),
  name: z.string(),
  contactMail: z.string(),
  contactPhone: z.string().optional(),
  address: z.object({
    number: z.string(),
    street: z.string(),
    city: z.string(),
    zipCode: z.string(),
    country: z.string(),
  }),
})

export const route = new OpenAPIHono()
  .openapi(
    createRoute({
      method: "get",
      path: "/{agencyId}",
      request: {
        params: z.object({ agencyId: z.string() }),
      },
      responses: {
        200: {
          description: "Get an agency",
          content: {
            "application/json": {
              schema: AgencySchema,
            },
          },
        },
        404: {
          description: "Agency not found",
          content: {
            "application/json": {
              schema: z.object({ message: z.string() }),
            },
          },
        },
      },
      description: "Get an agency",
    }),
    async (c) => {
      const { agencyId } = c.req.valid("param")
      const agency = await Agency.get(agencyId)
      if (!agency) {
        return c.json({ message: "Agency not found" }, 404)
      }
      return c.json(AgencySchema.parse(agency), 200)
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
              schema: AgencySchema.omit({ agencyId: true }),
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
          description: "Agency created",
        },
      },
    }),
    async (c) => {
      const agency = await c.req.json()
      const agencyId = `agency_${uuid()}`
      await Agency.update({
        ...agency,
        agencyId,
        oplock: getUnixTime(new Date()),
      })
      return c.json(agencyId, 200)
    },
  )
  .openapi(
    createRoute({
      method: "delete",
      path: "/{agencyId}",
      request: {
        params: z.object({ agencyId: z.string() }),
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.string(),
            },
          },
          description: "Delete an agency",
        },
      },
    }),
    async (c) => {
      const { agencyId } = c.req.valid("param")
      await Agency.del(agencyId)
      return c.json("Agency deleted", 200)
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
              schema: AgencySchema,
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
          description: "Update an agency",
        },
      },
    }),
    async (c) => {
      const agency = await c.req.json()
      await Agency.update({ ...agency, oplock: getUnixTime(new Date()) })
      return c.json("Agency updated", 200)
    },
  )
