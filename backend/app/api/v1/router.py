from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.comparison import router as comparison_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.defenses import router as defenses_router
from app.api.v1.findings import router as findings_router
from app.api.v1.health import router as health_router
from app.api.v1.reports import router as reports_router
from app.api.v1.sandbox import router as sandbox_router
from app.api.v1.scans import router as scans_router
from app.api.v1.settings import router as settings_router
from app.api.v1.targets import router as targets_router
from app.api.v1.tests import router as tests_router

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(health_router)
api_v1_router.include_router(dashboard_router)
api_v1_router.include_router(targets_router)
api_v1_router.include_router(sandbox_router)
api_v1_router.include_router(tests_router)
api_v1_router.include_router(scans_router)
api_v1_router.include_router(findings_router)
api_v1_router.include_router(defenses_router)
api_v1_router.include_router(comparison_router)
api_v1_router.include_router(reports_router)
api_v1_router.include_router(settings_router)
