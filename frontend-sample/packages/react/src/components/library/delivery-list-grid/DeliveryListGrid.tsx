import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import {
  DataGrid,
  DataGridRef,
  Column,
  Selection,
  Sorting,
  HeaderFilter,
  DataGridTypes,
  RequiredRule,
  Paging,
  Pager,
  Editing,
  Scrolling,
  LoadPanel,
} from "devextreme-react/data-grid";
import notify from "devextreme/ui/notify";

import { Delivery } from "../../../types/delivery";
import { deliveryApi } from "../../../api/delivery"; // 🛠️ bạn cần tạo file API tương ứng

import "./DeliveryListGrid.scss";

let useNavigation = true;

// Props cho component
interface DeliveryListGridProps {
  dataSource: Delivery[];
  onDataChanged?: () => void;
}

export const DeliveryListGrid = React.forwardRef<
  DataGridRef,
  DeliveryListGridProps
>(({ dataSource, onDataChanged }, ref) => {
  const [data, setData] = useState<Delivery[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setData(dataSource.filter((d) => d.status && d.deliveryDate));
  }, [dataSource]);

  const navigateToDetails = useCallback(
    ({ rowType, data }: DataGridTypes.RowClickEvent) => {
      if (useNavigation && rowType !== "detailAdaptive" && data.id) {
        navigate(`/delivery-details/${data.id}`);
      }
    },
    [navigate]
  );

  const toggleUseNavigation = useCallback(() => {
    useNavigation = !useNavigation;
  }, []);

  const onRowRemoving = useCallback(
    async (e: DataGridTypes.RowRemovingEvent) => {
      e.cancel = true;
      const id = e.data.id;

      try {
        const result = await deliveryApi.delete(id);
        if (result.isOk) {
          notify(`Xóa đơn giao hàng thành công`, "success", 3000);
          onDataChanged?.();
        } else {
          notify(`Xóa thất bại: ${result.message}`, "error", 3000);
        }
      } catch (error) {
        notify("Có lỗi khi xóa", "error", 3000);
      }
    },
    [onDataChanged]
  );

  const onRowUpdating = useCallback(
    async (e: DataGridTypes.RowUpdatingEvent) => {
      e.cancel = true;
      const updatedData = { ...e.oldData, ...e.newData };

      try {
        const result = await deliveryApi.update(updatedData.id, updatedData);
        if (result.isOk) {
          notify("Cập nhật thành công", "success", 3000);
          onDataChanged?.();
        } else {
          notify(`Cập nhật thất bại: ${result.message}`, "error", 3000);
        }
      } catch (error) {
        notify("Có lỗi khi cập nhật", "error", 3000);
      }
    },
    [onDataChanged]
  );
  return (
    <DataGrid
      className="delivery-grid theme-dependent"
      ref={ref}
      dataSource={data}
      columnAutoWidth
      hoverStateEnabled
      showBorders
      height={56 * 10}
      onEditingStart={toggleUseNavigation}
      onEditCanceled={toggleUseNavigation}
      onSaved={toggleUseNavigation}
      onRowClick={navigateToDetails}
      onRowRemoving={onRowRemoving}
      onRowUpdating={onRowUpdating}
    >
      <LoadPanel enabled={false} />
      <Scrolling mode="virtual" />
      <Paging defaultPageSize={15} />
      <Pager visible showPageSizeSelector />
      <Editing mode="row" allowUpdating allowDeleting />
      <Selection mode="multiple" selectAllMode="allPages" showCheckBoxesMode="always" />
      <HeaderFilter visible />
      <Sorting mode="multiple" />

      <Column dataField="billId" caption="Mã hóa đơn">
        <RequiredRule />
      </Column>
      <Column
        dataField="deliveryDate"
        caption="Ngày giao"
        dataType="date"
        format="dd/MM/yyyy"
        editorOptions={{
          displayFormat: "dd/MM/yyyy",
        }}
      >
        <RequiredRule />
      </Column>

      <Column
        dataField="deliveredBy"
        caption="Người giao"
      >
        <RequiredRule />
      </Column>
      <Column
        dataField="recipient"
        caption="Người nhận"
      >
        <RequiredRule />
      </Column>
      <Column
        dataField="status"
        caption="Trạng thái"
      >
        <RequiredRule />
      </Column>
      <Column
        dataField="notes"
        caption="Ghi chú"
        hidingPriority={1}
      />
    </DataGrid>
  );
});
