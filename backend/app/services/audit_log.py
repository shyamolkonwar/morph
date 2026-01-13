"""
Audit Logging Service
Track generation iterations and refinement history
"""

import os
from typing import Optional
from dataclasses import dataclass
from datetime import datetime


@dataclass
class AuditLogEntry:
    """Single audit log entry"""
    id: str
    generation_id: str
    iteration_number: int
    verification_errors: dict
    agent_action: Optional[str]
    svg_before: Optional[str]
    svg_after: Optional[str]
    duration_ms: Optional[int]
    created_at: datetime


class AuditLogService:
    """Track iterative refinement for debugging and analytics"""
    
    def __init__(self):
        self._client = None
    
    @property
    def client(self):
        """Lazy load Supabase client"""
        if self._client is None:
            from supabase import create_client
            
            url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
            key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
            
            if not url or not key:
                raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required")
            
            self._client = create_client(url, key)
        return self._client
    
    async def log_iteration(
        self,
        generation_id: str,
        iteration_number: int,
        verification_errors: dict,
        agent_action: Optional[str] = None,
        svg_before: Optional[str] = None,
        svg_after: Optional[str] = None,
        duration_ms: Optional[int] = None,
    ) -> str:
        """
        Log a refinement iteration.
        
        Args:
            generation_id: The generation this belongs to
            iteration_number: Which iteration (1, 2, 3...)
            verification_errors: What failed in verification
            agent_action: What the agent did to fix it
            svg_before: SVG before correction
            svg_after: SVG after correction
            duration_ms: Time taken for this iteration
            
        Returns:
            Log entry ID
        """
        result = self.client.table("refinement_audit_logs").insert({
            "generation_id": generation_id,
            "iteration_number": iteration_number,
            "verification_errors": verification_errors,
            "agent_action": agent_action,
            "svg_before": svg_before,
            "svg_after": svg_after,
            "duration_ms": duration_ms,
        }).execute()
        
        return result.data[0]["id"]
    
    async def get_generation_history(
        self,
        generation_id: str
    ) -> list[AuditLogEntry]:
        """
        Get full audit history for a generation.
        
        Args:
            generation_id: The generation ID
            
        Returns:
            List of audit log entries ordered by iteration
        """
        result = self.client.table("refinement_audit_logs").select("*").eq(
            "generation_id", generation_id
        ).order("iteration_number").execute()
        
        entries = []
        for row in result.data or []:
            entries.append(AuditLogEntry(
                id=row["id"],
                generation_id=row["generation_id"],
                iteration_number=row["iteration_number"],
                verification_errors=row.get("verification_errors", {}),
                agent_action=row.get("agent_action"),
                svg_before=row.get("svg_before"),
                svg_after=row.get("svg_after"),
                duration_ms=row.get("duration_ms"),
                created_at=datetime.fromisoformat(row["created_at"].replace("Z", "+00:00")),
            ))
        
        return entries
    
    async def update_generation(
        self,
        generation_id: str,
        constraint_graph: Optional[dict] = None,
        svg_output: Optional[str] = None,
        verification_status: Optional[str] = None,
        verification_report: Optional[dict] = None,
        iteration_count: Optional[int] = None,
        retrieved_patterns: Optional[list[str]] = None,
    ) -> None:
        """
        Update generation record with design pipeline state.
        
        Args:
            generation_id: Generation to update
            constraint_graph: The calculated constraint graph
            svg_output: Final SVG code
            verification_status: Pass/fail status
            verification_report: Full verification result
            iteration_count: Number of iterations taken
            retrieved_patterns: Pattern IDs used in RAG
        """
        update_data = {}
        
        if constraint_graph is not None:
            update_data["constraint_graph"] = constraint_graph
        if svg_output is not None:
            update_data["svg_output"] = svg_output
        if verification_status is not None:
            update_data["verification_status"] = verification_status
        if verification_report is not None:
            update_data["verification_report"] = verification_report
        if iteration_count is not None:
            update_data["iteration_count"] = iteration_count
        if retrieved_patterns is not None:
            update_data["retrieved_patterns"] = retrieved_patterns
        
        if update_data:
            self.client.table("generations").update(update_data).eq(
                "id", generation_id
            ).execute()


_audit_service: Optional[AuditLogService] = None


def get_audit_service() -> AuditLogService:
    """Get singleton audit log service"""
    global _audit_service
    if _audit_service is None:
        _audit_service = AuditLogService()
    return _audit_service
