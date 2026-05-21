import { ChangePasswordRequest, User } from "../types/auth";
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
export const userApi = {
  // Get all users
  async getAll(): Promise<{ isOk: boolean; data?: User[]; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/user`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const users: User[] = await response.json();
        const transformedUsers = users.map((user) => ({
          ...user,
          name: `${user.firstname} ${user.lastname}`,
          phone: user.phoneNumber,
          image: user.avatarUrl,
        }));
        return {
          isOk: true,
          data: transformedUsers,
        };
      } else {
        const errorText = await response.text();
        return {
          isOk: false,
          message: errorText || "Failed to fetch users",
        };
      }
    } catch (error) {
      console.error("Get users error:", error);
      return {
        isOk: false,
        message: "Network error. Please try again.",
      };
    }
  },

  async getById(
    id: string
  ): Promise<{ isOk: boolean; data?: User; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const user: User = await response.json();
        const transformedUser = {
          ...user,
          name: `${user.firstname} ${user.lastname}`,
          phone: user.phoneNumber,
          image: user.avatarUrl,
        };
        return {
          isOk: true,
          data: transformedUser,
        };
      } else {
        const errorText = await response.text();
        return {
          isOk: false,
          message: errorText || "User not found",
        };
      }
    } catch (error) {
      console.error("Get user error:", error);
      return {
        isOk: false,
        message: "Network error. Please try again.",
      };
    }
  },

  async getByUsername(
    username: string
  ): Promise<{ isOk: boolean; data?: User; message?: string }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/user/username/${username}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const user: User = await response.json();
        const transformedUser = {
          ...user,
          name: `${user.firstname} ${user.lastname}`,
          phone: user.phoneNumber,
          image: user.avatarUrl,
        };
        return {
          isOk: true,
          data: transformedUser,
        };
      } else {
        const errorText = await response.text();
        return {
          isOk: false,
          message: errorText || "User not found",
        };
      }
    } catch (error) {
      console.error("Get user by username error:", error);
      return {
        isOk: false,
        message: "Network error. Please try again.",
      };
    }
  },

  async create(
    user: Partial<User>
  ): Promise<{ isOk: boolean; data?: User; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      });

      if (response.ok) {
        const createdUser: User = await response.json();
        const transformedUser = {
          ...createdUser,
          name: `${createdUser.firstname} ${createdUser.lastname}`,
          phone: createdUser.phoneNumber,
          image: createdUser.avatarUrl,
        };
        return {
          isOk: true,
          data: transformedUser,
        };
      } else {
        const errorText = await response.text();
        return {
          isOk: false,
          message: errorText || "Failed to create user",
        };
      }
    } catch (error) {
      console.error("Create user error:", error);
      return {
        isOk: false,
        message: "Network error. Please try again.",
      };
    }
  },

  async update(
    id: string,
    user: Partial<User>
  ): Promise<{ isOk: boolean; message?: string }> {
    try {
      const backendUser = {
        ...user,
        phoneNumber: user.phone || user.phoneNumber,
        hiredDate: user.hiredDate,
        birthDate: user.birthDate,
      };

      const response = await fetch(`${API_BASE_URL}/user/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
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
          message: errorText || "Failed to update user",
        };
      }
    } catch (error) {
      console.error("Update user error:", error);
      return {
        isOk: false,
        message: "Network error. Please try again.",
      };
    }
  },

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ isOk: boolean; message?: string }> {
    try {
      const requestBody: ChangePasswordRequest = {
        currentPassword,
        newPassword,
      };

      const response = await fetch(
        `${API_BASE_URL}/user/${userId}/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          isOk: true,
          message: data.message || "Đổi mật khẩu thành công",
        };
      } else {
        // Không quan tâm đến chi tiết lỗi server trả về, chỉ trả 1 thông báo chung
        return {
          isOk: false,
          message: "Cập nhật không thành công",
        };
      }
    } catch (error) {
      console.error("Change password error:", error);
      return {
        isOk: false,
        message: "Lỗi mạng. Vui lòng kiểm tra kết nối và thử lại.",
      };
    }
  },

  // Delete user
  async delete(id: string): Promise<{ isOk: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
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
          message: errorText || "Failed to delete user",
        };
      }
    } catch (error) {
      console.error("Delete user error:", error);
      return {
        isOk: false,
        message: "Network error. Please try again.",
      };
    }
  },
};
