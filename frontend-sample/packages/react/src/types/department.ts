import { UserReference } from "./auth";

export interface Department {
  id: string;
  departmentName: string;
  position: string[];
  description: string;
  user: UserReference[];
}
