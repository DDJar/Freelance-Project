import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { productApi } from "../../api/product";
import "./OrderDetailPage.scss";

interface BillItem {
  productId: string;
  quantity: number;
  price: number;
  total: number;
}

const OrderDetailPage: React.FC = () => {
  const location = useLocation();
  const bill = location.state?.bill;
  const [detailedItems, setDetailedItems] = useState<any[]>([]);

  useEffect(() => {
    if (!bill || !bill.items) return;

    const fetchProductDetails = async () => {
      try {
        const products = await Promise.all(
          bill.items.map(async (item: BillItem) => {
            const res = await productApi.getById(item.productId);
            if (res.isOk && res.data) {
              return {
                ...item,
                productName: res.data.name,
                imageUrl: res.data.imageUrl,
              };
            }
            return { ...item, productName: "Không xác định", imageUrl: "" };
          })
        );
        setDetailedItems(products);
      } catch (err) {
        console.error("Lỗi khi lấy thông tin sản phẩm:", err);
      }
    };

    fetchProductDetails();
  }, [bill]);

  if (!bill) {
    return <div>Không có dữ liệu đơn hàng. Vui lòng tra cứu lại.</div>;
  }

  return (
    <div className="order-detail-page">
      <div className="order-content">
        {/* LEFT: 60% danh sách sản phẩm */}
        <div className="order-left">
          <h3>Sản phẩm trong đơn hàng</h3>
          <table className="product-table">
            <thead>
              <tr>
                <th>Thông tin sản phẩm</th>
                <th>Đơn giá</th>
                <th>Số lượng</th>
                <th>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {detailedItems.map((item, index) => (
                <tr key={index}>
                  <td className="product-info">
                    <img src={item.imageUrl} alt={item.productName} />
                    <span>{item.productName}</span>
                  </td>
                  <td>{item.price.toLocaleString()} ₫</td>
                  <td>{item.quantity}</td>
                  <td>{item.total.toLocaleString()} ₫</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="total-amount">
            <strong>Tổng tiền: </strong>
            {bill.totalAmount.toLocaleString()} ₫
          </div>
        </div>

        {/* RIGHT: 40% thông tin đơn hàng */}
        <div className="order-right">
          <h3>Thông tin đơn hàng</h3>
          <div className="order-info">
            <p><strong>Mã đơn:</strong> {bill.id}</p>
            <p><strong>Khách hàng:</strong> {bill.lastName} {bill.firstName}</p>
            <p><strong>SĐT:</strong> {bill.phone}</p>
            <p><strong>Email:</strong> {bill.email}</p>
            <p><strong>Địa chỉ:</strong> {bill.address}</p>
            <p><strong>Ngày đặt:</strong> {new Date(bill.billDate).toLocaleDateString("vi-VN")}</p>
            <p><strong>Thanh toán:</strong> {bill.paymentMethod}</p>
            <p><strong>Trạng thái:</strong> {bill.status}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
