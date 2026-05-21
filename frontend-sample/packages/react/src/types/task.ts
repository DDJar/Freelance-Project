export type TaskPriority = 'Low' | 'Normal' | 'High';
export type TaskStatus = 'Open' | 'In Progress' | 'Deferred' | 'Completed';

export interface Task {
  id: string;
  title: string;
  company: string;
  assignedTo: string[];
  departmentId: string;
  priority: TaskPriority,
  status: TaskStatus,
  startDate: Date;
  dueDate: Date;
  createdAt: Date;
  detail: string;
  estimatedHour: number
  result?: string; 
}
export interface TaskProp {
    text: string;
    showText?: boolean;
}
export interface PlanningProps {
    dataSource: Task[];
    changePopupVisibility?: () => void;
}
