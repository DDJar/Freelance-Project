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

import { departmentApi } from "../../api/department";
import { formatPhone } from "../../utils/format-phone";
import { renderStatusTag } from "../../utils/status-color";
import "./bill-list.scss";
import { Department } from "../../types/department";
import { Bill, BillRes } from "../../types/bill";
import { BillPanel } from "../../components/library/bill-panel/BillPanel";
import { billApi } from "../../api/bill";


const exportFormats = ["xlsx", "pdf"];

// ===== Cell Renders =====
const cellPhoneRender = (cell: DataGridTypes.ColumnCellTemplateData) =>
  formatPhone(cell.data.phoneNumber);

const cellNameRender = (cell: DataGridTypes.ColumnCellTemplateData) => (
  <div className="name-template">
    <div>
      {cell.data.firstname} {cell.data.lastname}
    </div>
    <div className="position">{cell.data.username}</div>
  </div>
);

// ===== Export Handler =====
const onExporting = (e: DataGridTypes.ExportingEvent) => {
  if (e.format === "pdf") {
    const doc = new JsPdf();
    exportDataGridToPdf({
      jsPDFDocument: doc,
      component: e.component,
    }).then(() => doc.save("Bills.pdf"));
  } else {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("Bills");
    exportDataGridToXLSX({
      component: e.component,
      worksheet,
      autoFilterEnabled: true,
    }).then(() => {
      workbook.xlsx.writeBuffer().then((buffer) => {
        saveAs(
          new Blob([buffer], { type: "application/octet-stream" }),
          "Bills.xlsx"
        );
      });
    });
    e.cancel = true;
  }
};

// ===== Main Component =====
export const BillList = () => {
  const [bills, setBills] = useState<BillRes[]>([]);
  const [loading, setLoading] = useState(true);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [billId, setBillId] = useState<string | null>(null);
  const [selectedBill, setSelectedBill] = useState<BillRes | null>(null);

  const [isPanelOpened, setPanelOpened] = useState(false);
  const [isPanelPinned, setPanelPinned] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const gridRef = useRef<DataGridRef>(null);
  const { id } = useParams();
  const navigate = useNavigate();
  //===== Fetch Departments =====
  useEffect(() => {
    departmentApi.getAll().then((res) => {
      if (res.isOk && res.data) setDepartments(res.data);
      else console.error(res.message);
    });
  }, []);

  // ===== Fetch Bill =====
  const loadBills = useCallback(async (showLoading = true) => {
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
        res = await billApi.getByDepartment(departmentId?.toString());
      } else {
        res = await billApi.getAll();
      }

      if (res.isOk && res.data) {
        setBills(res.data);
      } else {
        console.error(res.message);
        notify("Failed to load bills", "error", 3000);
      }
    } catch (err) {
      console.error(err);
      notify("Error loading bills", "error", 3000);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadBills(true)
  }, [loadBills]);
  // ===== Sync URL Param =====
  useEffect(() => {
    if (id && bills.length > 0) {
      const p = bills.find((u) => u.id === id);
      if (p) {
        setSelectedBill(p);
        setBillId(p.id);
        setPanelOpened(true);
      }
    } else {
      setSelectedBill(null);
      setPanelOpened(false);
    }
  }, [id, bills]);

  // ===== Actions =====
  const onRowDblClick = useCallback(
    (e) => {
      const p = e.data;
      navigate(`/bill-list/${p.id}`);
    },
    [navigate]
  );

  const refresh = useCallback(async () => {
    await loadBills(false);
  }, [loadBills]);

  const changePanelOpened = useCallback(
    (value: boolean) => {
      setPanelOpened(value);
      if (!value) navigate("/bill-list");
    },
    [navigate]
  );

  const changePanelPinned = useCallback(
    () => setPanelPinned((prev) => !prev),
    []
  );

  // ===== Additional Handlers =====
  const showColumnChooser = useCallback(() => {
    gridRef.current?.instance().showColumnChooser();
  }, []);

  const search = useCallback((e: TextBoxTypes.InputEvent) => {
    gridRef.current?.instance().searchByText(e.component.option("text") ?? "");
  }, []);

  const changePopupVisibility = useCallback((visible: boolean) => {
    setPopupVisible(visible);
  }, []);

  return (
    <div className="view bill-list">
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
            dataSource={bills}
            height={56 * 10}
            width="100%"
            noDataText="No bills found"
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
                  Danh sách hóa đơn
                </div>
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
            <Column caption="Mã số hóa đơn" dataField="id" minWidth={100} />
            <Column
              caption="Ngày tạo"
              dataField="billDate"
              dataType="date"
              format={{
                type: "custom",
                formatter: (value) =>
                  value
                    ? new Date(value).toLocaleDateString("vi-VN")
                    : "",
              }}
            />
            <Column
              caption="Tổng hóa đơn"
              dataType="number"
              minWidth={100}
              alignment="right"
              calculateCellValue={(rowData) =>
                Array.isArray(rowData.items) && rowData.items.length
                  ? rowData.items.reduce((sum, item) => sum + (item.total || 0), 0)
                  : rowData.totalAmount || 0
              }
              calculateDisplayValue={(rowData) => {
                const total = Array.isArray(rowData.items) && rowData.items.length
                  ? rowData.items.reduce((sum, item) => sum + (item.total || 0), 0)
                  : rowData.totalAmount || 0;
                return new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                  minimumFractionDigits: 0,
                }).format(total);
              }}
            />
            <Column caption="Trạng thái" dataField="status" minWidth={100} />
            <Column caption="Họ và tên" calculateCellValue={(rowData) => `${rowData.firstName} ${rowData.lastName}`} />
            <Column caption="SĐT" dataField="phone" minWidth={120} />
            <Column caption="Địa chỉ" dataField="address" minWidth={150} />

          </DataGrid>
        )}
        <BillPanel
          id={billId}
          isOpened={isPanelOpened}
          changePanelOpened={changePanelOpened}
          changePanelPinned={changePanelPinned}
        />
      </div>
    </div>
  );
};
