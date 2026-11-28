/** Khai báo kiểu tối thiểu cho phần pdfmake đang dùng (bản chạy trên trình duyệt) */
declare module 'pdfmake/build/pdfmake' {
  const pdfMake: {
    addVirtualFileSystem(vfs: Record<string, string>): void
    createPdf(definition: object): {
      download(fileName?: string): Promise<void>
      getBuffer(): Promise<Uint8Array>
    }
  }
  export default pdfMake
}

declare module 'pdfmake/build/vfs_fonts' {
  const vfs: Record<string, string>
  export default vfs
}
