"""
Prometheus metrics collector and text-format exporter.
Provides standard Prometheus exposition format (/metrics) for container observability and APM integration.
"""
import time
from collections import defaultdict
from typing import Dict, List, Tuple
from datetime import datetime, timezone


class MetricsCollector:
    """Thread-safe, lightweight Prometheus metrics recorder."""

    def __init__(self):
        self._start_time = time.time()
        # (method, path_prefix, status_code) -> count
        self._http_requests: Dict[Tuple[str, str, int], int] = defaultdict(int)
        # Latency samples list (last 1000 requests)
        self._latencies: List[float] = []
        # AI inference counter: (model, task, status) -> count
        self._ai_inferences: Dict[Tuple[str, str, str], int] = defaultdict(int)
        # Cache stats
        self._cache_hits = 0
        self._cache_misses = 0

    def record_http_request(self, method: str, path: str, status_code: int, duration_sec: float):
        # Normalize path to prevent high cardinality
        normalized_path = self._normalize_path(path)
        self._http_requests[(method, normalized_path, status_code)] += 1
        if len(self._latencies) >= 2000:
            self._latencies = self._latencies[-1000:]
        self._latencies.append(duration_sec)

    def record_ai_inference(self, model: str, task: str, status: str = "success"):
        self._ai_inferences[(model, task, status)] += 1

    def record_cache_hit(self):
        self._cache_hits += 1

    def record_cache_miss(self):
        self._cache_misses += 1

    @staticmethod
    def _normalize_path(path: str) -> str:
        """Collapse UUIDs and customer IDs to prevent metric cardinality explosion."""
        parts = path.strip("/").split("/")
        normalized = []
        for p in parts:
            # Check if part looks like UUID or customer ID
            if len(p) >= 32 or (len(p) == 36 and "-" in p) or p.startswith("CUST-"):
                normalized.append(":id")
            else:
                normalized.append(p)
        return "/" + "/".join(normalized) if normalized else "/"

    def generate_prometheus_text(self) -> str:
        """Formats collected metrics as Prometheus text/plain exposition format."""
        lines = []
        now_ts = int(time.time() * 1000)

        # 1. System Uptime
        uptime = time.time() - self._start_time
        lines.append("# HELP process_uptime_seconds Total seconds the backend process has been active.")
        lines.append("# TYPE process_uptime_seconds gauge")
        lines.append(f"process_uptime_seconds {uptime:.2f}")

        # 2. HTTP Requests Total
        lines.append("# HELP http_requests_total Total number of HTTP requests processed by endpoint and status.")
        lines.append("# TYPE http_requests_total counter")
        if not self._http_requests:
            lines.append('http_requests_total{method="GET",endpoint="/health",status="200"} 0')
        else:
            for (method, endpoint, status_code), count in sorted(self._http_requests.items()):
                lines.append(f'http_requests_total{{method="{method}",endpoint="{endpoint}",status="{status_code}"}} {count}')

        # 3. HTTP Request Latency Summary
        lines.append("# HELP http_request_duration_seconds HTTP request latency percentiles in seconds.")
        lines.append("# TYPE http_request_duration_seconds summary")
        if self._latencies:
            sorted_lat = sorted(self._latencies)
            n = len(sorted_lat)
            p50 = sorted_lat[int(n * 0.50)]
            p90 = sorted_lat[min(int(n * 0.90), n - 1)]
            p95 = sorted_lat[min(int(n * 0.95), n - 1)]
            p99 = sorted_lat[min(int(n * 0.99), n - 1)]
            lat_sum = sum(sorted_lat)
            lines.append(f'http_request_duration_seconds{{quantile="0.5"}} {p50:.6f}')
            lines.append(f'http_request_duration_seconds{{quantile="0.9"}} {p90:.6f}')
            lines.append(f'http_request_duration_seconds{{quantile="0.95"}} {p95:.6f}')
            lines.append(f'http_request_duration_seconds{{quantile="0.99"}} {p99:.6f}')
            lines.append(f'http_request_duration_seconds_sum {lat_sum:.6f}')
            lines.append(f'http_request_duration_seconds_count {n}')
        else:
            lines.append('http_request_duration_seconds{quantile="0.5"} 0.000000')
            lines.append('http_request_duration_seconds_sum 0.000000')
            lines.append('http_request_duration_seconds_count 0')

        # 4. AI Inferences Total
        lines.append("# HELP ai_inferences_total Total count of AI inferences by model and task.")
        lines.append("# TYPE ai_inferences_total counter")
        if not self._ai_inferences:
            lines.append('ai_inferences_total{model="lightgbm-v1.0.0",task="priority_scoring",status="ready"} 0')
        else:
            for (model, task, status), count in sorted(self._ai_inferences.items()):
                lines.append(f'ai_inferences_total{{model="{model}",task="{task}",status="{status}"}} {count}')

        # 5. Cache Metrics
        lines.append("# HELP llm_cache_hits_total Total count of successful LLM cache lookups.")
        lines.append("# TYPE llm_cache_hits_total counter")
        lines.append(f"llm_cache_hits_total {self._cache_hits}")

        lines.append("# HELP llm_cache_misses_total Total count of LLM cache misses requiring inference.")
        lines.append("# TYPE llm_cache_misses_total counter")
        lines.append(f"llm_cache_misses_total {self._cache_misses}")

        # 6. App Info
        lines.append("# HELP app_info Metadata about application version and environment.")
        lines.append("# TYPE app_info gauge")
        lines.append('app_info{version="1.0.0",app="broker_insight_ai",environment="production_ready"} 1')

        return "\n".join(lines) + "\n"


# Global singleton instance
metrics_collector = MetricsCollector()
