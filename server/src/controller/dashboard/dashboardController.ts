import { eq, sql } from "drizzle-orm";

import db from "src/db";
import { application } from "src/model/application";
import { riskAssessment } from "src/model/riskAssessment";
import { offer } from "src/model/offer";
import { session } from "src/model/session";
import { campaign } from "src/model/campaign";
import { faceVerification } from "src/model/faceVerification";
import { BadRequestError } from "src/utils/error";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

export const getDashboardData = async () => {
  const rows = await db
    .select()
    .from(application)
    .leftJoin(riskAssessment, eq(riskAssessment.applicationId, application.id))
    .leftJoin(offer, eq(offer.applicationId, application.id))
    .leftJoin(session, eq(session.id, application.sessionId))
    .orderBy(sql`${application.createdAt} DESC`);

  const totalApplications = rows.length;
  const approved = rows.filter((r) => r.applications.status === "approved").length;
  const rejected = rows.filter((r) => r.applications.status === "rejected").length;

  const totalDisbursed = rows
    .filter((r) => r.offers?.status === "accepted")
    .reduce((sum, r) => sum + parseFloat(r.offers?.eligibleAmount || "0"), 0);

  const scores = rows
    .filter((r) => r.risk_assessments?.compositeScore)
    .map((r) => parseFloat(r.risk_assessments!.compositeScore!));

  const averageCompositeScore =
    scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

  const acceptedCount = rows.filter((r) => r.offers?.status === "accepted").length;
  const conversionRate = totalApplications > 0 ? acceptedCount / totalApplications : 0;

  const campaigns = await db.select().from(campaign).orderBy(sql`${campaign.createdAt} DESC`);

  return {
    summary: {
      totalApplications,
      approved,
      rejected,
      totalDisbursed,
      averageCompositeScore,
      conversionRate,
    },
    applications: rows.map((r) => ({
      application: r.applications,
      riskAssessment: r.risk_assessments || null,
      offer: r.offers || null,
      session: r.sessions || null,
    })),
    campaigns,
  };
};

export const getApplicationDetail = async (applicationId: string) => {
  const [row] = await db
    .select()
    .from(application)
    .leftJoin(riskAssessment, eq(riskAssessment.applicationId, application.id))
    .leftJoin(offer, eq(offer.applicationId, application.id))
    .leftJoin(session, eq(session.id, application.sessionId))
    .where(eq(application.id, applicationId))
    .limit(1);

  if (!row) {
    throw new BadRequestError("Application not found");
  }

  const [faceRecord] = await db
    .select()
    .from(faceVerification)
    .where(eq(faceVerification.sessionId, row.applications.sessionId))
    .limit(1);

  let resolvedLocation: string | null = null;
  if (row.sessions?.geoLatitude && row.sessions?.geoLongitude) {
    try {
      const resp = await fetch(
        `${AI_SERVICE_URL}/cv/reverse-geocode?lat=${row.sessions.geoLatitude}&lon=${row.sessions.geoLongitude}`
      );
      if (resp.ok) {
        const geo = (await resp.json()) as { location: string | null };
        resolvedLocation = geo.location;
      }
    } catch {}
  }

  return {
    application: row.applications,
    riskAssessment: row.risk_assessments || null,
    offer: row.offers || null,
    session: row.sessions || null,
    faceVerification: faceRecord || null,
    resolvedLocation,
  };
};
