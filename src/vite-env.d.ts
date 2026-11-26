/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_USE_MOCK?: string
  /** Địa chỉ web công khai in trên tem QR (vd https://capnong.vn); bỏ trống = địa chỉ đang mở */
  readonly VITE_PUBLIC_WEB_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
