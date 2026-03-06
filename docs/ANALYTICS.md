# Warmchain — Analytics Plan

## North Star Metric
**Median time from intro_request.created_at → intro_request.accepted_at < 24 hours**

## Key Metrics

### Acquisition
| Metric | Source | Frequency |
|--------|--------|-----------|
| New signups (founder/connector) | auth.users + profiles | Daily |
| Signup source (if tracked via UTM) | page_analytics | Per visit |
| Landing page conversion rate | page_analytics | Weekly |

### Activation
| Metric | Source | Frequency |
|--------|--------|-----------|
| % founders who complete profile (all required fields) | profiles | Daily |
| % connectors who complete profile | connector_profiles | Daily |
| Time to first intro request sent | intro_requests.created_at - auth.users.created_at | Weekly |

### Engagement
| Metric | Source | Frequency |
|--------|--------|-----------|
| Requests sent per founder per month | intro_requests | Monthly |
| Connector inbox response rate (accepted+declined / total) | intro_requests | Weekly |
| Connector median response time (responded_at - created_at) | intro_requests | Weekly |
| Connector accept rate (accepted / responded) | intro_requests | Weekly |
| Profile views per founder | profile_views | Weekly |

### North Star
| Metric | Calculation |
|--------|-------------|
| Median accept time | PERCENTILE_CONT(0.5) of (accepted_at - created_at) |
| Funnel: request → accepted | accepted / total * 100 |
| Funnel: view → request | requests / views * 100 |

### Retention
| Metric | Source |
|--------|--------|
| D7/D30 retention (any dashboard visit) | page_analytics |
| Monthly active founders (request sent) | intro_requests |
| Monthly active connectors (request triaged) | intro_requests |

## Database Tables for Analytics

### `page_analytics` (existing)
- user_id, page, event, metadata, created_at
- Events: page_view, profile_view, request_sent, request_accepted, request_declined

### `profile_views` (existing)
- profile_user_id, viewer_user_id, created_at

### `intro_requests` lifecycle columns (to add/added)
- created_at       ← request created
- viewed_at        ← connector first opened/viewed the request
- responded_at     ← connector took action (accept or decline)
- accepted_at      ← request accepted
- declined_at      ← request declined

## Funnel Definitions

```
1. Landing page view
2. Signup started
3. Signup completed
4. Profile completed (>80% fields)
5. First request sent (founder) / First request received (connector)
6. Request accepted
7. Intro completed (future: confirmed by founder)
```

## Admin Dashboard (`/admin/analytics`)
Existing chart widgets:
- Daily signups (AreaChart)
- Page views by path (BarChart)
- Profile completeness distribution

To add:
- Request funnel (pending → accepted → completed)
- Median accept time trend
- Connector response rate leaderboard

## Events to Track (client-side)

```typescript
// Profile view
POST /api/analytics { event: 'profile_view', page: '/f/username', metadata: { username } }

// Request sent
POST /api/analytics { event: 'request_sent', metadata: { connector_username, ask_type } }

// Request accepted/declined (server-side via dashboard action)
POST /api/analytics { event: 'request_accepted', metadata: { request_id } }
```

## Privacy
- No PII in analytics events (use user_id not email)
- Page analytics anonymous for logged-out visitors (user_id = null)
- GDPR: analytics data deleted with account deletion request
