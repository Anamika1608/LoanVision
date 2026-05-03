import { Router } from "express";

import {
  createApplicationSchema,
  sessionIdParamSchema,
  acceptOfferSchema,
} from "src/controller/application/applicationSchema";
import {
  createApplication,
  getOffer,
  acceptOffer,
  declineOffer,
} from "src/controller/application/applicationController";
import { validateRequest } from "src/middleware/validateRequest";

const router = Router();

router.route("/").post(validateRequest(createApplicationSchema), async (req, res, next) => {
  try {
    const { sessionId, entities, cvResults } = req.body;
    const userId = req.session?.userId;
    const result = await createApplication(sessionId, entities, cvResults || {}, userId);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.route("/:sessionId/offer").get(validateRequest(sessionIdParamSchema), async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const result = await getOffer(sessionId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.route("/:sessionId/offer/accept").patch(validateRequest(acceptOfferSchema), async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { selectedTenure } = req.body;
    const result = await acceptOffer(sessionId, selectedTenure);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.route("/:sessionId/offer/decline").patch(validateRequest(sessionIdParamSchema), async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const result = await declineOffer(sessionId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
