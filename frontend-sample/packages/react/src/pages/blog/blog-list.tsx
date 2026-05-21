import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  DataGrid,
  DataGridRef,
  Sorting,
  Selection,
  HeaderFilter,
  Scrolling,
  SearchPanel,
  ColumnChooser,
  Export,
  Column,
  Toolbar,
  Item,
  LoadPanel,
  Paging,
  Pager,
  DataGridTypes,
} from "devextreme-react/data-grid";
import Button from "devextreme-react/button";
import { Workbook } from "exceljs";
import { saveAs } from "file-saver-es";
import { jsPDF as JsPdf } from "jspdf";
import { exportDataGrid as exportDataGridToPdf } from "devextreme/pdf_exporter";
import { exportDataGrid as exportDataGridToXLSX } from "devextreme/excel_exporter";
import { renderStatusTag } from "../../utils/status-color";
import "./blog-list.scss";
import { Blog, BlogStatus } from "../../types/blog";
import { blogApi } from "../../api/blog";
import { BlogPanel } from "../../components/library/blog-panel/BlogPanel";
import { FormPopup } from "../../components/utils/form-popup/FormPopup";
import { BlogNewForm } from "../../components/library/blog-new-form/BlogNewForm";
import notify from "devextreme/ui/notify";

const formDataDefaults: Blog = {
  id: "",
  title: "",
  content: "",
  author: "",
  status: "Draft",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const exportFormats = ["xlsx", "pdf"];

const cellTitleRender = (cell: DataGridTypes.ColumnCellTemplateData) => (
  <div className="title-template">
    <div className="title">{cell.data.title}</div>
  </div>
);

const cellAuthorRender = (cell: DataGridTypes.ColumnCellTemplateData) => (
  <div className="title-template">
    <div className="author">{cell.data.author}</div>
  </div>
);

const cellDateRender = (cell: DataGridTypes.ColumnCellTemplateData) => {
  const date = new Date(cell.value);
  return date.toLocaleDateString("vi-VN");
};

const onExporting = (e: DataGridTypes.ExportingEvent) => {
  if (e.format === "pdf") {
    const doc = new JsPdf();
    exportDataGridToPdf({
      jsPDFDocument: doc,
      component: e.component,
    }).then(() => doc.save("Blogs.pdf"));
  } else {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("Blogs");
    exportDataGridToXLSX({
      component: e.component,
      worksheet,
      autoFilterEnabled: true,
    }).then(() => {
      workbook.xlsx.writeBuffer().then((buffer) => {
        saveAs(
          new Blob([buffer], { type: "application/octet-stream" }),
          "Blogs.xlsx"
        );
      });
    });
    e.cancel = true;
  }
};

export const BlogList = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [blogId, setBlogId] = useState<string | null>(null);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [isPanelOpened, setPanelOpened] = useState(false);
  const [isPanelPinned, setPanelPinned] = useState(false);

  const gridRef = useRef<DataGridRef>(null);
  const { id } = useParams();
  const navigate = useNavigate();

  const loadBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await blogApi.getAll();
      if (res.isOk && res.data) setBlogs(res.data);
      else console.error(res.message);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Thêm vào đầu BlogList
  const [popupVisible, setPopupVisible] = useState(false);

  const changePopupVisibility = useCallback((visible: boolean) => {
    setPopupVisible(visible);
  }, []);

  const onSaveClick = useCallback(
    async (data: Partial<Blog>, imageFile?: File | null) => {
      // ✅ Cho phép null
      try {
        const blogData: Partial<Blog> = {
          ...data,
          title: data.title || "",
          status: data.status as BlogStatus,
          author: data.author || "",
          createdAt: data.createdAt || new Date(),
          updatedAt: data.updatedAt || new Date(),
          content: data.content || "",
        };

        // ✅ Truyền imageFile vào blogApi.create (chỉ khi không null)
        const res = await blogApi.create(blogData, imageFile || undefined);

        if (res.isOk) {
          // Add new blog to local state for immediate UI update
          if (res.data) {
            const newBlog = res.data;
            setBlogs((prevBlogs) => [...prevBlogs, newBlog]);
          }

          notify(`New Blog created successfully`, "success", 3000);
          setPopupVisible(false);
          // Sync with server after
          setTimeout(() => loadBlogs(), 100);
        } else {
          console.error(res.message);
          notify(`Failed to create blog: ${res.message}`, "error", 3000);
        }
      } catch (err) {
        console.error(err);
        notify("Error creating blog", "error", 3000);
      }
    },
    [loadBlogs]
  );
  useEffect(() => {
    loadBlogs();
  }, [loadBlogs]);

  useEffect(() => {
    if (id && blogs.length > 0) {
      const blog = blogs.find((b) => b.id === id);
      if (blog) {
        setSelectedBlog(blog);
        setBlogId(blog.id);
        setPanelOpened(true);
      } else {
        navigate("/blog-list", { replace: true });
      }
    } else if (!id) {
      setSelectedBlog(null);
      setBlogId(null);
      setPanelOpened(false);
      setPanelPinned(false);
    }
  }, [id, blogs, navigate]);

  const onRowDblClick = useCallback(
    (e: any) => {
      const blog = e.data;
      navigate(`/blog-list/${blog.id}`);
    },
    [navigate]
  );

  const refresh = useCallback(() => {
    loadBlogs();
  }, [loadBlogs]);

  const changePanelOpened = useCallback(
    (value: boolean) => {
      setPanelOpened(value);
      if (!value) {
        setSelectedBlog(null);
        setBlogId(null);
        setPanelPinned(false);
        navigate("/blog-list", { replace: true });
      }
    },
    [navigate]
  );

  const changePanelPinned = useCallback(() => {
    setPanelPinned((prev) => !prev);
  }, []);

  const onBlogDataChanged = useCallback(
    async (blog: Blog | null) => {
      if (blog) {
        setBlogs((prev) => prev.map((b) => (b.id === blog.id ? blog : b)));
        setSelectedBlog(blog);
      } else {
        await loadBlogs();
        changePanelOpened(false);
      }
    },
    [loadBlogs, changePanelOpened]
  );

  const onAddBlogClick = useCallback(() => {
    setPopupVisible(true);
  }, []);

  return (
    <div className="view blog-list">
      <div className="view-wrapper list-page">
        <LoadPanel
          enabled={loading}
          showIndicator
          showPane
          shadingColor="rgba(0, 0, 0, 0.4)"
        />

        {!loading && (
          <DataGrid
            className="grid theme-dependent"
            dataSource={blogs}
            height={56 * 10}
            width="100%"
            noDataText="No blogs found"
            focusedRowEnabled
            keyExpr="id"
            showBorders
            allowColumnReordering
            onExporting={onExporting}
            onRowDblClick={onRowDblClick}
            ref={gridRef}
          >
            <SearchPanel visible placeholder="Blog search..." />
            <ColumnChooser enabled />
            <Export enabled allowExportSelectedData formats={exportFormats} />
            <Selection
              mode="multiple"
              showCheckBoxesMode="always"
              selectAllMode="allPages"
            />
            <HeaderFilter visible />
            <Sorting mode="multiple" />
            <Scrolling mode="virtual" />
            <Paging defaultPageSize={5} />
            <Pager
              visible={true}
              showPageSizeSelector
              allowedPageSizes={[5, 10, 20, 50]}
              showInfo
            />

            <Toolbar>
              <Item location="before">
                <div
                  className="grid-header"
                  style={{ fontWeight: "bold", fontSize: "19px" }}
                >
                  Blogs
                </div>
              </Item>
              <Item location="after" widget="dxButton">
                <Button
                  icon="plus"
                  text="Tạo bài đăng"
                  type="default"
                  stylingMode="contained"
                  onClick={onAddBlogClick}
                />
              </Item>
              <Item location="after" locateInMenu="auto" showText="inMenu">
                <Button icon="refresh" text="Làm mới" onClick={refresh} />
              </Item>
              <Item location="after" locateInMenu="auto">
                <div className="separator" />
              </Item>
              <Item name="exportButton" />
              <Item name="columnChooserButton" locateInMenu="auto" />
              <Item name="searchPanel" locateInMenu="auto" />
            </Toolbar>

            <Column
              caption="Tiêu đề"
              dataField="title"
              minWidth={200}
              cellRender={cellTitleRender}
              sortOrder="asc"
            />
            <Column
              caption="Trạng thái bài đăng"
              dataField="status"
              minWidth={120}
              cellRender={({ value }) => renderStatusTag(value)}
            />
            <Column
              caption="Tác giả"
              dataField="author"
              minWidth={150}
              cellRender={cellAuthorRender}
            />
            <Column
              caption="Ngày tạo"
              dataField="createdAt"
              minWidth={120}
              cellRender={cellDateRender}
            />
            <Column
              caption="Ngày chỉnh sửa"
              dataField="updatedAt"
              minWidth={120}
              cellRender={cellDateRender}
            />
          </DataGrid>
        )}

        <BlogPanel
          blogId={blogId}
          isOpened={isPanelOpened}
          changePanelOpened={changePanelOpened}
          changePanelPinned={changePanelPinned}
          isPinned={isPanelPinned}
          onBlogDataChanged={onBlogDataChanged}
        />
        <FormPopup
          title="Tạo bài đăng"
          visible={popupVisible}
          setVisible={changePopupVisibility}
          hideSaveButton={true}
        >
          {popupVisible && (
            <BlogNewForm
              initData={formDataDefaults}
              onDataChanged={onSaveClick}
            />
          )}
        </FormPopup>
      </div>
    </div>
  );
};
