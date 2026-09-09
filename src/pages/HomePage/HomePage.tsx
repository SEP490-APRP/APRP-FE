import { Link } from 'react-router'

import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/utils/constants'

/* ===== Home Page ===== */
const HomePage = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center">
        <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
          🚀 Welcome to Capstone Project
        </span>
        <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
          Build Something{' '}
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Amazing
          </span>
        </h1>
        <p className="mb-8 max-w-2xl text-lg text-text-secondary">
          Đây là codebase frontend cho dự án Capstone. Được xây dựng với React,
          TypeScript, và các công nghệ hiện đại nhất.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link to={ROUTES.DASHBOARD}>
            <Button size="lg">Bắt đầu ngay</Button>
          </Link>
          <Link to={ROUTES.LOGIN}>
            <Button variant="outline" size="lg">
              Đăng nhập
            </Button>
          </Link>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="mt-24 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: '⚡',
            title: 'Vite',
            description: 'Lightning fast build tool',
          },
          {
            icon: '⚛️',
            title: 'React 18',
            description: 'Modern UI framework',
          },
          {
            icon: '🔷',
            title: 'TypeScript',
            description: 'Type-safe development',
          },
          {
            icon: '🎨',
            title: 'TailwindCSS',
            description: 'Utility-first styling',
          },
        ].map((item) => (
          <div
            key={item.title}
            className="group rounded-xl border border-border bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="mb-3 text-3xl">{item.icon}</div>
            <h3 className="mb-1 text-lg font-semibold text-text-primary">
              {item.title}
            </h3>
            <p className="text-sm text-text-secondary">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default HomePage
