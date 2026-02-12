import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Play,
  Pause,
  CheckSquare,
  LucideIcon
} from 'lucide-react'

export interface TaskStatusColumn {
  id: string
  title: string
  color: string
  icon: LucideIcon
  headerColor: string
}

export const TASK_STATUS_COLUMNS: TaskStatusColumn[] = [
  { 
    id: 'OPEN', 
    title: 'Open', 
    color: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: Clock,
    headerColor: 'bg-slate-100 border-slate-200'
  },
  { 
    id: 'TODO', 
    title: 'To Do', 
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Clock,
    headerColor: 'bg-blue-100 border-blue-200'
  },
  { 
    id: 'IN_PROGRESS', 
    title: 'In Progress', 
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Play,
    headerColor: 'bg-amber-100 border-amber-200'
  },
  { 
    id: 'ON_HOLD', 
    title: 'On Hold', 
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: Pause,
    headerColor: 'bg-orange-100 border-orange-200'
  },
  { 
    id: 'DONE', 
    title: 'Done', 
    color: 'bg-green-50 text-green-700 border-green-200',
    icon: CheckSquare,
    headerColor: 'bg-green-100 border-green-200'
  },
  { 
    id: 'COMPLETED', 
    title: 'Completed', 
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle,
    headerColor: 'bg-emerald-100 border-emerald-200'
  },
]

export const FOLLOW_UP_STATUS_COLUMNS: TaskStatusColumn[] = [
  { 
    id: 'OPEN', 
    title: 'Open', 
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    icon: Clock,
    headerColor: 'bg-yellow-100 border-yellow-200'
  },
  { 
    id: 'TODO', 
    title: 'To Do', 
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Clock,
    headerColor: 'bg-blue-100 border-blue-200'
  },
  { 
    id: 'IN_PROGRESS', 
    title: 'In Progress', 
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock,
    headerColor: 'bg-amber-100 border-amber-200'
  },
  { 
    id: 'DONE', 
    title: 'Done', 
    color: 'bg-green-50 text-green-700 border-green-200',
    icon: CheckCircle,
    headerColor: 'bg-green-100 border-green-200'
  },
  { 
    id: 'COMPLETED', 
    title: 'Completed', 
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle,
    headerColor: 'bg-emerald-100 border-emerald-200'
  },
  { 
    id: 'ON_HOLD', 
    title: 'On Hold', 
    color: 'bg-gray-50 text-gray-700 border-gray-200',
    icon: AlertCircle,
    headerColor: 'bg-gray-100 border-gray-200'
  },
]

// Helper function to get status icon
export const getTaskStatusIcon = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return CheckCircle
    case 'DONE':
      return CheckSquare
    case 'IN_PROGRESS':
      return Play
    case 'ON_HOLD':
      return Pause
    case 'OPEN':
    case 'TODO':
      return Clock
    default:
      return Clock
  }
}

// Helper function to get status color
export const getTaskStatusColor = (status: string): string => {
  const column = TASK_STATUS_COLUMNS.find(col => col.id === status) || 
                 FOLLOW_UP_STATUS_COLUMNS.find(col => col.id === status)
  return column?.color || 'bg-gray-50 text-gray-700 border-gray-200'
}

// Helper function to get status info
export const getTaskStatusInfo = (status: string) => {
  const column = TASK_STATUS_COLUMNS.find(col => col.id === status) || 
                 FOLLOW_UP_STATUS_COLUMNS.find(col => col.id === status)
  
  if (column) {
    return {
      color: column.color,
      icon: column.icon,
      label: column.title
    }
  }
  
  return {
    color: 'bg-gray-50 text-gray-700 border-gray-200',
    icon: Clock,
    label: status.replace(/_/g, ' ')
  }
}

// Helper to normalize seeker status
export const normalizeStatusHelper = (status: string): string => {
  const statusMap: Record<string, string> = {
    'NEW': 'PENDING',
    'ATTEMPTING_CONTACT': 'IN_PROGRESS',
    'CONNECTED': 'IN_PROGRESS',
    'QUALIFIED': 'IN_PROGRESS',
    'COUNSELING_SCHEDULED': 'IN_PROGRESS',
    'CONSIDERING': 'IN_PROGRESS',
    'READY_TO_REGISTER': 'IN_PROGRESS',
    'LOST': 'NOT_INTERESTED',
  }
  return statusMap[status] || status
}

// Check if task is read-only (seeker has final status)
export const isTaskReadOnly = (seekerStage?: string, registerNow?: boolean): boolean => {
  if (registerNow) return true
  if (!seekerStage) return false
  
  const normalizedStatus = normalizeStatusHelper(seekerStage)
  const finalStatuses = ['REGISTERED', 'NOT_INTERESTED', 'COMPLETED', 'LOST']
  return finalStatuses.includes(normalizedStatus)
}

// Priority colors
export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'URGENT':
      return 'bg-red-50 text-red-700 border-red-200'
    case 'HIGH':
      return 'bg-orange-50 text-orange-700 border-orange-200'
    case 'MEDIUM':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200'
    case 'LOW':
      return 'bg-gray-50 text-gray-700 border-gray-200'
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200'
  }
}

// Type guards
export const isFollowUpTask = (task: any): task is {
  purpose: string
  dueAt: string
  seeker: any
} => {
  return 'purpose' in task && 'dueAt' in task && 'seeker' in task
}

export const isRegularTask = (task: any): task is {
  title: string
  priority: string
} => {
  return 'title' in task && 'priority' in task && !('purpose' in task)
}
