import { useState, useEffect, useRef, useCallback } from "react";
import {
  DataGrid,
  DataGridRef,
  Sorting,
  Selection,
  HeaderFilter,
  Scrolling,
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
import TextBox from "devextreme-react/text-box";
import notify from "devextreme/ui/notify";

import "./department-list.scss";
import { departmentApi } from "../../api/department";
import { Department } from "../../types/department";
import { FormPopup } from "../../components";
import { DepartmentNewForm } from "../../components/library/department-new-form copy/DepartmentNewForm";


const exportFormats = ["xlsx", "pdf"];

const onExporting = (e: DataGridTypes.ExportingEvent) => {
  if (e.format === "pdf") {
    const doc = new JsPdf();
    exportDataGridToPdf({
      jsPDFDocument: doc,
      component: e.component,
    }).then(() => doc.save("Companies.pdf"));  
  } else {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("Companies");  
    exportDataGridToXLSX({
      component: e.component,
      worksheet,
      autoFilterEnabled: true,
    }).then(() => {
      workbook.xlsx.writeBuffer().then((buffer) => {
        saveAs(new Blob([buffer], { type: "application/octet-stream" }), "Companies.xlsx");  
      });
    });
    e.cancel = true;
  }
};

export const DepartmentList = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);

  const gridRef = useRef<DataGridRef>(null);

  const loadDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await departmentApi.getAll();
      if (res.isOk && res.data) setDepartments(res.data);
      else notify("Không thể tải danh sách công ty", "error", 3000);  
    } catch (err) {
      console.error(err);
      notify("Lỗi khi tải dữ liệu", "error", 3000);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    loadDepartments();
  }, [loadDepartments]);

  const search = useCallback((e: any) => {
    const text = e.component.option("text") ?? "";
    gridRef.current?.instance().searchByText(text);
  }, []);

  const showColumnChooser = useCallback(() => {
    gridRef.current?.instance().showColumnChooser();
  }, []);

  const changePopupVisibility = useCallback((visible: boolean) => {
    setPopupVisible(visible);
  }, []);

  const onAddDepartmentClick = useCallback(() => {
    setPopupVisible(true);
  }, []);

  const onSaveClick = useCallback(async (data: Partial<Department>) => {
    try {
      const res = await departmentApi.create(data);
      if (res.isOk && res.data) {
        const newDepartment = res.data;
        setDepartments((prev) => [...prev, newDepartment]);
        notify("Thêm công ty thành công", "success", 3000);  
        setPopupVisible(false);
      } else {
        notify(`Thêm thất bại: ${res.message}`, "error", 3000);
      }
    } catch (err) {
      console.error(err);
      notify("Lỗi khi thêm công ty", "error", 3000);  
    }
  }, []);

  return (
    <div className="view department-list">
      <div className="view-department-list">
        <LoadPanel
          enabled={loading}
          showIndicator
          showPane
          shadingColor="rgba(0, 0, 0, 0.4)"
        />

        {!loading && (
          <div className="grid theme-dependent">
            <DataGrid
              dataSource={departments}
              height="auto"
              width="100%"
              noDataText="Không có công ty nào"  
              keyExpr="id"
              showBorders
              allowColumnReordering
              onExporting={onExporting}
              ref={gridRef}
            >
              <ColumnChooser enabled />
              <Export enabled allowExportSelectedData formats={exportFormats} />
              <Selection mode="multiple" showCheckBoxesMode="always" selectAllMode="allPages" />
              <HeaderFilter visible />
              <Sorting mode="multiple" />
              <Scrolling mode="virtual" />
              <Paging defaultPageSize={10} />
              <Pager visible showPageSizeSelector allowedPageSizes={[5, 10, 20, 50]} showInfo />

              <Toolbar>
                <Item location="before">
                  <div className="grid-header" style={{ fontSize: "19px", fontWeight: "bold" }}>
                    Danh sách công ty {/*  */}
                  </div>
                </Item>
                <Item location="after" widget="dxButton">
                  <Button icon="plus" text="Thêm công ty" type="default" stylingMode="contained" onClick={onAddDepartmentClick} />
                </Item>
                <Item location="after" widget="dxButton">
                  <Button icon="refresh" text="Làm mới" stylingMode="text" onClick={refresh} disabled={isRefreshing} />
                </Item>
                <Item location="after" widget="dxButton">
                  <Button icon="columnchooser" text="Chọn cột" stylingMode="text" onClick={showColumnChooser} />
                </Item>
                <Item location="after">
                  <div className="separator" />
                </Item>
                <Item name="exportButton" />
                <Item location="after" widget="dxTextBox">
                  <TextBox mode="search" placeholder="Tìm kiếm" onInput={search} />
                </Item>
              </Toolbar>

              <Column caption="Tên công ty" dataField="departmentName" minWidth={150} /> {/*  */}
              <Column caption="Mô tả" dataField="description" minWidth={200} />
              <Column
                caption="Chức vụ"
                dataField="position"
                cellRender={({ data }) => data.position?.join(", ") ?? ""}
                minWidth={150}
              />
              <Column
                caption="Số lượng nhân viên"
                calculateCellValue={(data: Department) => data.user?.length || 0}
                minWidth={150}
              />
            </DataGrid>
          </div>
        )}

        <FormPopup
          title="Thêm công ty"  
          visible={popupVisible}
          setVisible={changePopupVisibility}
          hideSaveButton
        >
          {popupVisible && (
            <DepartmentNewForm
              initData={{ departmentName: "", position: [], description: "", user: [] }}
              onDataChanged={onSaveClick}
            />
          )}
        </FormPopup>
      </div>
    </div>
  );
};
