import { Context } from "hono";
import { HTTPException } from "hono/http-exception";

export function getUserFromContext(c: Context): {
  id: string;
  email: string;
  given_name: string;
  family_name: string;
  agencyId: string;
  groups: string[];
} {
  const auth = c.req.header("Authorization");

  if (!auth) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const tokenParts = auth.split(".");
  if (tokenParts.length !== 3)
    throw new HTTPException(401, { message: "No valid format token provided" });
  const payloadBase64 = tokenParts[1];
  const payloadJson = atob(payloadBase64);
  const payload = JSON.parse(payloadJson);

  return {
    id: payload["cognito:username"],
    email: payload.email,
    given_name: payload.given_name,
    family_name: payload.family_name,
    agencyId: payload["custom:currentAgency"],
    groups: payload["cognito:groups"],
  };
}
