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
import { Workbook } from "exceljs";
import { saveAs } from "file-saver-es";
import { jsPDF as JsPdf } from "jspdf";
import { exportDataGrid as exportDataGridToPdf } from "devextreme/pdf_exporter";
import { exportDataGrid as exportDataGridToXLSX } from "devextreme/excel_exporter";
import Button from "devextreme-react/button";
import TextBox, { TextBoxTypes } from "devextreme-react/text-box";
import notify from "devextreme/ui/notify";

import { FormPopup } from "../../components";
import { departmentApi } from "../../api/department";
import { productApi } from "../../api/product";
import { formatPhone } from "../../utils/format-phone";
import "./product-list.scss";
import { Department } from "../../types/department";
import { CreateProductDTO, Product } from "../../types/product";
import { ProductPanel } from "../../components/library/product-panel/ProductPanel";
import { ProductNewForm } from "../../components/library/product-new-form/ProductNewForm";


// ===== Defaults =====
const formDataDefaults: Partial<CreateProductDTO> = {
  name: "",
  productCode: "",
  category: "",
  quantity: 0,
  price: 0,
  unit: "",
  description: "",
  imageUrl: "",
  idDepartment: "",
};

const exportFormats = ["xlsx", "pdf"];

// ===== Export Handler =====
const onExporting = (e: DataGridTypes.ExportingEvent) => {
  if (e.format === "pdf") {
    const doc = new JsPdf();
    exportDataGridToPdf({
      jsPDFDocument: doc,
      component: e.component,
    }).then(() => doc.save("Users.pdf"));
  } else {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("Users");
    exportDataGridToXLSX({
      component: e.component,
      worksheet,
      autoFilterEnabled: true,
    }).then(() => {
      workbook.xlsx.writeBuffer().then((buffer) => {
        saveAs(
          new Blob([buffer], { type: "application/octet-stream" }),
          "Users.xlsx"
        );
      });
    });
    e.cancel = true;
  }
};

// ===== Main Component =====
export const ProductList = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [productId, setProductId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<Product | null>(null);

  const [isPanelOpened, setPanelOpened] = useState(false);
  const [isPanelPinned, setPanelPinned] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const gridRef = useRef<DataGridRef>(null);
  const { id } = useParams();
  const navigate = useNavigate();

  // ===== Fetch Departments =====
  useEffect(() => {
    departmentApi.getAll().then((res) => {
      if (res.isOk && res.data) setDepartments(res.data);
      else console.error(res.message);
    });
  }, []);

  // ===== Fetch Products =====
  const loadUsers = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setIsRefreshing(!showLoading);

    try {
      const storedUser = localStorage.getItem("currentUser");
      let departmentId: string | null = null;
      let role: string | null = null;

      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          departmentId = user.departmentId ?? null;
          role = user.role ?? null;
        } catch (error) {
          console.error("Error parsing user from localStorage:", error);
          notify("Failed to read user data", "error", 3000);
          return;
        }
      }

      let res;
      if (role !== "Admin") {
        res = await productApi.search(departmentId?.toString());
      } else {
        res = await productApi.search();
      }

      if (res.isOk && res.data) {
        setProducts(res.data);
      } else {
        console.error(res.message);
        notify("Failed to load products", "error", 3000);
      }
    } catch (err) {
      console.error(err);
      notify("Error loading products", "error", 3000);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);
  useEffect(() => {
    loadUsers(true);
  }, [loadUsers]);

  // ===== Sync URL Param =====
  useEffect(() => {
    if (id && products.length > 0) {
      const p = products.find((u) => u.id === id);
      if (p) {
        setSelectedUser(p);
        setProductId(p.id);
        setPanelOpened(true);
      }
    } else {
      setSelectedUser(null);
      setPanelOpened(false);
    }
  }, [id, products]);

  // ===== Actions =====
  const onRowDblClick = useCallback(
    (e) => {
      const p = e.data;
      navigate(`/product-list/${p.id}`);
    },
    [navigate]
  );

  const refresh = useCallback(async () => {
    await loadUsers(false); // Soft refresh without full loading
  }, [loadUsers]);

  const changePanelOpened = useCallback(
    (value: boolean) => {
      setPanelOpened(value);
      if (!value) navigate("/product-list");
    },
    [navigate]
  );

  const changePanelPinned = useCallback(
    () => setPanelPinned((prev) => !prev),
    []
  );

  // ===== Additional Handlers =====
  const onAddContactClick = useCallback(() => {
    setPopupVisible(true);
  }, []);

  const showColumnChooser = useCallback(() => {
    gridRef.current?.instance().showColumnChooser();
  }, []);

  const search = useCallback((e: TextBoxTypes.InputEvent) => {
    gridRef.current?.instance().searchByText(e.component.option("text") ?? "");
  }, []);

  const changePopupVisibility = useCallback((visible: boolean) => {
    setPopupVisible(visible);
  }, []);

  const onSaveClick = useCallback(
    async (data: Partial<CreateProductDTO>) => {
      try {
        const productData = {
          ...data,
          name: data.name || "",
          productCode: data.productCode || "",
          category: data.category || "",
          quantity: data.quantity || 0,
          price: data.price || 0,
          unit: data.unit || "",
          description: data.description || "",
          imageUrl: data.imageUrl || "",
          idDepartment: data.idDepartment || "",
        };

        const res = await productApi.create(productData);
        if (res.isOk) {
          // Add new contact to local state for immediate UI update
          if (res.data) {
            const newProduct = res.data; // Store in variable to ensure type safety
            setProducts((prev) => [...prev, newProduct]);
          }
          notify(
            `thêm sản phẩm "${data.name}" thành công`,
            "success",
            3000
          );
          setPopupVisible(false);
          // Sync with server after
          setTimeout(() => loadUsers(false), 100);
        } else {
          console.error(res.message);
          notify(`Failed to create contact: ${res.message}`, "error", 3000);
        }
      } catch (err) {
        console.error(err);
        notify("Error creating contact", "error", 3000);
      }
    },
    [loadUsers]
  );

  const onProductDataChanged = useCallback(
    async (user: Product) => {
      try {
        const res = await productApi.update(user.id.toString(), user);
        if (res.isOk) {
          // Update local state for immediate UI feedback
          setProducts((prevUsers) =>
            prevUsers.map((u) => (u.id === user.id ? { ...u, ...user } : u))
          );
          notify("Product updated successfully", "success", 2000);
          // Sync with server
          setTimeout(() => loadUsers(false), 100);
        } else {
          console.error(res.message);
          notify(`Failed to update product: ${res.message}`, "error", 3000);
        }
      } catch (err) {
        console.error(err);
        notify("Error updating contact", "error", 3000);
      }
    },
    [loadUsers]
  );

  return (
    <div className="view user-list">
      <div className="view-wrapper list-page">
        <LoadPanel
          enabled={loading}
          showIndicator={true}
          showPane={true}
          shadingColor="rgba(0, 0, 0, 0.4)"
        />

        {!loading && (
          <DataGrid
            className="grid theme-dependent"
            dataSource={products}
            height={56 * 10}
            width="100%"
            noDataText="No products found"
            focusedRowEnabled
            keyExpr="id"
            showBorders
            allowColumnReordering
            onExporting={onExporting}
            onRowDblClick={onRowDblClick}
            ref={gridRef}
          >
            {/* SearchPanel removed - using toolbar search instead */}
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
            <Paging defaultPageSize={10} />
            <Pager
              visible={true}
              showPageSizeSelector
              allowedPageSizes={[5, 10, 20, 50]}
              showInfo
            />
            <Toolbar>

              <Item location="before">
                <div className="grid-header" style={{ fontSize: "19px", fontWeight: "bold" }}>
                  Danh sách sản phẩm
                </div>
              </Item>
              <Item location="after" widget="dxButton">
                <Button
                  icon="plus"
                  text="Thêm sản phẩm"
                  type="default"
                  stylingMode="contained"
                  onClick={onAddContactClick}
                />
              </Item>
              <Item location="after" widget="dxButton">
                <Button
                  icon="refresh"
                  text="Làm mới"
                  stylingMode="text"
                  onClick={refresh}
                  disabled={isRefreshing}
                />
              </Item>
              <Item location="after" widget="dxButton">
                <Button
                  icon="columnchooser"
                  text="Chọn cột"
                  stylingMode="text"
                  onClick={showColumnChooser}
                />
              </Item>
              <Item location="after">
                <div className="separator" />
              </Item>
              <Item name="exportButton" />
              <Item location="after" widget="dxTextBox">
                <TextBox
                  mode="search"
                  placeholder="Tìm kiếm"
                  onInput={search}
                />
              </Item>
            </Toolbar>
            <Column
              caption="Mã sản phẩm"
              dataField="productCode"
              minWidth={130}
            />
            <Column
              caption="Tên sản phẩm"
              sortOrder="asc"
              dataField="name"
              minWidth={150}
            />
            <Column caption="Danh mục" dataField="category" minWidth={100} />
            <Column
              caption="Số lượng"
              dataField="quantity"
              dataType="number"
              minWidth={120}

            />
            <Column caption="Đơn vị" dataField="unit" />
            <Column
              caption="Giá"
              dataField="price"
              dataType="number"
              alignment="right"
              calculateDisplayValue={(data) =>
                new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                  minimumFractionDigits: 0,
                }).format(data.price)
              }
            />
            <Column
              caption="Công ty"
              dataField="idDepartment"
              cellRender={({ value }) => {
                const dept = departments.find((d) => d.id === value);
                return dept ? dept.departmentName : "";
              }}
            />
          </DataGrid>
        )}

        <ProductPanel
          id={productId}
          isOpened={isPanelOpened}
          changePanelOpened={changePanelOpened}
          changePanelPinned={changePanelPinned}
          onReloadList={loadUsers}
        />

        <FormPopup
          title="Thêm sản phẩm"
          visible={popupVisible}
          setVisible={changePopupVisibility}
          hideSaveButton={true} // 👈 truyền prop này vào
        >
          {popupVisible && (
            <ProductNewForm
              initData={formDataDefaults}
              onDataChanged={onSaveClick}
            />
          )}
        </FormPopup>
      </div>
    </div>
  );
};
