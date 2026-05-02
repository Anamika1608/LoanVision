import { Router } from "express";

import { createSessionSchema, sessionIdParamSchema } from "src/controller/session/sessionSchema";
import { createSession, startSession, endSession, getSession } from "src/controller/session/sessionController";
import { validateRequest } from "src/middleware/validateRequest";

const router = Router();

router.route("/").post(validateRequest(createSessionSchema), async (req, res, next) => {
  try {
    const { campaignCode, geoLatitude, geoLongitude, deviceInfo } = req.body;
    const userId = req.session.userId;
    const newSession = await createSession(userId, campaignCode, geoLatitude, geoLongitude, deviceInfo);
    return res.status(201).json({
      sessionId: newSession.id,
      socketRoom: newSession.id,
      status: newSession.status
    });
  } catch (error) {
    next(error);
  }
});

router.route("/:id/start").patch(validateRequest(sessionIdParamSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await startSession(id);
    return res.status(200).json({ sessionId: updated.id, status: updated.status });
  } catch (error) {
    next(error);
  }
});

router.route("/:id/end").patch(validateRequest(sessionIdParamSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await endSession(id);
    return res.status(200).json({ sessionId: result.id, status: result.status, duration: result.duration });
  } catch (error) {
    next(error);
  }
});

router.route("/:id").get(validateRequest(sessionIdParamSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const sessionRecord = await getSession(id);
    return res.status(200).json(sessionRecord);
  } catch (error) {
    next(error);
  }
});

export default router;
