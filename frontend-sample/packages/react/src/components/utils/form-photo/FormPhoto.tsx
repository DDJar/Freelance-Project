import React, { useState, useEffect } from 'react';
import './FormPhoto.scss';
import { FileUploader } from 'devextreme-react';

export const FormPhoto = ({
  link,
  size,
  editable = false,
  onChange // Thêm callback để thông báo thay đổi
}: {
  link: string;
  size: number;
  editable?: boolean;
  onChange?: (base64Image: string) => void; // Thêm prop này
}) => {
  const [photo, setPhoto] = useState<string>(link);

  // Sync với prop link khi thay đổi từ bên ngoài
  useEffect(() => {
    setPhoto(link);
  }, [link]);

  const handleFileChange = (e: any) => {
    const file = e.value[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setPhoto(base64); // Cập nhật ảnh local
        
        // Thông báo thay đổi lên component cha
        if (onChange) {
          onChange(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="form-photo-view">
      <div
        className={`form-photo ${editable ? 'editable' : ''}`}
        style={{
          width: size,
          height: size,
          maxHeight: size,
          backgroundImage: `url('data:image/png;base64,${photo}')`
        }}
      >
        {editable && <i className="edit-icon dx-icon-photooutline" />}
      </div>
      {editable && (
        <FileUploader
          dialogTrigger=".edit-icon"
          accept="image/*"
          visible={false}
          onValueChanged={handleFileChange}
        />
      )}
    </div>
  );
};