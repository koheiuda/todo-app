export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  workspace: string;
  isToday: boolean;
  parentId: string | null;
  order: number;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
}
