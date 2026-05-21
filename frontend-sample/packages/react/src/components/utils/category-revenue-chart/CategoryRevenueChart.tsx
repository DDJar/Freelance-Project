import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Chart,
  Series,
  ArgumentAxis,
  ValueAxis,
  Legend,
  Tooltip,
  Animation,
  Export,
  Format,
  Label,
} from "devextreme-react/chart";
import type dxChart from "devextreme/viz/chart";

import { billApi } from "../../../api/bill";
import { transformBillsToCategoryRevenue } from "../../../types/bill";
import { formatCurrency } from "../../../utils/format-currency";
import { CardAnalytics } from "../../library/card-analytics/CardAnalytics";

interface Props {
  departmentId?: string;
}

export const CategoryRevenueChart: React.FC<Props> = ({ departmentId }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chartRef = useRef<dxChart | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = departmentId
        ? await billApi.getByDepartment(departmentId)
        : await billApi.getAll();

      if (res.isOk && res.data) {
        const transformed = transformBillsToCategoryRevenue(res.data);
        setData(transformed);
      } else {
        setData([]);
        setError(res.message || "Không thể tải dữ liệu");
      }
    } catch (err) {
      console.error("Error fetching category revenue data:", err);
      setError("Có lỗi xảy ra khi tải dữ liệu");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [departmentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ padding: "20px", textAlign: "center" }}>
          Đang tải dữ liệu...
        </div>
      );
    }

    if (error) {
      return (
        <div style={{ padding: "20px", textAlign: "center", color: "red" }}>
          <div>Lỗi: {error}</div>
          <button onClick={fetchData} style={{ marginTop: "10px" }}>
            Thử lại
          </button>
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div style={{ padding: "20px", textAlign: "center" }}>
          Không có dữ liệu
        </div>
      );
    }

    const categories =
      data.length > 0
        ? Object.keys(data[0]).filter((key) => key !== "month")
        : [];

    if (categories.length === 0) {
      return (
        <div style={{ padding: "20px", textAlign: "center" }}>
          Không có dữ liệu category
        </div>
      );
    }

    return (
      <Chart
        dataSource={data}
        id={`category-revenue-chart-${departmentId ?? "all"}`}
        palette="Soft Pastel"
        height={400}
        onInitialized={(e) => {
          chartRef.current = e.component ?? null;
        }}
      >
        <Animation enabled duration={1000} />
        <ArgumentAxis argumentType="string" title="Tháng" />
        <ValueAxis title="Doanh thu">
          <Label>
            <Format type="currency" currency="VND" precision={0} />
          </Label>
        </ValueAxis>

        {categories.map((cat) => (
          <Series
            key={`${cat}-${departmentId ?? "all"}`}
            valueField={cat}
            name={cat}
            argumentField="month"
            type="stackedbar"
          />
        ))}

        <Legend verticalAlignment="bottom" horizontalAlignment="center" />
        <Tooltip
          enabled
          customizeTooltip={(info) => ({
            text: `${info.seriesName}: ${formatCurrency(info.value)}<br/>Tháng: ${info.argument}`,
          })}
        />
        <Export enabled />
      </Chart>
    );
  };

  return (
    <CardAnalytics
      title="Doanh thu theo Category (theo tháng)"
      contentClass="chart-card"
      isLoading={loading}
    >
      {renderContent()}
    </CardAnalytics>
  );
};
