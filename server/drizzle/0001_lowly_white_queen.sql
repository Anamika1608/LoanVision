DO $$ BEGIN
 CREATE TYPE "application_status" AS ENUM('in_progress', 'submitted', 'approved', 'rejected', 'escalated');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "audit_event_type" AS ENUM('session_start', 'consent_captured', 'face_detected', 'face_matched', 'age_estimated', 'liveness_passed', 'transcript_chunk', 'entity_extracted', 'bureau_pulled', 'risk_computed', 'offer_generated', 'offer_presented', 'policy_check', 'fraud_flag', 'session_end');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "audit_source" AS ENUM('client', 'server', 'ai-service');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "campaign_channel" AS ENUM('sms', 'whatsapp', 'email', 'web');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "offer_status" AS ENUM('generated', 'presented', 'accepted', 'rejected', 'expired');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "risk_band" AS ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'REJECT');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "session_status" AS ENUM('pending', 'active', 'completed', 'expired', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" uuid,
	"status" "application_status" DEFAULT 'in_progress' NOT NULL,
	"first_name" varchar(50),
	"last_name" varchar(50),
	"date_of_birth" date,
	"estimated_age" integer,
	"declared_age" integer,
	"employer" varchar(100),
	"monthly_income" numeric(12, 2),
	"loan_purpose" text,
	"loan_amount_requested" numeric(12, 2),
	"consent_given" boolean DEFAULT false,
	"consent_timestamp" timestamp,
	"consent_transcript" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"event_type" "audit_event_type" NOT NULL,
	"payload" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"source" "audit_source" NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"channel" "campaign_channel" NOT NULL,
	"product_type" varchar(50) NOT NULL,
	"max_uses" integer NOT NULL,
	"current_uses" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "campaigns_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "face_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"face_detected" boolean,
	"face_match_score" numeric(5, 4),
	"estimated_age" integer,
	"estimated_gender" varchar(10),
	"liveness_blink_detected" boolean,
	"liveness_head_turn_detected" boolean,
	"liveness_score" numeric(5, 4),
	"anti_spoofing_passed" boolean,
	"frames_captured" integer,
	"id_photo_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"risk_assessment_id" uuid NOT NULL,
	"status" "offer_status" DEFAULT 'generated' NOT NULL,
	"eligible_amount" numeric(12, 2),
	"interest_rate" numeric(5, 2),
	"tenure_options" jsonb,
	"selected_tenure" integer,
	"emi_amount" numeric(12, 2),
	"processing_fee" numeric(10, 2),
	"processing_fee_percent" numeric(5, 2),
	"risk_band" varchar(10),
	"valid_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "risk_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"bureau_score" numeric(5, 4),
	"ml_propensity_score" numeric(5, 4),
	"video_fraud_score" numeric(5, 4),
	"llm_confidence_score" numeric(5, 4),
	"alternate_data_score" numeric(5, 4),
	"composite_score" numeric(5, 4),
	"risk_band" "risk_band",
	"fraud_flags" jsonb,
	"policy_checks_passed" boolean,
	"decision_rationale" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"campaign_id" varchar(20),
	"status" "session_status" DEFAULT 'pending' NOT NULL,
	"started_at" timestamp,
	"ended_at" timestamp,
	"geo_latitude" numeric(10, 7),
	"geo_longitude" numeric(10, 7),
	"declared_city" varchar(100),
	"device_info" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "applications" ADD CONSTRAINT "applications_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "face_verifications" ADD CONSTRAINT "face_verifications_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "offers" ADD CONSTRAINT "offers_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "offers" ADD CONSTRAINT "offers_risk_assessment_id_risk_assessments_id_fk" FOREIGN KEY ("risk_assessment_id") REFERENCES "risk_assessments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
