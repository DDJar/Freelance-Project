import { ValidationRule } from 'devextreme-react/common';
import { ProfileCardItem } from '../components/library/profile-card/ProfileCard';
import { departmentApi } from '../api/department';
import { userApi } from '../api/user';
import { User } from '../types/auth';

export const service = {
  async getCurrentUserProfile(userId: string): Promise<User | null> {
    try {
      const result = await userApi.getById(userId);
      if (result.isOk && result.data) {
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  },

  async updateUserProfile(userId: string, userData: Partial<User>): Promise<boolean> {
    try {
      const result = await userApi.update(userId, userData);
      return result.isOk;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  },

  async getDepartments(): Promise<{ id: string, departmentName: string }[]> {
    try {
      const result = await departmentApi.getAll(); 
      if (result.isOk && result.data) {
        return result.data; 
      }
      return [];
    } catch (error) {
      console.error('Error fetching departments:', error);
      return [];
    }
  },

  async getPositionsByDepartment(departmentName: string): Promise<string[]> {
    try {
      const result = await departmentApi.getPositionsByDepartmentName(departmentName);
      if (result.isOk && result.data) {
        return result.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching positions:', error);
      return [];
    }
  },

  async getBasicInfoItems(onPositionUpdate?: (positions: string[]) => void, userData?: User): Promise<ProfileCardItem[]> {
    const departments = await this.getDepartments();
    
    // Pre-load positions if user has a department
    let initialPositions: string[] = [];
    if (userData?.departmentId) {
      const userDepartment = departments.find(d => d.id === userData.departmentId);
      if (userDepartment) {
        initialPositions = await this.getPositionsByDepartment(userDepartment.departmentName);
        // Notify parent component about initial positions
        if (onPositionUpdate) {
          onPositionUpdate(initialPositions);
        }
      }
    }

    return [
      { dataField: 'firstname', colSpan: 2, label: 'Họ' },
      { dataField: 'lastname', colSpan: 2, label: 'Tên' },
      {
        dataField: 'departmentId',
        editorType: 'dxSelectBox',
        colSpan: 1,
        label: 'Công ty',
        editorOptions: {
          items: departments,
          displayExpr: 'departmentName',
          valueExpr: 'id',
          searchEnabled: true,
          onValueChanged: async (e) => {
            try {
              const selectedDepartment = e.value;
              if (!selectedDepartment) {
                // Reset positions when no department selected
                if (onPositionUpdate) {
                  onPositionUpdate([]);
                }
                return;
              }

              const selectedDeptName = departments.find(d => d.id === selectedDepartment)?.departmentName;
              if (selectedDeptName) {
                const positionItems = await service.getPositionsByDepartment(selectedDeptName);      
                // Use callback to update positions instead of directly accessing form
                if (onPositionUpdate) {
                  onPositionUpdate(positionItems);
                }

                // Alternative approach: Try to access form safely with timeout
                setTimeout(() => {
                  try {
                    const form = e.component?.option?.('form');
                    if (form && form.getEditor) {
                      const positionEditor = form.getEditor('position');
                      if (positionEditor) {
                        positionEditor.option('items', positionItems);
                      }
                    }
                  } catch (formError) {
                    console.warn('Could not update position editor directly:', formError);
                  }
                }, 100);
              }
            } catch (error) {
              console.error('Error in department onValueChanged:', error);
            }
          }
        }
      },
      {
        dataField: 'position',
        editorType: 'dxSelectBox',
        colSpan: 1,
        label: 'Vị trí trong công ty',
        editorOptions: {
          items: initialPositions, // Use pre-loaded positions
          displayExpr: 'this',
          valueExpr: 'this',
          searchEnabled: true,
        }
      },
      {
        dataField: 'birthDate',
        colSpan: 1,
        editorType: 'dxDateBox',
        label: 'Ngày Tháng Năm sinh',
        editorOptions: {
          max: new Date(),
          displayFormat: 'dd/MM/yyyy',
          type: 'date'
        }
      },
      {
        dataField: 'gender',
        editorType: 'dxSelectBox',
        colSpan: 2,
        label: 'Giới tính',
        editorOptions: {
          items: [
            { value: 'Male', text: 'Nam' },
            { value: 'Female', text: 'Nữ' },
            { value: 'Other', text: 'Khác' }
          ],
          displayExpr: 'text',  
          valueExpr: 'value' 
        }
      }
    ];
  },

  getContactItems(): ProfileCardItem[] {
    return [
      {
        dataField: 'phoneNumber',
        label: 'Số điện thoại',
        editorOptions: {
          mask: '+84 000 000 000'
        }
      },
      {
        dataField: 'email',
        label: 'Email',
        validators: [
          { type: 'email' }
        ] as ValidationRule[]
      },
      {
        dataField: 'status',
        colSpan: 2,
        label: 'Trạng thái tài khoản',
        editorType: 'dxSelectBox',
        editorOptions: {
          items: ['Active', 'Inactive', 'Pending'],
          displayExpr: 'this',
          valueExpr: 'this',
        }
      },
    ];
  },

  getAddressItems(): ProfileCardItem[] {
    return [
      { 
        dataField: 'country',
        label: 'Đất nước'
      },
      { 
        dataField: 'city',
        label: 'Thành phố'
      },
      {
        dataField: 'address',
        colSpan: 2,
        label: 'Địa chỉ'
      },
    ];
  }
};