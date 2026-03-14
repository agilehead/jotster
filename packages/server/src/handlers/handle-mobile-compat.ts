import type { Request, Response } from "@tsonic/express/index.js";
import type { AppContext } from "../helpers/app-context.ts";
import { registerClientDevice, removeClientDevice } from "../helpers/compat-db.ts";
import { getBodyObject, getOptionalStringField } from "../helpers/body.ts";
import { requireAuth } from "../helpers/require-auth.ts";

export const handleRegisterClientDeviceCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const deviceId = await registerClientDevice(app.options, requester);
  res.json({ result: "success", msg: "", device_id: deviceId });
};

export const handleRemoveClientDeviceCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const body = getBodyObject(req);
  const deviceId = getOptionalStringField(body, "device_id");
  if (deviceId === undefined) {
    res.status(400).json({ result: "error", msg: "Missing device_id", code: "BAD_REQUEST" });
    return;
  }

  const removed = await removeClientDevice(app.options, requester, deviceId);
  if (!removed) {
    res.status(404).json({ result: "error", msg: "Device does not exist", code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "" });
};

export const handleRegisterRemotePushDeviceCompat = async (
  req: Request,
  res: Response,
  _app: AppContext,
): Promise<void> => {
  const body = getBodyObject(req);
  const realmUuid = getOptionalStringField(body, "realm_uuid");
  const tokenId = getOptionalStringField(body, "token_id");
  const encryptedPushRegistration = getOptionalStringField(body, "encrypted_push_registration");
  const bouncerPublicKey = getOptionalStringField(body, "bouncer_public_key");
  if (
    realmUuid === undefined ||
    tokenId === undefined ||
    encryptedPushRegistration === undefined ||
    bouncerPublicKey === undefined
  ) {
    res.status(400).json({ result: "error", msg: "Missing required field", code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "" });
};
