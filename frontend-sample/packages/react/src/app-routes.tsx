import {
  UserProfile,
  CRMContactDetails,
  CRMContactList,
  PlanningTaskList,
  PlanningTaskDetails,
  ProductList,
  ProductDetails,
  BillList,
  BillDetails,
  DeliveryList,
  DeliveryDetails,
} from "./pages";
import { withNavigationWatcher } from "./contexts/navigation";
import Home from "./pages/home/home";
import { Products } from "./pages/products/products";
import { BlogList } from "./pages/blog/blog-list";
import { CartPage } from "./pages/cart/cart-page";
import { BillPage } from "./pages/bill/bill-page";
import { AnalyticsDashboard } from "./pages/analytics-dashboard/analytics-dashboard";
import InventoryAnalyticsDashboard from "./pages/inventory-report/InventoryReportPage";
import { ProductDetailPage } from "./pages/product-detail/product-detail";
import NewsDetailPage from "./pages/news-detail/news-detail-page";
import AboutPage from "./pages/aboutUsPage/aboutPage";
import OrderLookupPage from "./pages/OrderLookupPage/OrderLookupPage";
import OrderDetailPage from "./pages/OrderLookupPage/OrderDetailPage";
import { DepartmentList } from "./pages/department-list/department-list";





const publicRoutes = [
  { path: "/home", element: Home },
  { path: "/about", element: AboutPage },
  { path: "/products", element: Products },
  { path: "/product/:id", element: ProductDetailPage },
  { path: "/news/:id", element: NewsDetailPage },
  { path: "/order", element: OrderLookupPage },
  { path: "/order/:id", element: OrderDetailPage },
  { path: "/cart", element: CartPage },
  { path: "/bill", element: BillPage },
];

const privateRoutes = [
  { path: "/user-profile/:username", element: UserProfile },
  { path: "/crm-contact-list/:username?", element: CRMContactList },
  { path: "/crm-contact-details/:username?", element: CRMContactDetails },
  { path: "/planning-task-list", element: PlanningTaskList },
  { path: "/planning-task-details/:id?", element: PlanningTaskDetails },
  { path: "/blog-list/:id?", element: BlogList },
  { path: "/product-list/:id?", element: ProductList },
  { path: "/product-details/:id?", element: ProductDetails },
  { path: "/bill-list/:id?", element: BillList },
  { path: "/bill-details/:id?", element: BillDetails },
  { path: "/analytics-dashboard", element: AnalyticsDashboard },
  { path: "/delivery-list", element: DeliveryList },
  { path: "/delivery-details/:id?", element: DeliveryDetails },
  { path: "/analytics-dashboard", element: AnalyticsDashboard },
  { path: "/inventory-report", element: InventoryAnalyticsDashboard },
  { path: "/link-company", element: DepartmentList },
];

export const appRoutes = [...publicRoutes, ...privateRoutes].map((route) => ({
  ...route,
  element: withNavigationWatcher(route.element, route.path),
}));

export const publicPaths = publicRoutes.map((r) => r.path);

