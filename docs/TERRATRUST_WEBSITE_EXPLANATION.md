# TerraTrust AI Website Explanation

## How to use this document

This is the founder and presenter explanation of the current TerraTrust AI website. It describes the repository as it exists now and separates three ideas:

- **Implemented:** the screen or code path exists.
- **Production verified:** the latest ship-pass evidence actually exercised it.
- **Not fully proven:** the feature exists or is intended, but the latest evidence did not prove the complete behavior.

The latest final ship report is the authority for verification status. Older pitch documents contain claims that are no longer safe to present as current proof.

## 1. What Is TerraTrust AI?

### The problem

Property evidence is scattered. A citizen may have a deed, a tax record, a survey drawing, a map location, and other references, but these pieces are difficult to connect and check. Government officers, surveyors, and banks then spend time reviewing the same evidence in separate workflows.

This creates four practical problems:

- Citizens struggle to show a clear, organized picture of a property.
- Boundaries can disagree with documents or field observations.
- Fraud and risk signals can be hard to spot early.
- Banks may not have enough trusted property information for assessment.

### The solution

TerraTrust creates one persistent digital record for a parcel. It brings together the property identity, location, citizen-drawn boundary, documents, verification results, review history, confidence and risk information, and institutional review.

The product is best described as a **property trust layer**. It helps people understand and review evidence. It does not replace the official land registry or the legal authority of Government.

### What the Digital Property Passport means

A Digital Property Passport is the organized evidence and trust summary for one property. It can bring together:

- A stable passport identifier.
- Property name, address, owner information, state and cadastral references.
- Area, coordinates, and the citizen-submitted polygon boundary.
- Uploaded document records and their verification state.
- Workflow status, confidence, fraud and risk signals.
- Surveyor evidence when an assignment exists.
- Government review and decision information when recorded.
- Indicative valuation information when an AI result has actually been produced.
- Timeline and audit information shown by the product.

It is **not a title deed, legal ownership certificate, government land record, or automatic approval of ownership**.

### Who uses it

- **Citizens** register and understand their own property evidence.
- **Surveyors** inspect assigned parcels and submit field evidence.
- **Government officers** review evidence and retain the legal decision.
- **Banks** inspect verified property intelligence for lending or assessment.
- **Administrators** manage users, roles, system information, regions, integrations and audit surfaces.

The current authentication model has these active application roles: Citizen, Surveyor, Government, Bank and Admin. Community is not part of the current product explanation or role flow.

### Why it is useful

TerraTrust gives each participant the same parcel identity while showing information appropriate to that role. It makes evidence easier to review, gives the map and documents a common place, creates a traceable verification workflow, and makes a verified property easier for an institution to assess.

### What makes it different

TerraTrust connects several kinds of evidence around one property record:

`property identity + documents + GIS boundary + verification workflow + surveyor evidence + government review + bank intelligence`

The important distinction is that AI assists the review, while deterministic checks and Government authority keep the final legal meaning outside the AI model.

## 2. Complete End-to-End Story

The intended story is:

1. **Citizen creates a property.** The citizen opens Add Property and enters a name, type, value estimate, description, address, state, location and cadastral references.
2. **Citizen enters property information.** State-aware fields can show terminology and identifiers appropriate to the selected Indian state. Karnataka is the primary demonstrated profile; Maharashtra and Andhra Pradesh profiles are present in the form.
3. **Citizen marks the boundary.** The citizen places or edits points on the map to make a polygon. The application calculates area from that polygon.
4. **Citizen uploads documents.** Documents are uploaded to Supabase Storage and document metadata is saved in the database.
5. **AI analyses available evidence.** The server-side Gemini valuation path exists for an evidence-grounded, indicative analysis. Several other AI-looking screens are present, but they are not all proven Gemini-backed.
6. **n8n orchestrates verification.** The application sends a structured property payload to the configured n8n webhook. The canonical workflow validates and normalizes the request, runs deterministic evidence analysis, makes a decision, saves a verification run, and returns a structured result.
7. **Verification, risk and confidence results are produced.** Results can contain document/OCR confidence, fraud signals, boundary checks, registry checks, risk, confidence, reasons and a status such as `verified`, `manual_review` or `rejected`.
8. **A surveyor can inspect field evidence.** Government can assign a surveyor. The surveyor can inspect the citizen boundary, edit a proposed field boundary, add notes, and submit a decision and optional evidence file.
9. **Government reviews the case.** Government can inspect the property, documents, state references, boundary layers, verification result and surveyor evidence.
10. **Government remains the final legal authority.** The Government workbench supports approve, reject and clarification-request decisions. These decisions are the legal workflow boundary in the product.
11. **The verified property becomes passport-ready.** The property record and verification result can show a verified or passport-ready outcome. The passport remains an evidence summary, not legal title.
12. **A bank can use verified property intelligence.** Bank users can inspect eligible verified properties, see property and trust information, and use the loan workflow where the required records and authorization exist.

### What is actually implemented versus proven

- The citizen property, boundary, document, passport and production dashboard path is the strongest current evidence and was exercised in the latest pass.
- Supabase persistence for a fresh property, passport, document, verification result and review case exists in prior QA evidence.
- The live n8n webhook has prior execution evidence, but the latest pass could not verify the n8n editor/API session and did not prove Gemini inside n8n.
- Surveyor, Government, Bank and Admin screens and persistence paths exist, but complete fresh role acceptance was not completed in the latest pass.
- A fresh AI valuation response was not visible in the final browser run.
- The Aparsoft widget was most recently verified with real responses and navigation persistence, as described in Section 13.

## 3. Citizen Side

### Dashboard

**What the citizen sees:** Summary cards for the property portfolio, verification counts, pending or disputed work, recent activity and shortcuts into the main workflow.

**What they can click:** A property, My Properties, Add Property, verification, valuation, AI screens, notifications, profile, settings and support. The global Aparsoft widget is also available to an authenticated user.

**What happens:** The dashboard loads the authenticated user’s property information and routes the citizen to the relevant workflow.

**Saved data and system:** User identity and profile come from Supabase Auth and the `profiles` table. Property counts and property records come from Supabase when configured. The latest production smoke test authenticated and displayed a fresh persisted QA property and passport.

### Properties

**What the citizen sees:** A list of their property records with passport identifiers, location, status, trust information and actions.

**What they can click:** A property opens the property workspace or passport; Add Property opens the registration wizard.

**What happens:** The selected property becomes the context for documents, boundary, verification, timeline, AI pages and sharing or reporting surfaces.

**Saved data and system:** Owned property data is loaded from Supabase through the property repository. The database property record includes owner, passport ID, location, area and status.

### Add / Create Property

**What the citizen sees:** A five-step wizard: Property Details, Location, Boundary & GIS, Documents, and Review & Submit.

**What they can click:** They enter property details, choose a state and property type, enter or detect coordinates, edit the polygon, attach documents, then submit.

**What happens:** The app creates a real property row, uploads documents, saves document metadata, calls the configured n8n verification path, and displays either a structured result or an explicit n8n failure. It does not silently replace a failed live n8n call with a fake success.

**Saved data and system:** Supabase stores the property. Supabase Storage stores private document files. Supabase stores document metadata. Verification results and review information are persisted when the live result is available. A new property starts as `pending` in the current data model.

### Property details

**What the citizen sees:** The property identity, passport ID, address, state, area, valuation field, trust/confidence information, boundary map and links to property sections.

**What they can click:** Tabs and actions lead to Boundary, Documents, Timeline, Ownership, GIS layers, AI analysis, Verification, sharing and passport/PDF surfaces.

**What happens:** The application loads the selected property and presents its evidence as a single record.

**Saved data and system:** The property repository reads from Supabase and may use fallback display data for older UI surfaces. A presenter should use a fresh persisted QA property when claiming that data is live.

### Map and boundary

**What the citizen sees:** A MapLibre-based map with a property polygon, points and location context.

**What they can click:** They can place, drag and edit boundary vertices in the registration flow. Read-only maps show the stored geometry for inspection.

**What happens:** The polygon is recalculated as it changes. The area, centroid and perimeter-related information can be shown in the property and verification views.

**Saved data and system:** The boundary and area are sent with the property and persisted through Supabase property data. Prior QA evidence confirms persisted boundary evidence for a fresh property. Cross-role reload of that exact geometry was not repeated in the latest ship pass.

### Documents

**What the citizen sees:** A document upload area and a property document list. Documents can be categorized, for example as deed, survey, tax, ID or other.

**What they can click:** They choose files, upload them, and open the document or continue to review and submit.

**What happens:** The binary is uploaded to the private `property-documents` Storage bucket. A metadata row is written to `property_documents`, including name, kind, path and verification flag.

**Saved data and system:** Supabase Storage holds the file; Supabase PostgreSQL holds metadata. The latest final report says a prior upload exists but the authorized and unauthorized Storage access checks were not repeated in the final pass.

### Verification

**What the citizen sees:** A verification timeline/workbench with workflow steps, status, scores, reasons, state profile references, boundary comparison and result details.

**What they can click:** Run Live Verification or Re-run n8n. They can open the result, property passport and relevant review context.

**What happens:** The property payload is sent to n8n. A successful result is persisted to Supabase. A manual-review result is presented as human review rather than automatic approval. An unavailable or failed n8n call is shown as failed.

**Saved data and system:** The n8n webhook is the external orchestrator. Supabase stores verification results and review cases where the persistence path succeeds. Prior webhook evidence exists; a fresh Gemini-in-n8n execution does not.

### Passport

**What the citizen sees:** A consolidated property identity and evidence view, including passport ID, area, boundary, documents, verification state, trust/confidence context, risk context and timestamps where available.

**What they can click:** They can inspect sections, open verification, view document and timeline details, and use the passport/PDF/share surfaces that are present.

**What happens:** The passport presents the stored property and verification information. It does not turn an AI score into legal title.

**Saved data and system:** Passport identity is stored with the property record. Verification information comes from Supabase verification results and any government decision record.

### AI features

**What the citizen sees:** An AI hub and separate screens for valuation, confidence, OCR, boundary, satellite, land health, risk, fraud, recommendations, suggestions, summary, timeline and passport intelligence.

**What they can click:** Depending on the screen, they select a property, run analysis, open a report, inspect factors or read recommendations.

**What happens:** The pages render a mixture of persisted property data, deterministic application calculations and feature-specific displays. Only the valuation page is directly wired to the server-side Gemini function in the current source audit.

**Saved data and system:** The valuation path can persist an AI analysis in Supabase `ai_analyses`. The latest fresh browser run loaded the property and enabled the action but did not return a visible result. Other AI surfaces must not be presented as freshly proven Gemini features.

### Valuation

**What the citizen sees:** A property selector, a Run AI analysis button, an indicative INR estimate, a range and confidence when analysis is returned, plus an explicit non-binding warning.

**What they can click:** Select a persisted property and run analysis.

**What happens:** The server-side Gemini function receives the property evidence, asks for structured JSON, displays the result and attempts to persist it.

**Saved data and system:** The Gemini request uses `GEMINI_API_KEY` on the server. The result can be saved to the AI analysis table. Fresh valuation response was not proven in the final browser session, so do not call it live during a presentation unless the result visibly returns.

### Fraud and risk

**What the citizen sees:** Fraud and risk pages with signals, severity, risk dimensions, reasons and review-oriented displays.

**What they can click:** They can inspect a property’s risk/fraud information and follow recommended next steps where shown.

**What happens:** The current verification path computes deterministic fraud and risk information from the supplied property evidence. The feature screens are not all proven to be server-side Gemini analyses.

**Saved data and system:** Verification results can persist scores and reasons. Do not claim that every fraud or risk page is a fresh model run or a government finding.

### Notifications

**What the citizen sees:** A notification list for workflow, review, verification and support events.

**What they can click:** They can open notification context and navigate to the related property or workflow.

**What happens:** The UI routes to related surfaces. The latest ship report did not make a separate fresh notification mutation claim.

**Saved data and system:** Notification storage exists in the application model, but the complete fresh notification lifecycle was not a final ship-pass acceptance target.

### Aparsoft assistant

The current assistant is the global authenticated Aparsoft widget. See Section 13 for the latest verified behavior.

## 4. GIS and Property Boundary

### How the map works

The website uses MapLibre-based map components. A property has a center coordinate and a polygon made from latitude/longitude points. The map can be interactive during capture and read-only during review.

### How a citizen marks the boundary

In Add Property, the citizen reaches Boundary & GIS, places or adjusts polygon points, and closes the shape. The current form starts with a four-point example boundary and lets the user edit it. The map is a visual and geographic record of the citizen’s claimed parcel.

### Polygon editing

Editable points can be dragged. The application keeps the edited point list in the form, recalculates the polygon area, and sends the final vertices as part of the property submission.

### Area calculation

The application calculates area from the polygon geometry and displays state-aware area formatting where applicable. The stored property includes the calculated area. Area is a geometric calculation from the submitted points, not an official land measurement by itself.

### Persistence

The boundary and area travel with the property record and are used again in property, verification, surveyor and government views. Prior QA evidence shows a fresh property with persisted four-point boundary geometry and area. The latest pass did not repeat cross-role reload testing for that geometry.

### Intended use by surveyor and Government

- The surveyor sees the citizen-claimed boundary, can adjust a proposed field boundary, add field notes and submit a decision.
- Government sees boundary layers and can compare the citizen shape with surveyor evidence and other referenced layers.
- The resulting surveyor evidence can contribute to the review that Government decides.

### What GIS proves and does not prove

GIS proves what coordinates and polygon the application received, how large that polygon calculates to be, and how the stored shape compares with another supplied shape. It can expose differences and support field review.

GIS does **not** by itself prove legal ownership, title, official cadastral correctness, lawful possession, or Government approval. A map polygon is evidence for review, not a legal land record.

## 5. Documents and AI

### Document handling

The citizen selects a supported property document. The application uploads the binary to Supabase Storage and saves a database metadata record linked to the property. The record includes the document name, category, storage path and whether it has been marked verified.

The document is then available as evidence for the verification payload and for authorized review surfaces. The latest final report records prior upload evidence but says Storage access controls were not freshly rechecked in the final pass.

### AI feature truth table

| Feature | Intended purpose | Server-side Gemini wiring | Fresh production proof | Persistence |
|---|---|---|---|---|
| OCR / document intelligence | Extract and organize document fields and identify missing or unusual evidence. | The current n8n workflow uses deterministic Code-node evidence analysis; the feature page itself is not proven as a Gemini call. | Not freshly proven as a Gemini document run. | Document metadata and verification results can be persisted; do not claim a fresh OCR model row without evidence. |
| Valuation | Produce an evidence-grounded, indicative INR estimate, range and confidence. | **Yes.** `/valuation` calls the server-side Gemini function. | **Not proven in the final run:** the fresh action returned no visible result. | The code attempts to persist `ai_analyses`; a fresh row was not created for the final QA property. |
| Fraud detection | Identify signals such as duplicate or conflicting evidence and route cases for review. | Deterministic local and n8n analysis paths exist; not proven as Gemini-backed. | Verification outputs have prior evidence; fresh full browser acceptance was not repeated. | Verification results can contain fraud score, band and reasons. |
| Risk analysis | Summarize property risk dimensions and identify attention areas. | Deterministic property intelligence and n8n Code nodes exist; not proven as Gemini-backed. | Not freshly proven as an independent production AI run. | Risk can be included in verification results. |
| Confidence | Combine evidence factors into a score and explain why confidence is high or low. | The current confidence engine is deterministic; it is not presented as a Gemini decision. | Core confidence/verification path has prior evidence; latest pass did not reaccept every role. | Confidence is part of verification results and property trust data. |
| Property summary | Explain the property and evidence in plain language. | A screen exists; fresh Gemini backing was not proven. | Not freshly proven. | Persistence of a generated summary was not established in the latest pass. |
| Recommendations | Suggest next review or evidence steps. | A screen exists; fresh Gemini backing was not proven. | Not freshly proven. | Persistence was not established in the latest pass. |
| Boundary-related analysis | Compare claimed, surveyor and referenced boundary information. | GIS calculations and deterministic checks exist; Gemini backing was not proven. | Persisted GIS evidence has prior proof; cross-role reload was not repeated in the final pass. | Boundary geometry and verification results can be persisted. |
| Timeline / history | Show property events, decisions and evidence history. | The timeline surface exists; it is not proven as a Gemini feature. | Route exists; fresh complete history acceptance was not a final PASS. | Timeline/event data is part of the application model and review records. |
| Passport intelligence | Bring property evidence, status, confidence, risk and valuation context together. | Passport surfaces exist; not proven as Gemini-generated. | Citizen passport visibility was production verified. | Passport/property and verification records are persisted. |

### Important presentation rule

Say **AI-assisted indicative valuation** only when a fresh result is visibly returned. Say **deterministic verification result** for the n8n evidence workflow unless and until a Gemini provider node is actually installed and executed inside n8n.

## 6. Gemini

### Where Gemini fits

Gemini is an application-side AI service for structured property analysis, especially the valuation path. The flow is:

`citizen property evidence -> server-side AI request -> structured JSON result -> database persistence attempt -> UI result`

The property evidence can include the property record, location, area, boundary, documents and existing scores. The server prompt tells the model to analyze only supplied evidence, avoid inventing government records or comparables, return structured JSON, and use insufficient-evidence responses rather than guessing.

### Why the API key is server-side

The Gemini API key is read from the server environment as `GEMINI_API_KEY`. It is not exposed as a browser `VITE_` key. This prevents the browser bundle and ordinary users from receiving the secret. Supabase service-role credentials are also not used in browser code.

### Gemini in the application versus Gemini in n8n

- **Gemini in the application:** Implemented as a server-side function for property AI analysis and wired directly to the valuation screen. The latest fresh browser run did not prove a visible valuation result.
- **Gemini inside n8n:** **Not proven.** The canonical workflow JSON is built from Webhook, validation, conditional checks, deterministic Code nodes, Supabase persistence and response behavior. The latest final ship report states that no Gemini provider-node execution was proven and the workflow must not be described as Gemini-backed.

Do not merge these two facts. A server-side Gemini function in the web application does not mean that Gemini is running inside n8n.

## 7. n8n

### Purpose

n8n is the external orchestration layer for the verification request. It receives one structured property submission and coordinates validation, analysis, decision and persistence so that the website has a consistent workflow result.

### Intended workflow

`Webhook -> validation and normalization -> evidence processing -> AI/verification stage -> deterministic verification -> decision -> persistence -> response`

In the current proven product, call the AI/verification stage **evidence analysis** unless Gemini in n8n is separately proven.

### What the current workflow actually does

The repository workflow contains these real categories of behavior:

- An authenticated POST webhook at `/webhook/terratrust/verify`.
- Request validation for property ID, passport ID, property fields, boundary size and document file types.
- Conditional branches for invalid or unauthorized/duplicate conditions.
- Deterministic JavaScript analysis for document/OCR-style fields, fraud signals, boundary checks, registry evidence, risk and confidence.
- An automated decision gate that can produce `verified`, `manual_review` or `rejected` behavior according to the supplied evidence and thresholds.
- A structured verification result containing scores, reasons, status, workflow ID and steps.
- Supabase persistence for the verification run and related data where the external credentials and tables are available.
- A response back to the website.

The workflow JSON does **not** prove a Gemini provider node. The latest n8n editor/API attempt hit external access problems including 401/502 and workflow-store errors. The n8n execution and Gemini-provider configuration therefore remain an external dependency and a current blocker to full ship readiness.

### What to say in a demo

Say: “The website sends the real property payload to n8n. n8n validates it, runs deterministic evidence checks, applies the decision gates, saves the verification run and returns the result. Gemini is a separate server-side application service today; Gemini inside this n8n workflow is not yet proven.”

## 8. Surveyor

### Dashboard

The Surveyor dashboard shows field work, assignment counts, submitted work and links to assignments, field tools, boundary capture, documents, verification evidence, reports, cases and notifications.

### Assignments

The assignment list shows properties assigned for field review. A Government or Admin user can use the verification workbench to select a surveyor and persist an assignment. The assignment detail is intended for the assigned surveyor.

### Property inspection

The surveyor sees the passport ID, address, area, state and cadastral identifiers. The page shows the citizen-claimed boundary on a map and allows a separate surveyor boundary to be edited without overwriting the citizen polygon.

### Boundary and evidence review

The surveyor can inspect the polygon, adjust proposed vertices to match physical markers, enter field notes, choose `verified` or `correction_required`, and optionally upload a field evidence file or photo. The upload uses Supabase Storage and document metadata persistence.

### Evidence submission

On submission, the surveyor decision, notes, proposed boundary and field-photo paths are sent through the persistence layer. The UI says the result is forwarded to Government review.

### Verification status

This functionality is implemented in the routes and persistence code. The latest final ship report says no fresh authorized surveyor submission was completed in the final pass, so present it as implemented but not freshly accepted end to end.

## 9. Government

### Dashboard and properties/parcels

Government has a dashboard, registry parcel list, property search, GIS map, verification queue, fraud/evidence views, reports and jurisdiction analytics. The screens show property status categories and evidence-oriented summaries.

### Verification and review

The Government workbench shows the passport, state profile, cadastral identifiers, researched official systems, citizen boundary, surveyor boundary when available, workflow steps, scores and review reasons.

### Decisions

The implemented decision controls are:

- **Approve:** records an approved Government decision and changes the property to verified.
- **Reject:** records a rejected decision and changes the property to disputed.
- **Request clarification:** records a clarification request and leaves the property pending.

Officer notes are saved with the decision path.

### Disputes and audit

Government routes exist for disputes, decisions, statutory audit and review evidence. The latest final ship report did not freshly complete an authorized Government decision in the final pass, so do not present a new browser decision as a current PASS unless it is visibly repeated.

### Legal authority

TerraTrust helps Government review evidence; it does not replace Government land records, title systems, registry orders or legal processes. Government remains the final legal authority. A TerraTrust verification result or passport is not legal title.

## 10. Bank

### What the bank can see

The Bank workspace is intended to show verified or eligible Property Passports, property identity, owner context permitted by the role, valuation context, trust/confidence, risk context, LTV-style information and verification results.

### Workflow

The bank dashboard can list eligible verified properties, open the passport/verification view, and open an Originate Loan dialog. The dialog accepts a lending institution, loan amount and notes, then calls the Supabase persistence layer for the loan application.

### What the bank is not

The bank consumes verified property intelligence for lending and assessment. It does not approve land ownership, alter government title, or become the legal authority.

### Verification status

The Bank routes and authorization behavior exist. The latest final ship report says no fresh persisted assessment was completed in the final pass. Present the bank workflow as implemented but not freshly proven end to end in the current ship evidence.

## 11. Admin

### What the Admin role does

The Admin workspace includes:

- User and role management.
- Role and permission surfaces.
- Jurisdictions and regions.
- State and official-system profiles.
- System health and external service surfaces.
- n8n/integration visibility.
- API credential management screens.
- Audit logs.
- Feedback and platform analytics.
- Security and account settings.

The Admin dashboard reads platform-style counts such as users, properties and verification records from Supabase when available.

### What is actually proven

The Admin routes render and the dashboard path exists. The latest final report says `/admin` rendered but the shared production session had zero live records and a full administrative control audit was not completed. Treat Admin as implemented, not freshly accepted.

## 12. Authentication and Security

### Supabase authentication

Supabase Auth manages sessions, sign-in, sign-up, password reset and authenticated role profiles. After authentication, the application loads the user’s profile and routes the user to the appropriate role home: Dashboard, Surveyor, Government, Bank or Admin.

### Role-based access

The UI uses role-required route guards and role-specific navigation. The database also applies role-aware policies. A Citizen sees their own properties; institutional users receive access appropriate to the workflow and property status.

### RLS

Supabase Row Level Security protects database tables. The current schema enables RLS for profiles, properties, property documents, verification results and review cases. The policies limit property and document access by owner, role and verification state.

### Private documents

Property documents are stored in the private property-document bucket and linked through metadata rows. The browser uses publishable Supabase configuration, not a service-role key. Authorized access checks were not repeated in the latest final pass, so the security design is implemented but Storage acceptance is not a fresh PASS.

### Secret handling

- `GEMINI_API_KEY` stays server-side.
- No `VITE_GEMINI_API_KEY` is used.
- n8n credentials are not placed in source or workflow JSON as secrets.
- Supabase service-role credentials are not put in browser code.
- `.env.local` remains ignored and must not be committed.

## 13. Aparsoft Chatbot

The current assistant integration is Aparsoft.

The latest verified evidence is:

- A global authenticated Aparsoft widget is mounted.
- There is one iframe, not duplicate widgets.
- The widget produced real responses.
- The tested navigation was `Dashboard -> Properties -> Notifications -> Dashboard`.
- Conversation history survived navigation.
- No duplicate widget was observed.
- No failed Aparsoft requests were observed.
- The production session was signed out afterward.

Explain it simply: “Aparsoft is the support assistant available across authenticated TerraTrust screens. It keeps the conversation while the user navigates.” It is a provider-owned support integration, not the legal verification engine and not proof of property ownership.

## 14. Data Flow

```text
Browser
  |
  v
React / TanStack application
  |
  v
Supabase Auth, PostgreSQL, Storage and RLS
  |
  +--> server-side Gemini for structured AI analysis
  |
  +--> n8n verification webhook for orchestration
          |
          v
  verification / review / Government decision
          |
          v
  Digital Property Passport and bank-readable intelligence
```

### Browser

The browser presents screens, collects property evidence, displays maps and sends authenticated requests. It must not hold private service credentials.

### React / TanStack application

This is the website layer: navigation, role workspaces, forms, maps, document controls, verification displays and AI result displays.

### Supabase

Supabase provides authentication, profiles, property records, document metadata, private Storage, verification results, review records, assignments, survey evidence, loan records and RLS boundaries.

### Server-side Gemini

The server sends selected property evidence to Gemini and expects structured JSON. It returns a model result to the application and can persist an AI analysis. It is an assistant to evidence interpretation, not a legal decision-maker.

### n8n

n8n receives the verification payload, validates and normalizes it, runs the current deterministic evidence and decision workflow, persists the run where configured, and returns the result.

### Review and decision

Surveyor evidence and Government review handle cases that should not be treated as automatic approval. Government retains the final legal authority.

## 15. Property Status

Only use statuses that are supported by the current implementation:

| Status | Meaning |
|---|---|
| `draft` | A property record is in an early editable state in the data model. It is supported by the database status constraint, although the latest final citizen QA property began as pending. |
| `pending` | Submitted or awaiting review. A manual-review verification result is mapped to pending on the property. |
| `verified` | The property has a verified property status after the verification/government path. Bank eligibility is based on verified properties. |
| `disputed` | The property is in a conflict/rejected/disputed state and should not be treated as clear collateral. |
| `manual_review` | A verification workflow result requiring human review. This is a workflow result, not the PostgreSQL property status value. |
| `rejected` | A verification workflow result indicating rejection. The property can be mapped to a disputed state. |
| `processing` | A temporary UI/action state while analysis or submission is running. It is not a confirmed persistent property status. |
| `Passport ready` | A workflow/passport outcome shown when the evidence gates clear. It is not a separate confirmed property status in the database constraint. |

Do not describe `submitted` as a separate persistent status unless the screen is clearly showing a submission event rather than a database status.

## 16. Digital Property Passport

The passport represents the evidence-backed trust summary for a parcel. It brings together:

- The parcel’s stable identity and passport ID.
- The citizen-submitted location and polygon.
- Calculated area and state/cadastral references.
- Document metadata and verification information.
- Verification workflow steps, scores and reasons.
- Fraud and risk context.
- Surveyor field evidence when available.
- Government decision and notes when available.
- Indicative AI valuation only when a real result has been returned and persisted.
- Relevant timeline and audit information.

It is useful because a Citizen, authorized reviewer, Government officer or Bank can examine one organized record instead of piecing together disconnected evidence.

It is not a replacement for government title records. It is not automatically court-admissible, legally binding, or proof that AI has approved ownership. Government retains final legal authority.

## 17. What Is Actually Working Right Now?

| Feature | Implemented | Production verified | Current limitation |
|---|---|---|---|
| Production login and Citizen dashboard | Yes | Yes, latest pass | Fresh citizen flow was the strongest current acceptance; broader role acceptance remains incomplete. |
| Citizen property list and property passport | Yes | Yes for a fresh persisted QA property/passport | Full mutation/reload audit was not repeated for every path. |
| Add/Create Property | Yes | Core path and prior persistence evidence | Complete latest browser acceptance of every step was not repeated. |
| GIS boundary capture and area | Yes | Prior QA persisted boundary evidence; latest citizen property was visible | Cross-role geometry reload was not repeated in the final pass. |
| Document upload and metadata | Yes | Prior QA upload and metadata evidence | Storage authorization checks were not repeated in the final pass. |
| Live n8n verification webhook | Yes | Prior webhook evidence exists | Latest n8n editor/API access had 401/502/store errors; fresh Gemini-in-n8n execution is not proven. |
| Deterministic verification result | Yes | Prior verification result and workflow reference exist | Do not call it Gemini-backed. |
| Server-side Gemini valuation path | Yes | Server code and feature route exist; prior historical persistence evidence exists | Fresh valuation response was not visible in the final browser run. |
| OCR/fraud/risk/confidence screens | Yes | Some deterministic verification evidence exists | Not all are server-side Gemini features or freshly run production analyses. |
| Surveyor assignment and evidence code | Yes | Route/persistence implementation exists | Fresh authorized submission was not completed in the final pass. |
| Government review and decision code | Yes | Route and decision persistence code exist | Fresh authorized decision was not completed in the final pass. |
| Bank eligible-property and loan workflow | Yes | Route/authorization observed | Fresh persisted bank assessment was not completed in the final pass. |
| Admin dashboard and controls | Yes | `/admin` rendered | Full fresh control audit was not completed; shared session showed zero live records. |
| Supabase Auth, database and RLS design | Yes | Auth and persisted QA records evidenced | Full fresh mutation and unauthorized-access audit was not repeated. |
| Private Storage documents | Yes | Prior upload evidence | Latest final Storage access checks were not proven. |
| Aparsoft authenticated widget | Yes | Yes: real responses, one iframe, history survived navigation, no failed requests observed | It is an external provider integration; do not confuse it with verification or Gemini. |
| Production deployment | Yes | Production URL loaded and `/login` returned HTTP 200 | The final source change was not deployed during the latest pass. |

## 18. What Is Not Fully Proven?

The honest unresolved list is:

- **Fresh AI valuation response:** The final browser run loaded the persisted property and enabled the valuation action, but no visible fresh result returned.
- **Gemini inside n8n:** The canonical workflow’s Gemini provider execution was not proven. The workflow currently appears deterministic and Code-node driven for analysis and decisions.
- **Complete role acceptance:** Fresh complete Government, Surveyor, Bank and Admin acceptance, including mutation, reload, logout/login and unauthorized-route checks, was not completed in the final pass.
- **External n8n access:** The n8n editor/API session reported 401/502 and workflow-store errors, and credential configuration was unavailable to the pass.
- **Fresh Storage security checks:** Prior upload evidence exists, but authorized and unauthorized access checks were not repeated.
- **Fresh production persistence for every institutional role:** Surveyor assignment, Government decision and Bank assessment IDs were not created in the latest final pass.
- **All AI feature wiring:** Several AI screens exist, but the latest source audit does not support calling all of them Gemini-backed or live.
- **Production deployment of the latest source change:** The production URL was healthy, but the final report says the source change was not deployed during that pass.

These are limitations, not hidden passes.

## 19. Simple 30-Second Explanation

“TerraTrust AI is a property trust platform. It gives each parcel a Digital Property Passport that brings together the citizen’s documents, location, GIS boundary, verification results and review history. AI helps interpret the evidence and n8n coordinates the verification workflow. Surveyors can add field evidence, Government makes the final legal decision, and banks can use verified property intelligence for assessment. The passport is an evidence summary, not a replacement for government title records.”

## 20. Simple 1-Minute Explanation

“Today, property evidence is spread across deeds, tax records, maps, surveys and institutional systems. TerraTrust creates one persistent record for the parcel. A citizen enters the property, draws its boundary, uploads documents and submits it for verification. The application stores the evidence in Supabase, sends a structured verification request to n8n, and receives confidence, fraud, boundary, risk and decision information. If something needs human attention, Government can review it and assign a surveyor for field evidence. Once Government has made its decision, the property’s Digital Property Passport gives authorized institutions a clear evidence summary. Banks can use that information for lending assessment, but TerraTrust and AI do not replace legal title or Government authority.”

## 21. Complete 5-Minute Demo Story

Use a fresh persisted QA property where possible. Never show a sample card as if it were a new live result. Do not claim a fresh AI valuation or fresh institutional mutation unless it visibly succeeds during the demo.

### 0:00 Problem

- **Open:** The landing page or login page.
- **Click:** Continue to the authenticated Citizen workspace.
- **Point at:** The fragmented evidence problem, then the role-specific application.
- **Say:** “Property verification is spread across documents, maps, surveys and institutional review. TerraTrust brings those pieces around one persistent parcel identity.”

### 0:30 Citizen

- **Open:** `/dashboard`.
- **Click:** Open the persisted property or go to `/properties`.
- **Point at:** Property count, passport ID, status and verification summary.
- **Say:** “This is the Citizen view. The user sees their own properties and the current state of each one. The property already has a persistent passport identity.”

### 1:00 Property and GIS boundary

- **Open:** The property detail page, then Boundary or the map.
- **Click:** Open the boundary view; in a creation demo, open Add Property and reach Boundary & GIS.
- **Point at:** The polygon vertices, coordinates, calculated area and any read-only comparison layers.
- **Say:** “The citizen can mark the parcel as a polygon and edit its points. TerraTrust stores that geometry and calculates the area. This is GIS evidence for review, not legal proof of title.”

### 2:00 Documents and AI

- **Open:** Documents, then `/valuation` only if a result is already visibly available or can be freshly demonstrated.
- **Click:** Show the document records. Select a persisted property and, only if it returns, click Run AI analysis.
- **Point at:** Document name/category, storage-backed record, the explicit indicative-valuation label, model, confidence and range.
- **Say:** “Documents are stored as private property evidence. The application has a server-side Gemini valuation path that is designed to return structured, evidence-grounded JSON. This is an indicative estimate, not an official valuation. In the latest final run, a fresh valuation response was not proven, so I will not call it live unless the result is visible.”

### 3:00 Verification and n8n

- **Open:** `/properties/{id}/verify`.
- **Click:** Run Live Verification or Re-run n8n only when the webhook is reachable.
- **Point at:** Workflow steps, document/OCR evidence, fraud/risk scores, boundary checks, confidence, decision reason and manual-review message.
- **Say:** “The real property payload goes to n8n. The current workflow validates and normalizes it, runs deterministic evidence checks, applies decision gates, saves the verification run where configured and returns a structured result. Gemini inside this n8n workflow has not been proven.”

### 3:30 Surveyor

- **Open:** Government review or `/surveyor/assignments` if a fresh authorized assignment is available.
- **Click:** Open an assignment and inspect the field map.
- **Point at:** Citizen claimed boundary, editable surveyor boundary, notes and evidence upload.
- **Say:** “A surveyor can inspect the claimed polygon against field evidence, propose a separate field boundary, add notes and submit either verified or correction required. This contributes evidence; it does not make the legal decision.”

### 4:00 Government

- **Open:** `/government` or the verification workbench.
- **Click:** Open the review case; inspect the evidence and decision controls.
- **Point at:** Cadastral references, state systems, boundary layers, review reasons and Approve/Reject/Request Clarification.
- **Say:** “Government reviews the complete evidence picture. Government remains the final legal authority. TerraTrust assists this decision; it does not replace the land registry.”

### 4:20 Digital Property Passport

- **Open:** The property passport.
- **Click:** Move through the identity, documents, boundary, verification and timeline sections.
- **Point at:** Passport ID, status, evidence and decision history.
- **Say:** “The passport is the evidence and trust summary for the parcel. It is portable property intelligence, not legal title.”

### 4:40 Bank

- **Open:** `/bank` with a fresh authorized Bank session only if available.
- **Click:** Inspect a verified property, then Originate Loan if the persistence flow has been freshly confirmed.
- **Point at:** Verified property, valuation context, confidence/risk, collateral information and loan fields.
- **Say:** “The bank consumes verified property intelligence for lending assessment. It can evaluate collateral and record an application, but it is not the authority that determines ownership.”

### 5:00 Closing

- **Open:** Leave the passport or dashboard visible.
- **Point at:** The single parcel identity and linked evidence.
- **Say:** “TerraTrust turns fragmented property evidence into an organized, auditable trust record while keeping AI assistive, surveyor evidence practical, and Government legally in control.”

## 22. Judge Questions

### Why do we need TerraTrust?

Because property evidence is fragmented and difficult to review. TerraTrust puts the parcel, documents, boundary, verification and institutional review around one persistent identity.

### Why AI?

AI can help organize evidence, identify missing information, summarize documents and produce an indicative valuation faster. It should assist human review, not make unsupported legal claims.

### Why Gemini?

Gemini is used as a server-side structured-analysis service for the application’s AI feature path. It can interpret supplied evidence while the prompt requires it not to invent records or ownership. The current fresh valuation result is not proven in the final run, so present the capability carefully.

### Why n8n?

n8n gives TerraTrust a visible orchestration layer for the verification workflow: validation, normalization, evidence checks, deterministic gates, persistence and response. It makes the process easier to inspect and connect to external systems.

### Why GIS?

Documents describe a property, but a boundary describes where the claimed parcel is. GIS lets the system calculate area, compare shapes and give surveyors and Government a common visual reference.

### Why a surveyor?

A map polygon and document are not the same as field evidence. A surveyor can inspect physical markers, adjust a proposed field boundary and submit evidence for Government review.

### Why Government?

Government is the legal authority for land records and decisions. TerraTrust organizes evidence and supports review; it does not replace the official land administration system.

### Why a bank?

Banks need trusted, understandable property intelligence before assessing land-backed lending. The bank consumes the passport and verification context; it does not decide legal ownership.

### Is this legally binding?

No. The Digital Property Passport is an evidence and trust summary. It is not a replacement for government title records or a legal ownership certificate.

### Can AI approve land ownership?

No. AI can assist evidence analysis. Government retains the final legal decision.

### How do you prevent hallucinations?

The server-side prompt tells Gemini to use only supplied evidence, return structured JSON and report insufficient evidence instead of guessing. Deterministic checks and human Government review provide additional control. This reduces risk; it does not make hallucinations impossible.

### How is fraud detected?

The verification workflow examines supplied document, identity, boundary, registry, dispute, anomaly and risk signals. It produces a score, band and reasons that can route a case to manual review. It is a signal system, not an automatic legal finding.

### What happens when there is a conflict?

The workflow can return manual review or rejected. The property can remain pending or become disputed. Government can request clarification, inspect surveyor evidence and make the final decision.

### What happens when documents disagree with the map?

The mismatch becomes a review reason or boundary attention signal. The surveyor can inspect the parcel and submit field evidence. Government decides what the official record should be.

### How is the system secured?

Supabase Auth manages identity, role profiles and sessions. Supabase RLS limits database access by user and role. Property documents are private Storage objects. Gemini secrets remain server-side, and service-role keys are not shipped to the browser.

### What happens if government APIs are unavailable?

TerraTrust can preserve the supplied document and GIS evidence and mark the official check as documentary evidence or manual review, depending on the workflow. It should not invent a successful government check. The current screens distinguish researched official systems from confirmed live connectors.

### What makes this scalable?

The product separates the browser experience, Supabase persistence, server-side AI and n8n orchestration. A stable property/passport identity lets more review tools and institutional integrations use the same evidence contract. Scaling the concept still requires reliable external credentials, government connectors, role acceptance and production operational work.

## 23. Final One-Page Cheat Sheet

### PROBLEM
Property evidence is fragmented across documents, maps, surveys, registries and institutional workflows.

### SOLUTION
A property trust layer that organizes evidence, GIS, verification, review and bank intelligence around one parcel identity.

### USERS
Citizens, Surveyors, Government officers, Banks and Administrators.

### CORE FLOW
Citizen property -> information -> GIS polygon -> documents -> server-side AI when available -> n8n verification -> surveyor evidence -> Government review -> Passport -> bank assessment.

### AI
Gemini is a server-side structured-analysis service, primarily wired to the valuation path. Fresh valuation output was not proven in the final browser run. Do not call every AI screen Gemini-backed.

### GIS
A stored citizen-claimed polygon with editable points and calculated area. Useful evidence, not legal title.

### N8N
External verification orchestrator. Current workflow validates, normalizes, runs deterministic Code-node checks, applies decision gates, persists the run and responds. Gemini inside n8n is not proven.

### SUPABASE
Auth, profiles, PostgreSQL property records, private document Storage, verification results, review cases, role access and RLS.

### PASSPORT
An evidence/trust summary for a parcel: identity, boundary, documents, status, scores, risk, review history and available valuation context.

### LEGAL DISCLAIMER
The passport and AI outputs do not replace government title records. Government retains final legal authority.

### CURRENT LIMITATIONS
Fresh valuation response not proven; Gemini-in-n8n not proven; complete fresh role acceptance not proven; n8n editor/API access had external 401/502 issues; Storage security checks and fresh institutional mutations were not fully repeated; not all AI screens are proven live Gemini features.

### 5-MINUTE DEMO ORDER
Dashboard -> Property -> GIS boundary -> Documents -> Valuation only if visible -> Verification/n8n -> Surveyor evidence -> Government decision -> Passport -> Bank.

### CLOSING LINE
“TerraTrust turns fragmented property evidence into an organized, auditable trust record while keeping AI assistive and Government legally in control.”
