# Architecture Documentation

This document describes the architecture and design decisions of the Quantum Technology V2 application.

## Overview

Quantum Technology V2 is a full-stack Next.js application for managing supplier quotes with AI-powered extraction. The architecture follows a clean, modular design with clear separation of concerns.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                     (Next.js App Router)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Upload  │  │  Review  │  │  Parts   │  │  Orders  │   │
│  │   Page   │  │   Page   │  │   Page   │  │   Page   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                         │                                    │
│                    TanStack Query                           │
└─────────────────────────┼───────────────────────────────────┘
                          │
                    ┌─────▼──────┐
                    │ API Routes  │
                    │  (Next.js)  │
                    └─────┬──────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
    ┌────▼────┐    ┌─────▼──────┐   ┌────▼────┐
    │ Upload  │    │ Extraction │   │  CRUD   │
    │ Service │    │  Service   │   │ Handlers│
    └────┬────┘    └─────┬──────┘   └────┬────┘
         │               │               │
         │          ┌────▼────┐          │
         │          │Provider │          │
         │          │Interface│          │
         │          └────┬────┘          │
         │               │               │
         │      ┌────────┼────────┐      │
         │      │        │        │      │
         │  ┌───▼──┐ ┌──▼───┐ ┌──▼───┐  │
         │  │OpenAI│ │DocAI │ │ Mock │  │
         │  └──────┘ └──────┘ └──────┘  │
         │                               │
         └───────────────┬───────────────┘
                         │
                    ┌────▼────┐
                    │Supabase │
                    │         │
                    │┌───────┐│
                    ││Postgres││
                    │└───────┘│
                    │┌───────┐│
                    ││Storage││
                    │└───────┘│
                    │┌───────┐│
                    ││  Auth ││
                    │└───────┘│
                    └─────────┘
```

## Layers

### 1. Presentation Layer (Frontend)

**Location**: `/app/` (pages), `/components/`

**Responsibilities**:
- User interface rendering
- User input handling
- State management via TanStack Query
- Client-side validation

**Key Components**:
- `app/upload/page.tsx`: File upload interface with drag & drop
- `app/review/[extractionId]/page.tsx`: Extraction review and approval
- `app/parts/page.tsx`: Parts catalog with search
- `app/orders/page.tsx`: Order management
- `components/ui/`: Reusable UI components (shadcn/ui)

**Design Patterns**:
- Server Components for static content
- Client Components for interactive features
- React Query for data fetching and caching
- Composition pattern for UI components

### 2. API Layer

**Location**: `/app/api/`

**Responsibilities**:
- Request validation using Zod
- Business logic coordination
- Authentication/authorization
- Error handling and logging
- Response formatting

**Endpoints**:
```
/api/upload          POST   - Generate signed URL for file upload
/api/extract         POST   - Trigger extraction process
/api/extractions/:id
  /approve          POST   - Approve and import extraction
/api/parts           GET    - List parts (with search/pagination)
                     POST   - Create part
/api/parts/:id       GET    - Get single part
                     PATCH  - Update part
                     DELETE - Delete part
/api/orders          GET    - List orders
                     POST   - Create order
/api/orders/:id      GET    - Get order with items
                     PATCH  - Update order
                     DELETE - Delete order
/api/order-items     POST   - Add item to order
/api/order-items/:id PATCH  - Update order item
                     DELETE - Remove order item
```

### 3. Service Layer

**Location**: `/lib/services/`

**Responsibilities**:
- Core business logic
- Provider orchestration
- Data transformation
- External API communication

**Key Services**:

#### ExtractionService
```typescript
class ExtractionService {
  - extract(options, provider?): Promise<ExtractionResult>
  - getDefaultProvider(): ProviderType
  - setDefaultProvider(provider): void
  - getAvailableProviders(): ProviderType[]
}
```

**Provider Interface**:
```typescript
interface IExtractionProvider {
  getName(): string
  extract(options): Promise<ExtractionResult>
}
```

**Implementations**:
- `OpenAIProvider`: Uses GPT-4 with structured outputs
- `DocumentAIProvider`: Uses Google Document AI
- `MockProvider`: Returns sample data for testing

### 4. Data Access Layer

**Location**: `/lib/supabase/`

**Responsibilities**:
- Database connection management
- Query execution
- File storage operations
- Row Level Security enforcement

**Clients**:
- `supabase`: Client-side client (anon key)
- `supabaseAdmin`: Server-side client (service role key)

### 5. Data Layer

**Technology**: Supabase (PostgreSQL)

**Schema**:
```
suppliers
├── id (uuid, PK)
├── name (text)
├── email (text)
├── currency (text)
└── created_at (timestamptz)

parts
├── id (uuid, PK)
├── sku (text, unique)
├── supplier_part_number (text)
├── name (text)
├── description (text)
├── attributes (jsonb)
├── drawing_url (text)
└── created_at (timestamptz)

part_prices
├── id (uuid, PK)
├── part_id (uuid, FK → parts)
├── supplier_id (uuid, FK → suppliers)
├── currency (text)
├── unit_price (numeric(12,4))
├── moq (int)
├── lead_time_days (int)
├── valid_from (date)
├── valid_through (date)
└── created_at (timestamptz)

documents
├── id (uuid, PK)
├── supplier_id (uuid, FK → suppliers)
├── doc_type (text)
├── file_path (text)
├── status (text)
└── created_at (timestamptz)

extractions
├── id (uuid, PK)
├── document_id (uuid, FK → documents)
├── provider (text)
├── raw_json (jsonb)
├── normalized_json (jsonb)
├── accuracy (jsonb)
├── status (text)
└── created_at (timestamptz)

orders
├── id (uuid, PK)
├── type (text)
├── customer_name (text)
├── status (text)
├── currency (text)
└── created_at (timestamptz)

order_items
├── id (uuid, PK)
├── order_id (uuid, FK → orders)
├── part_id (uuid, FK → parts)
├── supplier_id (uuid, FK → suppliers)
├── quantity (numeric(12,3))
├── unit_price (numeric(12,4))
├── currency (text)
└── created_at (timestamptz)
```

## Key Design Decisions

### 1. Provider Pattern for Extraction

**Why**: Different customers may prefer different AI providers based on cost, accuracy, or compliance requirements.

**Implementation**: 
- Abstract `IExtractionProvider` interface
- Strategy pattern for provider selection
- Easy to add new providers

**Benefits**:
- Vendor flexibility
- Easy testing with mock provider
- Can A/B test different providers

### 2. Normalized JSON Schema

**Why**: Different providers return different formats. We need a consistent structure for the application.

**Implementation**:
- Strict JSON Schema definition
- Provider-specific normalization logic
- Zod validation at runtime

**Benefits**:
- Type safety
- Consistent data structure
- Easy to extend

### 3. Review Workflow

**Why**: AI extraction isn't 100% accurate. Human review ensures data quality.

**Implementation**:
- Extractions saved with `pending_review` status
- Review page for manual verification
- Approve action creates parts/prices

**Benefits**:
- Data quality assurance
- User trust
- Audit trail

### 4. Price History with Validity Dates

**Why**: Prices change over time. We need to track historical prices and know which are current.

**Implementation**:
- `valid_from` and `valid_through` dates
- Query latest valid price when creating orders
- Allow manual price override

**Benefits**:
- Price history tracking
- Automatic price selection
- Flexibility for negotiations

### 5. Quantity Breaks

**Why**: Suppliers often offer volume discounts.

**Implementation**:
- Array of `qty_breaks` in line items
- Each break has `min_qty` and `unit_price`
- Multiple price points per part

**Benefits**:
- Accurate quoting
- Volume discount support
- Flexible pricing

### 6. Supabase Storage for Files

**Why**: Need secure, scalable file storage integrated with database.

**Implementation**:
- Signed URLs for upload/download
- Bucket-level access control
- Integration with RLS

**Benefits**:
- Secure file access
- No server storage needed
- Built-in CDN

## Data Flow

### Upload & Extract Flow

```
1. User uploads PDF
   ↓
2. API generates signed URL
   ↓
3. Client uploads to Supabase Storage
   ↓
4. API creates document record
   ↓
5. API triggers extraction service
   ↓
6. Provider processes PDF
   ↓
7. Service normalizes response
   ↓
8. API saves extraction record
   ↓
9. Client redirects to review page
```

### Review & Approve Flow

```
1. User views extraction
   ↓
2. User clicks Approve
   ↓
3. API iterates line items
   ↓
4. For each line item:
   a. Upsert part (by SKU)
   b. Create part_prices for qty breaks
   ↓
5. Update extraction status
   ↓
6. Return counts to client
   ↓
7. Client redirects to parts page
```

### Order Creation Flow

```
1. User creates order
   ↓
2. User adds parts
   ↓
3. For each part:
   a. Query latest valid price
   b. Allow manual override
   c. Create order_item
   ↓
4. Calculate totals
   ↓
5. User submits order
   ↓
6. Update order status
```

## Performance Considerations

### Caching Strategy

- **TanStack Query**: Client-side cache with 1-minute stale time
- **Next.js**: Static generation for marketing pages
- **Supabase**: Database indexes on frequently queried columns

### Pagination

- All list endpoints support `limit` and `offset`
- Default limit: 50 items
- Count included in response for pagination UI

### Lazy Loading

- Parts list: Load on scroll
- Order items: Load with order details
- File previews: Load on demand

## Security

### Authentication

Current implementation allows all authenticated users. For production:

1. Implement user roles (admin, user, read-only)
2. Add role claims to JWT
3. Enforce role-based access in RLS policies

### Authorization

- **RLS Policies**: Enforce data access at database level
- **API Validation**: Zod schemas validate all inputs
- **File Access**: Signed URLs with expiration

### Input Validation

1. Client-side: Form validation with Zod
2. API-side: Request schema validation with Zod
3. Database: Constraints and triggers

## Extensibility

### Adding New Providers

1. Create provider class implementing `IExtractionProvider`
2. Add normalization logic for provider's response format
3. Register provider in `ExtractionService`
4. Add environment variables for credentials
5. Update documentation

### Adding New Features

1. Define database schema changes
2. Create migration file
3. Update TypeScript types
4. Add API routes
5. Implement service logic
6. Create UI components
7. Add tests

## Testing Strategy

### Unit Tests

- Utility functions (metrics, validation)
- Service layer (extraction logic)
- Normalization mapping

### Integration Tests

- API routes with mocked Supabase
- Provider implementations with mocked external APIs

### E2E Tests

- Full user flows (upload → extract → review → approve)
- Order creation and management

## Monitoring

### Logs

- Structured JSON logs with context
- Log levels: debug, info, warn, error
- Include request IDs for tracing

### Metrics

- Extraction response times
- Token usage (for cost tracking)
- Accuracy scores
- API response times

### Alerts

- Extraction failures
- High error rates
- Slow API responses

## Future Enhancements

1. **Email Notifications**: Notify users when extraction completes
2. **Bulk Upload**: Upload multiple PDFs at once
3. **Export**: Generate quote PDFs and CSV reports
4. **Analytics**: Dashboard with extraction metrics
5. **Version Control**: Track part/price changes over time
6. **Approval Workflows**: Multi-step approval process
7. **Integration**: Connect to ERP systems
8. **ML Improvements**: Train custom models on historical data

