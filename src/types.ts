export interface User {
  user_id: string;
  username: string;
  role: 'admin' | 'volunteer';
}

export interface Gate {
  gate_id: string;
  gate_name: string;
  capacity: number;
  current_count: number;
  status: 'active' | 'closed' | 'restricted';
}

export interface Activity {
  id: string;
  gate_name: string;
  action: 'arrival' | 'exit';
  timestamp: string;
}

export interface DashboardMetrics {
  totalVisitors: number;
  currentCrowd: number;
  totalCapacity: number;
  activeGates: number;
  totalGates: number;
  emergencyStatus: 'nominal' | 'warning' | 'critical';
  peakHours: { time: string; count: number }[];
  recentActivities: Activity[];
  gates: Gate[];
}

export interface Recommendation {
  recommended_gate_id: string;
  reasoning: string;
  safety_status: 'nominal' | 'warning' | 'critical';
  estimated_wait_time_minutes: number;
  safety_advisory: string;
  isAI?: boolean;
  error?: string;
}
