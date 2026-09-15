# TerraTrust AI — Developer & Agent Guidelines

> [!IMPORTANT]
> **Project:** TerraTrust AI (GDTA'26 Smart City & Infrastructure Hackathon, SCI-01)  
> **Author:** Kushal Santhosh  
> **Target Repository:** `Kushh-Santhosh/TerraTrust-AI-PROTOTYPE`

## Architectural Principles

1. **Real Infrastructure Over Mocks:** All data persistence is handled via Supabase PostgreSQL, Storage, and Supabase Auth.
2. **Deterministic & Orchestrated Verification:** The verification engine runs against the live n8n workflow (`POST /webhook/terratrust/verify`).
3. **Role-Based Access Control:** Strict Row Level Security (RLS) guarantees appropriate boundaries between Citizens, Surveyors, Government Officers, Community Verifiers, Banks, and Admins.
4. **Security:** Never expose service-role keys or private credentials to the browser or in `.env` committed files.
