# Deprecated Database Schemas

## Migration Notice

The following legacy schema files have been deprecated in favor of the new PostgreSQL-specific schemas located in `packages/database/src/schemas/pg/`.

### Migration Path

| Legacy File | New Location | Status |
|-------------|--------------|--------|
| `user.ts` | `pg/auth.ts` | ✅ Migrated |
| `course.ts` | `pg/academic.ts` | ✅ Migrated |
| `enrollment.ts` | `pg/student.ts` | ✅ Migrated |

### Changes Summary

1. **Schema Namespacing**: All tables now use PostgreSQL schemas:
   - `auth` schema: users, sessions, accounts, organizations
   - `academic` schema: courses, modules, lessons, departments
   - `student` schema: students, enrollments, progress, assignments
   - `certification` schema: certificates, blanks, registry
   - `finance` schema: invoices, payments, fee schedules

2. **Type Changes**:
   - Primary keys: Changed from `text` to `uuid` with `.defaultRandom()`
   - Timestamps: Now include `{ withTimezone: true }` option
   - Enums: Using `pgEnum()` for better PostgreSQL integration

3. **Table Renames**:
   - `users` → `auth.users`
   - `courses` → `academic.courses`
   - `enrollments` → `student.enrollments`
   - `grades` → `student.enrollments.finalGrade`

### Migration Timeline

- **Phase 1** (Complete): Unify exports to use pg schemas
- **Phase 2** (Pending): Migrate service implementations
- **Phase 3** (Pending): Database migration scripts
- **Phase 4** (Pending): Remove deprecated files

### Usage

```typescript
// OLD (Deprecated)
import { users, courses } from '@thai-binh/database';

// NEW (Current)
import { users } from '@thai-binh/database/schemas/pg/auth';
import { courses } from '@thai-binh/database/schemas/pg/academic';
```

**Note**: These deprecated files will be removed in v1.0.0
