Problem Statement 3 - Agentic AI Video Call–Based Onboarding


Video-Based Digital Loan Origination & Risk Assessment System

 
1. Problem Statement

Traditional digital loan journeys face challenges such as high drop-offs, fraud risks, incomplete data capture, and limited contextual understanding of customers. Manual KYC processes add operational overhead, while purely form-based applications lack real-time verification and intent validation.

There is a need for a secure, compliant, and intelligent loan origination system that can:

• Digitally onboard customers in real time
• Capture consent and eligibility signals accurately
• Reduce fraud and misrepresentation
• Generate instant, personalized loan offers with minimal human intervention
 
2. Detailed Description

The Video-Based Digital Loan Origination System enables end-to-end loan onboarding, verification, risk assessment, and offer generation using a live video call as the primary interaction channel.

 
2.1 Key Functional Flow

 
2.1.1 Customer Entry via Campaign

• Customers access the system through a secure link shared via SMS, WhatsApp, email, or digital campaigns.
• The link initiates a controlled video call session.
 
2.1.2 Video Call–Based Data Capture

During the live video interaction, the system captures:

• Live video and audio streams
• Geo-location of the customer for compliance and fraud checks
• Session metadata (device, timestamp, IP)
 
2.1.3 Speech-to-Text (STT) & Consent Capture

• Customer responses during the call are converted into text using STT services.
• Key information extracted:
o Employment details
o Income declaration
o Loan purpose
o Explicit verbal consent
• Creates an auditable consent trail.
 
2.1.4 Computer Vision–Based Age Estimation

• Facial analysis estimates customer age from the video feed.
• Acts as a validation signal against declared age and policy thresholds.
 
2.1.5 Auto-Fill & Alternate Data Generation

• Extracted data auto-fills application forms.
• Reduces manual input and onboarding time.
 
2.1.6 Risk & Policy Evaluation

The system consumes:

• Internal bureau data (historical loan performance)
• Policy rules (eligibility, limits, exclusions)
• Propensity and risk scores (ML models)
 
2.1.7 LLM-Based Intelligence Layer

• An LLM interprets conversational context and normalizes unstructured inputs.
• Performs customer classification (risk band, persona, confidence indicators).
• Outputs structured intelligence without overriding deterministic rules.
 
2.1.8 Offer Generation

Based on policy, risk, and LLM insights, the system generates content of offers:

• Eligible loan amount(s)
• Tenure options
• Interest rates
• EMI structures
 
2.1.9 Central Logging & Audit Repository

• Stores video recordings, transcripts, geo-data, decisions, and offers.
• Ensures regulatory compliance, traceability, and audit readiness.
 
3. Judging Criteria

The solution will be evaluated based on:

 
3.1 End-to-End Digitisation

• Seamless onboarding with minimal manual intervention
• Fully paperless loan journey
 
3.2 Accuracy & Compliance

• Adherence to KYC and regulatory standards
 
3.3 Risk Mitigation

• Ability to detect fraud signals (location mismatch, age inconsistency)
• Robust policy and risk enforcement
 
3.4 Intelligence & Personalization

• Effective use of AI/LLM for contextual understanding
• Quality and relevance of generated loan offers
 
3.5 Scalability & Reliability

• Architecture supports high concurrency
• Low latency for real-time decisioning
 
4. Data Format

 
4.1 Input Data

• Video stream (live)
• Audio stream
• Geo-location coordinates
• Customer verbal responses
• Internal bureau records
• Policy configurations
 
4.2 Intermediate Data

• STT transcripts
• Age estimation scores
• Risk and propensity scores
• LLM classification outputs
 
4.3 Output Data

• Personalized loan offers
• Eligibility status
• Decision explanations
• Audit logs and consent records
 