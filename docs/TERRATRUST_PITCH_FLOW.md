# TerraTrust AI Pitch Flow

## 0:00-0:30: Problem

Land ownership evidence is fragmented across documents, boundaries, registry references, field observations, government decisions, and financial review. TerraTrust connects those records around one persistent parcel identity.

## 0:30-1:00: Citizen

Show the citizen login, dashboard, Add Property flow, property details, boundary editor, document upload, and generated passport ID.

Say:

> A citizen does not just upload a document. TerraTrust creates a persistent digital identity for the parcel and connects its documents, location, boundary, and verification evidence.

## 1:00-2:00: Property, GIS, and Documents

Show a Karnataka/Bengaluru parcel, its persisted polygon, calculated area, coordinates, document metadata, and passport identifier. Explain that the same stored geometry is shared with authorized surveyor and government workflows.

Be precise: the map is GIS evidence and context, not a claim of direct access to protected government cadastral systems.

## 2:00-3:00: AI and Orchestration

Show the server-side Gemini valuation result labelled **AI-assisted indicative valuation**, the confidence explanation, and the n8n verification result.

Say:

> Gemini interprets the supplied evidence. Deterministic TerraTrust rules keep the authoritative trust and verification decision reproducible. n8n validates, normalizes, persists, audits, and returns the workflow result.

Do not present the valuation or AI interpretation as legal title or an official government valuation.

Current limitation to disclose if asked: the deployed canonical n8n workflow currently has deterministic analysis Code nodes but does not yet contain a Gemini provider node.

## 3:00-3:45: Surveyor and Government

Show the review queue, shared boundary, document evidence, surveyor assignment surface, field evidence controls, and government decision surface when using a verified QA session.

Say:

> AI assists the decision. Surveyors provide field evidence and government retains final legal authority.

## 3:45-4:20: Digital Property Passport

Show the unique passport ID, property identity, area, boundary, documents, verification state, trust score, indicative valuation, risk context, and timestamps.

Say:

> The Property Passport is an evidence-backed trust record for a parcel. It is not a replacement for legal title.

## 4:20-4:45: Bank

Show a verified property, valuation, risk context, and the persisted collateral or loan assessment. Emphasize that bank users receive only the information permitted by the role and workflow state.

## 4:45-5:00: Why TerraTrust

> TerraTrust turns a parcel of land into a verifiable digital trust record by connecting citizen evidence and GIS boundaries with Gemini AI, n8n orchestration, surveyor field validation, government authority, and bank-ready property intelligence.

## Demo Discipline

- Use a fresh QA property and preserve its UUID/passport correlation.
- Show actual persisted records, not static cards.
- Label AI valuation as indicative.
- Distinguish AI interpretation from verified government evidence.
- Never claim a Gemini-in-n8n execution until the canonical workflow visibly contains and executes the Gemini node.
- Never expose credentials during the demo.
