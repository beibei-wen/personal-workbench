import {
  BarChart3,
  BookOpen,
  Briefcase,
  CalendarCheck2,
  Clapperboard,
  Code2,
  Dumbbell,
  Gamepad2,
  Home,
  Utensils,
} from 'lucide-react'

export type NavigationItem = {
  path: string
  label: string
  description: string
  icon: typeof Home
  accent: string
  accentSoft: string
}

export const navigationItems: NavigationItem[] = [
  {
    path: '/',
    label: '首页总览',
    description: '今天与重要摘要',
    icon: Home,
    accent: '#1f6f5f',
    accentSoft: '#e9f5f0',
  },
  {
    path: '/today',
    label: '今日计划',
    description: '今天的行动安排',
    icon: CalendarCheck2,
    accent: '#2563eb',
    accentSoft: '#eaf1ff',
  },
  {
    path: '/self-media',
    label: '自媒体',
    description: '选题、发布与复盘',
    icon: Clapperboard,
    accent: '#d946a6',
    accentSoft: '#fcebf7',
  },
  {
    path: '/development',
    label: '开发工作',
    description: '项目、任务与阻塞',
    icon: Code2,
    accent: '#0e87c7',
    accentSoft: '#e7f6fe',
  },
  {
    path: '/consulting',
    label: '咨询工作',
    description: '客户、会议与跟进',
    icon: Briefcase,
    accent: '#d97706',
    accentSoft: '#fff5df',
  },
  {
    path: '/fitness',
    label: '健身计划',
    description: '训练、动作与指标',
    icon: Dumbbell,
    accent: '#dc3f4d',
    accentSoft: '#ffedef',
  },
  {
    path: '/diet',
    label: '饮食计划',
    description: '饮食、饮水与采购',
    icon: Utensils,
    accent: '#149447',
    accentSoft: '#eaf8ee',
  },
  {
    path: '/games',
    label: '游戏娱乐',
    description: '游戏、进度与感想',
    icon: Gamepad2,
    accent: '#7350d8',
    accentSoft: '#f0ebff',
  },
  {
    path: '/data-design',
    label: '数据与设计',
    description: '项目、来源与交付',
    icon: BarChart3,
    accent: '#078ba4',
    accentSoft: '#e6f7fa',
  },
  {
    path: '/learning',
    label: '学习计划',
    description: '进度、笔记与复习',
    icon: BookOpen,
    accent: '#df5b20',
    accentSoft: '#fff0e7',
  },
]
