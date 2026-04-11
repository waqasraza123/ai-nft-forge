CREATE INDEX "audit_logs_entity_type_entity_id_created_at_idx"
  ON "audit_logs"("entity_type", "entity_id", "created_at");
