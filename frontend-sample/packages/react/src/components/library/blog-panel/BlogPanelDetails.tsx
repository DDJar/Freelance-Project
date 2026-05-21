import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import classNames from "classnames";
import { Button, ButtonTypes } from "devextreme-react/button";
import { ScrollView } from "devextreme-react/scroll-view";
import Toolbar, { Item as ToolbarItem } from "devextreme-react/toolbar";
import Form, {
  Item as FormItem,
  GroupItem,
  ColCountByScreen,
} from "devextreme-react/form";
import notify from "devextreme/ui/notify";
import { useScreenSize } from "../../../utils/media-query";
import ValidationGroup from "devextreme-react/validation-group";
import { blogApi } from "../../../api/blog";
import SelectBox from "devextreme-react/select-box";
import TextArea from "devextreme-react/text-area";
import { renderStatusTag } from "../../../utils/status-color";
import { Blog } from "../../../types/blog";
import { FileUploader } from "devextreme-react";

const statusOptions = ["Draft", "Published", "Archived"];

export const BlogPanelDetails = ({
  blog,
  isOpened,
  changePanelOpened,
  onDataChanged,
  changePanelPinned,
}: {
  blog: Blog;
  isOpened: boolean;
  changePanelOpened: (value: boolean) => void;
  onDataChanged: (data: Blog | null) => void;
  changePanelPinned: () => void;
}) => {
  const [formData, setFormData] = useState<Blog>(blog);
  const [isPinned, setIsPinned] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { isLarge, isMedium } = useScreenSize();
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Reset form data khi blog thay đổi
  useEffect(() => {
    if (blog) {
      setFormData(blog);
      setIsEditing(false);
    }
  }, [blog]);

  // Reset pin state khi panel mở/đóng
  useEffect(() => {
    if (!isOpened) {
      setIsPinned(false);
      setIsEditing(false);
    }
  }, [isOpened]);

  const updateField = (field: string) => (value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // FIX: Sửa logic pin toggle
  const onPinClick = useCallback(() => {
    const newPinnedState = !isPinned;
    setIsPinned(newPinnedState);
    // Chỉ gọi changePanelPinned khi thực sự cần thay đổi
    changePanelPinned();
  }, [isPinned, changePanelPinned]);

  // FIX: Logic đóng panel - LUÔN đóng được dù có pin hay không
  const onClosePanelClick = useCallback(() => {
    // Reset tất cả states
    setIsPinned(false);
    setIsEditing(false);
    setFormData(blog);

    // Đóng panel - điều này phải luôn hoạt động
    changePanelOpened(false);
  }, [blog, changePanelOpened]);

  const toggleEditHandler = useCallback(() => {
    setIsEditing(!isEditing);
  }, [isEditing]);

  const cancelHandler = useCallback(() => {
    setIsEditing(false);
    setFormData(blog);
  }, [blog]);

  const onSaveClick = useCallback(
    async ({ validationGroup }: ButtonTypes.ClickEvent) => {
      const result = validationGroup.validate();
      if (!result.isValid) return;

      try {
        const response = await blogApi.update(
          blog.id,
          formData,
          imageFile || undefined
        );
        if (response.isOk) {
          notify("Cập nhật thành công", "success", 2000);
          onDataChanged(formData);
          setIsEditing(false);
          setImageFile(null); // Reset sau khi upload
        } else {
          notify(response.message || "Cập nhật thất bại", "error", 3000);
        }
      } catch (error) {
        notify("Có lỗi xảy ra khi cập nhật", "error", 3000);
        console.error(error);
      }
    },
    [formData, blog.id, onDataChanged, imageFile]
  );

  const onDeleteClick = useCallback(async () => {
    const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa blog này?");
    if (!confirmDelete) return;

    try {
      const result = await blogApi.delete(blog.id);
      if (result.isOk) {
        notify("Xóa blog thành công", "success", 2000);
        onDataChanged(null);
        changePanelOpened(false);
      } else {
        notify(result.message || "Xóa thất bại", "error", 3000);
      }
    } catch (error) {
      notify("Có lỗi xảy ra khi xóa", "error", 3000);
      console.error(error);
    }
  }, [blog.id, changePanelOpened, onDataChanged]);

  return (
    <div
      id="blog-panel"
      className={classNames({
        panel: true,
        open: isOpened,
        // FIX: Chỉ pin khi isPinned = true VÀ màn hình đủ lớn
        pin: isPinned && (isLarge || isMedium),
      })}
    >
      <div className="data-wrapper">
        <Toolbar className="panel-toolbar">
          <ToolbarItem location="before">
            <span className="blog-title value">{blog.title}</span>
          </ToolbarItem>
          {/* FIX: Chỉ hiện nút pin trên màn hình lớn */}
          <ToolbarItem location="after" visible={isLarge || isMedium}>
            <Button
              icon={isPinned ? "pin" : "unpin"}
              stylingMode="text"
              onClick={onPinClick}
              hint={isPinned ? "Unpin panel" : "Pin panel"}
            />
          </ToolbarItem>
          {/* FIX: Nút close luôn hoạt động */}
          <ToolbarItem location="after">
            <Button
              icon="close"
              stylingMode="text"
              onClick={onClosePanelClick}
              hint="Close panel"
            />
          </ToolbarItem>
        </Toolbar>

        <ScrollView className="panel-scroll">
          <ValidationGroup>
            <div className="data-part border">
              <Form
                className={classNames({
                  "plain-styled-form": true,
                  "view-mode": !isEditing,
                })}
              >
                <GroupItem cssClass="blog-fields-group">
                  <FormItem
                    label={{ text: "Title" }}
                    editorOptions={{
                      value: formData.title,
                      onValueChanged: (e: any) => updateField("title")(e.value),
                      readOnly: !isEditing,
                    }}
                    editorType="dxTextBox"
                    validationRules={[
                      { type: "required", message: "Title is required" },
                    ]}
                  />
                  <FormItem
                    label={{ text: "Author" }}
                    editorType="dxTextBox"
                    editorOptions={{
                      value: formData.author,
                      onValueChanged: (e: any) =>
                        updateField("author")(e.value),
                      readOnly: !isEditing,
                    }}
                    validationRules={[
                      { type: "required", message: "Author is required" },
                    ]}
                  />

                  <FormItem label={{ text: "Status" }}>
                    {isEditing ? (
                      <SelectBox
                        items={statusOptions}
                        value={formData.status}
                        onValueChanged={(e) => updateField("status")(e.value)}
                      />
                    ) : (
                      renderStatusTag(formData.status)
                    )}
                  </FormItem>

                  <FormItem label={{ text: "Content" }}>
                    {isEditing ? (
                      <TextArea
                        value={formData.content}
                        onValueChanged={(e) => updateField("content")(e.value)}
                        height={200}
                        placeholder="Blog content..."
                      />
                    ) : (
                      <div className="content-preview">{formData.content}</div>
                    )}
                  </FormItem>

                  <FormItem label={{ text: "Image" }} colSpan={2}>
                    {isEditing ? (
                      <FileUploader
                        accept="image/*"
                        uploadMode="useForm"
                        selectButtonText="Select Image"
                        labelText=""
                        showFileList={true}
                        onValueChanged={(e) => {
                          if (e.value && e.value.length > 0) {
                            setImageFile(e.value[0]);
                          } else {
                            setImageFile(null); // hoặc null tùy logic
                          }
                        }}
                      />
                    ) : (
                      <img
                        src={`${process.env.REACT_APP_BACKEND_URL}/blog/${formData.id}/image`}
                        alt="Blog"
                        style={{ maxHeight: "200px", marginTop: 8 }}
                      />
                    )}
                  </FormItem>

                  <FormItem label={{ text: "Created Date" }}>
                    <span className="field-value">
                      {new Date(formData.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </FormItem>

                  <FormItem label={{ text: "Updated Date" }}>
                    <span className="field-value">
                      {new Date(formData.updatedAt).toLocaleDateString("vi-VN")}
                    </span>
                  </FormItem>
                </GroupItem>
              </Form>
            </div>

            <div className="data-part data-part-toolbar border">
              <Toolbar>
                {!isEditing && (
                  <>
                    <ToolbarItem location="after">
                      <Button
                        icon="edit"
                        text="Edit"
                        stylingMode="contained"
                        type="default"
                        onClick={toggleEditHandler}
                      />
                    </ToolbarItem>
                    <ToolbarItem location="after">
                      <Button
                        icon="trash"
                        text="Delete"
                        stylingMode="contained"
                        type="danger"
                        onClick={onDeleteClick}
                      />
                    </ToolbarItem>
                  </>
                )}
                {isEditing && (
                  <>
                    <ToolbarItem location="after">
                      <Button
                        text="Save"
                        icon="save"
                        stylingMode="contained"
                        type="default"
                        onClick={onSaveClick}
                      />
                    </ToolbarItem>
                    <ToolbarItem location="after">
                      <Button
                        text="Cancel"
                        stylingMode="outlined"
                        type="normal"
                        onClick={cancelHandler}
                      />
                    </ToolbarItem>
                  </>
                )}
              </Toolbar>
            </div>
          </ValidationGroup>
          <div className="data-part" />
        </ScrollView>
      </div>
    </div>
  );
};
