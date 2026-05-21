import { Task } from '../types/task';
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
export const taskApi = {
  // Get all tasks
  async getAll(): Promise<{ isOk: boolean; data?: Task[]; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const tasks: Task[] = await response.json();
        return {
          isOk: true,
          data: tasks,
        };
      } else {
        const errorText = await response.text();
        return {
          isOk: false,
          message: errorText || 'Failed to fetch users',
        };
      }
    } catch (error) {
      console.error('Get users error:', error);
      return {
        isOk: false,
        message: 'Network error. Please try again.',
      };
    }
  },

  async getById(id: string): Promise<{ isOk: boolean; data?: Task; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const tasks: Task = await response.json();
        return {
          isOk: true,
          data: tasks,
        };
      } else {
        const errorText = await response.text();
        return {
          isOk: false,
          message: errorText || 'User not found',
        };
      }
    } catch (error) {
      console.error('Get user error:', error);
      return {
        isOk: false,
        message: 'Network error. Please try again.',
      };
    }
  },

  async create(user: Partial<Task>): Promise<{ isOk: boolean; data?: Task; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
      });

      if (response.ok) {
        const createdUser: Task = await response.json();
        return {
          isOk: true,
          data: createdUser,
        };
      } else {
        const errorText = await response.text();
        return {
          isOk: false,
          message: errorText || 'Failed to create user',
        };
      }
    } catch (error) {
      console.error('Create user error:', error);
      return {
        isOk: false,
        message: 'Network error. Please try again.',
      };
    }
  },

  async update(id: string, user: Partial<Task>): Promise<{ isOk: boolean; message?: string }> {
    try {
      const backendUser = {
        ...user,
      };
      const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendUser),
      });
      if (response.ok) {
        return {
          isOk: true,
        };
      } else {
        const errorText = await response.text();
        return {
          isOk: false,
          message: errorText || 'Failed to update user',
        };
      }
    } catch (error) {
      console.error('Update user error:', error);
      return {
        isOk: false,
        message: 'Network error. Please try again.',
      };
    }
  },

  // Delete user
  async delete(id: string): Promise<{ isOk: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        return {
          isOk: true,
        };
      } else {
        const errorText = await response.text();
        return {
          isOk: false,
          message: errorText || 'Failed to delete user',
        };
      }
    } catch (error) {
      console.error('Delete user error:', error);
      return {
        isOk: false,
        message: 'Network error. Please try again.',
      };
    }
  },
};
