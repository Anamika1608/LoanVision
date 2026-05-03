import { Router } from "express";

import { getDashboardData, getApplicationDetail, getUserApplications } from "src/controller/dashboard/dashboardController";
import { applicationDetailParamSchema } from "src/controller/dashboard/dashboardSchema";
import { validateRequest } from "src/middleware/validateRequest";
import { onlyAdmin, onlyIfLoggedIn } from "src/middleware/authCheck";

const router = Router();

router.route("/").get(onlyAdmin, async (req, res, next) => {
  try {
    const data = await getDashboardData();
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});

router.route("/my-applications").get(onlyIfLoggedIn, async (req, res, next) => {
  try {
    const userId = req.session.userId!;
    const data = await getUserApplications(userId);
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});

router.route("/application/:applicationId").get(
  onlyAdmin,
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
