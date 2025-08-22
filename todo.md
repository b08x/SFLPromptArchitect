* **Backup and Recovery**:
  * **PostgreSQL**: Use `pg_dump` for daily logical backups, stored in a secure cloud bucket (e.g., S3). For production, enable Point-in-Time Recovery (PITR) using continuous archiving of WAL files.
