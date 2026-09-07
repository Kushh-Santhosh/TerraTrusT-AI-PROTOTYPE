# TerraTrust AI — All-India State Land Verification Matrix

> **Authoritative Baseline:** Department of Land Resources (DoLR), Digital India Land Records Modernization Programme (DILRMP), and official State Government Portal Architectures.  
> **Operational Standard:** Zero fictitious integrations. Transparent separation between **LIVE API**, **AUTHORIZED CONNECTOR**, **DOCUMENT/EVIDENCE VERIFICATION**, **MANUAL PORTAL REVIEW**, and **UNAVAILABLE**.

---

## 1. Executive Summary
Land records and property registration in India are State subjects under the Seventh Schedule of the Constitution of India (List II, Entry 18 & Entry 45). Consequently, terminology, record structures, cadastral mapping, and departmental workflows vary fundamentally across jurisdictions.

TerraTrust AI’s verification engine is built on a **State Land Profile Architecture**, routing each property to its jurisdiction’s official records, terminology, and legal evidence standards rather than applying a monolithic schema.

---

## 2. All-India State Land Verification Matrix

| State | Land Record System (Rural/Revenue) | Record of Rights (RoR) | Cadastral / Map System | Registration & Stamps (Deeds & EC) | Mutation & Mutation Register | Urban Property / Municipal Records | Primary Department Authorities | Integration & Access Status |
|---|---|---|---|---|---|---|---|---|
| **Karnataka (KA)** | **Bhoomi** | **RTC** (Record of Rights, Tenancy & Crops / Pahani) | **Mojini** (Cadastral survey & sketch) | **Kaveri 2.0** (Registered Deeds, EC Form 15 & 16, Guidance Value) | Bhoomi Mutation Register (MR Extract) | **e-Aasthi** (BBMP / Urban Local Bodies, ePID, SAS Tax ID, A/B Khata); **e-Swathu** (Gram Panchayats Form 9/11); **BDA** (Bangalore Development Authority layout allotments) | Revenue Dept, Survey Settlement & Land Records (SSLR), Stamps & Registration Dept, BBMP, BDA | Bhoomi: `DOCUMENT/EVIDENCE`<br>Kaveri 2.0: `DOCUMENT/EVIDENCE`<br>e-Aasthi: `DOCUMENT/EVIDENCE`<br>BDA: `DOCUMENT/EVIDENCE`<br>Live Direct API: `UNAVAILABLE` (Protected by OTP/CAPTCHA) |
| **Maharashtra (MH)** | **Mahabhumi / Bhulekh** | **7/12** (Saat Baara / Adhikar Abhilekh), **8A** (Khate Pustika) | **Mahabhunakasha** (Cadastral map parcel integration) | **IGR Maharashtra** (SARITA, Index II, e-Search, Non-Encumbrance) | **Ferfar** (Form 6 Mutation extract) | **City Survey Office** (Property Card / Milkat Patra, CTS Number); BMC/PMC Property Tax | Revenue & Forest Dept, Inspector General of Registration (IGR), Directorate of Land Records (DLR) | Mahabhumi: `DOCUMENT/EVIDENCE`<br>IGR Index II: `DOCUMENT/EVIDENCE`<br>Property Card: `DOCUMENT/EVIDENCE`<br>Mahabhunakasha: `MANUAL PORTAL`<br>Live Direct API: `UNAVAILABLE` |
| **Andhra Pradesh (AP)** | **MeeBhoomi** | **Adangal / Pahani**, **1B** (Record of Rights) | **Bhunaksha AP** (Digitized FMB / Resurvey) | **IGRS AP** (CARD, Encumbrance Certificate, Sec 22A Prohibited Property Check) | **Webland AP** (Integrated online mutation) | **CDMA / Puraseva** (Urban property tax, assessment number, Town Planning) | Revenue Dept, Survey Settlement & Land Records, Registration & Stamps Dept, CDMA | MeeBhoomi: `DOCUMENT/EVIDENCE`<br>IGRS AP: `DOCUMENT/EVIDENCE`<br>Webland: `DOCUMENT/EVIDENCE`<br>Live Direct API: `UNAVAILABLE` |
| **Telangana (TS)** | **Dharani Portal** | **Pattadar Passbook**, **ROR-1B**, **Pahani** | **Bhunaksha TS** / **Bhu-Bharathi** | **Registration & Stamps Dept (IGRS TS)** (e-Challan, EC, Market Value Search, Prohibited Property Registry) | Integrated Dharani Instant Mutation | **GHMC / CDMA** (Property Tax Identification Number - PTIN, Mutation) | Revenue Dept (Chief Commissioner of Land Administration - CCLA), Stamps & Registration Dept | Dharani: `DOCUMENT/EVIDENCE`<br>IGRS TS: `DOCUMENT/EVIDENCE`<br>Live Direct API: `UNAVAILABLE` |
| **Kerala (KL)** | **ReLIS** (Revenue Land Information System) | **Thandapper Account** (RoR), Pokkuvaravu (Mutation) | **e-Rekha** (Bhoomi Keralam, FMB - Field Measurement Book) | **PEARL** (Registration Dept Kerala, Encumbrance Certificate, Fair Value) | ReLIS Online Mutation | **Sanchitha / Sanchaya** (Local Self Government property tax & building permits) | Revenue Dept, Survey and Land Records Dept, Registration Dept | ReLIS: `DOCUMENT/EVIDENCE`<br>PEARL: `DOCUMENT/EVIDENCE`<br>e-Rekha: `MANUAL PORTAL`<br>Live Direct API: `UNAVAILABLE` |
| **Uttar Pradesh (UP)** | **UP Bhulekh** | **Khatauni** (RoR), **Khasra** | **Bhunaksha UP** (Shajra maps) | **IGRSUP** (Stamp and Registration Dept, Registered Deed, Barah Sala / 12-Year EC) | UP Bhulekh E-Court / Mutation | **e-Nagarsewa** (Nagar Nigam property tax); Development Authorities (LDA, NOIDA, YEIDA allotment letters) | Board of Revenue Uttar Pradesh, Stamp and Registration Dept | UP Bhulekh: `DOCUMENT/EVIDENCE`<br>IGRSUP: `DOCUMENT/EVIDENCE`<br>Development Authority: `DOCUMENT/EVIDENCE`<br>Live Direct API: `UNAVAILABLE` |
| **Rajasthan (RJ)** | **Apna Khata / E-Dharti** | **Jamabandi** (RoR), **Khasra Girdawari** | **BhuNaksha Rajasthan** | **E-Panjiyan** (IGR Rajasthan, Registered Sale Deed, Encumbrance) | E-Dharti Mutation | **DLB Rajasthan** / Urban Local Bodies; **JDA / UIT** (Jaipur Development Authority lease deeds / Patta) | Revenue Dept Rajasthan, Registration & Stamps Dept, Urban Development Dept | Apna Khata: `DOCUMENT/EVIDENCE`<br>E-Panjiyan: `DOCUMENT/EVIDENCE`<br>JDA Patta: `DOCUMENT/EVIDENCE`<br>Live Direct API: `UNAVAILABLE` |
| **Delhi (NCT of Delhi)** | **Delhi Land Records (DLRC)** | **Khasra Khatauni** (Revenue villages) | Revenue Survey Settlement Maps | **DORIS** (Delhi Online Registration Information System, Sub-Registrar Offices) | Revenue Dept Mutation Order | **MCD** (Municipal Corporation of Delhi) Property Tax (**UPIC** - Unique Property Identification Code); **DDA** (Delhi Development Authority Conveyance Deed) | Revenue Dept GNCTD, DDA, MCD, Office of Inspector General of Registration | DORIS: `DOCUMENT/EVIDENCE`<br>MCD UPIC: `DOCUMENT/EVIDENCE`<br>DDA: `DOCUMENT/EVIDENCE`<br>DLRC: `DOCUMENT/EVIDENCE`<br>Live Direct API: `UNAVAILABLE` |

---

## 3. Standard Evidence Classification & Adapter Protocol

To prevent falsification or misleading claims, every source check handled by TerraTrust AI is strictly typed into one of five verified operational tiers:

### Protocol Definition:
1. **LIVE API**: Programmatic query executed against an open, authorized government endpoint.
2. **AUTHORIZED CONNECTOR**: Direct API integration using institutional credentials (e.g., Bank/NBFC sandbox, CERSAI, official G2G gateway).
3. **DOCUMENT / EVIDENCE CHECK**: Validates uploaded official extracts (RTC, 7/12, Sale Deed, e-Khata, EC) by comparing document metadata, extracted OCR identifiers, survey numbers, owner names, and area against the citizen's claimed submission.
4. **MANUAL GOVERNMENT / FIELD REVIEW**: Official verification performed by a licensed Surveyor (field boundary confirmation) or Government Officer (legal title resolution).
5. **UNAVAILABLE**: The official system could not be accessed and no valid evidence was provided. The system **NEVER** marks an unavailable check as "Verified".
