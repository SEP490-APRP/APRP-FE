# 🚀 Capstone Project - Frontend

Codebase frontend chuẩn cho dự án Capstone, được xây dựng trên nền tảng **React + TypeScript** với hiệu năng cao từ **Vite**, định kiểu linh hoạt với **TailwindCSS v4**, và kiến trúc module hóa theo nghiệp vụ (**Feature-Driven Architecture**).

---

## 🛠 Tech Stack

| Danh mục | Công nghệ sử dụng | Mục đích |
|---|---|---|
| **Build Tool** | [Vite 8.x](https://vite.dev/) | Tốc độ khởi động và HMR cực nhanh |
| **Framework** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) | Type-safe, component-driven UI |
| **Styling** | [TailwindCSS v4](https://tailwindcss.com/) | Utility-first CSS hiện đại, cấu hình qua `@theme` |
| **Routing** | [React Router v7](https://reactrouter.com/) | Cấu hình định tuyến tập trung, hỗ trợ data router |
| **Client State** | [Zustand](https://zustand-demo.pmnd.rs/) | Quản lý state toàn cục nhẹ gọn, có persist middleware |
| **Server State** | [TanStack Query v5](https://tanstack.com/query/latest) | Quản lý caching, fetching và synchronization dữ liệu API |
| **HTTP Client** | [Axios](https://axios-http.com/) | Quản lý request/response, tự động gán Bearer token & bắt lỗi 401 |
| **Form Handling** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) | Validate form linh hoạt, an toàn về kiểu dữ liệu |
| **Lint & Format** | [Oxlint](https://oxc.rs/) + [Prettier](https://prettier.io/) | Soi lỗi logic code siêu tốc và chuẩn hóa cách trình bày |

---

## ⚡ Hướng dẫn cài đặt & Chạy dự án (Quick Start)

### 1. Yêu cầu môi trường
* **Node.js**: Phiên bản `>= 18.x` (khuyến nghị `20.x` LTS trở lên).
* **Trình quản lý gói**: `npm` (hoặc `yarn` / `pnpm`).

### 2. Các bước khởi chạy

```bash
# 1. Di chuyển vào thư mục FE
cd FE

# 2. Cài đặt các thư viện phụ thuộc
npm install

# 3. Tạo file cấu hình môi trường từ mẫu
cp .env.example .env
# (Trên Windows PowerShell: Copy-Item .env.example .env)

# 4. Chạy môi trường phát triển (Dev Server)
npm run dev
```

Ứng dụng sẽ tự động mở tại: **`http://localhost:3000`**

### 3. Danh sách scripts khả dụng

| Lệnh | Ý nghĩa |
|---|---|
| `npm run dev` | Khởi chạy server phát triển (Port 3000, hỗ trợ Hot Reload) |
| `npm run build` | Kiểm tra kiểu TypeScript và đóng gói mã nguồn cho môi trường Production (vào thư mục `dist/`) |
| `npm run preview` | Chạy thử bản build production trên môi trường local |
| `npm run lint` | Chạy Oxlint kiểm tra lỗi logic và cú pháp toàn bộ dự án |

---

## 📂 Chi tiết cấu trúc thư mục (`src/`)

```text
src/
├── app/                  # Khởi tạo cấp ứng dụng (Providers, Router, Root App)
├── assets/               # Tài nguyên tĩnh (ảnh, icon, font)
├── components/           # Components dùng chung toàn app
│   ├── ui/               # Primitive components (Button, Input, Modal, ...)
│   ├── layout/           # Khung layout (Header, Sidebar, Footer, MainLayout)
│   └── common/           # Components phức hợp dùng chung (SearchBar, Avatar, ...)
├── features/             # Module tính năng theo nghiệp vụ (Auth, Product, Order, ...)
├── pages/                # Các trang gắn trực tiếp với URL route
├── services/             # Cấu hình gọi API toàn cục (Axios instance, Interceptors)
├── hooks/                # Custom React hooks dùng chung
├── stores/               # Quản lý state toàn cục (Zustand)
├── types/                # Định nghĩa interface / type TypeScript toàn cục
├── utils/                # Hằng số (constants) và hàm tiện ích (helpers)
├── styles/               # CSS toàn cục và cấu hình theme Tailwind
└── main.tsx              # Điểm khởi đầu (Entry point) gắn kết vào DOM
```

### Chi tiết chức năng từng thư mục:

#### 1. `app/` — Application Layer
* **Nhiệm vụ**: Kết nối các tầng hệ thống trước khi hiển thị lên giao diện.
* **Tệp chính**:
  * `providers/AppProviders.tsx`: Bọc tất cả Context Providers (React Query, Theme, Toast...) nhằm tránh tình trạng lồng ghép provider phức tạp tại `main.tsx`.
  * `router/index.tsx`: Cấu hình danh sách các routes của ứng dụng bằng `createBrowserRouter`.
  * `App.tsx`: Root component kết hợp Provider và Router.

#### 2. `assets/` — Static Assets
* **Nhiệm vụ**: Chứa các file tĩnh nội bộ được bundle qua Vite.
* **Gồm**: `images/` (hình ảnh), `icons/` (icon SVG), `fonts/` (font chữ nội bộ).
* *Lưu ý*: Các file `.gitkeep` rỗng được đặt trong các folder này nhằm đảm bảo Git theo dõi được thư mục khi chưa có file thực tế.

#### 3. `components/` — Shared Components
Được phân tầng theo nguyên lý thiết kế hệ thống (Design System):
* **`ui/` (Atomic / Primitives)**: Chứa các component giao diện cơ bản nhất, **không chứa nghiệp vụ** (ví dụ: `Button`, `Input`, `Badge`, `Checkbox`). Nhận props và render UI.
* **`layout/`**: Các thành phần tạo nên khung bố cục của trang web như `Header`, `Sidebar`, `Footer` và `MainLayout`.
* **`common/`**: Các component tái sử dụng trên nhiều trang nhưng có độ phức tạp cao hơn (ví dụ: `UserAvatar`, `DataTable`, `ConfirmModal`).

#### 4. `features/` — Domain Modules (Feature-Driven Architecture)
* **Nhiệm vụ**: Đóng gói mã nguồn theo từng nghiệp vụ kinh doanh độc lập (Domain Logic).
* **Mỗi feature sẽ có cấu trúc tự đóng gói**:
  ```text
  features/auth/
  ├── components/  # Component chỉ phục vụ cho feature này (LoginForm, SignupForm...)
  ├── hooks/       # Custom hook riêng của feature (useAuthQuery, useLogin...)
  ├── services/    # API calls riêng của feature (authApi.ts)
  ├── types/       # Kiểu dữ liệu riêng của feature (auth.types.ts)
  └── index.ts     # File export công khai ra bên ngoài
  ```
* **Quy tắc**: Nếu cần xóa hoặc sửa tính năng `auth`, bạn chỉ cần can thiệp bên trong thư mục này mà không làm ảnh hưởng đến các module khác.

#### 5. `pages/` — Route Pages
* **Nhiệm vụ**: Mỗi folder đại diện cho một màn hình gắn với URL (ví dụ: `HomePage`, `LoginPage`, `NotFoundPage`).
* **Quy tắc**: Component tại `pages` nên được viết **ngắn gọn**; vai trò chính là ráp các component từ `features/` và `components/` lại với nhau.

#### 6. `services/` — Global API Layer
* **Nhiệm vụ**: Quản lý giao tiếp HTTP với backend.
* **Tệp chính**: `api/axiosInstance.ts` — cấu hình sẵn baseURL, timeout và các interceptors (tự động đính kèm `Bearer token` vào header, tự động clear session và chuyển về trang login khi gặp lỗi `401 Unauthorized`).

#### 7. `hooks/` — Global Custom Hooks
* **Nhiệm vụ**: Chứa các hook logic dùng chung trong toàn bộ app (không dính dáng đến nghiệp vụ cụ thể).
* **Ví dụ**: `useDebounce.ts` (giảm tải API khi nhập tìm kiếm), `useLocalStorage`, `useOnClickOutside`...

#### 8. `stores/` — Global Client State (Zustand)
* **Nhiệm vụ**: Quản lý các trạng thái cần chia sẻ giữa các trang (như thông tin người dùng đang đăng nhập, cài đặt theme).
* **Tệp chính**: `useAuthStore.ts` — lưu thông tin user, tích hợp sẵn `devtools` và `persist` (tự động đồng bộ với `localStorage`).

#### 9. `types/` — Global TypeScript Types
* **Nhiệm vụ**: Lưu trữ các khai báo kiểu dữ liệu chung.
* **Tệp chính**:
  * `api.types.ts`: Chuẩn hóa response từ backend (`ApiResponse<T>`, `PaginatedResponse<T>`, `ApiError`).
  * `common.types.ts`: Các entity nền tảng (`User`, `BaseEntity`, `PaginationParams`...).

#### 10. `utils/` — Helpers & Constants
* **Nhiệm vụ**: Lưu trữ các hàm thuần túy và biến cấu hình tĩnh.
* **Tệp chính**:
  * `constants.ts`: Các hằng số (`ROUTES`, `STORAGE_KEYS`, `PAGINATION`).
  * `helpers.ts`: Hàm tiện ích (`cn()` để nối class Tailwind, `formatDate()`, `debounce()`, `getFromStorage()`).

#### 11. `styles/` — Styling & Theme
* **Tệp chính**: `index.css` — Nơi import TailwindCSS v4, định nghĩa bảng màu theme bằng `@theme` (`--color-primary`, `--color-secondary`...) và tinh chỉnh thanh cuộn (scrollbar).

---

## 📌 Quy ước & Hướng dẫn phát triển (Guidelines)

### 1. Đường dẫn tắt (Path Alias)
Dự án đã cấu hình alias `@/` trỏ thẳng về thư mục `src/`. **Tuyệt đối không dùng đường dẫn tương đối nhiều cấp (`../../../`)**:

```typescript
// ✅ ĐÚNG:
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores'
import { ROUTES, cn } from '@/utils'
import type { User } from '@/types'

// ❌ TRÁNH:
import { Button } from '../../../components/ui/Button/Button'
```

### 2. Quy trình thêm một tính năng mới (Feature)
Khi nhận một nghiệp vụ mới (ví dụ: `products`):
1. Tạo thư mục `src/features/products/`.
2. Tạo các thư mục con tương ứng nếu cần: `components/`, `services/`, `hooks/`, `types/`.
3. Tạo file `src/features/products/index.ts` để export các component/hàm cần thiết.
4. Tạo trang tương ứng tại `src/pages/ProductPage/` và đăng ký route vào `src/app/router/index.tsx`.

### 3. Quy ước viết Component UI (`components/ui`)
* Mỗi component nằm trong một thư mục riêng gồm file component và `index.ts`:
  ```text
  components/ui/Badge/
  ├── Badge.tsx
  └── index.ts
  ```
* Component UI phải có tính tái sử dụng cao, hỗ trợ truyền `className` thông qua hàm `cn()` để mở rộng kiểu dáng khi cần.

### 4. Code Formatting & Chuẩn hóa
* Dự án sử dụng **Prettier** theo cấu hình:
  * Không dùng dấu chấm phẩy (`;`) ở cuối dòng.
  * Ưu tiên dùng nháy đơn (`'`).
  * Thụt lề 2 khoảng trắng (spaces).
* Khuyến nghị cài đặt extension **Prettier - Code formatter** trên VS Code và bật:
  ```json
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
  ```
