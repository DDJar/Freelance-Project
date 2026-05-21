import { Blog } from "../types/blog";
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

export const blogApi = {
  // Get all blogs
  async getAll(): Promise<{ isOk: boolean; data?: Blog[]; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/blog`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const blogs: Blog[] = await response.json();
        return { isOk: true, data: blogs };
      } else {
        const errorText = await response.text();
        return { isOk: false, message: errorText || "Failed to fetch blogs" };
      }
    } catch (error) {
      console.error("Get blogs error:", error);
      return {
        isOk: false,
        message: "Network error. Please try again.",
      };
    }
  },

  // Get blog by ID
  async getById(
    id: string
  ): Promise<{ isOk: boolean; data?: Blog; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/blog/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const blog: Blog = await response.json();
        return { isOk: true, data: blog };
      } else {
        const errorText = await response.text();
        return { isOk: false, message: errorText || "Blog not found" };
      }
    } catch (error) {
      console.error("Get blog by ID error:", error);
      return {
        isOk: false,
        message: "Network error. Please try again.",
      };
    }
  },

  // Add logging to both create and update methods

  // Create method with debug logging
  async create(
    blog: Partial<Blog>,
    imageFile?: File
  ): Promise<{ isOk: boolean; data?: Blog; message?: string }> {
    try {
      console.log(
        "🚀 [CREATE] Starting create with imageFile:",
        imageFile?.name,
        imageFile?.size
      );

      const formData = new FormData();
      formData.append("title", blog.title || "");
      formData.append("content", blog.content || "");
      formData.append("status", blog.status || "Draft");
      formData.append("author", blog.author || "");

      if (imageFile) {
        console.log("📎 [CREATE] Appending image file to formData");
        formData.append("image", imageFile);

        // Debug: Check formData contents
        Array.from(formData.entries()).forEach(([key, value]) => {
          console.log(
            "📋 [CREATE] FormData:",
            key,
            value instanceof File ? `File: ${value.name}` : value
          );
        });
      } else {
        console.log("⚠️ [CREATE] No image file to upload");
      }

      const startTime = Date.now();
      console.log("⏰ [CREATE] Starting API call...");

      const response = await fetch(`${API_BASE_URL}/blog`, {
        method: "POST",
        body: formData,
      });

      const endTime = Date.now();
      console.log(`⏱️ [CREATE] API call completed in ${endTime - startTime}ms`);

      if (response.ok) {
        const created: Blog = await response.json();
        console.log("✅ [CREATE] Success:", created.id);
        return { isOk: true, data: created };
      } else {
        const errorText = await response.text();
        console.error("❌ [CREATE] Error response:", errorText);
        return { isOk: false, message: errorText || "Failed to create blog" };
      }
    } catch (error) {
      console.error("💥 [CREATE] Exception:", error);
      return {
        isOk: false,
        message: "Network error. Please try again.",
      };
    }
  },

  // Update method with debug logging
  async update(
    id: string,
    blog: Partial<Blog>,
    imageFile?: File
  ): Promise<{ isOk: boolean; message?: string }> {
    try {
      console.log(
        "🔄 [UPDATE] Starting update for ID:",
        id,
        "with imageFile:",
        imageFile?.name,
        imageFile?.size
      );

      const formData = new FormData();
      formData.append("title", blog.title || "");
      formData.append("content", blog.content || "");
      formData.append("author", blog.author || "");
      formData.append("status", blog.status || "");

      if (imageFile) {
        console.log("📎 [UPDATE] Appending image file to formData");
        formData.append("image", imageFile);

        // Debug: Check formData contents
        Array.from(formData.entries()).forEach(([key, value]) => {
          console.log(
            "📋 [UPDATE] FormData:",
            key,
            value instanceof File ? `File: ${value.name}` : value
          );
        });
      } else {
        console.log("⚠️ [UPDATE] No image file to upload");
      }

      const startTime = Date.now();
      console.log("⏰ [UPDATE] Starting API call...");

      const response = await fetch(`${API_BASE_URL}/blog/${id}`, {
        method: "PUT",
        body: formData,
      });

      const endTime = Date.now();
      console.log(`⏱️ [UPDATE] API call completed in ${endTime - startTime}ms`);

      if (response.ok) {
        console.log("✅ [UPDATE] Success");
        return { isOk: true };
      } else {
        const errorText = await response.text();
        console.error("❌ [UPDATE] Error response:", errorText);
        return { isOk: false, message: errorText || "Failed to update blog" };
      }
    } catch (error) {
      console.error("💥 [UPDATE] Exception:", error);
      return {
        isOk: false,
        message: "Network error. Please try again.",
      };
    }
  },

  // Delete blog
  async delete(id: string): Promise<{ isOk: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/blog/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        return { isOk: true };
      } else {
        const errorText = await response.text();
        return { isOk: false, message: errorText || "Failed to delete blog" };
      }
    } catch (error) {
      console.error("Delete blog error:", error);
      return {
        isOk: false,
        message: "Network error. Please try again.",
      };
    }
  },
  async getPublished(): Promise<{ isOk: boolean; data?: Blog[]; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/blog/published`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const blogs: Blog[] = await response.json();
        return { isOk: true, data: blogs };
      } else {
        const errorText = await response.text();
        return { isOk: false, message: errorText || "Failed to fetch published blogs" };
      }
    } catch (error) {
      console.error("Get published blogs error:", error);
      return {
        isOk: false,
        message: "Network error. Please try again.",
      };
    }
  }
};
