export type NotDone = { id: string; topic: string; closest?: string; note: string };

/** Things Aswin has NOT done. The fit check must never present these as matches (SPEC §7, guard.honesty). */
export const notDone: NotDone[] = [
  { id: "hardware-roadmaps", topic: "Hardware roadmaps from prototype to mass production", note: "Not something Aswin has done." },
  { id: "contract-manufacturing", topic: "Contract manufacturers and supply chain", note: "Not something Aswin has done." },
  {
    id: "retail-channel-pl",
    topic: "Retail channel P&L",
    closest: "Ran Dhee's, a direct-to-consumer brand. Not retail, not hardware.",
    note: "Not retail, not hardware.",
  },
  { id: "consumer-hardware-launches", topic: "Consumer hardware launches", note: "Not something Aswin has done." },

  // From the master resume's "gaps (do not claim)" notes, Nov 2026. Professional gaps only; review before launch.
  {
    id: "llm-feature-shipped-at-work",
    topic: "Shipping an LLM feature to production in a professional role",
    closest: "Shipped ML-based OCR to production at Zelthy; his LLM work there was prototypes that did not ship. His shipped agents are his own projects.",
    note: "Not something Aswin has done in a job yet.",
  },
  {
    id: "experimentation",
    topic: "A/B tests, experiments and product analytics tools",
    closest: "Tracked adoption, defects and time to deploy to prioritize features at Zelthy.",
    note: "Not something Aswin has done.",
  },
  {
    id: "graphql",
    topic: "Working with GraphQL APIs",
    closest: "REST, webhooks and SOAP APIs at Zelthy.",
    note: "Tried out only, no working experience.",
  },
  {
    id: "scim-provisioning",
    topic: "SCIM or directory-driven user provisioning",
    closest: "SAML SSO with Azure AD and an approval-based provisioning workflow at Zelthy.",
    note: "Not something Aswin has done.",
  },
  {
    id: "payments",
    topic: "Payments products",
    closest: "Invoicing linked to sales orders in ERPNext at Dhee's.",
    note: "Not something Aswin has done.",
  },
  {
    id: "data-warehouse",
    topic: "Data warehouses or working with a dedicated data team",
    closest: "Batch pipelines into a data lake and 10+ Power BI dashboards at Zelthy.",
    note: "Not something Aswin has done.",
  },
  {
    id: "enterprise-erp-hands-on",
    topic: "Hands-on SAP, Oracle ERP or Microsoft Dynamics",
    closest: "Integrated the platform with a client's SAP; ran ERPNext at Dhee's.",
    note: "Not something Aswin has done.",
  },
  {
    id: "mcp-server",
    topic: "Building an MCP server",
    closest: "Connected his job-search agent to Google Drive and Chrome through existing MCP connectors.",
    note: "Not something Aswin has done.",
  },
  {
    id: "accessibility-wcag",
    topic: "Accessibility (WCAG) programs",
    closest: "Lighthouse accessibility 100 on every route and WCAG AA contrast verified by a unit test on this site.",
    note: "Not something Aswin has done.",
  },
  {
    id: "hr-software",
    topic: "HR or hiring software (HRIS, ATS)",
    closest: "Hired and onboarded PMs and developers, but never built software for it.",
    note: "Not something Aswin has done.",
  },
];
