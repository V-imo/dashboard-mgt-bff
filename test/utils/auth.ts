import {
  AdminAddUserToGroupCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  CreateGroupCommand,
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";

/**
 * Create a Cognito employee user for tests, add it to a group matching the agency,
 * and return credentials plus tokens.
 *
 * This expects:
 * - a User Pool with ID `userPoolId`
 * - an App Client with ID `clientId` that allows the `USER_PASSWORD_AUTH` flow
 * - a custom attribute named `custom:currentAgency` on the user pool
 */
export const createEmployee = async (params: {
  userPoolId: string;
  clientId: string;
  agencyId: string;
}) => {
  const cognitoClient = new CognitoIdentityProviderClient({});

  // Simple deterministic-but-unique-enough test credentials
  const username = `test-emp-${Date.now()}-${Math.floor(
    Math.random() * 1_000_000
  )}`;
  const password = `P@ssw0rd!${Math.floor(Math.random() * 1_000_000)}`;

  // 1. Create the user with a temporary password and custom attributes
  await cognitoClient.send(
    new AdminCreateUserCommand({
      UserPoolId: params.userPoolId,
      Username: username,
      TemporaryPassword: password,
      MessageAction: "SUPPRESS", // we don't want emails/SMS in tests
      UserAttributes: [
        {
          Name: "custom:currentAgency",
          Value: params.agencyId,
        },
      ],
    })
  );

  // 2. Set a permanent password so we can authenticate with USER_PASSWORD_AUTH
  await cognitoClient.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: params.userPoolId,
      Username: username,
      Password: password,
      Permanent: true,
    })
  );

  // 3. Ensure the agency group exists (ignore if it already exists)
  try {
    await cognitoClient.send(
      new CreateGroupCommand({
        UserPoolId: params.userPoolId,
        GroupName: params.agencyId,
      })
    );
  } catch (err: any) {
    // ResourceExistsException is fine in tests; group already there
    if (err?.name !== "ResourceExistsException") {
      throw err;
    }
  }

  // 4. Add the user to the agency group
  await cognitoClient.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: params.userPoolId,
      Username: username,
      GroupName: params.agencyId,
    })
  );

  // 5. Authenticate to get tokens for use in tests
  const auth = await cognitoClient.send(
    new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: params.clientId,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    })
  );

  return {
    username,
    password,
    idToken: auth.AuthenticationResult?.IdToken,
    accessToken: auth.AuthenticationResult?.AccessToken,
  };
};
