export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8001/api/v1').replace(/\/$/, '');

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  // Normalize path so it doesn't double prepend /api/v1
  let cleanPath = path;
  if (API_BASE.endsWith('/api/v1') && cleanPath.startsWith('/api/v1')) {
    cleanPath = cleanPath.replace(/^\/api\/v1/, '');
  }
  if (!cleanPath.startsWith('/')) {
    cleanPath = `/${cleanPath}`;
  }

  const url = `${API_BASE}${cleanPath}`;
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      let errMsg = `API error ${res.status}`;
      try {
        const errorJson = await res.json();
        errMsg = errorJson.detail || errorJson.message || errMsg;
      } catch {
        const text = await res.text();
        if (text) errMsg = text;
      }
      throw new Error(errMsg);
    }

    if (res.status === 204) return undefined as T;
    return await res.json();
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Backend API is unavailable. Ensure the FastAPI server is running on port 8000.');
    }
    throw err;
  }
}

export function getReportDownloadUrl(scanId: number | string, format: 'json' | 'csv' | 'html'): string {
  return `${API_BASE}/reports/scans/${scanId}.${format}`;
}

export function getFindingsCsvUrl(): string {
  return `${API_BASE}/reports/findings.csv`;
}

// -------------------------------------------------------------
// Type Definitions
// -------------------------------------------------------------

export interface TestCase {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  prompt: string;
  expected_behavior: string;
  evaluation_rule: string;
  remediation: string;
  is_attack: boolean;
  enabled: boolean;
  tags: string;
}

export interface TestResult {
  id: number;
  scan_id: number;
  test_id: string;
  test: TestCase;
  outcome: 'passed' | 'failed' | 'review' | 'error';
  response: string;
  evidence: string;
  explanation: string;
  defense_events: string[];
  duration_ms: number;
  finding_id?: number | null;
}

export interface ScanMetrics {
  total: number;
  passed: number;
  failed: number;
  review: number;
  error: number;
  attack_tests_count: number;
  benign_tests_count: number;
  attack_success_rate: number | null;
  test_pass_rate: number | null;
  benign_false_positive_rate: number | null;
}

export interface Scan {
  id: number;
  name: string;
  target_id: string;
  mode: 'baseline' | 'protected';
  status: 'queued' | 'running' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string | null;
  duration_ms: number;
  metrics: ScanMetrics;
  results: TestResult[];
}

export interface Finding {
  id: number;
  scan_id: number;
  test_result_id?: number | null;
  key: string;
  title: string;
  description: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  evidence: string;
  remediation: string;
  status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk';
  note: string;
  created_at: string;
  updated_at?: string | null;
}

export interface Defense {
  id: string;
  name: string;
  category: string;
  description: string;
  protects_against: string;
  limitations: string;
  safe_example: string;
  enabled: boolean;
  updated_at?: string | null;
}

export interface Target {
  id: string;
  name: string;
  description: string;
  target_type: string;
  system_instructions: string;
  public_faq: string;
  synthetic_secret: string;
  allowed_capabilities: string[];
  restricted_capabilities: string[];
  authorized: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardSummary {
  total_scans: number;
  completed_scans: number;
  passed_tests: number;
  failed_tests: number;
  review_tests: number;
  attack_success_rate: number | null;
  baseline_scans_count: number;
  protected_scans_count: number;
  open_findings_count: number;
  critical_findings_count: number;
  findings_by_severity: { severity: string; count: number }[];
  results_by_category: { category: string; total: number; passed: number; failed: number; review: number }[];
  recent_scans: Scan[];
}

export interface ComparisonRow {
  test_id: string;
  name: string;
  category: string;
  severity: string;
  is_attack: boolean;
  baseline_outcome: string;
  protected_outcome: string;
  status_change: 'BLOCKED_BY_DEFENSE' | 'PERSISTENT_FAILURE' | 'CONSISTENT_PASS' | 'FALSE_POSITIVE' | 'REGRESSION' | 'OTHER';
  explanation: string;
}

export interface ComparisonResponse {
  scan_a: Scan;
  scan_b: Scan;
  matching_test_ids: string[];
  attack_success_rate_a: number | null;
  attack_success_rate_b: number | null;
  rate_difference_percentage_points: number | null;
  newly_blocked_count: number;
  persistent_failures_count: number;
  false_positives_count: number;
  rows: ComparisonRow[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  security_events?: string[];
  mode?: 'baseline' | 'protected';
}
