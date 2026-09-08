# TerraTrust AI Pitch Readiness Report

## A. What Is TerraTrust AI?

TerraTrust AI is a property trust layer for India that connects identity, documents, land geometry, AI verification, government review, surveyor evidence, audit history, and bank underwriting around one persistent Property Passport.

## B. The Problem

Land verification is often fragmented across paper deeds, registry references, maps, field surveys, and disconnected institutional workflows. This makes ownership, boundary, fraud, and collateral decisions slow and difficult to audit.

## C. What TerraTrust Does

1. A Citizen creates a property with Karnataka/Bengaluru location, a polygon boundary, calculated area, and supporting documents.
2. Supabase stores the property UUID, immutable passport ID, geometry, area, document metadata, and private document object.
3. The website calls the deployed n8n verification webhook with the real property UUID.
4. n8n validates and normalizes the submission, analyzes document evidence, fraud signals, boundary data, registry references, risk, confidence, and decision gates.
5. A verified result can make the passport eligible for institutional review. A manual-review result creates a Government review case.
6. Government can inspect evidence and assign a Surveyor. Surveyor evidence is persisted and visible back to Government.
7. Government retains the final legal decision.
8. Bank users can inspect verified passports and persist underwriting applications against the property.

The Digital Property Passport is an evidence and trust summary. It is not legal title and does not replace government authority.

## D. What n8n Does

The live workflow is the orchestration layer:

`Website -> POST webhook -> validation/normalization -> OCR/document checks -> fraud analysis -> GIS/boundary checks -> registry evidence -> risk -> confidence -> decision -> response`

The workflow returns structured `verified`, `manual_review`, or `rejected` states. TerraTrust does not silently convert a failed or manual-review result into verified. Fresh executions `#122` and `#123` were observed in the authenticated n8n workspace with `Succeeded` status.

## E. What Supabase Does

Supabase provides:

- Authenticated users and role profiles
- Citizen, Government, Surveyor, Bank, and Admin role boundaries
- Properties and immutable passport IDs
- Persisted polygon geometry and calculated areas
- Private property-document Storage and metadata
- Verification results and review cases
- Surveyor assignments and evidence workflow
- Bank loan applications with RLS
- Audit, notification, valuation, and assistant workflow tables

RLS is enabled on the application tables and the private property-document bucket.

## F. What Vercel Does

Vercel hosts the production TerraTrust web application. Production URL:

https://terra-trus-t-ai-prototype.vercel.app

Production uses the configured Supabase publishable key, current Supabase URL, and live n8n webhook configuration.

## G. What Makes TerraTrust Different

TerraTrust does not stop at an AI score. It connects:

`identity + documents + land geometry + AI analysis + orchestration + government review + surveyor evidence + audit trail + bank-ready verification`

into one property trust layer. AI accelerates evidence processing, while Government remains the final legal authority.

## H. Five-Minute Demo Script

### 0:00-0:30: The problem

Explain that property evidence is fragmented across documents, maps, registries, and field verification.

### 0:30-1:00: Citizen

On `/login`, choose **Continue as Demo Citizen**. Open the Citizen dashboard and show the persisted Bengaluru QA properties.

### 1:00-2:00: Property, boundary, and documents

Open a property. Show the Karnataka coordinates, the persisted polygon, calculated area, passport ID, and uploaded document metadata.

### 2:00-3:00: n8n verification

Open the verification view and run the live workflow. Explain that the real UUID is sent to n8n, which executes validation, document, fraud, GIS, registry, risk, confidence, and decision stages. Show a manual-review result and the corresponding review case.

### 3:00-3:45: Government and Surveyor

Choose **Continue as Demo Government**, open the review property, inspect the same boundary and evidence, and assign the Surveyor. Choose **Continue as Demo Surveyor**, open the persisted assignment, and submit field evidence. Return to Government for the final decision.

### 3:45-4:20: Digital Passport

Show the stable passport ID, evidence, status, decision history, and the distinction between an evidence passport and legal title.

### 4:20-4:45: Bank

Choose **Continue as Demo Bank**. Show the approved eligible property, originate an underwriting application, and show the persisted application in the loan book.

### 4:45-5:00: Closing

TerraTrust turns fragmented property evidence into an auditable trust layer while preserving Government legal authority.

## I. Live Demo Access

Use the production login buttons:

- Continue as Demo Citizen
- Continue as Demo Government
- Continue as Demo Surveyor
- Continue as Demo Bank
- Continue as Demo Admin

Passwords are intentionally not included in this document.

## J. Verified Test Evidence

- Git commit: `dbc7b17`
- Production: `https://terra-trus-t-ai-prototype.vercel.app`
- n8n workflow ID: `2tzD8K0zTU43KzGH`
- Latest verified n8n execution: `#123`, succeeded
- Test property UUID: `e0cb4362-3ce7-4678-af0b-a7e65e2629e9`
- Passport ID: `TT-KA-QA-MTRU9UXS`
- Location: Bellandur, Bengaluru East, Bengaluru Urban, Karnataka
- Verification result: `manual_review`, then Government-approved and persisted as `verified`
- Review case: `1d94e8df-34ff-4b66-a051-bdfccf63f944`
- Surveyor assignment: `be0baf92-51aa-4866-a2e5-f166db3d2332`
- Bank loan application: `27afb0e8-d4ca-46eb-9ad4-9065a43a2083`

## Release Status

The five real roles, production demo login, Supabase persistence, n8n execution, Government approval, Surveyor assignment visibility, GIS/document records, and Bank loan persistence were exercised with real accounts and records.

Known external blocker: the Aparsoft provider iframe mounts globally but remains blank in Chrome. Its loader and public config endpoints return HTTP 200, but the embedded frame fails with `ERR_ABORTED` and exposes no usable chat control. This remains a third-party runtime/provider issue; no replacement chatbot was introduced.

Known validation gap: the repository-wide ESLint run is not clean because of existing `any` and formatting findings, including the user-owned JSON lint-script change. The production build passes.
