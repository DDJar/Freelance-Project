import React, { useState } from "react";
import "./OrderLookupPage.scss";
import { billApi } from "../../api/bill";
import { useNavigate } from "react-router-dom";

const OrderLookupPage: React.FC = () => {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await billApi.lookupBill(emailOrPhone, orderCode);
      setLoading(false);

      if (result.isOk && result.data) {
        // Chuyển trang và truyền dữ liệu đơn hàng qua navigate
        navigate(`/order/${result.data.id}`, { state: { bill: result.data } });
      } else {
        setError(result.message || "Không tìm thấy đơn hàng");
      }
    } catch (err) {
      setLoading(false);
      setError("Đã xảy ra lỗi trong quá trình tra cứu.");
    }
  };

  return (
    <div className="lookup-container dark-theme">
      <div className="lookup-left">
        <img
          src="/assets/lookup-banner.jpg"
          alt="Order Lookup"
          className="lookup-image"
        />
      </div>

      <div className="lookup-right">
        <h2 className="lookup-title">TRA CỨU ĐƠN HÀNG</h2>

        <form className="lookup-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              Email hoặc SĐT <span>*</span>
            </label>
            <input
              type="text"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              placeholder="Nhập email hoặc số điện thoại"
              required
            />
          </div>

          <div className="form-group">
            <label>
              Mã đơn hàng <span>*</span>
            </label>
            <input
              type="text"
              value={orderCode}
              onChange={(e) => setOrderCode(e.target.value)}
              placeholder="Nhập mã đơn hàng"
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Đang kiểm tra..." : "KIỂM TRA"}
          </button>

          {/* Hiển thị lỗi nếu có */}
          {error && <div className="error-message">{error}</div>}
        </form>
      </div>
    </div>
  );
};

export default OrderLookupPage;
