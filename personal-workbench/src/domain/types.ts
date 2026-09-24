export type Priority = 'low' | 'medium' | 'high'
export type ActionStatus = 'pending' | 'in_progress' | 'completed'

export type BaseRecord = {
  id: string
  createdAt: string
  updatedAt: string
}

export type QuickNoteStatus = 'open' | 'processed' | 'converted'

export type QuickNote = BaseRecord & {
  text: string
  status: QuickNoteStatus
  convertedTo?: string
}

export type StandaloneTask = BaseRecord & {
  title: string
  notes?: string
  plannedDate: string
  startTime?: string
  endTime?: string
  priority: Priority
  status: ActionStatus
  completedAt?: string
}

export type SelfMediaStage =
  | 'idea'
  | 'topic'
  | 'drafting'
  | 'ready'
  | 'published'
  | 'review'

export type SelfMediaItem = BaseRecord & {
  title: string
  platform: string
  contentType: string
  stage: SelfMediaStage
  plannedPublishDate?: string
  publishedAt?: string
  link?: string
  outline?: string
  nextAction?: string
  reviewNotes?: string
  actionTitle?: string
  plannedActionDate?: string
  priority: Priority
  actionStatus: ActionStatus
  completedAt?: string
}

export type SelfMediaMetric = BaseRecord & {
  itemId: string
  date: string
  views?: number
  likes?: number
  comments?: number
  shares?: number
  note?: string
}

export type DevProjectStatus = 'active' | 'paused' | 'completed' | 'archived'
export type DevItemType = 'task' | 'bug'

export type DevProject = BaseRecord & {
  name: string
  description?: string
  status: DevProjectStatus
}

export type DevItem = BaseRecord & {
  projectId: string
  title: string
  type: DevItemType
  priority: Priority
  status: ActionStatus | 'blocked'
  milestone?: string
  dueDate?: string
  plannedDate?: string
  blocker?: string
  nextAction?: string
  completedAt?: string
}

export type WorkLog = BaseRecord & {
  projectId?: string
  itemId?: string
  date: string
  durationMinutes: number
  note?: string
}

export type ConsultingClient = BaseRecord & {
  name: string
  contact?: string
  notes?: string
  status: 'active' | 'inactive'
}

export type ConsultingProject = BaseRecord & {
  clientId: string
  name: string
  objective?: string
  status: 'planning' | 'active' | 'paused' | 'completed'
  startDate?: string
  endDate?: string
}

export type ConsultingMeeting = BaseRecord & {
  projectId: string
  date: string
  title: string
  participants?: string
  notes?: string
}

export type ConsultingAction = BaseRecord & {
  projectId: string
  meetingId?: string
  title: string
  ownerNote?: string
  dueDate?: string
  plannedDate?: string
  status: ActionStatus
  result?: string
  completedAt?: string
}

export type ConsultingTimeEntry = BaseRecord & {
  projectId: string
  date: string
  durationMinutes: number
  fee?: number
  note?: string
}

export type PlannedExercise = {
  name: string
  sets?: number
  reps?: number
  weight?: number
  durationMinutes?: number
}

export type FitnessPlan = BaseRecord & {
  dayOfWeek: number
  title: string
  exercises: PlannedExercise[]
  notes?: string
}

export type WorkoutSession = BaseRecord & {
  planId?: string
  date: string
  plannedDate?: string
  title: string
  status: ActionStatus | 'partial'
  notes?: string
  completedAt?: string
}

export type WorkoutEntry = BaseRecord & {
  sessionId: string
  exerciseName: string
  sets?: number
  reps?: number
  weight?: number
  durationMinutes?: number
}

export type BodyMetric = BaseRecord & {
  date: string
  weight?: number
  waist?: number
  chest?: number
  note?: string
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export type MealPlan = BaseRecord & {
  date: string
  mealType: MealType
  plannedItems: string
  status: ActionStatus
  note?: string
}

export type MealLog = BaseRecord & {
  date: string
  mealType: MealType
  actualItems: string
  feeling?: string
}

export type WaterLog = BaseRecord & {
  date: string
  amountMl: number
}

export type ShoppingItem = BaseRecord & {
  name: string
  quantity?: string
  purchased: boolean
  plannedDate?: string
}

export type GameStatus =
  | 'wishlist'
  | 'playing'
  | 'paused'
  | 'completed'
  | 'dropped'

export type Game = BaseRecord & {
  name: string
  platform: string
  status: GameStatus
  priority: Priority
  coverPath?: string
  estimatedHours?: number
  progress?: string
  rating?: number
  review?: string
  completedAt?: string
}

export type PlaySession = BaseRecord & {
  gameId: string
  date: string
  plannedDate?: string
  durationMinutes: number
  progress?: string
  notes?: string
  status?: ActionStatus
}

export type DataDesignType = 'data' | 'design'

export type DataDesignProject = BaseRecord & {
  name: string
  type: DataDesignType
  objective?: string
  status: 'planning' | 'active' | 'blocked' | 'completed'
  priority: Priority
  dueDate?: string
  plannedDate?: string
  sourceLinks?: string[]
  notes?: string
  nextAction?: string
  completedAt?: string
}

export type DataDesignDeliverable = BaseRecord & {
  projectId: string
  name: string
  status: 'draft' | 'review' | 'delivered'
  version: string
  link?: string
  notes?: string
}

export type LearningType = 'course' | 'book' | 'skill'

export type LearningItem = BaseRecord & {
  title: string
  type: LearningType
  goal?: string
  status: 'planned' | 'in_progress' | 'paused' | 'completed'
  progress: number
  outline?: string
  nextReviewDate?: string
  completedAt?: string
}

export type LearningSession = BaseRecord & {
  itemId: string
  date: string
  plannedDate?: string
  durationMinutes: number
  progress: number
  status: ActionStatus
  note?: string
  completedAt?: string
}

export type LearningNote = BaseRecord & {
  itemId: string
  content: string
  question?: string
  reviewStatus: 'new' | 'reviewing' | 'mastered'
  reviewDate?: string
}
