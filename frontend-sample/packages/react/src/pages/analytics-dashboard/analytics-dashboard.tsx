import { useCallback, useEffect, useState } from "react";

import { Item } from "devextreme-react/toolbar";
import { LoadPanel } from "devextreme-react/load-panel";
import ScrollView from "devextreme-react/scroll-view";
import Chart, {
  ArgumentAxis,
  Border,
  CommonSeriesSettings,
  Format,
  Label,
  Legend,
  Series,
  ValueAxis,
  Title,
  Grid,
  Tooltip,
  Export,
  Animation,
} from "devextreme-react/chart";
import { SelectBox } from "devextreme-react/select-box";

import { useScreenSize } from "../../utils/media-query";
import { billApi } from "../../api/bill";
import { departmentApi } from "../../api/department";
import { useAuth } from "../../contexts/auth";
import { ToolbarAnalytics } from "../../components";
import { Bill, RevenueChartData, RevenueStats } from "../../types/bill";
import { Department } from "../../types/department";
import { CardAnalytics } from "../../components/library/card-analytics/CardAnalytics";

import "./analytics-dashboard.scss";
import { formatCurrency } from "../../utils/format-currency";
import { formatDate } from "../../utils/format-date";
import { CategoryRevenueChart } from "../../components/utils/category-revenue-chart/CategoryRevenueChart";

// Định nghĩa các mốc thời gian cho bill analytics
const TIME_PERIODS = [
  {
    key: "week",
    name: "Tuần",
    value: "Tuần",
    getDays: () => 7,
    getStartDate: () => {
      const date = new Date();
      date.setDate(date.getDate() - 7);
      return date;
    },
  },
  {
    key: "month",
    name: "Tháng",
    value: "Tháng",
    getDays: () => 30,
    getStartDate: () => {
      const date = new Date();
      date.setMonth(date.getMonth() - 1);
      return date;
    },
  },
  {
    key: "year",
    name: "Năm",
    value: "Năm",
    getDays: () => 365,
    getStartDate: () => {
      const date = new Date();
      date.setFullYear(date.getFullYear() - 1);
      return date;
    },
  },
  {
    key: "three_years",
    name: "3 Năm",
    value: "3 Năm",
    getDays: () => 365 * 3,
    getStartDate: () => {
      const date = new Date();
      date.setFullYear(date.getFullYear() - 3);
      return date;
    },
  },
];

const DEFAULT_PERIOD = "month";

const formatDateKey = (date: Date): string => {
  return date.toISOString().split("T")[0];
};


const groupBillsByTimeUnit = (
  bills: Bill[],
  periodKey: string
): RevenueChartData[] => {
  const grouped: {
    [key: string]: { revenue: number; count: number; bills: Bill[] };
  } = {};

  bills.forEach((bill) => {
    const billDate = new Date(bill.billDate);
    let groupKey: string;
    let displayKey: string;

    // Nhóm theo đơn vị thời gian phù hợp
    switch (periodKey) {
      case "week":
      case "month":
        groupKey = billDate.toISOString().split("T")[0]; // Theo ngày
        displayKey = formatDate(bill.billDate);
        break;
      case "year":
        groupKey = `${billDate.getFullYear()}-${billDate.getMonth() + 1}`; // Theo tháng
        displayKey = `${billDate.getMonth() + 1}/${billDate.getFullYear()}`;
        break;
      case "three_years":
        groupKey = `${billDate.getFullYear()}-Q${
          Math.floor(billDate.getMonth() / 3) + 1
        }`; // Theo quý
        displayKey = `Q${
          Math.floor(billDate.getMonth() / 3) + 1
        }/${billDate.getFullYear()}`;
        break;
      default:
        groupKey = billDate.toISOString().split("T")[0];
        displayKey = formatDate(bill.billDate);
    }

    if (!grouped[groupKey]) {
      grouped[groupKey] = { revenue: 0, count: 0, bills: [] };
    }

    grouped[groupKey].revenue += bill.totalAmount;
    grouped[groupKey].count += 1;
    grouped[groupKey].bills.push(bill);
  });

  return Object.entries(grouped)
    .map(([key, data]) => ({
      date: key,
      dateDisplay: formatDate(data.bills[0].billDate),
      revenue: data.revenue,
      billCount: data.count,
      averageAmount: data.count > 0 ? data.revenue / data.count : 0,
      rawBills: data.bills, // 👈 thêm dòng này
    }))

    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const calculateRevenueStats = (
  currentData: RevenueChartData[],
  previousPeriodBills: Bill[]
): RevenueStats => {
  const totalRevenue = currentData.reduce((sum, item) => sum + item.revenue, 0);
  const totalBills = currentData.reduce((sum, item) => sum + item.billCount, 0);
  const averageRevenue = totalBills > 0 ? totalRevenue / totalBills : 0;

  const previousPeriodRevenue = previousPeriodBills.reduce(
    (sum, bill) => sum + bill.totalAmount,
    0
  );
  const growthRate =
    previousPeriodRevenue > 0
      ? ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100
      : 0;

  // Tìm ngày có doanh thu cao nhất
  const bestDayData = currentData.reduce(
    (best, current) => (current.revenue > best.revenue ? current : best),
    { revenue: 0, dateDisplay: "", date: "" }
  );

  return {
    totalRevenue,
    totalBills,
    averageRevenue,
    previousPeriodRevenue,
    growthRate,
    bestDay: bestDayData.dateDisplay,
    bestDayRevenue: bestDayData.revenue,
  };
};

// Components
const RevenueStatsCards = ({ stats }: { stats: RevenueStats }) => (
  <>
    <CardAnalytics title="Tổng Doanh Thu" contentClass="stat-card revenue">
      <div className="stat-content">
        <div className="stat-value primary">
          {formatCurrency(stats.totalRevenue)}
        </div>
        <div
          className={`stat-growth ${
            stats.growthRate >= 0 ? "positive" : "negative"
          }`}
        >
          {stats.growthRate >= 0 ? "↗" : "↘"}{" "}
          {Math.abs(stats.growthRate).toFixed(1)}%
        </div>
      </div>
    </CardAnalytics>

    <CardAnalytics title="Số Hóa Đơn" contentClass="stat-card bills">
      <div className="stat-content">
        <div className="stat-value">{stats.totalBills.toLocaleString()}</div>
        <div className="stat-label">Tổng hóa đơn</div>
      </div>
    </CardAnalytics>

    <CardAnalytics title="Doanh Thu TB" contentClass="stat-card average">
      <div className="stat-content" style = {{marginTop : "4px"}}>
        <div className="stat-value">
          {formatCurrency(stats.averageRevenue)}
        </div>
        <div className="stat-label">Trung bình/hóa đơn</div>
      </div>
    </CardAnalytics>

    <CardAnalytics title="Ngày Tốt Nhất" contentClass="stat-card best-day">
      <div className="stat-content">
        <div className="stat-value small">{stats.bestDay}</div>
        <div className="stat-value small">
          {formatCurrency(stats.bestDayRevenue)}
        </div>
      </div>
    </CardAnalytics>
  </>
);

const RevenueChart = ({
  data,
  periodKey,
}: {
  data: RevenueChartData[];
  periodKey: string;
}) => {
  const argumentType: "string" | "datetime" =
    periodKey === "three_years" ? "string" : "datetime";
  const getArgumentFormat = () => {
    switch (periodKey) {
      case "week":
      case "month":
        return "dd/MM";
      case "year":
        return "MM/yyyy";
      case "three_years":
        return "yyyy";
      default:
        return "dd/MM";
    }
  };

  return (
    <CardAnalytics title="Biểu Đồ Doanh Thu" contentClass="chart-card">
      <Chart dataSource={data} height={400} palette="Soft Pastel">
        <Animation enabled={true} duration={1200} />
        <CommonSeriesSettings
          argumentField="date"
          type={
            periodKey === "week" || periodKey === "month" ? "spline" : "bar"
          }
        >
          <Border visible={true} width={1} />
        </CommonSeriesSettings>

        <Series valueField="revenue" name="Doanh Thu" color="#28a745" />

        <ArgumentAxis
          argumentType={argumentType}
          tickInterval={periodKey === "year" ? "month" : undefined}
        >
          <Label format={getArgumentFormat()} />
          <Grid visible={true} opacity={0.3} />
        </ArgumentAxis>

        <ValueAxis>
          <Label>
            <Format type="currency" currency="VND" precision={0} />
          </Label>
          <Grid visible={true} opacity={0.3} />
        </ValueAxis>
        <Tooltip
          enabled={true}
          customizeTooltip={(info) => {
            const argumentKey =
              info.argument instanceof Date
                ? formatDateKey(info.argument)
                : info.argument;

            return {
              text: `Ngày: ${formatDate(info.argument, "medium")}<br/>
             Doanh thu: ${formatCurrency(info.value)}`,
            };
          }}
        />
        <Legend visible={true} />
        <Export enabled={true} />
        <Title text="Doanh Thu Theo Thời Gian" />
      </Chart>
    </CardAnalytics>
  );
};

const BillCountChart = ({
  data,
  periodKey,
}: {
  data: RevenueChartData[];
  periodKey: string;
}) => {
  const argumentType: "string" | "datetime" =
    periodKey === "three_years" ? "string" : "datetime";
  return (
    <CardAnalytics title="Số Lượng Hóa Đơn" contentClass="chart-card">
      <Chart dataSource={data} height={400} palette="Harmony Light">
        <Animation enabled={true} duration={1000} />
        <CommonSeriesSettings argumentField="date" type="bar">
          <Border visible={true} width={1} />
        </CommonSeriesSettings>

        <Series valueField="billCount" name="Số Hóa Đơn" color="#007bff" />

        <ArgumentAxis argumentType={argumentType}>
          <Label format={periodKey === "year" ? "MM/yyyy" : "dd/MM"} />
          <Grid visible={true} opacity={0.3} />
        </ArgumentAxis>

        <ValueAxis>
          <Label format="decimal" />
          <Grid visible={true} opacity={0.3} />
        </ValueAxis>
        <Tooltip
          enabled={true}
          customizeTooltip={(info) => {
            const argumentKey =
              info.argument instanceof Date
                ? formatDateKey(info.argument)
                : info.argument;

            return {
              text: `Ngày: ${formatDate(info.argument, "medium")}<br/>
             Số hóa đơn: ${info.value}`,
            };
          }}
        />
        <Legend visible={true} />
        <Export enabled={true} />
        <Title text="Số Lượng Hóa Đơn Theo Thời Gian" />
      </Chart>
    </CardAnalytics>
  );
};

const AverageRevenueChart = ({ data }: { data: RevenueChartData[] }) => (
  <CardAnalytics title="Doanh Thu Trung Bình/Hóa Đơn" contentClass="chart-card">
    <Chart dataSource={data} height={400} palette="Ocean">
      <Animation enabled={true} duration={800} />
      <CommonSeriesSettings argumentField="date" type="stepline">
        <Border visible={true} width={2} />
      </CommonSeriesSettings>

      <Series valueField="averageAmount" name="Doanh Thu TB" color="#ff6b6b" />

      <ArgumentAxis argumentType="datetime">
        <Label format="dd/MM" />
        <Grid visible={true} opacity={0.3} />
      </ArgumentAxis>

      <ValueAxis>
        <Label>
          <Format type="currency" currency="VND" precision={0} />
        </Label>
        <Grid visible={true} opacity={0.3} />
      </ValueAxis>

      <Tooltip
        enabled={true}
        customizeTooltip={(info) => {
          const dateStr =
            info.argument instanceof Date
              ? formatDate(info.argument, "medium")
              : info.argument;

          return {
            text: `Ngày: ${dateStr}<br/>
             Doanh thu TB: ${formatCurrency(info.value)}`,
          };
        }}
      />

      <Legend visible={true} />
      <Export enabled={true} />
      <Title text="Xu Hướng Doanh Thu Trung Bình" />
    </Chart>
  </CardAnalytics>
);

export const AnalyticsDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>(DEFAULT_PERIOD);
  const [chartData, setChartData] = useState<RevenueChartData[]>([]);
  const [revenueStats, setRevenueStats] = useState<RevenueStats>({
    totalRevenue: 0,
    totalBills: 0,
    averageRevenue: 0,
    previousPeriodRevenue: 0,
    growthRate: 0,
    bestDay: "",
    bestDayRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [currentDepartmentName, setCurrentDepartmentName] = useState<string>('');

  const { isXSmall } = useScreenSize();
  const { user } = useAuth();

  const loadDepartments = useCallback(async () => {
    try {
      const result = await departmentApi.getAll();
      if (result.isOk && result.data) {
        setDepartments(result.data);
      }
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  }, []);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const fetchAnalyticsData = useCallback(async (periodKey: string, departmentId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const period = TIME_PERIODS.find((p) => p.key === periodKey);
      if (!period) throw new Error("Invalid period selected");

      let currentResult, previousResult;
      let groupedData: RevenueChartData[] = [];
      let previousBills: Bill[] = [];
      const today = new Date();

      let targetDepartmentId: string | undefined;
      if (user?.role === 'Manager') {
        targetDepartmentId = user.departmentId;
      } else if (user?.role === 'Admin') {
        targetDepartmentId = departmentId;
      }

      if (periodKey === "year") {
        const startOfThisYear = new Date(today.getFullYear(), 0, 1);
        const endOfThisYear = new Date(today.getFullYear(), 11, 31);

        const startOfLastYear = new Date(today.getFullYear() - 1, 0, 1);
        const endOfLastYear = new Date(today.getFullYear() - 1, 11, 31);

        if (targetDepartmentId) {
          const departmentResult = await billApi.getByDepartment(targetDepartmentId);
          if (departmentResult.isOk && departmentResult.data) {
            const thisYearBills = departmentResult.data.filter(bill => new Date(bill.billDate) >= startOfThisYear && new Date(bill.billDate) <= endOfThisYear);
            const lastYearBills = departmentResult.data.filter(bill => new Date(bill.billDate) >= startOfLastYear && new Date(bill.billDate) <= endOfLastYear);
            currentResult = { isOk: true, data: thisYearBills };
            previousResult = { isOk: true, data: lastYearBills };
          } else {
            currentResult = departmentResult;
            previousResult = { isOk: false, message: 'No data' };
          }
        } else {
          currentResult = await billApi.search({ timeRange: `${startOfThisYear.toISOString().split("T")[0]}/${endOfThisYear.toISOString().split("T")[0]}` });
          previousResult = await billApi.search({ timeRange: `${startOfLastYear.toISOString().split("T")[0]}/${endOfLastYear.toISOString().split("T")[0]}` });
        }
      } else {
        const endDate = new Date();
        const startDate = period.getStartDate();
        const previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - period.getDays());

        if (targetDepartmentId) {
          const departmentResult = await billApi.getByDepartment(targetDepartmentId);
          if (departmentResult.isOk && departmentResult.data) {
            const currentBills = departmentResult.data.filter(bill => new Date(bill.billDate) >= startDate && new Date(bill.billDate) <= endDate);
            const prevBills = departmentResult.data.filter(bill => new Date(bill.billDate) >= previousStartDate && new Date(bill.billDate) < startDate);
            currentResult = { isOk: true, data: currentBills };
            previousResult = { isOk: true, data: prevBills };
          } else {
            currentResult = departmentResult;
            previousResult = { isOk: false, message: 'No data' };
          }
        } else {
          currentResult = await billApi.search({ timeRange: `${startDate.toISOString().split("T")[0]}/${endDate.toISOString().split("T")[0]}` });
          previousResult = await billApi.search({ timeRange: `${previousStartDate.toISOString().split("T")[0]}/${startDate.toISOString().split("T")[0]}` });
        }
      }

      if (!currentResult.isOk || !currentResult.data) throw new Error(currentResult.message || "Failed to fetch data");
      groupedData = groupBillsByTimeUnit(currentResult.data, periodKey);
      previousBills = previousResult?.data || [];

      const stats = calculateRevenueStats(groupedData, previousBills);
      setChartData(groupedData);
      setRevenueStats(stats);
    } catch (err) {
      console.error("Analytics fetch error:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setChartData([]);
      setRevenueStats({
        totalRevenue: 0,
        totalBills: 0,
        averageRevenue: 0,
        previousPeriodRevenue: 0,
        growthRate: 0,
        bestDay: "",
        bestDayRevenue: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAnalyticsData(selectedPeriod, selectedDepartmentId || undefined);
  }, [selectedPeriod, selectedDepartmentId, fetchAnalyticsData]);

  const handlePeriodChange = useCallback((e: any) => {
    setSelectedPeriod(e.value);
  }, []);

  const handleDepartmentChange = useCallback((e: any) => {
    const newDeptId = e.value;
    setSelectedDepartmentId(newDeptId);
    const selectedDept = departments.find(dept => dept.id === newDeptId);
    setCurrentDepartmentName(selectedDept?.departmentName || '');
    fetchAnalyticsData(selectedPeriod, newDeptId);
  }, [departments, selectedPeriod, fetchAnalyticsData]);

  const handleRefresh = useCallback(() => {
    fetchAnalyticsData(selectedPeriod, selectedDepartmentId || undefined);
  }, [fetchAnalyticsData, selectedPeriod, selectedDepartmentId]);

  if (error) {
    return (
      <ScrollView className="view-wrapper-scroll">
        <div className="error-container">
          <h3>Có lỗi xảy ra</h3>
          <p>{error}</p>
          <button onClick={() => handleRefresh()}>Thử lại</button>
        </div>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="view-wrapper-scroll">
      <ToolbarAnalytics 
        title={`Dashboard Phân Tích Doanh Thu${
          currentDepartmentName
            ? ` - ${currentDepartmentName}`
            : user?.role === 'Admin' && !selectedDepartmentId
            ? ' - Tất cả phòng ban'
            : ''
        }`}
        onRefresh={handleRefresh}
        additionalToolbarContent={
          <>
            <Item location="before">
              <SelectBox
                dataSource={TIME_PERIODS}
                displayExpr="name"
                valueExpr="key"
                value={selectedPeriod}
                onValueChanged={handlePeriodChange}
                width={isXSmall ? 120 : 150}
                placeholder="Chọn khoảng thời gian"
              />
            </Item>
            {user?.role === 'Admin' && (
              <Item location="before">
                <SelectBox
                  dataSource={departments}
                  displayExpr="departmentName"
                  valueExpr="id"
                  value={selectedDepartmentId}
                  onValueChanged={handleDepartmentChange}
                  width={isXSmall ? 150 : 200}
                  showClearButton={true}
                  searchEnabled
                  placeholder="Tất cả phòng ban"
                />
              </Item>
            )}
          </>
        }
      >
        <div className="cards compact">
          <RevenueStatsCards stats={revenueStats} />
        </div>
        <div className="cards normal">
          <RevenueChart data={chartData} periodKey={selectedPeriod} />
          <BillCountChart data={chartData} periodKey={selectedPeriod} />
        </div>
        {chartData.length > 0 && (
          <div className="cards normal">
            <AverageRevenueChart data={chartData} />
            <CategoryRevenueChart departmentId={selectedDepartmentId ?? undefined} />
          </div>
        )}
      </ToolbarAnalytics>
      <LoadPanel
        container=".content"
        visible={isLoading}
        position={{ of: ".layout-body" }}
        message="Đang tải dữ liệu..."
      />
    </ScrollView>
  );
};