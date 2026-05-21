import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo
} from "react";
import { Workbook } from "exceljs";
import { saveAs } from "file-saver-es";
import Toolbar, { Item } from "devextreme-react/toolbar";
import { DataGridRef } from "devextreme-react/data-grid";
import { SortableRef } from "devextreme-react/sortable";
import { exportDataGrid } from "devextreme/pdf_exporter";
import { exportDataGrid as exportDataGridXSLX } from "devextreme/excel_exporter";
import LoadPanel from "devextreme-react/load-panel";
import Button from "devextreme-react/button";
import TextBox, { TextBoxTypes } from "devextreme-react/text-box";
import Tabs from "devextreme-react/tabs";
import notify from "devextreme/ui/notify";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { useScreenSize } from "../../utils/media-query";
import { Delivery } from "../../types/delivery";
import { deliveryApi } from "../../api/delivery";
import { useAuth } from "../../contexts/auth";

import "./delivery-list.scss";
import { DeliveryListGrid } from "../../components/library/delivery-list-grid/DeliveryListGrid";
import { DeliveryListKanban } from "../../components/library/delivery-list-kanban/DeliveryListKanban";

const listsData = ["Danh sách", "Bảng Kanban"];

// ✅ fallback khởi tạo giao hàng mặc định
const newDeliveryDefaults: Delivery = {
  billId: "",
  deliveryDate: new Date(),
  deliveredBy: "",
  recipient: "",
  status: "Pending",
  notes: ""
};

export const DeliveryList = () => {
  const gridRef = useRef<DataGridRef>(null);
  const kanbanRef = useRef<SortableRef>(null);

  const [view, setView] = useState(listsData[0]);
  const [index, setIndex] = useState(0);
  const [gridData, setGridData] = useState<Delivery[]>([]);
  const [filteredData, setFilteredData] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [popupVisible, setPopupVisible] = useState(false);
  const [formData, setFormData] = useState<Delivery>({ ...newDeliveryDefaults });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { isXSmall } = useScreenSize();
  const { user } = useAuth();

  const isDataGrid = view === listsData[0];
  const isKanban = view === listsData[1];
  const [searchText, setSearchText] = useState("");
  
  const fetchDeliveries = useCallback(async (showLoading = true) => {
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
        notify("Không thể đọc thông tin người dùng", "error", 3000);
        return;
      }
    }

    let res;
    if (role !== "Admin" && departmentId) {
      res = await deliveryApi.getByDepartment(departmentId);
    } else {
      res = await deliveryApi.getAll();
    }

    if (res.isOk && res.data) {
      setGridData(res.data);
      setFilteredData(res.data.filter((d) => d.status));
    } else {
      notify(res.message || "Không thể tải dữ liệu", "error", 3000);
    }
  } catch (err) {
    console.error("fetchDeliveries error:", err);
    notify("Đã xảy ra lỗi khi tải dữ liệu", "error", 3000);
  } finally {
    setLoading(false);
    setIsRefreshing(false);
  }
}, []);


  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const handleDataChanged = useCallback(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const changePopupVisibility = useCallback((visible: boolean) => {
    setPopupVisible(visible);
  }, []);

  const onTabClick = useCallback((e: { itemData?: string }) => {
    const newView = e.itemData || "";
    setView(newView);
    setIndex(listsData.findIndex((d) => d === newView));
  }, []);

  const onAddClick = useCallback(() => {
    setFormData({ ...newDeliveryDefaults });
    setPopupVisible(true);
  }, []);

  const onDataChanged = useCallback((data: Delivery) => {
    setFormData(data);
  }, []);


  const refresh = useCallback(() => {
    setIsRefreshing(true);
    fetchDeliveries();
  }, [fetchDeliveries]);

  const showColumnChooser = useCallback(() => {
    gridRef.current?.instance().showColumnChooser();
  }, []);

  const exportToPDF = useCallback(() => {
    const doc = new jsPDF();
    exportDataGrid({
      jsPDFDocument: doc,
      component: gridRef.current?.instance(),
    }).then(() => doc.save("Deliveries.pdf"));
  }, []);

  const exportToXSLX = useCallback(() => {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("Deliveries");
    exportDataGridXSLX({
      component: gridRef.current?.instance(),
      worksheet,
      autoFilterEnabled: true,
    }).then(() => {
      workbook.xlsx.writeBuffer().then((buffer) => {
        saveAs(new Blob([buffer], { type: "application/octet-stream" }), "Deliveries.xlsx");
      });
    });
  }, []);

  const search = useCallback((e: TextBoxTypes.InputEvent) => {
  const text = e.component.option("text") ?? "";
  setSearchText(text); // 🔄
  gridRef.current?.instance().searchByText(text); // -> áp dụng tìm kiếm cho DataGrid
}, []);

  
    const getTabsWidth = useCallback(() => {
      return isXSmall ? 220 : "auto";
    }, [isXSmall]);
  
    // 🔄 Lọc dữ liệu cho Kanban theo searchText
    const kanbanData = useMemo(() => {
  if (!searchText.trim()) return filteredData;

  const search = searchText.toLowerCase();

  return filteredData.filter((item) =>
    item.billId.toLowerCase().includes(search) ||
    item.deliveredBy?.toLowerCase().includes(search) ||
    item.recipient?.toLowerCase().includes(search) ||
    item.status?.toLowerCase().includes(search) ||
    item.notes?.toLowerCase().includes(search)
  );
}, [filteredData, searchText]);

  
    const toolbarItems = useMemo(
      () => [
        {
          location: "before" as const,
          widget: "dxTabs" as const,
          options: {
            dataSource: listsData,
            width: getTabsWidth(),
            selectedIndex: index,
            scrollByContent: true,
            showNavButtons: false,
            onItemClick: onTabClick,
          },
        },
      ],
      [index, getTabsWidth, onTabClick]
    );

  return (
    <div className="view-wrapper view-wrapper-delivery-list list-page">
      <Toolbar className="toolbar-common theme-dependent">
        <Item location="before">
          <span className="toolbar-header" style={{ fontWeight: "bold", fontSize: "19px" }}>Cách thức hiển thị</span>
        </Item>
        <Item location="before" widget="dxTabs">
          <Tabs
            dataSource={listsData}
            width={getTabsWidth()}
            selectedIndex={index}
            scrollByContent
            onItemClick={onTabClick}
            className="planning-tabs"
          />
        </Item>
        <Item location="after" widget="dxButton">
          <Button icon="refresh" text="Làm mới" stylingMode="text" onClick={refresh} disabled={isRefreshing} />
        </Item>
        <Item location="after" widget="dxButton" disabled={!isDataGrid}>
          <Button icon="columnchooser" text="Truy xuất cột" stylingMode="text" onClick={showColumnChooser} />
        </Item>
        <Item location="after">
          <div className="separator" />
        </Item>
        <Item location="after" widget="dxButton" >
          <Button icon="exportpdf" text="Xuất PDF" stylingMode="text" onClick={exportToPDF} />
        </Item>
        <Item location="after" widget="dxButton" >
          <Button icon="exportxlsx" text="Xuất Excel" stylingMode="text" onClick={exportToXSLX} />
        </Item>
        <Item location="after" widget="dxTextBox" >
          <TextBox mode="search" placeholder="Tìm kiếm giao hàng" onInput={search} />
        </Item>
      </Toolbar>

      {loading && <LoadPanel container=".content" showPane={false} visible position={{ of: ".content" }} />}

      {!loading && isDataGrid && (
        <DeliveryListGrid ref={gridRef} dataSource={gridData} onDataChanged={handleDataChanged} />
      )}

      {!loading && isKanban && (
        <DeliveryListKanban
          ref={kanbanRef}
          dataSource={kanbanData}
          changePopupVisibility={() => changePopupVisibility(!popupVisible)}
          onDeliveryUpdated={handleDataChanged}
        />
      )}

    </div>
  );
};
