import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { getUnixTime } from "date-fns";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { Agency } from "../../core/agency";
import { getUserFromContext } from "./utils";

export const AgencySchema = z
  .object({
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
  .openapi("Agency");

export const route = new OpenAPIHono()
  .openapi(
    createRoute({
      method: "get",
      path: "/",
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
      const { agencyId } = getUserFromContext(c);

      const agency = await Agency.get(agencyId);
      if (!agency) {
        return c.json({ message: "Agency not found" }, 404);
      }
      return c.json(AgencySchema.parse(agency), 200);
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
      const { agencyId } = getUserFromContext(c);
      const agency = await c.req.json();
      await Agency.update({
        ...agency,
        agencyId,
        oplock: getUnixTime(new Date()),
        latched: false,
      });
      return c.json("Agency updated", 200);
    }
  );
