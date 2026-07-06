export interface CrewLead {
  id: string;
  name: string;
  createdAt: Date;
}

export interface CrewLeadWithPassword extends CrewLead {
  password: string;
}
