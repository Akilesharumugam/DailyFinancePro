export type CompanyRole = "owner" | "manager" | "collection_agent" | "accountant" | "viewer";

export type Membership = {
  companyId: string;
  companyName: string;
  companySlug: string;
  role: CompanyRole;
};

export type Viewer = {
  id: string;
  email: string;
  fullName: string;
  memberships: Membership[];
  activeCompany: Membership;
  demo: boolean;
};
