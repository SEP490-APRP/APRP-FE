import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { campaignProposalService } from '@/services/campaignProposal.service'
import type { CampaignProposal } from '@/services/campaignProposal.types'

/**
 * Số đề xuất chiến dịch shop vừa gửi mà admin chưa mở xem.
 * "Đã xem" lưu theo trình duyệt (localStorage): mỗi đơn tính theo id + lần gửi duyệt,
 * nên shop sửa rồi gửi lại thì đơn đó lại hiện số.
 */
const STORAGE_KEY = 'capnong.admin.seenProposals'
const EVENT = 'capnong:seen-proposals'

const stamp = (p: CampaignProposal) => `${p.proposalId}:${p.submittedAt ?? p.updatedAt ?? ''}`

function readSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

export function useNewProposalBadge() {
  const q = useQuery({
    queryKey: ['admin-campaign-proposals', 'SUBMITTED', 'badge'],
    queryFn: () => campaignProposalService.adminList('SUBMITTED'),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    retry: 1,
  })
  const [seen, setSeen] = useState(readSeen)

  // Đồng bộ giữa menu bên trái và tab "Đề xuất từ shop" (và giữa các tab trình duyệt)
  useEffect(() => {
    const sync = () => setSeen(readSeen())
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const count = useMemo(() => (q.data ?? []).filter((p) => !seen.has(stamp(p))).length, [q.data, seen])

  /** Đánh dấu mọi đơn đang chờ duyệt là đã xem (gọi khi admin mở tab đề xuất) */
  const markSeen = useCallback(() => {
    const list = q.data ?? []
    if (!list.length) return
    const next = readSeen()
    let changed = false
    for (const p of list) {
      const s = stamp(p)
      if (!next.has(s)) { next.add(s); changed = true }
    }
    if (!changed) return
    try {
      // Chỉ giữ 500 mục gần nhất cho gọn
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next].slice(-500)))
    } catch { /* trình duyệt chặn lưu: bỏ qua, chỉ mất trạng thái đã xem */ }
    window.dispatchEvent(new Event(EVENT))
  }, [q.data])

  return { count, markSeen }
}
