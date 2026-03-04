# OnlySurf API Endpoints (v1)

All endpoints are automatically prefixed with `/v1` using NestJS URI Versioning.

## Health

```
GET /v1/health                                # Health check (public)
```

## Authentication

```
POST /v1/auth/session                         # Create user session (public)
GET  /v1/me                                   # Get current user profile
PATCH /v1/me/profile                          # Update user profile
```

## Academies

```
POST /v1/academies                            # Create academy (coach/admin)
GET  /v1/academies/:id                        # Get academy details
PATCH /v1/academies/:id                       # Update academy (owner/admin)
GET  /v1/academies/:id/members                # List academy members
POST /v1/academies/:id/invites                # Invite member to academy
```

## Athletes

```
GET /v1/athletes                              # List athletes (optionally by academy)
GET /v1/athletes/:id                          # Get athlete details
GET /v1/athletes/:id/stats                    # Get athlete statistics
```

## Sessions

```
GET  /v1/sessions                             # List sessions (filtered by academy/athlete)
POST /v1/sessions                             # Create session
GET  /v1/sessions/:id                         # Get session details
PATCH /v1/sessions/:id                        # Update session
DELETE /v1/sessions/:id                       # Delete session
POST /v1/sessions/:id/roster                  # Add athlete to session roster
GET  /v1/sessions/:id/summary                 # Get session summary with stats
```

## Waves

```
GET    /v1/waves                              # List waves (filtered by session/athlete)
POST   /v1/waves                              # Create wave
GET    /v1/waves/:id                          # Get wave details
PATCH  /v1/waves/:id                          # Update wave
DELETE /v1/waves/:id                          # Delete wave
GET    /v1/waves/:id/download                 # Get wave download URL
POST   /v1/waves/:id/scores                   # Add score to wave
POST   /v1/waves/:id/notes                    # Add note to wave
```

## Saved Waves (Athlete Archive)

```
GET    /v1/saved-waves                        # List user's saved waves
POST   /v1/saved-waves                        # Save a wave to archive
DELETE /v1/saved-waves/:id                    # Remove wave from archive
```

## Media (Mux Integration)

```
POST /v1/media/mux/uploads                    # Create Mux direct upload URL
POST /v1/media/mux/webhook                    # Mux webhook handler (public)
```

## Billing (Stripe Integration)

```
GET  /v1/billing/plans                        # List available subscription plans
POST /v1/billing/checkout                     # Create Stripe checkout session
POST /v1/billing/portal                       # Create Stripe customer portal session
POST /v1/billing/webhook                      # Stripe webhook handler (public)
```

## Versioning

The API uses **URI Versioning** as implemented in NestJS:

- **Current Version**: v1 (default)
- **Base URL**: `http://localhost:3000/v1`
- **Configuration**: `main.ts` → `enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })`

### Adding Future Versions

To add v2 endpoints, use the `@Version('2')` decorator:

```typescript
// Supports both v1 and v2
@Controller('academies')
export class AcademiesController {
  @Get()
  findAllV1() {
    // Accessible at /v1/academies
  }
  
  @Version('2')
  @Get()
  findAllV2() {
    // Accessible at /v2/academies
  }
}
```

See [VERSIONING.md](./VERSIONING.md) for detailed versioning strategy.

## Authentication

Most endpoints require Firebase Authentication JWT token in the `Authorization` header:

```
Authorization: Bearer <firebase-id-token>
```

Public endpoints (marked above):
- `GET /v1/health`
- `POST /v1/auth/session`
- `POST /v1/media/mux/webhook`
- `POST /v1/billing/webhook`

## Authorization

Role-based access control (RBAC) is implemented for certain endpoints:

- **COACH/ADMIN**: Create academies, sessions, waves
- **ATHLETE**: View assigned content, save waves (with Pro subscription)

Subscription tiers also affect access:
- **Free Athlete**: View tagged waves, download
- **Pro Athlete**: + Create free surf sessions, save waves, statistics
- **Coach Starter**: Basic coaching features
- **Coach Pro**: + Premium profile, leaderboards, payment tracking
- **Academy**: + Multi-coach, advanced dashboard

## Rate Limiting

All endpoints are protected by rate limiting:
- **Default**: 100 requests per 60 seconds per IP
- Configured in `app.module.ts` via `ThrottlerModule`
