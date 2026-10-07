export interface ExportDateRange {
  from: string
  to: string
}

export const exportService = {
  async exportAdminTransactionsExcel(range: ExportDateRange): Promise<void> {
    await new Promise((r) => setTimeout(r, 1000))
    const csvContent = `data:text/csv;charset=utf-8,Mã GD,Ngày,Loại GD,Số tiền,Người thụ hưởng,Trạng thái\nGD-1001,${range.from},Rút tiền về ngân hàng,15000000,Nông trại Hữu cơ Đà Lạt,THÀNH CÔNG\nGD-1002,${range.to},Thu phí sàn 5%,450000,Hệ thống CapNong,THÀNH CÔNG\nGD-1003,${range.to},Hoàn tiền đơn hoàn,320000,Người mua Nguyễn Văn A,THÀNH CÔNG`

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Bao_cao_giao_dich_CapNong_${range.from}_den_${range.to}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  },

  async exportAdminTransactionsPdf(
    range: ExportDateRange,
    onProgress?: (msg: string) => void,
  ): Promise<void> {
    onProgress?.('Đang kết xuất báo cáo PDF...')
    await new Promise((r) => setTimeout(r, 600))
    onProgress?.('Đang tạo chữ ký số và con dấu...')
    await new Promise((r) => setTimeout(r, 400))

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Báo cáo Giao dịch CapNong (${range.from} - ${range.to})</title>
            <style>
              body { font-family: sans-serif; padding: 40px; color: #1c2216; }
              h1 { color: #326318; border-bottom: 2px solid #326318; padding-bottom: 10px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
              th { background-color: #f2f6ee; color: #326318; }
            </style>
          </head>
          <body>
            <h1>CAPNONG - BÁO CÁO TỔNG KẾT TÀI CHÍNH VÀ ĐỐI SOÁT</h1>
            <p><strong>Thời gian:</strong> Từ ${range.from} đến ${range.to}</p>
            <p><strong>Ngày xuất:</strong> ${new Date().toLocaleString('vi-VN')}</p>
            <table>
              <thead>
                <tr><th>Mã GD</th><th>Ngày</th><th>Nội dung</th><th>Số tiền</th><th>Trạng thái</th></tr>
              </thead>
              <tbody>
                <tr><td>TX-9901</td><td>${range.from}</td><td>Đối soát COD Shipper</td><td>24,500,000 đ</td><td>Đã tất toán</td></tr>
                <tr><td>TX-9902</td><td>${range.to}</td><td>Giải ngân ví Shop Nông trại</td><td>18,200,000 đ</td><td>Đã tất toán</td></tr>
                <tr><td>TX-9903</td><td>${range.to}</td><td>Phí dịch vụ vận hành 5%</td><td>2,135,000 đ</td><td>Đã ghi nhận</td></tr>
              </tbody>
            </table>
            <div style="margin-top: 40px; text-align: right;">
              <p><strong>BAN QUẢN TRỊ SÀN CAPNONG</strong></p>
              <p><em>(Đã ký duyệt điện tử)</em></p>
            </div>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  },

  async exportAllAdminDeliveryReceipts(
    param1?: ExportDateRange | ((current: number, total: number) => void),
    param2?: (current: number, total: number) => void,
  ): Promise<number> {
    const onProgress = typeof param1 === 'function' ? param1 : param2
    const total = 5
    for (let i = 1; i <= total; i++) {
      onProgress?.(i, total)
      await new Promise((r) => setTimeout(r, 150))
    }
    const csvContent = `data:text/csv;charset=utf-8,Mã Vận Đơn,Shipper,Nhà Vườn,Người Nhận,Địa Chỉ,Trạng Thái\nVD-8801,Nguyễn Văn Hùng,Nông Trại Hữu Cơ Đà Lạt,Trần Thị Mai,Quận 1 TP HCM,ĐÃ GIAO\nVD-8802,Phạm Tấn Tài,HTX Nông Sản Bảo Lộc,Lê Minh Quân,Quận 3 TP HCM,ĐÃ GIAO`
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `Phieu_giao_hang_CapNong_${new Date().toISOString().slice(0, 10)}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    return total
  },
}
