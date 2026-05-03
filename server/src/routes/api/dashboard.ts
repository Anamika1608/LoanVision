import { Router } from "express";

import { getDashboardData, getApplicationDetail } from "src/controller/dashboard/dashboardController";
import { applicationDetailParamSchema } from "src/controller/dashboard/dashboardSchema";
import { validateRequest } from "src/middleware/validateRequest";

const router = Router();

router.route("/").get(async (req, res, next) => {
  try {
    const data = await getDashboardData();
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});

router.route("/application/:applicationId").get(
  validateRequest(applicationDetailParamSchema),
  async (req, res, next) => {
    try {
      const { applicationId } = req.params;
      const data = await getApplicationDetail(applicationId);
      return res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
