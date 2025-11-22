
// Temporary types to support reports table until database types are properly updated
export interface Report {
  id: string;
  title: string;
  description: string;
  category: string;
  reported_by: string;
  reporter_role: string;
  status: string;
  admin_response?: string;
  responded_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ReportInsert {
  title: string;
  description: string;
  category: string;
  reported_by: string;
  reporter_role: string;
  status?: string;
  admin_response?: string;
  responded_at?: string;
}

export interface ReportUpdate {
  title?: string;
  description?: string;
  category?: string;
  status?: string;
  admin_response?: string;
  responded_at?: string;
}

export interface Submission {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  quiz?: { 
    title: string;
    id: string;
  };
  profiles?: { 
    name: string; 
    email: string;
  } | null;
}
