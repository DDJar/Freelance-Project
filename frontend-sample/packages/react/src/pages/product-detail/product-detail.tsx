import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Product } from '../../types/product';
import './product-detail.scss';
import ProductImage from '../../components/library/product-detail/ProductImage';
import ProductInfo from '../../components/library/product-detail/ProductInfo';
import { productApi } from '../../api/product';
import { billItemsApi } from '../../api/billItems';
import RelatedProducts from '../../components/library/product-detail/RelatedProducts';

export const ProductDetailPage = () => {
    const { id } = useParams();
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [products, setProducts] = useState<Product[]>([])
    const loadData = useCallback(async () => {
        if (!id) return;

        setIsLoading(true);
        setError(null);
        try {
            const productRes = await productApi.getById(id);
            if (productRes.isOk && productRes.data) {
                setProduct(productRes.data);
            } else {
                setError('Không tìm thấy sản phẩm');
            }
        } catch (error) {
            console.error("Error loading product details:", error);
            setError('Đã xảy ra lỗi khi tải sản phẩm');
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const loadProductData = useCallback(async () => {

        setIsLoading(true);

        try {
            const productRes = await productApi.getAll();
            if (productRes.isOk && productRes.data) {
                setProducts(productRes.data);
            }
        } catch (error) {
            console.error("Error loading contact details:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProductData();
    }, [loadProductData]);
    const addToCart = async (product: Product) => {
        const existingCart = JSON.parse(localStorage.getItem('cartItems') || '[]');
        const updatedCart = [...existingCart];
        const index = updatedCart.findIndex((item: any) => item.productId === product.id);

        if (index !== -1) {
            updatedCart[index].quantity += quantity;
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
                quantity: quantity,
                total: product.price * quantity,
            };

            const createRes = await billItemsApi.create(newItem);
            const data = {
                ...createRes.data,
                name: product.name,
            };

            updatedCart.push(data);
        }

        localStorage.setItem('cartItems', JSON.stringify(updatedCart));
        window.location.reload();
    };

    const buyNow = async (product: Product) => {
        const cartKey = 'cartItems';
        const existingCart = JSON.parse(localStorage.getItem(cartKey) || '[]');
        const updatedCart = [...existingCart];
        const index = updatedCart.findIndex((item: any) => item.productId === product.id);

        if (index !== -1) {
            updatedCart[index].quantity += quantity;
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
            }

            updatedCart[index] = data;
        } else {
            const newItem = {

                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: quantity,
                total: product.price
            };
            const createRes = await billItemsApi.create(newItem);
            const data = {
                ...createRes.data,
                name: product.name,
            }
            updatedCart.push(data);
        }

        localStorage.setItem(cartKey, JSON.stringify(updatedCart));
        window.location.href = "/cart";
    };
    if (error) return <div className="error-message">{error}</div>;
    if (!product) return <div className="error-message">Sản phẩm không tồn tại</div>;

    return (
        <div className="product-detail-page">
            <h1>CHi tiết sản phẩm</h1>
            <div className="product-detail-content">
                <ProductImage
                    imageUrl={product.imageUrl?.startsWith('data:image') ? product.imageUrl : 'https://i.pinimg.com/1200x/3c/7b/46/3c7b46b0388f6c4b4cbf431e71916884.jpg'}

                    altText={product.name}
                />
                <ProductInfo
                    product={product}
                    addToCart={addToCart}
                    buyNow={buyNow}
                    quantity={quantity}
                    setQuantity={setQuantity}

                />

            </div>
            <RelatedProducts
                category={product.category}
                currentProductId={product.id}
                products={products}
            />
        </div>
    );
};