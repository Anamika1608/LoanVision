import { Router } from "express";

import { createCampaignSchema, validateCampaignCodeSchema } from "src/controller/campaign/campaignSchema";
import { createCampaign, validateCampaignCode, listCampaigns } from "src/controller/campaign/campaignController";
import { validateRequest } from "src/middleware/validateRequest";
import { onlyAdmin } from "src/middleware/authCheck";

const router = Router();

router.route("/").post(onlyAdmin, validateRequest(createCampaignSchema), async (req, res, next) => {
  try {
    const { name, channel, productType, maxUses, expiresAt } = req.body;
    const newCampaign = await createCampaign(name, channel, productType, maxUses, expiresAt);
    return res.status(201).json({
      campaignId: newCampaign.id,
      code: newCampaign.code,
      link: `/apply/${newCampaign.code}`
    });
  } catch (error) {
    next(error);
  }
});

router.route("/").get(async (req, res, next) => {
  try {
    const campaigns = await listCampaigns();
    return res.status(200).json({ campaigns });
  } catch (error) {
    next(error);
  }
});

router.route("/:code").get(validateRequest(validateCampaignCodeSchema), async (req, res, next) => {
  try {
    const { code } = req.params;
    const campaignRecord = await validateCampaignCode(code);
    return res.status(200).json({
      valid: true,
      productType: campaignRecord.productType,
      campaignName: campaignRecord.name
    });
  } catch (error) {
    next(error);
  }
});

export default router;
