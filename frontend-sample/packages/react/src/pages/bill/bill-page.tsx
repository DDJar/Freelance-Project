import React, { useEffect, useRef, useState } from 'react';
import { Popup } from 'devextreme-react/popup';
import { BillInfor } from '../../components/library/bill/bill-infor/BillInfor';
import { BillOrder } from '../../components/library/bill/bill-order/BillOrder';
import './bill-page.scss';
import { Button } from 'devextreme-react';
import { BillItem } from '../../types/bill';
import { billApi } from '../../api/bill';
import { getWithExpiry, setWithExpiry } from '../../utils/loading-items';
import { productApi } from '../../api/product';
import { Product } from '../../types/product';
import { billItemsApi } from '../../api/billItems';
export const BillPage = () => {
    const [billOrder, setBillOrder] = useState<any>(null);
    const [grandTotal, setGrandTotal] = useState(0);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const billInforRef = useRef<any>(null);
    const [showWarning, setShowWarning] = useState(false);
    const [showLoading, setShowLoading] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [missingFields, setMissingFields] = useState<string[]>([]);

    useEffect(() => {
        const stored = getWithExpiry('billOrder');
        if (stored) {
            setBillOrder(stored);
        }
    }, []);
    const handlePlaceOrder = () => {


        const customer = billInforRef.current?.getCustomerData?.();

        if (
            !customer.email &&
            !customer.firstName &&
            !customer.lastName &&
            !customer.address &&
            !customer.identifyNumber
        ) {
            const missing: string[] = [];

            missing.push("Vui lòng nhập đầy đủ thông tin khách hàng trước khi đặt hàng.");

            setMissingFields(missing);
            setShowWarning(true);
            return;
        }
        const isValid = billInforRef.current?.validateForm?.();
        if (!isValid) {
            const customer = billInforRef.current?.getCustomerData?.();
            const missing: string[] = [];
            if (!customer.email) missing.push("Email");
            if (!customer.firstName) missing.push("Họ");
            if (!customer.lastName) missing.push("Tên");
            if (customer.address === ", , , ") missing.push("Địa chỉ");
            if (!customer.identifyNumber) missing.push("CCCD/CMT");

            setMissingFields(missing);
            setShowWarning(true);
            return;
        }
        setMissingFields([]);
        setShowConfirm(true);
    };


    const confirmPlaceOrder = async () => {
        if (showLoading) return;
        setShowLoading(true);

        try {
            const customer = billInforRef.current?.getCustomerData?.();
            if (!customer) {
                setErrorMessage("Không tìm thấy thông tin khách hàng.");
                return;
            }

            const items = billOrder.items.map((item: BillItem) => ({
                id: item.id || null,
                productId: item.productId,
                quantity: item.quantity,
                total: item.total,
            }));

            const dataCustomer = {
                email: customer.email,
                firstName: customer.firstName,
                lastName: customer.lastName,
                phone: customer.phone,
                address: customer.address,
                notes: customer.note,
                status: "Thành công",
                paymentMethod: "Tiền mặt",
                identifyNumber: customer.identifyNumber,
                totalAmount: grandTotal,
            };

            const latestProductsRes = await productApi.getAll();
            if (!latestProductsRes.isOk || !latestProductsRes.data) {
                handShowError("Không thể tải danh sách sản phẩm.");
                return;
            }

            const productMap = new Map<string, Product>(
                latestProductsRes.data.map((p) => [p.id, p])
            );
            const outOfStockItem = billOrder.items.find((item) => {
                const product = productMap.get(item.productId);
                return !product || product.quantity === 0;
            });

            if (outOfStockItem) {
                handShowError(`Sản phẩm "${outOfStockItem.name}" đã hết hàng. Đơn hàng bị hủy.`);
                clearCart();
                return;
            }

            const billRes = await billApi.create(dataCustomer);
            if (!billRes.isOk || !billRes.data?.id) {
                handShowError("Không thể tạo hóa đơn. Vui lòng thử lại sau.");
                return;
            }

            const billItemsRes = await billApi.updateBillItemByBillId(
                billRes.data.id,
                items
            );
            if (!billItemsRes.isOk) {
                await rollbackBill(billRes.data.id, items);
                handShowError("Không thể cập nhật danh sách sản phẩm.");
                return;
            }

            await billApi.sendNotify({
                toEmail: customer.email,
                customerName: `${customer.firstName} ${customer.lastName}`,
                orderDetails: billRes.data.id.trim(),
            });

            clearCart();
            setShowConfirm(false);
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                window.location.href = "/products";
            }, 2000);

        } catch (error) {
            console.error("Lỗi khi đặt hàng:", error);
            handShowError("Đã xảy ra lỗi. Vui lòng thử lại.");
        } finally {
            setShowLoading(false);
        }
    };

    const handShowError = (message: string) => {
        setErrorMessage(message);
        setShowError(true);
    };

    const clearCart = () => {
        localStorage.removeItem("billOrder");
        setWithExpiry("cartItems", []);
    };

    const rollbackBill = async (billId: string, items: BillItem[]) => {
        await billApi.deleteBill(billId);
        for (const item of items) {
            if (item.id) {
                try {
                    await billItemsApi.delete(item.id);
                } catch (err) {
                    console.error(`Lỗi khi xóa BillItem với ID: ${item.id}`, err);
                }
            }
        }
        clearCart();
    };


    const cancelPlaceOrder = () => {
        setShowConfirm(false);
    };


    if (!billOrder) return <div className="payment-page">Không có đơn hàng để thanh toán.</div>;

    return (
        <div className="payment-page">
            <h2>Xác nhận đơn hàng</h2>
            <div className="payment-container">
                <BillInfor ref={billInforRef} />
                <BillOrder
                    cartItems={billOrder.items}
                    total={billOrder.total}
                    handlePlaceOrder={handlePlaceOrder}
                    onTotalChange={setGrandTotal}
                />
            </div>
            <Popup
                visible={showLoading}
                showCloseButton={false}
                showTitle={false}
                dragEnabled={false}
                hideOnOutsideClick={false}
                width={200}
                height={150}
            >
                <div className="modal-content ">
                    <div className='loading'>
                        <p>Đang xử lý đơn hàng...</p>
                        <div className="loader"></div>
                    </div>
                </div>
            </Popup>
            <Popup
                visible={showConfirm}
                onHiding={() => setShowConfirm(false)}
                showCloseButton={false}
                showTitle={false}
                dragEnabled={false}
                width={350}
                height={180}
            >
                <div className="modal-content">
                    <h3>Bạn có chắc chắn muốn đặt hàng?</h3>
                    <div className="modal-actions">
                        <Button
                            text="Đồng ý"
                            type="success"
                            stylingMode="contained"
                            onClick={confirmPlaceOrder}
                            disabled={showLoading}
                        />
                        <Button
                            text="Hủy bỏ"
                            type="normal"
                            stylingMode="outlined"
                            onClick={cancelPlaceOrder}
                            disabled={showLoading}
                        />
                    </div>
                </div>
            </Popup>

            <Popup
                visible={showSuccess}
                onHiding={() => setShowSuccess(false)}
                showCloseButton={false}
                showTitle={false}
                dragEnabled={false}
                width={300}
                height={180}
            >
                <div className="modal-content">
                    <h3 className="modal-content__success">✅ Đặt hàng thành công</h3>
                    <p>Đang chuyển về trang sản phẩm...</p>
                    <div className="loader"></div>
                </div>
            </Popup>
            <Popup
                visible={showWarning}
                onHiding={() => setShowWarning(false)}
                showCloseButton={true}
                showTitle={false}
                dragEnabled={false}
                width={300}
                height={220}
            >
                <div className="modal-content">
                    <h3 className="modal-content__warning">⚠ Thiếu thông tin</h3>

                    {missingFields.length > 0 ? (
                        <>
                            <p>Vui lòng điền đầy đủ các trường sau:</p>
                            <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                                {missingFields.map((field, index) => (
                                    <li key={index} style={{ color: '#e67e22' }}>{field}</li>
                                ))}
                            </ul>
                        </>
                    ) : (
                        <p>Vui lòng nhập đầy đủ thông tin khách hàng trước khi đặt hàng.</p>
                    )}
                </div>
                <Button
                    text="Đóng"
                    type="normal"
                    stylingMode="outlined"
                    onClick={() => setShowWarning(false)}
                />
            </Popup>

            <Popup
                visible={showError}
                onHiding={() => {
                    setShowError(false);
                    window.location.href = '/products';
                }}
                showCloseButton={true}
                showTitle={false}
                dragEnabled={false}
                width={350}
                height={240}
            >
                <div className="modal-content">
                    <h3 className="modal-content__error">Đặt hàng thất bại</h3>
                    <p style={{ color: '#c0392b' }}>{errorMessage || 'Đã xảy ra lỗi khi xử lý đơn hàng.'}</p>
                    <div style={{ marginTop: 16, textAlign: 'right' }}>
                        <Button
                            text="Đóng"
                            type="normal"
                            stylingMode="outlined"
                            onClick={() => setShowError(false)}
                        />
                    </div>
                </div>
            </Popup>
        </div>
    );
};