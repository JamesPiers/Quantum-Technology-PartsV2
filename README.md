# Quantum Technology V2 - Supplier Quote Management System

A production-ready Next.js 14 application for managing supplier quotes, parts catalog, and customer orders with AI-powered document extraction.

## Features

- 📄 **PDF Upload & Extraction**: Upload supplier quote PDFs and automatically extract structured data using AI
- 🤖 **Multi-Provider AI**: Support for OpenAI GPT-4 and Google Document AI, with easy-to-add custom providers
- ✅ **Review Workflow**: Manual review and approval of extracted data before importing
- 📦 **Parts Catalog**: Comprehensive parts management with pricing history and quantity breaks
- 💰 **Order Management**: Create customer quotes and purchase orders with automatic price selection
- 🔒 **Secure Storage**: File storage and database backed by Supabase with Row Level Security
- 📊 **Accuracy Metrics**: Track extraction quality with completeness scores and response times

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL with RLS)
- **Storage**: Supabase Storage
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **State Management**: TanStack Query
- **Validation**: Zod
- **AI Providers**: OpenAI GPT-4, Google Document AI
- **Testing**: Jest

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key (optional) or Google Cloud account (optional)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd "Quantum-Technology V2"
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Choose provider: docai | openai | mock
USE_PROVIDER=mock

# OpenAI (if using OpenAI provider)
OPENAI_API_KEY=sk-...

# Google Document AI (if using docai provider)
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_LOCATION=us
GOOGLE_PROCESSOR_ID=your-processor-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

4. Run database migrations:
```bash
# In your Supabase SQL Editor, run:
# 1. supabase/migrations/20240101000000_initial_schema.sql
# 2. supabase/storage-setup.sql
```

5. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
├── app/                          # Next.js App Router pages
│   ├── api/                      # API routes
│   │   ├── upload/              # File upload endpoint
│   │   ├── extract/             # Extraction trigger
│   │   ├── extractions/[id]/    # Extraction approval
│   │   ├── parts/               # Parts CRUD
│   │   ├── orders/              # Orders CRUD
│   │   └── order-items/         # Order items CRUD
│   ├── upload/                  # Upload page
│   ├── review/[extractionId]/   # Review page
│   ├── parts/                   # Parts catalog page
│   └── orders/                  # Orders management
├── components/                   # React components
│   ├── ui/                      # shadcn/ui components
│   └── providers/               # Context providers
├── lib/                         # Shared libraries
│   ├── services/                # Business logic
│   │   └── extraction/          # Extraction service
│   │       ├── providers/       # AI provider implementations
│   │       └── extraction.service.ts
│   ├── schemas/                 # Zod validation schemas
│   ├── types/                   # TypeScript types
│   ├── utils/                   # Utility functions
│   └── supabase/                # Supabase client
├── supabase/                    # Database migrations
└── __tests__/                   # Test files
```

## Database Schema

### Tables

- **suppliers**: Supplier information
- **parts**: Parts catalog with SKU and metadata
- **part_prices**: Price history with quantity breaks and validity periods
- **documents**: Uploaded PDF documents
- **extractions**: AI extraction results with normalized data
- **orders**: Customer quotes and purchase orders
- **order_items**: Line items for orders

### Storage Buckets

- **supplier-docs**: PDF uploads from suppliers
- **exports**: Generated quote PDFs and CSV exports

## API Routes

### Upload
- `POST /api/upload`: Get signed URL and create document record

### Extract
- `POST /api/extract`: Trigger AI extraction on uploaded document
  ```json
  {
    "documentId": "uuid",
    "provider": "openai" | "docai" | "mock"
  }
  ```

### Approve
- `POST /api/extractions/:id/approve`: Approve extraction and create parts/prices

### Parts
- `GET /api/parts?search=...&limit=50&offset=0`: List parts
- `POST /api/parts`: Create part
- `GET /api/parts/:id`: Get part
- `PATCH /api/parts/:id`: Update part
- `DELETE /api/parts/:id`: Delete part

### Orders
- `GET /api/orders?status=...&limit=50&offset=0`: List orders
- `POST /api/orders`: Create order
- `GET /api/orders/:id`: Get order with items
- `PATCH /api/orders/:id`: Update order
- `DELETE /api/orders/:id`: Delete order

### Order Items
- `POST /api/order-items`: Add item to order
- `PATCH /api/order-items/:id`: Update order item
- `DELETE /api/order-items/:id`: Delete order item

## Extraction Providers

### Mock Provider
The mock provider returns sample data for testing without requiring external API keys.

### OpenAI Provider
Uses GPT-4 with structured outputs to extract data from PDF text.

### Document AI Provider
Uses Google Cloud Document AI Form Parser to extract structured data.

### Adding Custom Providers

1. Create a new provider class implementing `IExtractionProvider`:
```typescript
export class MyProvider implements IExtractionProvider {
  getName(): string {
    return 'my-provider';
  }

  async extract(options: ExtractionOptions): Promise<ExtractionResult> {
    // Your implementation
  }
}
```

2. Register in `extraction.service.ts`:
```typescript
this.providers.set('my-provider', new MyProvider());
```

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Deployment

### Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables in Production

Ensure all required environment variables are set in your Vercel project settings.

## Normalized JSON Schema

Extracted data follows this schema:

```typescript
{
  supplier_name: string;
  quote_number?: string;
  quote_date?: string;
  currency?: string;
  valid_until?: string;
  notes?: string;
  line_items: Array<{
    supplier_part_number: string;
    description: string;
    uom?: string;
    qty_breaks: Array<{
      min_qty: number;
      unit_price: number;
    }>;
    lead_time_days?: number;
    moq?: number;
  }>;
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT

## Support

For issues and questions, please open a GitHub issue.

