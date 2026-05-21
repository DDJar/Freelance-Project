import { useEffect, useState } from "react";
import Chart, {
  ArgumentAxis,
  ValueAxis,
  CommonSeriesSettings,
  Series,
  Legend,
  Tooltip,
  Export,
  Title,
  Label,
} from "devextreme-react/chart";
import DataGrid, { Column, Paging } from "devextreme-react/data-grid";
import { SelectBox } from "devextreme-react/select-box";
import { departmentApi } from "../../api/department";
import { productApi } from "../../api/product";
import { LoadPanel } from "devextreme-react/load-panel";
import "./inventory-report.scss";
import { CardReport } from "./CardReport";
import notify from "devextreme/ui/notify";
import { ScrollView } from "devextreme-react";

const TIME_PERIODS = [
  { key: "7ngay", name: "7 Ngày" },
  { key: "30ngay", name: "30 Ngày" },
  { key: "365ngay", name: "1 Năm" },
];

const ACTION_TYPES = [
  { value: "", name: "Tất cả" },
  { value: "Nhập kho hàng", name: "Nhập kho hàng" },
  { value: "Xuất kho", name: "Xuất kho" },
  { value: "Hoàn kho", name: "Hoàn kho" },
];

const GROUP_BY_OPTIONS = [
  { key: "daily", name: "Theo ngày" },
  { key: "monthly", name: "Theo tháng" },
];

export default function InventoryAnalyticsDashboard() {
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState("7ngay");
  const [actionType, setActionType] = useState("");
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [reportData, setReportData] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<{ departmentId: string; role: string } | null>(null);
  const [groupBy, setGroupBy] = useState("daily");

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser({
          departmentId: user.departmentId ?? "",
          role: user.role ?? "",
        });
      } catch (error) {
        console.error("Error parsing user from localStorage:", error);
        notify("Không đọc được thông tin người dùng", "error", 3000);
      }
    }
  }, []);

  useEffect(() => {
    departmentApi.getAll().then((res) => {
      if (res.isOk) setDepartments(res.data || []);
    });
  }, []);

  useEffect(() => {
    fetchData();
  }, [range, actionType, selectedDept, groupBy]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const storedUser = localStorage.getItem("currentUser");
      let departmentId: string | null = null;
      let role: string | null = null;

      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          departmentId = user?.departmentId ?? null;
          role = user?.role ?? null;
        } catch (error) {
          console.error("Error parsing user from localStorage:", error);
          notify("Không thể đọc dữ liệu người dùng", "error", 3000);
          return;
        }
      }

      const { fromDate, toDate } = getDateRange(range);
      const departmentIdToUse = role === "Admin" ? (selectedDept || undefined) : (departmentId || undefined);

      const [productRes, reportRes] = await Promise.all([
        productApi.getAll(),
        productApi.getInventoryReport({
          fromDate,
          toDate,
          actionType: actionType || undefined,
          departmentId: departmentIdToUse,
          groupBy,
        }),
      ]);

      if (productRes.isOk) {
        setProducts(productRes.data || []);
      }

      if (reportRes.isOk && productRes.isOk) {
        const productMap = Object.fromEntries((productRes.data || []).map((p) => [p.id, p.name]));

        const enriched = (reportRes.data || []).map((item) => ({
          ...item,
          productName: productMap[item.productId] || "(Không xác định)",
        }));

        setReportData(enriched);
      } else {
        notify("Không thể tải dữ liệu báo cáo", "error", 3000);
      }
    } catch (err) {
      console.error("Lỗi khi fetch dữ liệu:", err);
      notify("Đã xảy ra lỗi trong quá trình tải dữ liệu", "error", 3000);
    } finally {
      setLoading(false);
    }
  };

  function getDateRange(range: string): { fromDate: string; toDate: string } {
    const today = new Date();
    const toDateObj = new Date(today);
    toDateObj.setDate(toDateObj.getDate() + 1);
    const toDate = toDateObj.toISOString().substring(0, 10);

    let fromDateObj = new Date();
    if (range === "7ngay") {
      fromDateObj.setDate(today.getDate() - 7);
    } else if (range === "30ngay") {
      fromDateObj.setDate(today.getDate() - 30);
    } else if (range === "365ngay") {
      fromDateObj.setDate(today.getDate() - 365);
    } else {
      fromDateObj = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    const fromDate = fromDateObj.toISOString().substring(0, 10);
    return { fromDate, toDate };
  }

  const totalIncrease = reportData.filter((d) => d.totalQuantityChanged > 0).reduce((sum, d) => sum + d.totalQuantityChanged, 0);
  const totalDecrease = reportData.filter((d) => d.totalQuantityChanged < 0).reduce((sum, d) => sum + d.totalQuantityChanged, 0);
  const totalChange = reportData.reduce((sum, d) => sum + d.totalQuantityChanged, 0);

  return (
    <ScrollView>
      <div className="page-content with-toolbar analytics-page">
        <div className="analytics-toolbar">
          <span className="toolbar-title">Xuất nhập kho</span>
          <SelectBox dataSource={TIME_PERIODS} valueExpr="key" displayExpr="name" value={range} onValueChanged={(e) => setRange(e.value)} placeholder="Chọn thời gian" />
          <SelectBox dataSource={ACTION_TYPES} valueExpr="value" displayExpr="name" value={actionType} onValueChanged={(e) => setActionType(e.value)} placeholder="Loại hành động" />
          <SelectBox dataSource={GROUP_BY_OPTIONS} valueExpr="key" displayExpr="name" value={groupBy} onValueChanged={(e) => setGroupBy(e.value)} placeholder="Nhóm theo" />
          {currentUser?.role === "Admin" && (
            <SelectBox dataSource={departments} valueExpr="id" displayExpr="departmentName" value={selectedDept} onValueChanged={(e) => setSelectedDept(e.value)} placeholder="Chọn phòng ban" />
          )}
        </div>

        <LoadPanel visible={loading} />

        {!loading && (
          <>
            <div className="dashboard-summary">
              <CardReport title="Tổng tăng kho" value={totalIncrease} />
              <CardReport title="Tổng giảm kho" value={totalDecrease} />
              <CardReport title="Tổng biến động" value={totalChange} />
              <CardReport title="Lượt thay đổi" value={reportData.length} />
            </div>
<Chart
  dataSource={reportData}
  customizePoint={(pointInfo) => {
    if (pointInfo.data.actionType === "Nhập kho hàng") {
      return { color: "#2196f3" }; // xanh dương
    } else if (pointInfo.data.actionType === "Xuất kho") {
      return { color: "#f44336" }; // đỏ
    } else if (pointInfo.data.actionType === "Hoàn kho") {
      return { color: "#4caf50" }; // xanh lá
    } else {
      return { color: "#9e9e9e" }; // xám
    }
  }}
>
  <CommonSeriesSettings argumentField="groupDate" type="bar" valueField="totalQuantityChanged" />
  <Series name="Nhập kho hàng" />
  <Series name="Xuất kho" />
  <Series name="Hoàn kho" />
  <ArgumentAxis>
    <Title text="Ngày" />
    <Label rotationAngle={-45} overlappingBehavior="rotate" />
  </ArgumentAxis>
  <ValueAxis>
    <Title text="Số lượng" />
  </ValueAxis>
  <Tooltip enabled />
  <Export enabled />
</Chart>
            <div style={{ marginTop: 5 }}>
              <h4 style={{ margin: 10 }}>Lịch sử thay đổi tồn kho</h4>
              <DataGrid dataSource={reportData} showBorders={true} height={400}>
                <Paging defaultPageSize={10} />
                <Column dataField="productId" caption="Mã sản phẩm" />
                <Column dataField="productName" caption="Tên sản phẩm" />
                <Column dataField="actionType" caption="Loại hành động" />
                <Column dataField="groupDate" caption="Ngày" dataType="string" />
                <Column dataField="totalQuantityChanged" caption="Số lượng thay đổi" />
              </DataGrid>
            </div>
          </>
        )}
      </div>
    </ScrollView>
  );
}
