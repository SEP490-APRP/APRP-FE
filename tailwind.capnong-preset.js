/**
 * Design tokens CapNong (màu leaf/soil/sun/ink/paper/sale, text-caption, rounded-card...).
 * Các component mới trong src/components/ui, src/components/product, pages/Fresh,
 * design/TodayRescue, pages/admin/AdminPortal CẦN preset này.
 *
 * Thêm vào tailwind.config hiện có (giữ nguyên mọi thứ khác):
 *   import capnong from './tailwind.capnong-preset.js';
 *   export default { presets: [capnong], content: [...], theme: { ... } };
 * (Nếu config dùng CommonJS: presets: [require('./tailwind.capnong-preset.js').default])
 */
export default {
  theme: {
    extend: {
      colors: {
        leaf: {
          50: '#f1f8ec',
          100: '#e3f1da',
          200: '#cfe6c4',
          300: '#a4e876',
          500: '#5e9440',
          600: '#4a7c2f', // chữ trên nền trắng: 4.98:1 (đạt AA)
          700: '#326318', // màu thương hiệu chính, chữ trắng: 7.16:1 (đạt AAA)
          800: '#254b12',
          900: '#1a3a0c',
        },
        soil: {
          50: '#fdf5eb',
          100: '#eedec8',
          600: '#8a4e1d',
          700: '#6f3e16',
        },
        sun: {
          100: '#fff7cc',
          300: '#ffea79', // chữ vàng trên leaf-700: 5.9:1
          500: '#ffba41',
        },
        ink: {
          DEFAULT: '#1c2216',
          muted: '#5f6b57', // 5.63:1 trên nền trắng: dùng cho mô tả, meta
          subtle: '#6b7563', // 4.83:1: mức nhạt nhất được phép cho chữ
        },
        paper: {
          DEFAULT: '#f8faf6',
          warm: '#f8f6f0',
        },
        line: {
          DEFAULT: '#e5e2da',
          strong: '#d6d3c9',
        },
        sale: {
          DEFAULT: '#d32f2f', // chữ trắng: 4.98:1
          soft: '#fdecea',
        },
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Cỡ chữ nhỏ nhất cho nội dung cần đọc. Không dùng 8 đến 11px nữa.
        caption: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],
      },
      borderRadius: {
        card: '1rem',
        panel: '1.5rem',
      },
      boxShadow: {
        card: '0 1px 2px rgb(28 34 22 / 0.06), 0 1px 3px rgb(28 34 22 / 0.08)',
        'card-hover': '0 12px 24px -8px rgb(28 34 22 / 0.18)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.4s infinite',
      },
    },
  },
  plugins: [],
};
