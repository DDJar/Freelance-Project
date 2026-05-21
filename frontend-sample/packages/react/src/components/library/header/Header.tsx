import React, { useEffect, useState } from "react";
import { Toolbar, Item } from "devextreme-react/toolbar";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { DropDownButton } from "devextreme-react";
import "./Header.scss";
import { getWithExpiry } from "../../../utils/loading-items";

export const Header = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [cartItems, setCartItems] = useState<any[]>([]);

    const menuItems = [
        { label: "Trang chủ", to: "/home" },
        { label: "Giới thiệu", to: "/about" },
        { label: "Sản phẩm", to: "/products" },
        { label: "Tra cứu đơn hàng", to: "/order" },
    ];

    useEffect(() => {
        const resizeListener = () => {
            const isNowMobile = window.innerWidth <= 768;
            setIsMobile(isNowMobile);
            if (!isNowMobile) {
                setIsMobileMenuOpen(false);
            }
        };
        window.addEventListener("resize", resizeListener);
        return () => window.removeEventListener("resize", resizeListener);
    }, []);

    useEffect(() => {
        const stored = getWithExpiry("cartItems") || "[]";
        setCartItems(stored);
    }, []);

    return (
        <div className="header-home">
            <div className="header-container">
                <div className="header-left">
                    <Link to="/" className="logo">
                        <img src="/assets/logo.png" alt="ND Construction" />
                    </Link>
                </div>

                <div className="header-right">
                    <Toolbar className="toolbar">
                        {isMobile && (
                            <Item location="before" cssClass="mobile-toggle">
                                <i
                                    className="dx-icon-menu"
                                    onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                                />
                            </Item>
                        )}

                        {!isMobile && (
                            <Item location="center">
                                <div className="menu-container">
                                    {menuItems.map((item, idx) => (
                                        <Link
                                            key={idx}
                                            to={item.to}
                                            className={`navLink ${location.pathname === item.to ? "active" : ""
                                                }`}
                                        >
                                            {item.label}
                                        </Link>
                                    ))}
                                </div>
                            </Item>
                        )}

                        <Item location="after">
                            <Link to="/cart" className="cartButton">
                                <i className="dx-icon-cart" />
                                <span>Giỏ hàng</span>
                                <span className="cartBadge">{cartItems.length}</span>
                            </Link>
                        </Item>
                        <Item location="after">
                            <Link to="/login" className="login-button">
                                <span>Đăng nhập</span>
                            </Link>
                        </Item>
                    </Toolbar>

                    {isMobile && isMobileMenuOpen && (
                        <div className="menu-container mobile">
                            {menuItems.map((item, idx) => (
                                <Link
                                    key={idx}
                                    to={item.to}
                                    className={`navLink ${location.pathname === item.to ? "active" : ""
                                        }`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
