import { useState, type FormEvent } from 'react'
import {
  Heart,
  MessageCircle,
  MapPin,
  Send,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  Search,
  Sprout,
  X,
} from 'lucide-react'

import heroFarmerImg from '../assets/hero-farmer.jpg'
import freshFarmerBannerImg from '../assets/fresh-farmer-banner.jpg'
import fullBannerImg from '../assets/full-ecosystem-banner.jpg'
import aiFarmerImg from '../assets/ai-farmer.jpg'

import farmerForumBanner from '../assets/farmer-forum-banner.jpg'

interface FarmerStoriesPageProps {
  onAdd?: (id: string) => void
  onInfo?: (msg: string) => void
}

interface ForumPost {
  id: string
  title: string
  author: string
  authorRole: string
  location: string
  date: string
  category: 'rescue' | 'story' | 'news' | 'tips'
  readTime: string
  image: string
  summary: string
  content: string[]
  likes: number
  commentsCount: number
  featured?: boolean
  relatedProductId?: string
  relatedProductName?: string
  relatedProductPrice?: string
  comments: { user: string; text: string; time: string }[]
}

export default function FarmerStoriesPage({ onAdd, onInfo }: FarmerStoriesPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'rescue' | 'story' | 'news' | 'tips'
  >('all')
  const [selectedRegion, setSelectedRegion] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Active Reading Post Modal
  const [readingPost, setReadingPost] = useState<ForumPost | null>(null)

  // Active Comment Drawer
  const [commentingPost, setCommentingPost] = useState<ForumPost | null>(null)
  const [commentText, setCommentText] = useState('')

  // User Encouraging Note board
  const [notes, setNotes] = useState([
    {
      id: '1',
      sender: 'Chị Mai Lan (Quận 7, TP.HCM)',
      message:
        'Cà rốt 2 nhánh của chú Bảy ăn ngọt lịm và nhiều nước hơn hẳn hàng siêu thị. Cả nhà em làm nước ép ai cũng khen!',
      time: '15 phút trước',
      heart: 24,
    },
    {
      id: '2',
      sender: 'Anh Tuấn Kiệt (Cầu Giấy, Hà Nội)',
      message:
        'Mới nhận thùng bắp cải Cầu Đất, lá xanh cuộn chắc nịch. Cảm ơn các bác nông dân đã chăm sóc tận tâm dù thời tiết khắc nghiệt.',
      time: '1 giờ trước',
      heart: 38,
    },
    {
      id: '3',
      sender: 'Bác sĩ Thu Hằng (Bệnh viện ĐHYD)',
      message:
        'Rau củ xấu mã giữ trọn vẹn chất chống oxy hóa tự nhiên. Rất ủng hộ dự án CapNong vì nông sản sạch và bền vững.',
      time: '3 giờ trước',
      heart: 52,
    },
  ])

  const [newNoteSender, setNewNoteSender] = useState('')
  const [newNoteMessage, setNewNoteMessage] = useState('')
  const [noteNotice, setNoteNotice] = useState('')

  // Post Data
  const [posts, setPosts] = useState<ForumPost[]>([
    {
      id: 'post-1',
      title: 'Hành Trình 3 Ngày Giải Cứu 12 Tấn Bắp Cải Cầu Đất Trước Mùa Sương Muối',
      author: 'Chú Bảy & Hợp Tác Xã Rau Cầu Đất',
      authorRole: 'Chủ nhiệm Hợp tác xã (30 năm làm vườn)',
      location: 'Cầu Đất, TP. Đà Lạt',
      date: 'Hôm nay · 08:30',
      category: 'rescue',
      readTime: '4 phút đọc',
      image: freshFarmerBannerImg,
      summary:
        'Đợt rét đậm bất ngờ khiến hàng vạn búp bắp cải bị sạm lớp lá bẹ ngoài. Nhờ CapNong phân loại bằng AI và kết nối khách hàng, 12 tấn rau đã đến tay người tiêu dùng nguyên vẹn.',
      content: [
        'Đầu tuần trước, sương muối phủ trắng các triền đồi Cầu Đất. Bắp cải đến ngày thu hoạch nhưng lớp lá bẹ bên ngoài bị cháy nắng nhẹ, các thương lái truyền thống lập tức ép giá chỉ còn 2.000đ/kg hoặc bỏ mặc tại ruộng.',
        'Chú Bảy xót xa chia sẻ: "Bắp cải ở trong cuộn chặt, ngọt lịm không tì vết, chỉ bóc nhẹ lớp ngoài là ngon như thường. Nếu bỏ đi thì bao nhiêu mồ hôi công sức của bà con đổ sông đổ biển."',
        'Đội ngũ CapNong cùng hệ thống xe tải lạnh đã có mặt tại vườn trong 12 giờ. Ứng dụng Camera AI đo độ tươi đạt 97%, giúp phân loại đóng thùng ngay tại luống và vận chuyển thẳng về TP.HCM tiêu thụ trong 24 giờ.',
      ],
      likes: 342,
      commentsCount: 28,
      featured: true,
      relatedProductId: 'cabbage',
      relatedProductName: 'Bắp Cải Xanh Cầu Đất (Loại 2kg)',
      relatedProductPrice: '14.000đ/kg',
      comments: [
        {
          user: 'Thảo My',
          text: 'Nhà em vừa luộc ăn trưa nay, giòn ngọt xuất sắc chú Bảy ơi!',
          time: '1 giờ trước',
        },
        {
          user: 'Bếp Xanh Quán',
          text: 'Đã đặt 50kg về nấu súp cho quán cơm thiện nguyện, ủng hộ bà con.',
          time: '3 giờ trước',
        },
      ],
    },
    {
      id: 'post-2',
      title: 'Vườn Bưởi Da Xanh Bến Tre: "Xấu Mã Rám Nắng Nhưng Tép Mọng Nước 100%"',
      author: 'Cô Ba Út (Nhà Vườn Giồng Trôm)',
      authorRole: 'Nhà vườn hữu cơ 15 năm',
      location: 'Giồng Trôm, Bến Tre',
      date: 'Hôm qua',
      category: 'story',
      readTime: '3 phút đọc',
      image: heroFarmerImg,
      summary:
        'Cây bưởi cho trái tự nhiên đón nắng gắt nên vỏ ngoài rám sần. Nhưng chính những trái bưởi này lại có độ ngọt đậm và tép mọng nước nhất.',
      content: [
        'Nhiều người đi chợ chỉ thích trái bưởi da bóng láng xanh ngắt, nhưng nông dân miệt vườn chúng tôi ai cũng biết: Trái bưởi nằm ngoài đầu cành hứng trọn nắng gió tuy vỏ hơi rám nhưng múi bưởi ngọt đậm đà và róc vỏ nhất.',
        'Cô Ba Út bộc bạch: "Từ ngày đưa bưởi lên sàn CapNong, người tiêu dùng thành phố hiểu ra giá trị thật. Vừa không phải xịt thuốc làm bóng vỏ, vừa bán được giá tốt nuôi con ăn học."',
      ],
      likes: 218,
      commentsCount: 16,
      relatedProductId: 'pomelo',
      relatedProductName: 'Bưởi Da Xanh Rám Vỏ (1.2kg – 1.5kg)',
      relatedProductPrice: '28.000đ/trái',
      comments: [
        {
          user: 'Ngọc Trâm',
          text: 'Bưởi cô Ba ngọt lịm, múi đỏ hồng mọng nước ăn ghiền luôn!',
          time: 'Hôm qua',
        },
      ],
    },
    {
      id: 'post-3',
      title:
        'Báo Nông Nghiệp Việt Nam: "Mô Hình Nông Sản Xấu Mã Giúp Giảm 60% Thất Thoát Thực Phẩm"',
      author: 'Ban Biên Tập & Tin Tức CapNong',
      authorRole: 'Chuyên mục Báo Chí & Nông Nghiệp Số',
      location: 'Toàn quốc',
      date: '2 ngày trước',
      category: 'news',
      readTime: '5 phút đọc',
      image: fullBannerImg,
      summary:
        'Báo cáo thống kê từ hơn 150 nhà vườn liên kết tại Lâm Đồng và miền Tây cho thấy giải pháp định giá tự động bằng AI đã giải cứu hơn 48 tấn nông sản trong quý vừa qua.',
      content: [
        'Theo thống kê của Tổ chức Lương thực Thế giới (FAO), khoảng 30% sản lượng nông sản toàn cầu bị vứt bỏ vì không đạt tiêu chuẩn ngoại hình thẩm mỹ dù chất lượng dinh dưỡng hoàn toàn tương đương.',
        'Tại Việt Nam, mô hình kinh tế tuần hoàn của CapNong đang tạo nên làn sóng tiêu dùng văn minh mới: Mua nông sản xấu mã để bảo vệ túi tiền gia đình và chung tay bảo vệ môi trường sinh thái.',
      ],
      likes: 195,
      commentsCount: 12,
      comments: [
        {
          user: 'Hoàng Nam',
          text: 'Mô hình rất nhân văn, chúc CapNong ngày càng phát triển!',
          time: '2 ngày trước',
        },
      ],
    },
    {
      id: 'post-4',
      title: 'Kinh Nghiệm Nhà Nông: 4 Cách Bảo Quản Cà Rốt & Khoai Lang Tươi Ngon Cả Tháng',
      author: 'Bác Tư (Kỹ sư nông nghiệp CapNong)',
      authorRole: 'Cố vấn canh tác tự nhiên',
      location: 'Đơn Dương, Lâm Đồng',
      date: '3 ngày trước',
      category: 'tips',
      readTime: '3 phút đọc',
      image: aiFarmerImg,
      summary:
        'Bí quyết giữ rau củ củ quả củ không bị mọc mầm, giữ nguyên lượng vitamin tự nhiên mà không cần dùng bất kỳ hóa chất bảo quản nào.',
      content: [
        '1. Với Cà rốt: Cắt bỏ phần cuống lá xanh ngay khi nhận hàng để tránh cây rút nước từ củ. Quấn giấy báo ẩm và bảo quản ngăn mát tủ lạnh.',
        '2. Với Khoai lang: Không để trong tủ lạnh! Hãy để nơi thoáng gió, lót giấy báo khô dưới đáy thùng để khoai càng để lâu càng tươm mật ngọt.',
        '3. Với Rau ăn lá: Không rửa trước khi cất tủ lạnh. Dùng hộp kín có lót khăn giấy thấm hút ẩm dư thừa.',
      ],
      likes: 276,
      commentsCount: 22,
      relatedProductId: 'carrot',
      relatedProductName: 'Cà Rốt 2 Nhánh Đà Lạt (Túi 1kg)',
      relatedProductPrice: '18.000đ/kg',
      comments: [
        {
          user: 'Mẹ Bắp',
          text: 'Áp dụng mẹo quấn giấy báo của Bác Tư, cà rốt để 3 tuần vẫn giòn rụm.',
          time: '2 ngày trước',
        },
      ],
    },
  ])

  // Handle Likes
  const handleLikePost = (postId: string) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likes: p.likes + 1 } : p)))
  }

  // Handle Add Comment
  const handleAddComment = (e: FormEvent) => {
    e.preventDefault()
    if (!commentText.trim() || !commentingPost) return

    const newComment = {
      user: 'Khách tham quan',
      text: commentText.trim(),
      time: 'Vừa xong',
    }

    setPosts((prev) =>
      prev.map((p) =>
        p.id === commentingPost.id
          ? {
              ...p,
              commentsCount: p.commentsCount + 1,
              comments: [newComment, ...p.comments],
            }
          : p,
      ),
    )

    setCommentingPost((prev) =>
      prev
        ? {
            ...prev,
            comments: [newComment, ...prev.comments],
            commentsCount: prev.commentsCount + 1,
          }
        : null,
    )

    setCommentText('')
  }

  // Handle Post New Note to Farmer
  const handleSendNote = (e: FormEvent) => {
    e.preventDefault()
    if (!newNoteMessage.trim()) return

    const newNote = {
      id: Date.now().toString(),
      sender: newNoteSender.trim() || 'Thành viên CapNong',
      message: newNoteMessage.trim(),
      time: 'Vừa xong',
      heart: 1,
    }

    setNotes([newNote, ...notes])
    setNewNoteSender('')
    setNewNoteMessage('')
    setNoteNotice('Lời nhắn của bạn đã được gửi lên bảng tin tri ân nông dân!')
    setTimeout(() => setNoteNotice(''), 4000)
  }

  // Filter Posts
  const filteredPosts = posts.filter((post) => {
    const matchCat = selectedCategory === 'all' || post.category === selectedCategory
    const matchRegion =
      selectedRegion === 'all' || post.location.toLowerCase().includes(selectedRegion.toLowerCase())
    const matchSearch =
      !searchQuery ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.summary.toLowerCase().includes(searchQuery.toLowerCase())

    return matchCat && matchRegion && matchSearch
  })

  const featuredPost = posts.find((p) => p.featured) || posts[0]

  return (
    <div className="w-full bg-[#fcf9f1] text-[#1f241a] min-h-screen">
      {/* 1. Top Immersive Farmer Stories Hero Banner (Synchronized Design) */}
      <div className="relative w-full h-72 sm:h-84 md:h-96 lg:h-[380px] overflow-hidden flex items-center justify-center text-center shadow-lg">
        <img
          src={farmerForumBanner}
          alt="Bà con nông dân vui mừng thu hoạch nông sản tươi xanh"
          className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-700"
        />
        {/* Dark Vignette Overlay for maximum readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/40" />

        {/* Dynamic Title & Breadcrumb */}
        <div className="relative z-10 flex flex-col items-center gap-3 px-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-[#ffea79] text-xs font-bold uppercase tracking-wider shadow-sm">
            <Sprout size={13} />
            <span>Diễn Đàn &amp; Bản Tin Nông Dân CapNong</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-lg animate-fadeIn leading-tight">
            Câu Chuyện Nông Dân
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-white/85 font-normal max-w-xl mx-auto leading-relaxed drop-shadow">
            Nơi kết nối trực tiếp những câu chuyện mùa vụ chân thật, nhật ký cứu trợ nông sản và
            những lời nhắn gửi yêu thương giữa khách hàng và người nông dân Việt.
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/35 backdrop-blur-md border border-white/20 text-xs sm:text-sm text-white/90 font-medium mt-1 shadow-sm">
            <a href="#/" className="hover:text-[#ffea79] transition-colors">
              Trang chủ
            </a>
            <span className="text-white/40">›</span>
            <span className="text-[#ffea79] font-bold">Câu chuyện nông dân</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-12 flex flex-col gap-10 sm:gap-14">
        {/* ========================================================================= */}
        {/* 1. FORUM FILTER & SEARCH BAR                                              */}
        {/* ========================================================================= */}
        <div className="flex flex-col gap-6 text-center max-w-4xl mx-auto w-full">
          {/* Search Bar & Region Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-2xl mx-auto mt-2">
            <div className="relative flex-1 w-full">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8c9486]"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm câu chuyện vườn, tên nông dân hoặc loại nông sản..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-[#dcd6c8] text-xs sm:text-sm focus:border-[#326318] focus:ring-1 focus:ring-[#326318] outline-none shadow-sm"
              />
            </div>

            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-white border border-[#dcd6c8] text-xs sm:text-sm font-bold text-[#353c2e] focus:border-[#326318] outline-none shadow-sm shrink-0"
            >
              <option value="all">📍 Tất cả khu vực</option>
              <option value="Đà Lạt">Đà Lạt &amp; Lâm Đồng</option>
              <option value="Bến Tre">Miền Tây Nam Bộ</option>
              <option value="Gia Lai">Tây Nguyên</option>
              <option value="Toàn quốc">Toàn quốc &amp; Báo chí</option>
            </select>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {(
              [
                { id: 'all', label: 'Tất cả bài viết' },
                { id: 'rescue', label: '🚨 Nhật ký giải cứu' },
                { id: 'story', label: '📖 Phóng sự người nông dân' },
                { id: 'news', label: '📰 Báo chí & Tin tức' },
                { id: 'tips', label: '🌱 Mẹo canh tác & Bảo quản' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                  selectedCategory === tab.id
                    ? 'bg-[#326318] text-white shadow-sm'
                    : 'bg-white text-[#525a4d] border border-[#e2dcd0] hover:bg-[#f3ede1]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. SPOTLIGHT STORY BANNER (Ghim đầu trang)                                */}
        {/* ========================================================================= */}
        {featuredPost && selectedCategory === 'all' && !searchQuery && (
          <div className="bg-white rounded-3xl sm:rounded-[36px] border border-[#e5dfd2] p-6 sm:p-8 lg:p-10 shadow-lg relative overflow-hidden flex flex-col lg:flex-row gap-8 items-center">
            {/* Left Image (6 Cols) */}
            <div className="w-full lg:w-1/2 aspect-[16/10] sm:aspect-[16/9] rounded-2xl sm:rounded-3xl overflow-hidden relative shadow-md group shrink-0">
              <img
                src={featuredPost.image}
                alt={featuredPost.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 bg-[#c62828] text-white font-extrabold text-[10px] sm:text-xs px-3 py-1 rounded-full shadow flex items-center gap-1.5 uppercase">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>Tiêu Điểm Mùa Vụ</span>
              </div>
            </div>

            {/* Right Story Info (6 Cols) */}
            <div className="w-full lg:w-1/2 flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-xs text-[#6e7668]">
                  <span className="font-extrabold text-[#326318] uppercase tracking-wider">
                    {featuredPost.author}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-[#8a4e1d]" />
                    {featuredPost.location}
                  </span>
                </div>

                <h2
                  onClick={() => setReadingPost(featuredPost)}
                  className="text-xl sm:text-2xl lg:text-3xl font-black text-[#1c2216] tracking-tight leading-snug hover:text-[#326318] transition-colors cursor-pointer"
                >
                  {featuredPost.title}
                </h2>

                <p className="text-xs sm:text-sm text-[#555d4f] leading-relaxed line-clamp-3">
                  {featuredPost.summary}
                </p>
              </div>

              {/* Action Bar */}
              <div className="pt-4 border-t border-[#ede7dc] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-xs text-[#636b5c]">
                  <button
                    type="button"
                    onClick={() => handleLikePost(featuredPost.id)}
                    className="flex items-center gap-1.5 hover:text-[#c62828] font-bold transition-colors cursor-pointer"
                  >
                    <Heart size={16} className="text-[#c62828] fill-[#c62828]/20" />
                    <span>{featuredPost.likes} Cảm kích</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCommentingPost(featuredPost)}
                    className="flex items-center gap-1.5 hover:text-[#326318] font-bold transition-colors cursor-pointer"
                  >
                    <MessageCircle size={16} />
                    <span>{featuredPost.commentsCount} Bình luận</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReadingPost(featuredPost)}
                    className="px-4 py-2.5 rounded-full bg-[#f0ebd9] hover:bg-[#326318] text-[#2c3325] hover:text-white font-extrabold text-xs transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <span>Đọc toàn bộ bài viết</span>
                    <ArrowRight size={14} />
                  </button>

                  {featuredPost.relatedProductId && onAdd && (
                    <button
                      type="button"
                      onClick={() => onAdd(featuredPost.relatedProductId!)}
                      className="px-4 py-2.5 rounded-full bg-[#326318] hover:bg-[#254b12] text-white font-extrabold text-xs transition-all shadow flex items-center gap-1.5"
                    >
                      <ShoppingBag size={14} />
                      <span>Ủng hộ vườn ngay</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. FORUM FEED GRID (Danh sách bài viết & diễn đàn)                         */}
        {/* ========================================================================= */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-[#1c2216]">
              Bản Tin Ruộng Vườn Mới Nhất ({filteredPosts.length})
            </h2>
            <span className="text-xs text-[#6e7668] font-medium">
              Cập nhật trực tiếp từ 150+ nhà vườn
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-3xl border border-[#e5dfd2] p-5 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between gap-4 group"
              >
                <div>
                  {/* Top Author Bar */}
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#326318] text-white font-extrabold flex items-center justify-center text-xs">
                        {post.author.charAt(0)}
                      </div>
                      <div>
                        <div className="font-extrabold text-[#1d2318] leading-tight truncate max-w-[150px]">
                          {post.author}
                        </div>
                        <div className="text-[10px] text-[#71786a] flex items-center gap-1">
                          <MapPin size={10} />
                          <span>{post.location}</span>
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#f2eee3] text-[#555d4e]">
                      {post.date}
                    </span>
                  </div>

                  {/* Thumbnail Image */}
                  <div
                    onClick={() => setReadingPost(post)}
                    className="aspect-[16/10] rounded-2xl overflow-hidden mb-3 relative cursor-pointer"
                  >
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white font-bold text-[10px]">
                      {post.readTime}
                    </span>
                  </div>

                  {/* Title & Excerpt */}
                  <h3
                    onClick={() => setReadingPost(post)}
                    className="font-extrabold text-base text-[#1c2216] leading-snug group-hover:text-[#326318] transition-colors line-clamp-2 cursor-pointer mb-2"
                  >
                    {post.title}
                  </h3>

                  <p className="text-xs text-[#5a6252] leading-relaxed line-clamp-3">
                    {post.summary}
                  </p>
                </div>

                {/* Bottom Interactive Bar */}
                <div className="pt-3 border-t border-[#ede7dc] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleLikePost(post.id)}
                      className="flex items-center gap-1 text-[#666e60] hover:text-[#c62828] font-bold transition-colors cursor-pointer"
                    >
                      <Heart size={15} className="text-[#c62828]" />
                      <span>{post.likes}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCommentingPost(post)}
                      className="flex items-center gap-1 text-[#666e60] hover:text-[#326318] font-bold transition-colors cursor-pointer"
                    >
                      <MessageCircle size={15} />
                      <span>{post.commentsCount}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setReadingPost(post)}
                    className="text-xs font-extrabold text-[#326318] hover:underline flex items-center gap-1"
                  >
                    <span>Xem chi tiết</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. COMMUNITY BOARD: Lời Nhắn Tri Ân & Động Viên Nông Dân                   */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-br from-[#244e18] via-[#1d4213] to-[#122e0b] text-white rounded-[36px] p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-4xl mx-auto flex flex-col gap-8">
            <div className="text-center flex flex-col items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#ffea79]">
                <Heart size={14} className="fill-[#ffea79]" />
                <span>Góc Tri Ân &amp; Kết Nối Trực Tiếp</span>
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">
                Gửi Lời Động Viên Đến Những Người Nông Dân
              </h2>
              <p className="text-xs sm:text-sm text-white/80 max-w-xl">
                Những lời động viên chân thành từ khách hàng là nguồn động lực to lớn giúp bà con
                nông dân yên tâm canh tác sạch và giữ vững chất lượng.
              </p>
            </div>

            {/* Input Form to Post Note */}
            <form
              onSubmit={handleSendNote}
              className="bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-white/20 flex flex-col gap-3"
            >
              {noteNotice && (
                <div className="p-3 bg-[#eaf5e1] text-[#2c5f11] rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 size={16} />
                  <span>{noteNotice}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  value={newNoteSender}
                  onChange={(e) => setNewNoteSender(e.target.value)}
                  placeholder="Tên của bạn (VD: Chị Lan - Hà Nội)..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/20 border border-white/30 text-white placeholder-white/70 text-xs focus:outline-none focus:bg-white/30"
                />

                <input
                  type="text"
                  required
                  value={newNoteMessage}
                  onChange={(e) => setNewNoteMessage(e.target.value)}
                  placeholder="Viết lời nhắn gửi bà con nông dân..."
                  className="w-full sm:col-span-2 px-4 py-2.5 rounded-2xl bg-white/20 border border-white/30 text-white placeholder-white/70 text-xs focus:outline-none focus:bg-white/30"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#ffea79] hover:bg-[#ffe34f] text-[#331c00] font-black text-xs uppercase tracking-wide transition-all shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <Send size={14} />
                  <span>Gửi lời nhắn ngay</span>
                </button>
              </div>
            </form>

            {/* Live Message Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex flex-col justify-between gap-2 shadow-sm"
                >
                  <p className="text-xs text-white/90 leading-relaxed italic">"{note.message}"</p>
                  <div className="flex items-center justify-between text-[11px] text-white/70 pt-2 border-t border-white/15">
                    <strong className="text-[#ffea79]">{note.sender}</strong>
                    <span>{note.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: FULL POST READER                                                 */}
      {/* ========================================================================= */}
      {readingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-[#ede8df] relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setReadingPost(null)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#f4efe4] hover:bg-[#eae3d5] text-[#333a2e] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-xs text-[#6e7668]">
                <span className="font-bold text-[#326318]">{readingPost.author}</span>
                <span>•</span>
                <span>{readingPost.location}</span>
                <span>•</span>
                <span>{readingPost.date}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-[#1c2216] tracking-tight leading-snug">
                {readingPost.title}
              </h2>

              <div className="aspect-[16/9] rounded-2xl overflow-hidden shadow-md my-2">
                <img
                  src={readingPost.image}
                  alt={readingPost.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-[#384133] leading-relaxed">
                {readingPost.content.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>

              {/* Related Produce Card */}
              {readingPost.relatedProductName && (
                <div className="p-4 rounded-2xl bg-[#f1faea] border border-[#c6e8b2] flex items-center justify-between text-xs mt-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#326318]">
                      Nông sản từ vườn này:
                    </span>
                    <div className="font-extrabold text-sm text-[#1c2216]">
                      {readingPost.relatedProductName} ({readingPost.relatedProductPrice})
                    </div>
                  </div>

                  {onAdd && readingPost.relatedProductId && (
                    <button
                      type="button"
                      onClick={() => {
                        onAdd(readingPost.relatedProductId!)
                        setReadingPost(null)
                      }}
                      className="px-4 py-2 rounded-full bg-[#326318] hover:bg-[#254b12] text-white font-bold text-xs shadow cursor-pointer"
                    >
                      + Thêm vào giỏ
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: COMMENT DRAWER                                                   */}
      {/* ========================================================================= */}
      {commentingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-[#ede8df] relative max-h-[85vh] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#ede7dc]">
                <h3 className="font-black text-base text-[#1c2216]">
                  Bình Luận ({commentingPost.commentsCount})
                </h3>
                <button
                  type="button"
                  onClick={() => setCommentingPost(null)}
                  className="w-8 h-8 rounded-full bg-[#f4efe4] hover:bg-[#eae3d5] text-[#333a2e] flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="text-xs font-bold text-[#326318] mt-2 mb-4 truncate">
                {commentingPost.title}
              </div>

              {/* Comments List */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {commentingPost.comments.map((cm, idx) => (
                  <div key={idx} className="p-3 bg-[#faf8f3] rounded-2xl border border-[#eee8dc]">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <strong className="text-[#20271c]">{cm.user}</strong>
                      <span className="text-[#889182]">{cm.time}</span>
                    </div>
                    <p className="text-xs text-[#444c3e]">{cm.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="pt-4 border-t border-[#ede7dc] flex gap-2">
              <input
                type="text"
                required
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Viết lời động viên hoặc nhận xét của bạn..."
                className="flex-1 px-4 py-2.5 rounded-2xl bg-[#f4f6f1] border border-transparent focus:border-[#326318] text-xs outline-none"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-2xl bg-[#326318] hover:bg-[#254b12] text-white font-bold text-xs shadow shrink-0"
              >
                Gửi
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
