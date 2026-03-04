# API Versioning Strategy

## Current Implementation

The OnlySurf API uses **URI Versioning** as per [NestJS best practices](https://docs.nestjs.com/techniques/versioning), where version information is passed in the URI.

### Structure

```
src/
├── auth/              # Core authentication
├── common/            # Shared utilities (decorators, guards, etc.)
├── config/            # Configuration modules
├── health/            # Health check endpoint
├── prisma/            # Database service
├── academies/         # Academy management API
├── athletes/          # Athlete management API
├── billing/           # Stripe billing API
├── media/             # Mux video upload API
├── saved-waves/       # Saved waves archive API
├── sessions/          # Session management API
└── waves/             # Wave clips API
```

### How It Works

1. **URI Versioning**: Configured in `main.ts` using NestJS's built-in versioning
   ```typescript
   app.enableVersioning({
     type: VersioningType.URI,
     defaultVersion: '1',
   });
   ```

2. **Default Version**: All controllers automatically use version 1 (`/v1/`)
   - No need to add `@Version` decorators to controllers
   - Routes automatically become: `/v1/academies`, `/v1/sessions`, etc.

3. **Controller Structure**: Controllers are defined without version prefixes
   ```typescript
   @Controller('academies')  // Automatically becomes /v1/academies
   export class AcademiesController { }
   ```

### Example Routes

```
GET  /v1/health                    # Health check
POST /v1/auth/session              # Create session
GET  /v1/academies/:id             # Get academy
POST /v1/sessions                  # Create session
GET  /v1/waves?sessionId=xyz       # List waves
POST /v1/billing/checkout          # Stripe checkout
```

## Future: Adding Version 2

When you need to introduce breaking changes, you can use NestJS's `@Version()` decorator.

### Approach: Version Decorator on Methods

The most flexible approach is to add `@Version()` decorators to specific routes that change:

```typescript
// src/academies/academies.controller.ts
import { Controller, Get, Version } from '@nestjs/common';
import { AcademiesService } from './academies.service';

@Controller('academies')
export class AcademiesController {
  constructor(private readonly academiesService: AcademiesService) {}

  // Keep v1 working (default version uses defaultVersion from main.ts)
  @Get()
  async findAll() {
    // v1 implementation - still works at /v1/academies
    return this.academiesService.findAll();
  }

  // Add v2 endpoint with @Version('2') decorator
  @Version('2')
  @Get()
  async findAllV2() {
    // v2 implementation - accessible at /v2/academies
    return this.academiesService.findAllWithNewStructure();
  }
}
```

**Result:**
- `/v1/academies` → calls `findAll()` (v1 logic)
- `/v2/academies` → calls `findAllV2()` (v2 logic)

### Alternative: Separate Controllers for Major Versions

For significant breaking changes across all endpoints, create separate controllers:

```typescript
// src/academies/academies-v2.controller.ts
import { Controller, Get, Version } from '@nestjs/common';
import { AcademiesServiceV2 } from './academies-v2.service';

@Controller('academies')
@Version('2')  // All routes in this controller will be /v2/academies/*
export class AcademiesV2Controller {
  constructor(private readonly academiesService: AcademiesServiceV2) {}

  @Get()
  async findAll() {
    // v2 implementation
    return this.academiesService.findAllWithNewStructure();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    // v2 implementation
    return this.academiesService.findOneWithNewStructure(id);
  }
}

// src/academies/academies.module.ts
@Module({
  controllers: [
    AcademiesController,      // v1 controller (uses defaultVersion)
    AcademiesV2Controller,    // v2 controller (explicit @Version('2'))
  ],
  providers: [AcademiesService, AcademiesServiceV2],
})
export class AcademiesModule {}
```

**Result:**
- Original `AcademiesController` serves all `/v1/academies/*` routes
- New `AcademiesV2Controller` serves all `/v2/academies/*` routes

### Supporting Multiple Versions on Same Endpoint

You can make a single endpoint support multiple versions:

```typescript
@Version(['1', '2'])
@Get()
async findAll() {
  // Works for both /v1/academies and /v2/academies
  return this.academiesService.findAll();
}
```

### Neutral Versioning

To exclude specific endpoints from versioning (e.g., health check):

```typescript
@Controller('health')
export class HealthController {
  @Version(VERSION_NEUTRAL)  // Accessible at /health (no version prefix)
  @Get()
  check() {
    return { status: 'ok' };
  }
}
```

## Migration Strategy

When introducing v2:

1. **Announce Deprecation**: Give users notice about v1 deprecation
   ```typescript
   @Get()
   @Header('X-API-Deprecated', 'true')
   @Header('X-API-Sunset', '2027-12-31')
   findAll() { /* ... */ }
   ```

2. **Run Both Versions**: Keep v1 and v2 running simultaneously using `@Version()` decorators
3. **Monitor Usage**: Track which clients use which version
4. **Gradual Migration**: Help clients migrate to v2
5. **Sunset v1**: Eventually remove v1 methods

## Best Practices

1. **Keep v1 Stable**: Don't make breaking changes to v1
2. **Document Changes**: Maintain a changelog for each version
3. **Version Breaking Changes Only**: For non-breaking changes, update existing version
4. **Share Common Code**: Use shared services/utilities across versions when possible
5. **Test All Versions**: Ensure both v1 and v2 work correctly

## Current Versioning Types

NestJS supports multiple versioning types (configured in `main.ts`):

### 1. URI Versioning (Current)
```typescript
app.enableVersioning({
  type: VersioningType.URI,
  defaultVersion: '1',
});
```
Routes: `/v1/academies`, `/v2/academies`

### 2. Header Versioning
```typescript
app.enableVersioning({
  type: VersioningType.HEADER,
  header: 'X-API-Version',
});
```
Request Header: `X-API-Version: 1`

### 3. Media Type Versioning
```typescript
app.enableVersioning({
  type: VersioningType.MEDIA_TYPE,
  key: 'v=',
});
```
Accept Header: `application/json;v=1`

### 4. Custom Versioning
```typescript
app.enableVersioning({
  type: VersioningType.CUSTOM,
  extractor: (request) => {
    // Custom logic to extract version
    return request.headers['custom-version'] || '1';
  },
});
```

## Current Version Support

- **v1**: Current stable version (defaultVersion)
- **v2**: Not yet implemented

When v2 is needed, follow the migration strategy above using `@Version()` decorators.

---

For more information on NestJS versioning:
- [NestJS Versioning Documentation](https://docs.nestjs.com/techniques/versioning)
