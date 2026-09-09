// Researched State Land Verification Profiles for TerraTrust AI
import type { StateLandProfile, NormalizedGovernmentEvidence } from "./types";

export const STATE_PROFILES: Record<string, StateLandProfile> = {
  KA: {
    stateCode: "KA",
    stateName: "Karnataka",
    localTerminology: {
      recordOfRightsName: "RTC / Pahani",
      surveyNumberLabel: "Survey Number",
      subdivisionLabel: "Surnoc & Hissa",
      khataOrAccountLabel: "Khata / e-Khata",
      urbanPropertyCardLabel: "ePID / e-Aasthi (BBMP / ULB)",
      mutationExtractName: "Bhoomi Mutation Extract (MR)",
      deedRegistrationSystemName: "Kaveri 2.0",
      encumbranceCertificateName: "Encumbrance Certificate (Form 15 & 16)",
    },
    unitConversion: {
      primaryLocalUnit: "Gunta",
      localUnitToSqm: 101.171,
      localUnitsPerAcre: 40,
      label: "Guntas (40 Guntas = 1 Acre)",
    },
    cadastralFields: [
      {
        key: "district",
        label: "District",
        placeholder: "e.g., Bengaluru Urban, Mysuru",
        required: true,
      },
      { key: "taluk", label: "Taluk", placeholder: "e.g., Bengaluru East, Anekal", required: true },
      { key: "hobli", label: "Hobli", placeholder: "e.g., Varthur, Bidarahalli", required: true },
      {
        key: "village",
        label: "Village / Town",
        placeholder: "e.g., Bellandur, Whitefield",
        required: true,
      },
      { key: "surveyNumber", label: "Survey Number", placeholder: "e.g., 14/2", required: true },
      { key: "surnoc", label: "Surnoc", placeholder: "e.g., * or 1", required: false },
      { key: "hissa", label: "Hissa Number", placeholder: "e.g., 2A, 1B", required: false },
      {
        key: "epidOrSas",
        label: "ePID / SAS Tax ID (e-Aasthi)",
        placeholder: "e.g., 1502001002003004",
        required: false,
        isUrbanOnly: true,
      },
      {
        key: "khataNumber",
        label: "Khata Certificate No.",
        placeholder: "e.g., A-Khata 8421/2024",
        required: false,
      },
      {
        key: "kaveriRegRef",
        label: "Kaveri 2.0 Registration Reference",
        placeholder: "e.g., KVR-BNG-2024-DOC-9821",
        required: false,
      },
      {
        key: "ecReference",
        label: "Encumbrance Certificate (EC) No.",
        placeholder: "e.g., EC-2024-F15-8812",
        required: false,
      },
      {
        key: "bdaAllotmentRef",
        label: "BDA Site / Layout Allotment Ref",
        placeholder: "e.g., BDA/ALLOT/HRBR/2021/41",
        required: false,
        isUrbanOnly: true,
      },
    ],
    officialSystems: [
      {
        id: "bhoomi",
        name: "Bhoomi Land Records",
        category: "land_records",
        officialPortalUrl: "https://landrecords.karnataka.gov.in/service2/",
        department: "Revenue Department, Government of Karnataka",
        adapterStatus: "DOCUMENT_EVIDENCE",
        description:
          "Official Karnataka land records management system verifying RTC, owner names, land classification, and mutation status.",
        sampleReferenceFormat: "District/Taluk/Hobli/Village/Survey/Hissa",
        requiredFields: ["district", "taluk", "hobli", "village", "surveyNumber"],
      },
      {
        id: "kaveri",
        name: "Kaveri 2.0 Registration & Stamps",
        category: "registration",
        officialPortalUrl: "https://kaveri.karnataka.gov.in/",
        department: "Department of Stamps and Registration, Government of Karnataka",
        adapterStatus: "DOCUMENT_EVIDENCE",
        description:
          "Karnataka registered sale deeds, certified copies, encumbrance certificates (Form 15 & 16), and guidance valuation.",
        sampleReferenceFormat: "KVR-<SRO>-<YEAR>-DOC-<NUM>",
        requiredFields: ["kaveriRegRef"],
      },
      {
        id: "eaasthi",
        name: "e-Aasthi / e-Khata (Urban Municipal)",
        category: "urban_municipal",
        officialPortalUrl: "https://bbmpeaasthi.karnataka.gov.in/",
        department:
          "Bruhat Bengaluru Mahanagara Palike (BBMP) & Directorate of Municipal Administration",
        adapterStatus: "DOCUMENT_EVIDENCE",
        description:
          "Bengaluru & ULB digitized property ownership, ePID issuance, SAS Property Tax records, and A-Khata / B-Khata verification.",
        sampleReferenceFormat: "16-digit ePID or SAS Tax Assessment ID",
        requiredFields: ["epidOrSas"],
      },
      {
        id: "bda",
        name: "Bangalore Development Authority (BDA)",
        category: "planning_authority",
        officialPortalUrl: "https://bdabangalore.org/",
        department: "Urban Development Department, Karnataka",
        adapterStatus: "DOCUMENT_EVIDENCE",
        description:
          "BDA layout approval, site allotment, possession certificates, and master plan land use zoning.",
        sampleReferenceFormat: "BDA/ALLOT/<LAYOUT>/<YEAR>/<SITE_NO>",
        requiredFields: ["bdaAllotmentRef"],
      },
      {
        id: "mojini",
        name: "Mojini Cadastral Survey",
        category: "cadastral",
        officialPortalUrl: "https://landrecords.karnataka.gov.in/service37/",
        department: "Survey Settlement and Land Records (SSLR)",
        adapterStatus: "MANUAL_REVIEW",
        description:
          "Official pre-mutation sketch (11E sketch) and digitized cadastral village parcel maps.",
        requiredFields: ["surveyNumber"],
      },
    ],
    recommendedDocuments: [
      {
        kind: "deed",
        label: "Registered Sale Deed / Title Deed (Kaveri)",
        description: "Registered conveyance instrument with SRO stamp and registration number.",
        isMandatory: true,
      },
      {
        kind: "survey",
        label: "RTC / Pahani (Bhoomi Extract)",
        description:
          "Current year Record of Rights, Tenancy & Crops showing owner name and extent.",
        isMandatory: true,
      },
      {
        kind: "tax",
        label: "Khata Certificate / e-Khata Extract",
        description: "e-Aasthi ePID extract or A-Khata certificate showing municipal assessment.",
        isMandatory: false,
      },
      {
        kind: "other",
        label: "Encumbrance Certificate (EC Form 15)",
        description: "Kaveri 2.0 non-encumbrance certificate for past 15 to 30 years.",
        isMandatory: false,
      },
      {
        kind: "other",
        label: "Bhoomi Mutation Extract (MR)",
        description: "Official mutation order reflecting current title transfer.",
        isMandatory: false,
      },
    ],
  },

  MH: {
    stateCode: "MH",
    stateName: "Maharashtra",
    localTerminology: {
      recordOfRightsName: "7/12 Extract (Saat Baara)",
      surveyNumberLabel: "Gat Number / Survey Number",
      subdivisionLabel: "Hissa / Poth Hissa",
      khataOrAccountLabel: "8A Khate Pustika (Holding Account)",
      urbanPropertyCardLabel: "Property Card / Milkat Patra (CTS No)",
      mutationExtractName: "Ferfar Extract (Form 6)",
      deedRegistrationSystemName: "IGR Maharashtra (SARITA)",
      encumbranceCertificateName: "Index II & e-Search Certificate",
    },
    unitConversion: {
      primaryLocalUnit: "Gunta",
      localUnitToSqm: 101.171,
      localUnitsPerAcre: 40,
      label: "Guntas (40 Guntas = 1 Acre)",
    },
    cadastralFields: [
      {
        key: "district",
        label: "District",
        placeholder: "e.g., Pune, Mumbai Suburban, Thane",
        required: true,
      },
      {
        key: "taluka",
        label: "Taluka / Tehsil",
        placeholder: "e.g., Haveli, Mulshi, Kurla",
        required: true,
      },
      {
        key: "village",
        label: "Village / City Division",
        placeholder: "e.g., Hinjawadi, Wakad, Andheri",
        required: true,
      },
      {
        key: "gatOrSurveyNo",
        label: "Gat No. / Survey No.",
        placeholder: "e.g., Gat 241, Survey 88",
        required: true,
      },
      { key: "hissaNo", label: "Hissa Number", placeholder: "e.g., 1A, 2/1", required: false },
      {
        key: "ctsNumber",
        label: "CTS Number (City Survey No.)",
        placeholder: "e.g., CTS 1042/B",
        required: false,
        isUrbanOnly: true,
      },
      {
        key: "saatBaaraRef",
        label: "7/12 Digital Reference No.",
        placeholder: "e.g., 712-PUN-HAV-2024-891",
        required: false,
      },
      {
        key: "aathARef",
        label: "8A Khate Number",
        placeholder: "e.g., Khate No. 412",
        required: false,
      },
      {
        key: "ferfarNumber",
        label: "Ferfar / Mutation Entry No.",
        placeholder: "e.g., Mutation No. 3412",
        required: false,
      },
      {
        key: "igrDocRef",
        label: "IGR Maharashtra Document / Index II Ref",
        placeholder: "e.g., HAV-4-12401-2023",
        required: false,
      },
    ],
    officialSystems: [
      {
        id: "mahabhumi",
        name: "Mahabhumi / Bhulekh (7/12 & 8A)",
        category: "land_records",
        officialPortalUrl: "https://bhulekh.mahabhumi.gov.in/",
        department: "Revenue & Forest Department, Government of Maharashtra",
        adapterStatus: "DOCUMENT_EVIDENCE",
        description:
          "Official Maharashtra portal for digitized 7/12 extracts, 8A landholding accounts, and Ferfar mutation extracts.",
        sampleReferenceFormat: "District/Taluka/Village/GatNo/Hissa",
        requiredFields: ["district", "taluka", "village", "gatOrSurveyNo"],
      },
      {
        id: "propertycard",
        name: "City Survey Property Card (Milkat Patra)",
        category: "urban_municipal",
        officialPortalUrl: "https://digitalsatbara.mahabhumi.gov.in/aapli-chawdi/",
        department: "Directorate of Land Records, Maharashtra",
        adapterStatus: "DOCUMENT_EVIDENCE",
        description:
          "Urban landholding title deed and CTS (City Survey) parcel card for Mumbai, Pune, Nagpur, and municipal corporations.",
        sampleReferenceFormat: "CTS Number / City Survey Division",
        requiredFields: ["ctsNumber"],
      },
      {
        id: "igrmaharashtra",
        name: "IGR Maharashtra (SARITA & e-Stepin)",
        category: "registration",
        officialPortalUrl: "https://igrmaharashtra.gov.in/",
        department: "Inspector General of Registration & Controller of Stamps, Maharashtra",
        adapterStatus: "DOCUMENT_EVIDENCE",
        description:
          "Registered sale deed authentication, Index II verification, e-Search encumbrance check, and market valuation.",
        sampleReferenceFormat: "<SRO_CODE>-<DOC_NO>-<YEAR>",
        requiredFields: ["igrDocRef"],
      },
      {
        id: "mahabhunakasha",
        name: "Mahabhunakasha (Cadastral Maps)",
        category: "cadastral",
        officialPortalUrl: "https://mahabhunakasha.mahabhumi.gov.in/",
        department: "Land Records Department, Maharashtra",
        adapterStatus: "MANUAL_REVIEW",
        description:
          "Digitized cadastral village maps, Tippan, and parcel boundary overlay for Gat and Survey numbers.",
        requiredFields: ["gatOrSurveyNo"],
      },
    ],
    recommendedDocuments: [
      {
        kind: "deed",
        label: "Registered Sale Deed & Index II (IGR Maharashtra)",
        description: "Certified copy of registered conveyance deed along with Index II extract.",
        isMandatory: true,
      },
      {
        kind: "survey",
        label: "Digitally Signed 7/12 Extract (Saat Baara)",
        description:
          "Official Mahabhumi 7/12 extract reflecting current owner, area, and cultivation rights.",
        isMandatory: true,
      },
      {
        kind: "tax",
        label: "8A Landholding Account / Property Card",
        description:
          "8A Khate Pustika for rural revenue land, or City Survey Property Card for urban areas.",
        isMandatory: false,
      },
      {
        kind: "other",
        label: "Ferfar Extract (Form 6 Mutation)",
        description:
          "Official record of mutation entries showing historical ownership transitions.",
        isMandatory: false,
      },
    ],
  },

  AP: {
    stateCode: "AP",
    stateName: "Andhra Pradesh",
    localTerminology: {
      recordOfRightsName: "Adangal / Pahani & 1B RoR",
      surveyNumberLabel: "Survey Number / LP Number",
      subdivisionLabel: "Sub-Division Number",
      khataOrAccountLabel: "Khata Number",
      urbanPropertyCardLabel: "CDMA Assessment Number",
      mutationExtractName: "Webland Mutation Order",
      deedRegistrationSystemName: "IGRS AP (CARD)",
      encumbranceCertificateName: "CARD Encumbrance Certificate (EC)",
    },
    unitConversion: {
      primaryLocalUnit: "Cent",
      localUnitToSqm: 40.4686,
      localUnitsPerAcre: 100,
      label: "Cents (100 Cents = 1 Acre)",
    },
    cadastralFields: [
      {
        key: "district",
        label: "District",
        placeholder: "e.g., Visakhapatnam, Krishna, Guntur",
        required: true,
      },
      {
        key: "mandal",
        label: "Mandal",
        placeholder: "e.g., Vijayawada Urban, Gajuwaka",
        required: true,
      },
      {
        key: "village",
        label: "Village / Ward",
        placeholder: "e.g., Madhurawada, Poranki",
        required: true,
      },
      { key: "surveyNumber", label: "Survey Number", placeholder: "e.g., 204/1A", required: true },
      {
        key: "khataNumber",
        label: "Pattadar Khata Number",
        placeholder: "e.g., Khata 154",
        required: false,
      },
      {
        key: "adangalRef",
        label: "MeeBhoomi Adangal Ref",
        placeholder: "e.g., AP-MB-2024-AD-921",
        required: false,
      },
      {
        key: "igrsDocRef",
        label: "IGRS AP Registration Ref",
        placeholder: "e.g., RO-VJA-2023-4122",
        required: false,
      },
    ],
    officialSystems: [
      {
        id: "meebhoomi",
        name: "MeeBhoomi Land Records",
        category: "land_records",
        officialPortalUrl: "https://meebhoomi.ap.gov.in/",
        department: "Revenue Department, Government of Andhra Pradesh",
        adapterStatus: "DOCUMENT_EVIDENCE",
        description:
          "Official Andhra Pradesh portal for electronic Adangal, Village 1B RoR, and Pattadar passbook details.",
        requiredFields: ["district", "mandal", "village", "surveyNumber"],
      },
      {
        id: "igrsap",
        name: "IGRS AP (Registration & Stamps)",
        category: "registration",
        officialPortalUrl: "https://registration.ap.gov.in/",
        department: "Registration and Stamps Department, AP",
        adapterStatus: "DOCUMENT_EVIDENCE",
        description:
          "Encumbrance Certificate search, Section 22A prohibited property check, and registered document lookup.",
        requiredFields: ["igrsDocRef"],
      },
    ],
    recommendedDocuments: [
      {
        kind: "deed",
        label: "Registered Sale Deed (IGRS AP)",
        description: "Registered title deed with registration number and sub-registrar seal.",
        isMandatory: true,
      },
      {
        kind: "survey",
        label: "MeeBhoomi 1B / Adangal Extract",
        description: "Official electronic 1B record of rights or Adangal printout.",
        isMandatory: true,
      },
      {
        kind: "tax",
        label: "Pattadar Passbook / Tax Receipt",
        description: "Electronic Pattadar passbook extract or land revenue receipt.",
        isMandatory: false,
      },
    ],
  },

  TS: {
    stateCode: "TS",
    stateName: "Telangana",
    localTerminology: {
      recordOfRightsName: "Pattadar Passbook / ROR-1B",
      surveyNumberLabel: "Survey Number",
      subdivisionLabel: "Hissa / Sub-Division",
      khataOrAccountLabel: "Passbook / Khata Number",
      urbanPropertyCardLabel: "GHMC / CDMA PTIN",
      mutationExtractName: "Dharani Instant Mutation Extract",
      deedRegistrationSystemName: "Dharani & IGRS Telangana",
      encumbranceCertificateName: "Telangana EC Online",
    },
    unitConversion: {
      primaryLocalUnit: "Gunta",
      localUnitToSqm: 101.171,
      localUnitsPerAcre: 40,
      label: "Guntas (40 Guntas = 1 Acre)",
    },
    cadastralFields: [
      {
        key: "district",
        label: "District",
        placeholder: "e.g., Rangareddy, Medchal-Malkajgiri, Hyderabad",
        required: true,
      },
      {
        key: "mandal",
        label: "Mandal",
        placeholder: "e.g., Serilingampally, Rajendranagar",
        required: true,
      },
      {
        key: "village",
        label: "Village / Ward",
        placeholder: "e.g., Gachibowli, Madhapur",
        required: true,
      },
      { key: "surveyNumber", label: "Survey Number", placeholder: "e.g., 42/E", required: true },
      {
        key: "passbookNumber",
        label: "Pattadar Passbook Number",
        placeholder: "e.g., T08120041234",
        required: false,
      },
      {
        key: "ptinNumber",
        label: "GHMC PTIN (Urban Property Tax)",
        placeholder: "e.g., 1021004521",
        required: false,
        isUrbanOnly: true,
      },
    ],
    officialSystems: [
      {
        id: "dharani",
        name: "Dharani Integrated Land Records",
        category: "land_records",
        officialPortalUrl: "https://dharani.telangana.gov.in/",
        department: "Revenue Department (CCLA), Government of Telangana",
        adapterStatus: "DOCUMENT_EVIDENCE",
        description:
          "Unified portal for agricultural land records, integrated registration, and instantaneous mutation.",
        requiredFields: ["district", "mandal", "village", "surveyNumber"],
      },
    ],
    recommendedDocuments: [
      {
        kind: "deed",
        label: "Dharani Registered Sale Deed",
        description: "Registered sale deed issued through Dharani or IGRS TS.",
        isMandatory: true,
      },
      {
        kind: "survey",
        label: "E-Pattadar Passbook / Dharani RoR",
        description: "Passbook showing land extent and agricultural holding.",
        isMandatory: true,
      },
    ],
  },

  KL: {
    stateCode: "KL",
    stateName: "Kerala",
    localTerminology: {
      recordOfRightsName: "Thandapper Account (RoR)",
      surveyNumberLabel: "Survey / Resurvey Number",
      subdivisionLabel: "Sub-Division Number",
      khataOrAccountLabel: "Thandapper Number",
      urbanPropertyCardLabel: "Sanchitha / Sanchaya Property ID",
      mutationExtractName: "Pokkuvaravu Order",
      deedRegistrationSystemName: "PEARL (Registration Dept Kerala)",
      encumbranceCertificateName: "PEARL Encumbrance Certificate",
    },
    unitConversion: {
      primaryLocalUnit: "Cent",
      localUnitToSqm: 40.4686,
      localUnitsPerAcre: 100,
      label: "Cents (100 Cents = 1 Acre)",
    },
    cadastralFields: [
      {
        key: "district",
        label: "District",
        placeholder: "e.g., Ernakulam, Thiruvananthapuram, Kozhikode",
        required: true,
      },
      { key: "taluk", label: "Taluk", placeholder: "e.g., Kanayannur, Aluva", required: true },
      {
        key: "village",
        label: "Village",
        placeholder: "e.g., Kakkanad, Edappally",
        required: true,
      },
      {
        key: "resurveyNumber",
        label: "Resurvey / Survey No.",
        placeholder: "e.g., Resurvey 184/3",
        required: true,
      },
      {
        key: "thandapperNo",
        label: "Thandapper Account Number",
        placeholder: "e.g., TP-8421",
        required: false,
      },
    ],
    officialSystems: [
      {
        id: "relis",
        name: "ReLIS (Revenue Land Information System)",
        category: "land_records",
        officialPortalUrl: "https://revenue.kerala.gov.in/",
        department: "Revenue Department, Government of Kerala",
        adapterStatus: "DOCUMENT_EVIDENCE",
        description:
          "Official Kerala digital land records verifying Thandapper account, land tax, and online Pokkuvaravu.",
        requiredFields: ["district", "taluk", "village", "resurveyNumber"],
      },
    ],
    recommendedDocuments: [
      {
        kind: "deed",
        label: "Registered Document (PEARL Kerala)",
        description: "Registered title instrument registered with Kerala SRO.",
        isMandatory: true,
      },
      {
        kind: "survey",
        label: "Thandapper Extract / Land Tax Receipt",
        description: "Official e-payment land tax receipt showing Thandapper account.",
        isMandatory: true,
      },
    ],
  },

  UP: {
    stateCode: "UP",
    stateName: "Uttar Pradesh",
    localTerminology: {
      recordOfRightsName: "Khatauni (RoR)",
      surveyNumberLabel: "Khasra Number / Gata Number",
      subdivisionLabel: "Hissa",
      khataOrAccountLabel: "Khata Number",
      urbanPropertyCardLabel: "Nagar Nigam Property ID / Development Auth Allotment",
      mutationExtractName: "Bhulekh E-Court Mutation Order",
      deedRegistrationSystemName: "IGRSUP",
      encumbranceCertificateName: "Barah Sala (12-Year Encumbrance Certificate)",
    },
    unitConversion: {
      primaryLocalUnit: "Bigha (Pukka)",
      localUnitToSqm: 2529.28,
      localUnitsPerAcre: 1.6,
      label: "Bigha (Pukka) / Biswa (20 Biswa = 1 Bigha)",
    },
    cadastralFields: [
      {
        key: "district",
        label: "District",
        placeholder: "e.g., Gautam Buddha Nagar, Lucknow, Ghaziabad",
        required: true,
      },
      { key: "tehsil", label: "Tehsil", placeholder: "e.g., Dadri, Sadar", required: true },
      {
        key: "village",
        label: "Village / Pargana",
        placeholder: "e.g., Noida Sector 62, Chhajarsi",
        required: true,
      },
      {
        key: "khasraNumber",
        label: "Khasra / Gata Number",
        placeholder: "e.g., Gata 124",
        required: true,
      },
      { key: "khataNumber", label: "Khata Number", placeholder: "e.g., Khata 88", required: false },
      {
        key: "allotmentRef",
        label: "Development Authority Allotment (NOIDA/YEIDA/LDA)",
        placeholder: "e.g., NOIDA/RES/SEC62/PL-14",
        required: false,
        isUrbanOnly: true,
      },
    ],
    officialSystems: [
      {
        id: "upbhulekh",
        name: "UP Bhulekh",
        category: "land_records",
        officialPortalUrl: "https://upbhulekh.gov.in/",
        department: "Board of Revenue, Government of Uttar Pradesh",
        adapterStatus: "DOCUMENT_EVIDENCE",
        description:
          "Official digitized Khatauni RoR, Khasra details, and revenue court mutation records.",
        requiredFields: ["district", "tehsil", "village", "khasraNumber"],
      },
    ],
    recommendedDocuments: [
      {
        kind: "deed",
        label: "Registered Registry / Conveyance Deed (IGRSUP)",
        description: "Registered title deed executed at the Sub-Registrar Office.",
        isMandatory: true,
      },
      {
        kind: "survey",
        label: "Digitally Signed Khatauni Extract",
        description:
          "Official UP Bhulekh Khatauni extract showing ownership and land classification.",
        isMandatory: true,
      },
    ],
  },

  RJ: {
    stateCode: "RJ",
    stateName: "Rajasthan",
    localTerminology: {
      recordOfRightsName: "Jamabandi (RoR)",
      surveyNumberLabel: "Khasra Number",
      subdivisionLabel: "Sub-Division",
      khataOrAccountLabel: "Khata Number",
      urbanPropertyCardLabel: "JDA / Urban Patta",
      mutationExtractName: "Dakhil Kharij (Mutation Order)",
      deedRegistrationSystemName: "E-Panjiyan (IGR Rajasthan)",
      encumbranceCertificateName: "Nil Encumbrance Certificate",
    },
    unitConversion: {
      primaryLocalUnit: "Bigha (Pukka)",
      localUnitToSqm: 2529.28,
      localUnitsPerAcre: 1.6,
      label: "Bigha (Pukka) / Biswa",
    },
    cadastralFields: [
      {
        key: "district",
        label: "District",
        placeholder: "e.g., Jaipur, Jodhpur, Udaipur",
        required: true,
      },
      { key: "tehsil", label: "Tehsil", placeholder: "e.g., Sanganer, Jaipur", required: true },
      {
        key: "village",
        label: "Village / Patwar Circle",
        placeholder: "e.g., Mansarovar, Jagatpura",
        required: true,
      },
      {
        key: "khasraNumber",
        label: "Khasra Number",
        placeholder: "e.g., Khasra 312",
        required: true,
      },
      { key: "khataNumber", label: "Khata Number", placeholder: "e.g., Khata 45", required: false },
    ],
    officialSystems: [
      {
        id: "apnakhata",
        name: "Apna Khata / E-Dharti",
        category: "land_records",
        officialPortalUrl: "https://apnakhata.rajasthan.gov.in/",
        department: "Revenue Department, Government of Rajasthan",
        adapterStatus: "DOCUMENT_EVIDENCE",
        description:
          "Official Rajasthan Jamabandi RoR and electronic Khasra Girdawari verification.",
        requiredFields: ["district", "tehsil", "village", "khasraNumber"],
      },
    ],
    recommendedDocuments: [
      {
        kind: "deed",
        label: "Registered Sale Deed / Patta (E-Panjiyan / JDA)",
        description: "Registered conveyance deed or authorized municipal/JDA lease deed.",
        isMandatory: true,
      },
      {
        kind: "survey",
        label: "Apna Khata Jamabandi Extract",
        description: "Official digitized Jamabandi extract with authorized QR code.",
        isMandatory: true,
      },
    ],
  },

  DL: {
    stateCode: "DL",
    stateName: "Delhi (NCT)",
    localTerminology: {
      recordOfRightsName: "Khasra Khatauni (Revenue)",
      surveyNumberLabel: "Khasra Number",
      subdivisionLabel: "Plot / Site Number",
      khataOrAccountLabel: "UPIC (Unique Property ID Code)",
      urbanPropertyCardLabel: "MCD Property Tax UPIC / DDA Conveyance",
      mutationExtractName: "MCD Property Mutation Order",
      deedRegistrationSystemName: "DORIS (e-Registrar Delhi)",
      encumbranceCertificateName: "Non-Encumbrance Certificate",
    },
    unitConversion: {
      primaryLocalUnit: "Sq Yards (Gaj)",
      localUnitToSqm: 0.836127,
      localUnitsPerAcre: 4840,
      label: "Square Yards (Gaj)",
    },
    cadastralFields: [
      {
        key: "district",
        label: "Revenue District",
        placeholder: "e.g., South Delhi, New Delhi, South West",
        required: true,
      },
      {
        key: "subdivision",
        label: "Sub-Division",
        placeholder: "e.g., Hauz Khas, Vasant Vihar",
        required: true,
      },
      {
        key: "locality",
        label: "Locality / Colony / Village",
        placeholder: "e.g., Greater Kailash II, Mehrauli",
        required: true,
      },
      {
        key: "khasraOrPlot",
        label: "Plot / Khasra Number",
        placeholder: "e.g., Plot B-42, Khasra 128",
        required: true,
      },
      {
        key: "upicNumber",
        label: "MCD UPIC (Property Tax ID)",
        placeholder: "e.g., 501249120042",
        required: false,
        isUrbanOnly: true,
      },
      {
        key: "dorisRegRef",
        label: "DORIS Registration Reference",
        placeholder: "e.g., DORIS-SR-V-2023-9912",
        required: false,
      },
    ],
    officialSystems: [
      {
        id: "doris",
        name: "DORIS (Delhi Online Registration)",
        category: "registration",
        officialPortalUrl: "https://doris.delhigovt.nic.in/",
        department: "Department of Revenue, GNCTD",
        adapterStatus: "DOCUMENT_EVIDENCE",
        description:
          "Official Delhi online registration information system for deed verification and certified copies.",
        requiredFields: ["dorisRegRef"],
      },
      {
        id: "mcd",
        name: "MCD Property Tax (UPIC)",
        category: "urban_municipal",
        officialPortalUrl: "https://mcdonline.nic.in/",
        department: "Municipal Corporation of Delhi",
        adapterStatus: "DOCUMENT_EVIDENCE",
        description:
          "Digitized municipal property records, UPIC assignment, and property tax receipt authentication.",
        requiredFields: ["upicNumber"],
      },
    ],
    recommendedDocuments: [
      {
        kind: "deed",
        label: "Registered Conveyance Deed / Sale Deed (DORIS)",
        description: "Registered conveyance deed executed at Sub-Registrar Office.",
        isMandatory: true,
      },
      {
        kind: "tax",
        label: "MCD Property Tax Receipt with UPIC",
        description: "Current financial year MCD property tax receipt showing UPIC.",
        isMandatory: false,
      },
    ],
  },
};

/**
 * Resolves a state profile by state code (e.g. "KA", "MH") or name (e.g. "Karnataka", "Maharashtra")
 */
export function getStateProfile(codeOrName?: string | null): StateLandProfile {
  if (!codeOrName) return STATE_PROFILES.KA;
  const clean = codeOrName.trim();
  const upper = clean.toUpperCase();

  // Direct code match
  if (STATE_PROFILES[upper]) return STATE_PROFILES[upper];

  // Name match
  const found = Object.values(STATE_PROFILES).find(
    (p) => p.stateName.toLowerCase() === clean.toLowerCase() || upper.includes(p.stateCode),
  );

  return found || STATE_PROFILES.KA; // Default to Karnataka if not matched
}

/**
 * Returns all configured state profiles for state selectors and admin matrix
 */
export function getAllStateProfiles(): StateLandProfile[] {
  return Object.values(STATE_PROFILES);
}

/**
 * Formats a metric area in square meters into the jurisdiction's localized units
 */
export function formatStateArea(
  sqm: number,
  stateCodeOrName?: string,
): {
  sqm: number;
  sqft: number;
  acres: number;
  localUnits: number;
  localUnitLabel: string;
  displayText: string;
} {
  const profile = getStateProfile(stateCodeOrName);
  const sqft = Math.round(sqm * 10.7639);
  const acres = Number((sqm * 0.000247105).toFixed(3));
  const localUnits = Number((sqm / profile.unitConversion.localUnitToSqm).toFixed(2));

  return {
    sqm: Math.round(sqm),
    sqft,
    acres,
    localUnits,
    localUnitLabel: profile.unitConversion.primaryLocalUnit,
    displayText: `${sqm.toLocaleString("en-IN")} m² · ${acres} acres · ${localUnits} ${profile.unitConversion.primaryLocalUnit}`,
  };
}
