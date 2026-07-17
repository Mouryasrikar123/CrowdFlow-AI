import fs from 'fs';
import path from 'path';

export interface User {
  user_id: string;
  username: string;
  password?: string;
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
  activity_id: string;
  gate_id: string;
  action: 'arrival' | 'exit';
  timestamp: string;
}

export interface DatabaseSchema {
  users: User[];
  gates: Gate[];
  activities: Activity[];
}

const DB_FILE = path.join(process.cwd(), 'crowdflow_db.json');

// Initial seed data
const DEFAULT_DB: DatabaseSchema = {
  users: [
    { user_id: 'u1', username: 'admin', password: 'admin123', role: 'admin' },
    { user_id: 'u2', username: 'volunteer1', password: 'volunteer123', role: 'volunteer' },
    { user_id: 'u3', username: 'volunteer2', password: 'volunteer123', role: 'volunteer' }
  ],
  gates: [
    { gate_id: 'g1', gate_name: 'Gate A - North Main Entrance', capacity: 600, current_count: 145, status: 'active' },
    { gate_id: 'g2', gate_name: 'Gate B - South Parking Plaza', capacity: 400, current_count: 360, status: 'active' },
    { gate_id: 'g3', gate_name: 'Gate C - East Ticket Concourse', capacity: 300, current_count: 55, status: 'active' },
    { gate_id: 'g4', gate_name: 'Gate D - West VIP & Transit Link', capacity: 200, current_count: 185, status: 'active' },
    { gate_id: 'g5', gate_name: 'Gate E - Arena Boulevard Gate', capacity: 500, current_count: 150, status: 'active' }
  ],
  activities: [
    { activity_id: 'act_1', gate_id: 'g1', action: 'arrival', timestamp: new Date(Date.now() - 3600000 * 4).toISOString() },
    { activity_id: 'act_2', gate_id: 'g2', action: 'arrival', timestamp: new Date(Date.now() - 3600000 * 3).toISOString() },
    { activity_id: 'act_3', gate_id: 'g3', action: 'exit', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
    { activity_id: 'act_4', gate_id: 'g4', action: 'arrival', timestamp: new Date(Date.now() - 3600000 * 1).toISOString() }
  ]
};

export class JSONDatabase {
  private static getDB(): DatabaseSchema {
    try {
      if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8');
        return DEFAULT_DB;
      }
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading database file:', error);
      return DEFAULT_DB;
    }
  }

  private static saveDB(db: DatabaseSchema): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving database file:', error);
    }
  }

  // Auth helper
  public static findUser(username: string): User | undefined {
    const db = this.getDB();
    return db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  // Gates helper
  public static getGates(): Gate[] {
    const db = this.getDB();
    return db.gates;
  }

  public static updateGate(gate_id: string, updates: Partial<Gate>): Gate | undefined {
    const db = this.getDB();
    const idx = db.gates.findIndex(g => g.gate_id === gate_id);
    if (idx === -1) return undefined;

    db.gates[idx] = { ...db.gates[idx], ...updates };
    this.saveDB(db);
    return db.gates[idx];
  }

  public static addGate(gate: Omit<Gate, 'gate_id'>): Gate {
    const db = this.getDB();
    const newGate: Gate = {
      ...gate,
      gate_id: 'g_' + Math.random().toString(36).substr(2, 9)
    };
    db.gates.push(newGate);
    this.saveDB(db);
    return newGate;
  }

  // Arrival counter increment
  public static handleArrival(gate_id: string): Gate | undefined {
    const db = this.getDB();
    const gateIdx = db.gates.findIndex(g => g.gate_id === gate_id);
    if (gateIdx === -1) return undefined;

    const gate = db.gates[gateIdx];
    gate.current_count = Math.min(gate.capacity * 1.5, gate.current_count + 1); // allow slight overflow but cap it

    // Log Activity
    const newActivity: Activity = {
      activity_id: 'act_' + Math.random().toString(36).substr(2, 9),
      gate_id,
      action: 'arrival',
      timestamp: new Date().toISOString()
    };
    db.activities.push(newActivity);
    
    this.saveDB(db);
    return gate;
  }

  // Exit counter decrement
  public static handleExit(gate_id: string): Gate | undefined {
    const db = this.getDB();
    const gateIdx = db.gates.findIndex(g => g.gate_id === gate_id);
    if (gateIdx === -1) return undefined;

    const gate = db.gates[gateIdx];
    gate.current_count = Math.max(0, gate.current_count - 1);

    // Log Activity
    const newActivity: Activity = {
      activity_id: 'act_' + Math.random().toString(36).substr(2, 9),
      gate_id,
      action: 'exit',
      timestamp: new Date().toISOString()
    };
    db.activities.push(newActivity);
    
    this.saveDB(db);
    return gate;
  }

  // Get full metrics & activity history
  public static getDashboardMetrics() {
    const db = this.getDB();
    const totalCapacity = db.gates.reduce((sum, g) => sum + g.capacity, 0);
    const totalCurrentCount = db.gates.reduce((sum, g) => sum + g.current_count, 0);
    const activeGatesCount = db.gates.filter(g => g.status === 'active').length;
    
    // Is there any gate that has more than 90% crowd?
    const highCrowdGate = db.gates.some(g => (g.current_count / g.capacity) >= 0.9);
    const emergencyStatus = highCrowdGate ? 'critical' : totalCurrentCount > totalCapacity * 0.8 ? 'warning' : 'nominal';

    // Mock peak hour metrics based on current counts
    const peakHoursData = [
      { time: '08:00', count: Math.round(totalCurrentCount * 0.3) },
      { time: '10:00', count: Math.round(totalCurrentCount * 0.5) },
      { time: '12:00', count: Math.round(totalCurrentCount * 0.7) },
      { time: '14:00', count: Math.round(totalCurrentCount * 0.95) },
      { time: '16:00', count: Math.round(totalCurrentCount * 0.8) },
      { time: '18:00', count: Math.round(totalCurrentCount * 0.4) }
    ];

    // Recent Activity mapping
    const recentActivities = [...db.activities]
      .reverse()
      .slice(0, 10)
      .map(act => {
        const gate = db.gates.find(g => g.gate_id === act.gate_id);
        return {
          id: act.activity_id,
          gate_name: gate ? gate.gate_name : 'Unknown Gate',
          action: act.action,
          timestamp: act.timestamp
        };
      });

    return {
      totalVisitors: totalCurrentCount + 540, // Simulated total visitors across the entire day
      currentCrowd: totalCurrentCount,
      totalCapacity,
      activeGates: activeGatesCount,
      totalGates: db.gates.length,
      emergencyStatus,
      peakHours: peakHoursData,
      recentActivities
    };
  }
}
