import { Department } from "../types/department";
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

export const departmentApi = {
  // Get all departments
  async getAll(): Promise<{ isOk: boolean; data?: Department[]; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/department`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const departments: Department[] = await response.json();
        return {
          isOk: true,
          data: departments,
        };
      } else {
        const errorText = await response.text();
        return {
          isOk: false,
          message: errorText || 'Failed to fetch departments',
        };
      }
    } catch (error) {
      console.error('Get departments error:', error);
      return {
        isOk: false,
        message: 'Network error. Please try again.',
      };
    }
  },

  // Get department by ID
  async getById(id: string): Promise<{ isOk: boolean; data?: Department; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/department/id/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const department: Department = await response.json();
        return {
          isOk: true,
          data: department,
        };
      } else {
        const errorText = await response.text();
        return {
          isOk: false,
          message: errorText || 'Department not found',
        };
      }
    } catch (error) {
      console.error('Get department error:', error);
      return {
        isOk: false,
        message: 'Network error. Please try again.',
      };
    }
  },

  // Get department by name
  async getByName(departmentName: string): Promise<{ isOk: boolean; data?: Department; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/department/name/${departmentName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const department: Department = await response.json();
        return {
          isOk: true,
          data: department,
        };
      } else {
        const errorText = await response.text();
        return {
          isOk: false,
          message: errorText || 'Department not found',
        };
      }
    } catch (error) {
      console.error('Get department by name error:', error);
      return {
        isOk: false,
        message: 'Network error. Please try again.',
      };
    }
  },

  // Get department names for dropdown
  async getDepartmentNames(): Promise<{ isOk: boolean; data?: string[]; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/department/names`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const departmentNames: string[] = await response.json();
        return {
          isOk: true,
          data: departmentNames,
        };
      } else {
        const errorText = await response.text();
        return {
          isOk: false,
          message: errorText || 'Failed to fetch department names',
        };
      }
    } catch (error) {
      console.error('Get department names error:', error);
      return {
        isOk: false,
        message: 'Network error. Please try again.',
      };
    }
  },

  // Get positions by department name
  async getPositionsByDepartmentName(departmentName: string): Promise<{ isOk: boolean; data?: string[]; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/department/business/${departmentName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const positions: string[] = await response.json();
        return {
          isOk: true,
          data: positions,
        };
      } else {
        const errorText = await response.text();
        return {
          isOk: false,
          message: errorText || 'No positions found for this department',
        };
      }
    } catch (error) {
      console.error('Get positions by department error:', error);
      return {
        isOk: false,
        message: 'Network error. Please try again.',
      };
    }
  },

  // Create department
  async create(department: Partial<Department>): Promise<{ isOk: boolean; data?: Department; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/department`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(department),
      });

      if (response.ok) {
        const createdDepartment: Department = await response.json();
        return {
          isOk: true,
          data: createdDepartment,
        };
      } else {
        const errorText = await response.text();
        return {
          isOk: false,
          message: errorText || 'Failed to create department',
        };
      }
    } catch (error) {
      console.error('Create department error:', error);
      return {
        isOk: false,
        message: 'Network error. Please try again.',
      };
    }
  },

  // Update department
  async update(id: string, department: Partial<Department>): Promise<{ isOk: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/department/id/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(department),
      });

      if (response.ok) {
        return {
          isOk: true,
        };
      } else {
        const errorText = await response.text();
        return {
          isOk: false,
          message: errorText || 'Failed to update department',
        };
      }
    } catch (error) {
      console.error('Update department error:', error);
      return {
        isOk: false,
        message: 'Network error. Please try again.',
      };
    }
  },

  // Delete department
  async delete(id: string): Promise<{ isOk: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/department/id/${id}`, {
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
          message: errorText || 'Failed to delete department',
        };
      }
    } catch (error) {
      console.error('Delete department error:', error);
      return {
        isOk: false,
        message: 'Network error. Please try again.',
      };
    }
  },
};
