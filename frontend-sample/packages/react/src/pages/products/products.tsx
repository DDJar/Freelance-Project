// ProductCatalog.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { Product } from '../../types/product';
import {
    CheckBox,
    SelectBox,
    Pagination,
    Button
} from 'devextreme-react';
import './products.scss';
import { ProductCard } from '../../components/library/product-cart/ProductCard';
import { productApi } from '../../api/product';
import { useNavigate } from 'react-router-dom';
import { billItemsApi } from '../../api/billItems';
import { getWithExpiry, setWithExpiry } from '../../utils/loading-items';

const PAGE_SIZES = [9];
const categoriesAccessory = ["Rotin thước lái", "Rotin cân bằng", "Ron suppap", "Mobin đánh lửa", "Cảm biến ABS", "Bơm nước", "Lá col", "Bạc đạn "];
const categoriesSpareParts = ["Lọc gió động cơ", "Lọc gió máy lạnh", "Lọc nhớt hộp số", "Lọc nhớt", "Lọc nhiên liệu", "Phụ tùng gầm", "Phụ tùng phanh", "Nắp két nước"];
const categoriesAdditives = ["Nước làm mát", "Dầu hộp số"];
const priceRanges = [
    { label: "Dưới 500.000đ", min: 0, max: 500000 },
    { label: "500.000đ - 2.000.000đ", min: 500000, max: 2000000 },
    { label: "Trên 2.000.000đ", min: 2000000, max: 10000000000 }
];

export const Products = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategoriesAccessory, setSelectedCategoriesAccessory] = useState<string[]>([]);
    const [selectedCategoriesSpareParts, setSelectedCategoriesSpareParts] = useState<string[]>([]);
    const [selectedCategoriesAdditives, setSelectedCategoriesAdditives] = useState<string[]>([]);
    const [selectedPriceRanges, setSelectedPriceRanges] = useState<number[]>([]);
    const [sortOption, setSortOption] = useState<string>('default');
    const [pageIndex, setPageIndex] = useState(1);
    const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);
    const [showCategoryAccessory, setShowCategoryAccessory] = useState(false);
    const [showCategorySpareParts, setShowCategorySpareParts] = useState(false);
    const [showCategoryAdditives, setShowCategoryAdditives] = useState(false);
    const [showPrice, setShowPrice] = useState(false);
    const navigate = useNavigate();

    const sortOptions = [
        { text: 'Mặc định', value: 'default' },
        { text: 'Giá tăng dần', value: 'price-asc' },
        { text: 'Giá giảm dần', value: 'price-desc' }
    ];

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const productRes = await productApi.getAll();
            if (productRes.isOk && productRes.data) {
                setProducts(productRes.data);
            }
        } catch (error) {
            console.error("Error loading products:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Chuẩn hóa selected categories (trim + lowercase)
    const allSelectedCategories = [
        ...selectedCategoriesAccessory,
        ...selectedCategoriesSpareParts,
        ...selectedCategoriesAdditives
    ].map(c => c.trim().toLowerCase());

    // Filter products theo category và price
    const filteredProducts = products.filter(product => {
        // product.category có thể là string hoặc array string
        const productCategories = Array.isArray(product.category)
            ? product.category.map(c => c.trim().toLowerCase())
            : [product.category?.trim().toLowerCase() || ''];

        const categoryMatch = allSelectedCategories.length > 0
            ? productCategories.some(pc => allSelectedCategories.includes(pc))
            : true;

        const priceMatch = selectedPriceRanges.length === 0
            || selectedPriceRanges.some(rangeIndex => {
                const range = priceRanges[rangeIndex];
                return product.price !== null
                    && product.price >= range.min
                    && product.price <= range.max;
            });

        return categoryMatch && priceMatch;
    });

    const filteredAndSortedProducts = [...filteredProducts].sort((a, b) => {
        if (sortOption === 'price-asc') {
            return (a.price ?? Infinity) - (b.price ?? Infinity);
        } else if (sortOption === 'price-desc') {
            return (b.price ?? 0) - (a.price ?? 0);
        }
        return 0;
    });

    const startIndex = (pageIndex - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filteredAndSortedProducts.length);
    const currentProducts = filteredAndSortedProducts.slice(startIndex, endIndex);

    const handleCategoryChange = (category: string, checked: boolean) => {
        setSelectedCategoriesAccessory(prev =>
            checked ? [...prev, category] : prev.filter(c => c !== category));
        setPageIndex(1);
    };
    const handleCategorySparePartsChange = (category: string, checked: boolean) => {
        setSelectedCategoriesSpareParts(prev =>
            checked ? [...prev, category] : prev.filter(c => c !== category));
        setPageIndex(1);
    };
    const handleCategoryAdditivesChange = (category: string, checked: boolean) => {
        setSelectedCategoriesAdditives(prev =>
            checked ? [...prev, category] : prev.filter(c => c !== category));
        setPageIndex(1);
    };
    const handlePriceRangeChange = (rangeIndex: number, checked: boolean) => {
        setSelectedPriceRanges(prev =>
            checked ? [...prev, rangeIndex] : prev.filter(r => r !== rangeIndex));
        setPageIndex(1);
    };
    const clearFilters = () => {
        setSelectedCategoriesAccessory([]);
        setSelectedCategoriesAdditives([]);
        setSelectedCategoriesSpareParts([]);
        setSelectedPriceRanges([]);
        setPageIndex(1);
    };

    const addToCart = async (product: Product) => {
        const existingCart = getWithExpiry('cartItems') || [];
        const updatedCart = [...existingCart];
        const index = updatedCart.findIndex((item: any) => item.productId === product.id);
        if (index !== -1) {
            updatedCart[index].quantity += 1;
            updatedCart[index].total = updatedCart[index].quantity * updatedCart[index].price;

            const updateRes = await billItemsApi.update(updatedCart[index].id, {
                id: updatedCart[index].id,
                productId: updatedCart[index].productId,
                name: updatedCart[index].name,
                price: updatedCart[index].price,
                quantity: updatedCart[index].quantity,
                total: updatedCart[index].total,
            });
            const data = {
                ...updateRes.data,
                name: product.name,
            };

            updatedCart[index] = data;
        } else {
            const newItem = {
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                total: product.price * 1
            };
            const createRes = await billItemsApi.create(newItem);
            const data = {
                ...createRes.data,
                name: product.name,
            };
            updatedCart.push(data);
        }

        setWithExpiry('cartItems', updatedCart);
        window.location.reload();
    };

    const buyNow = async (product: Product) => {
        const existingCart = getWithExpiry('cartItems') || [];
        const updatedCart = [...existingCart];
        const index = updatedCart.findIndex((item: any) => item.productId === product.id);

        if (index !== -1) {
            updatedCart[index].quantity += 1;
            updatedCart[index].total = updatedCart[index].quantity * updatedCart[index].price;

            const updateRes = await billItemsApi.update(updatedCart[index].id, {
                id: updatedCart[index].id,
                productId: updatedCart[index].productId,
                name: updatedCart[index].name,
                price: updatedCart[index].price,
                quantity: updatedCart[index].quantity,
                total: updatedCart[index].total,
            });
            const data = {
                ...updateRes.data,
                name: product.name,
            };

            updatedCart[index] = data;
        } else {
            const newItem = {
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                total: product.price
            };
            const createRes = await billItemsApi.create(newItem);
            const data = {
                ...createRes.data,
                name: product.name,
            };
            updatedCart.push(data);
        }

        setWithExpiry('cartItems', updatedCart);
        window.location.href = "/cart";
    };

    return (
        <div className="product-catalog-container">
            <div className="product-catalog">
                <h1>Danh mục sản phẩm</h1>
                <div className="catalog-content">
                    <div className='filter-container'>
                        <div className="sticky-wrapper">
                            <div className="filters-sidebar">
                                <div className="filter-section">
                                    <div className="filter-header" onClick={() => setShowCategoryAccessory(!showCategoryAccessory)}>
                                        <h2>Bộ lọc linh kiện</h2>
                                        <button>{showCategoryAccessory ? "−" : "+"}</button>
                                    </div>
                                    {showCategoryAccessory && categoriesAccessory.map(category => (
                                        <div key={category} className="filter-item">
                                            <CheckBox
                                                text={category}
                                                value={selectedCategoriesAccessory.includes(category)}
                                                onValueChanged={(e) =>
                                                    handleCategoryChange(category, e.value)
                                                }
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="filter-section">
                                    <div className="filter-header" onClick={() => setShowCategorySpareParts(!showCategorySpareParts)}>
                                        <h2>Bộ lọc phụ tùng</h2>
                                        <button>{showCategorySpareParts ? "−" : "+"}</button>
                                    </div>
                                    {showCategorySpareParts && categoriesSpareParts.map(cat => (
                                        <div key={cat} className="filter-item">
                                            <CheckBox
                                                text={cat}
                                                value={selectedCategoriesSpareParts.includes(cat)}
                                                onValueChanged={(e) =>
                                                    handleCategorySparePartsChange(cat, e.value)
                                                }
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="filter-section">
                                    <div className="filter-header" onClick={() => setShowCategoryAdditives(!showCategoryAdditives)}>
                                        <h2>Bộ lọc phụ gia</h2>
                                        <button>{showCategoryAdditives ? "−" : "+"}</button>
                                    </div>
                                    {showCategoryAdditives && categoriesAdditives.map(cat => (
                                        <div key={cat} className="filter-item">
                                            <CheckBox
                                                text={cat}
                                                value={selectedCategoriesAdditives.includes(cat)}
                                                onValueChanged={(e) =>
                                                    handleCategoryAdditivesChange(cat, e.value)
                                                }
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="filter-section">
                                    <div className="filter-header" onClick={() => setShowPrice(!showPrice)}>
                                        <h2>Mức giá</h2>
                                        <button>{showPrice ? "−" : "+"}</button>
                                    </div>
                                    {showPrice && priceRanges.map((range, index) => (
                                        <div key={index} className="filter-item">
                                            <CheckBox
                                                text={range.label}
                                                value={selectedPriceRanges.includes(index)}
                                                onValueChanged={(e) =>
                                                    handlePriceRangeChange(index, e.value)
                                                }
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="filters-footer">
                                {(selectedCategoriesAccessory.length > 0 ||
                                    selectedPriceRanges.length > 0 ||
                                    selectedCategoriesAdditives.length > 0 ||
                                    selectedCategoriesSpareParts.length > 0) ? (
                                    <Button className="clear-btn" onClick={clearFilters}>Xóa bộ lọc</Button>
                                ) : (
                                    <div className="invisible-btn" />
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="product-listing">
                        <div className="sort-section">
                            <div className="sort-right">
                                <span>Sắp xếp theo: </span>
                                                                <SelectBox
                                    items={sortOptions}
                                    displayExpr="text"
                                    valueExpr="value"
                                    value={sortOption}
                                    onValueChanged={(e) => setSortOption(e.value)}
                                />
                            </div>
                        </div>

                        <div className="products-grid">
                            {currentProducts.length === 0 ? (
                                <div className="no-products">Không có sản phẩm nào</div>
                            ) : (
                                currentProducts.map(product => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        addToCart={addToCart}
                                        buyNow={buyNow}
                                    />
                                ))
                            )}
                        </div>

                        <div className="pagination-container">
                            <Pagination
                                showInfo
                                showNavigationButtons
                                showPageSizeSelector={false}
                                allowedPageSizes={PAGE_SIZES}
                                itemCount={filteredAndSortedProducts.length}
                                pageIndex={pageIndex}
                                pageSize={pageSize}
                                onPageIndexChange={setPageIndex}
                                onPageSizeChange={(newPageSize) => {
                                    setPageSize(newPageSize);
                                    setPageIndex(1);
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

