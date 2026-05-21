import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import './BillInfor.scss';
import provincesData from 'hanhchinhvn/dist/tinh_tp.json';
import districtsData from 'hanhchinhvn/dist/quan_huyen.json';
import communesData from 'hanhchinhvn/dist/xa_phuong.json';
import { SelectBox } from 'devextreme-react/select-box';
import { DateBox, TextBox, Validator } from 'devextreme-react';
import { EmailRule, RequiredRule, StringLengthRule } from 'devextreme-react/validator';
import { ValidationGroup } from 'devextreme-react/validation-group';

export const BillInfor = forwardRef((props, ref) => {
    const [provinces, setProvinces] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);
    const [communes, setCommunes] = useState<any[]>([]);

    const [selectedProvince, setSelectedProvince] = useState<string>('');
    const [selectedDistrict, setSelectedDistrict] = useState<string>('');
    const [selectedCommune, setSelectedCommune] = useState<string>('');
    const formRef = useRef<HTMLFormElement>(null);
    const groupRef = useRef<any>(null);

    useEffect(() => {
        const provinceList = Object.entries(provincesData).map(([code, value]: any) => ({
            code,
            name: value.name,
        }));
        setProvinces(provinceList);
    }, []);

    const handleProvinceChange = (code: string) => {
        setSelectedProvince(code);
        const filteredDistricts = Object.entries(districtsData)
            .filter(([, value]: any) => value.parent_code === code)
            .map(([code, value]: any) => ({
                code,
                name: value.name,
            }));
        setDistricts(filteredDistricts);
        setCommunes([]);
        setSelectedDistrict('');
        setSelectedCommune('');
    };

    const handleDistrictChange = (code: string) => {
        setSelectedDistrict(code);
        const filteredCommunes = Object.entries(communesData)
            .filter(([, value]: any) => value.parent_code === code)
            .map(([code, value]: any) => ({
                code,
                name: value.name,
            }));
        setCommunes(filteredCommunes);
        setSelectedCommune('');
    };
    useImperativeHandle(ref, () => ({
        validateForm: () => {
            const result = groupRef.current?.validate();
            return result?.isValid ?? false;
        }
        ,
        getCustomerData: () => {
            const form = formRef.current;
            if (!form) return {};

            const formData = new FormData(form);
            const communeName = communes.find(c => c.code === selectedCommune)?.name || '';
            const districtName = districts.find(d => d.code === selectedDistrict)?.name || '';
            const provinceName = provinces.find(p => p.code === selectedProvince)?.name || '';
            const detailAddress = formData.get("address") || '';
            return {
                email: formData.get("email")?.toString().trim(),
                firstName: formData.get("firstName")?.toString().trim(),
                lastName: formData.get("lastName")?.toString().trim(),
                phone: formData.get("phone")?.toString().trim(),
                identifyNumber: formData.get("identifyNumber")?.toString().trim(),
                address: `${detailAddress}, ${communeName}, ${districtName}, ${provinceName}`,
                note: formData.get("note"),
                items: []
            };

        },
    }));
    return (
        <div className="payment-info">
            <div>
                <h3>Thông tin nhận hàng</h3>
                <ValidationGroup onInitialized={(e) => {
                    groupRef.current = e.component;
                }}>
                    <form ref={formRef} className="payment-form">
                        <TextBox name="email" mode='email' placeholder="Email">
                            <Validator>
                                <RequiredRule message="Email không được để trống" />
                                <EmailRule message="Email không đúng định dạng" />
                            </Validator>
                        </TextBox>
                        <TextBox name="firstName" mode='text' placeholder="Họ">
                            <Validator>
                                <RequiredRule message="Họ không được để trống" />
                                <StringLengthRule min={1} max={50} message="Họ tối đa 50 ký tự" />
                            </Validator>
                        </TextBox>
                        <TextBox name="lastName" mode='text' placeholder="Tên">
                            <Validator>
                                <RequiredRule message="Tên không được để trống" />
                                <StringLengthRule min={1} max={50} message="Tên tối đa 50 ký tự" />
                            </Validator>
                        </TextBox>
                        <TextBox name="identifyNumber" mode='tel' placeholder="CCCD/CMT">
                            <Validator>
                                <RequiredRule message="CCCD/CMT không được để trống" />
                                <StringLengthRule min={9} max={12} message="CCCD/CMT phải từ 9 đến 12 ký tự" />
                            </Validator>
                        </TextBox>
                        <TextBox name="phone" mode='tel' placeholder="Số điện thoại">
                            <Validator>
                                <RequiredRule message="Số điện thoại không được để trống" />
                                <StringLengthRule min={10} max={11} message="Số điện thoại phải từ 10 đến 11 số" />
                            </Validator>
                        </TextBox>
                        <TextBox name="address" mode='text' placeholder="Địa chỉ chi tiết">
                            <Validator>
                                <RequiredRule message="Địa chỉ chi tiết không được để trống" />
                                <StringLengthRule min={1} max={200} message="Địa chỉ chi tiết phải tối đa 200 ký tự" />
                            </Validator>
                        </TextBox>
                        <SelectBox
                            items={provinces}
                            displayExpr="name"
                            valueExpr="code"
                            value={selectedProvince}
                            onValueChanged={(e) => handleProvinceChange(e.value)}
                            placeholder="Chọn Tỉnh/Thành"
                            showClearButton
                            className='select-box'
                        />

                        <SelectBox
                            items={districts}
                            displayExpr="name"
                            valueExpr="code"
                            value={selectedDistrict}
                            onValueChanged={(e) => handleDistrictChange(e.value)}
                            placeholder="Chọn Quận/Huyện"
                            showClearButton
                            disabled={!selectedProvince} className='select-box'
                        />

                        <SelectBox
                            items={communes}
                            displayExpr="name"
                            valueExpr="code"
                            value={selectedCommune}
                            onValueChanged={(e) => setSelectedCommune(e.value)}
                            placeholder="Chọn Phường/Xã"
                            showClearButton
                            disabled={!selectedDistrict} className='select-box'
                        />

                        <textarea name='note' placeholder="Ghi chú (tùy chọn)"></textarea>
                    </form>    </ValidationGroup></div>

            <div>
                <h3>Vận chuyển</h3>
                <div className="shipping-info">
                    <span>Vui lòng nhập thông tin giao hàng</span>
                </div>

                <h3>Thanh toán</h3>
                <div className="payment-method">
                    <label>
                        <input type="radio" name="payment" defaultChecked />
                        Thanh toán khi giao hàng (COD)
                    </label>
                </div>
            </div>

        </div>
    );
});
