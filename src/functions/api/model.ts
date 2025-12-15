import { RoomsSchema } from "./property";
import { z } from "zod";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { getUnixTime } from "date-fns";
import { v4 as uuid } from "uuid";
import { Model } from "../../core/model";
import { getUserFromContext } from "./utils";

export const ModelSchema = z.object({
  modelId: z.string(),
  agencyId: z.string(),
  name: z.string(),
  rooms: RoomsSchema,
}).openapi("Model");

export const ModelsSchema = z.array(ModelSchema).openapi("Models");

export const route = new OpenAPIHono()
  .openapi(
    createRoute({
      method: "get",
      path: "/",
      responses: {
        200: {
          content: {
            "application/json": {
              schema: ModelsSchema,
            },
          },
          description: "Get all models of an agency",
        },
      },
      description: "Get all models of an agency",
    }),
    async (c) => {
      const { agencyId } = getUserFromContext(c);
      const { Items: models } = await Model.getAllByAgency(agencyId);
      return c.json(ModelsSchema.parse(models || []), 200);
    }
  )
  .openapi(
    createRoute({
      method: "get",
      path: "/{modelId}",
      request: {
        params: z.object({ modelId: z.string() }),
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: ModelSchema,
            },
          },
          description: "Get a model",
        },
        404: {
          content: {
            "application/json": {
              schema: z.object({ message: z.string() }),
            },
          },
          description: "Model not found",
        },
      },
      description: "Get a model",
    }),
    async (c) => {
      const { agencyId } = getUserFromContext(c);
      const { modelId } = c.req.valid("param");
      const { Item: model } = await Model.get(modelId, agencyId);
      if (!model) {
        return c.json({ message: "Model not found" }, 404);
      }
      return c.json(ModelSchema.parse(model), 200);
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
              schema: ModelSchema.omit({ modelId: true }),
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
          description: "Create a model",
        },
      },
    }),
    async (c) => {
      const { agencyId } = getUserFromContext(c);
      const model = await c.req.json();
      const modelId = `model_${uuid()}`;
      await Model.update({
        ...model,
        modelId,
        agencyId,
        oplock: getUnixTime(new Date()),
        latched: false,
      });
      return c.json(modelId, 200);
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
              schema: ModelSchema,
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
          description: "Update a model",
        },
      },
    }),
    async (c) => {
      const { agencyId } = getUserFromContext(c);
      const model = await c.req.json();
      await Model.update({
        ...model,
        agencyId,
        oplock: getUnixTime(new Date()),
        latched: false,
      });
      return c.json("Model updated", 200);
    }
  )
  .openapi(
    createRoute({
      method: "delete",
      path: "/{modelId}",
      request: {
        params: z.object({ modelId: z.string() }),
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.string(),
            },
          },
          description: "Delete a model",
        },
      },
      description: "Delete a model",
    }),
    async (c) => {
      const { agencyId } = getUserFromContext(c);
      const { modelId } = c.req.valid("param");
      await Model.del(modelId, agencyId);
      return c.json("Model deleted", 200);
    }
  )