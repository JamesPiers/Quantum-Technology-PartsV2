'use client'

import { useMemo } from 'react'
import { PartPriceWithRelations } from '@/lib/types/database.types'

interface PriceHistoryChartProps {
  prices: PartPriceWithRelations[]
  currentPriceId?: string
}

export function PriceHistoryChart({ prices, currentPriceId }: PriceHistoryChartProps) {
  const chartData = useMemo(() => {
    if (prices.length === 0) return null

    // Sort by date ascending for the chart
    const sorted = [...prices]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    const priceValues = sorted.map(p => p.unit_price)
    const minPrice = Math.min(...priceValues)
    const maxPrice = Math.max(...priceValues)
    const priceRange = maxPrice - minPrice || maxPrice * 0.2 || 1
    const paddedMin = minPrice - priceRange * 0.15
    const paddedMax = maxPrice + priceRange * 0.15

    return {
      sorted,
      minPrice,
      maxPrice,
      paddedMin,
      paddedMax,
      priceRange: paddedMax - paddedMin,
    }
  }, [prices])

  if (!chartData || chartData.sorted.length === 0) return null

  const { sorted, paddedMin, paddedMax, priceRange } = chartData

  // Chart dimensions
  const width = 600
  const height = 220
  const padding = { top: 20, right: 20, bottom: 40, left: 70 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Calculate positions
  const points = sorted.map((price, i) => {
    const x = sorted.length === 1
      ? chartWidth / 2
      : (i / (sorted.length - 1)) * chartWidth
    const y = chartHeight - ((price.unit_price - paddedMin) / priceRange) * chartHeight
    return { x: x + padding.left, y: y + padding.top, price }
  })

  // Create smooth line path
  const linePath = points.length === 1
    ? ''
    : points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ')

  // Create gradient area path
  const areaPath = points.length === 1
    ? ''
    : `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`

  // Y-axis ticks (4-5 ticks)
  const yTickCount = 4
  const yTicks = Array.from({ length: yTickCount + 1 }, (_, i) => {
    const value = paddedMin + (priceRange * i) / yTickCount
    const y = padding.top + chartHeight - (chartHeight * i) / yTickCount
    return { value, y }
  })

  // Format currency
  const formatPrice = (value: number) => {
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`
    return `$${value.toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }

  // Colors
  const lineColor = '#10b981'       // emerald-500
  const gradientStart = '#10b981'   // emerald-500
  const gradientEnd = '#10b98100'   // transparent emerald
  const dotColor = '#059669'        // emerald-600
  const currentDotColor = '#16a34a' // green-600
  const gridColor = '#e5e7eb'       // gray-200
  const textColor = '#6b7280'       // gray-500

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        style={{ maxHeight: '240px' }}
      >
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradientStart} stopOpacity="0.3" />
            <stop offset="100%" stopColor={gradientEnd} stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid lines */}
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={tick.y}
              x2={width - padding.right}
              y2={tick.y}
              stroke={gridColor}
              strokeWidth="1"
              strokeDasharray={i === 0 ? 'none' : '4 4'}
              opacity={i === 0 ? 0.8 : 0.5}
            />
            <text
              x={padding.left - 8}
              y={tick.y + 4}
              textAnchor="end"
              fill={textColor}
              fontSize="11"
              fontFamily="system-ui, sans-serif"
            >
              {formatPrice(tick.value)}
            </text>
          </g>
        ))}

        {/* Area fill */}
        {areaPath && (
          <path
            d={areaPath}
            fill="url(#priceGradient)"
          />
        )}

        {/* Line */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={lineColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Data points and labels */}
        {points.map((point, i) => {
          const isCurrent = currentPriceId === point.price.id
          const supplierName = point.price.supplier?.name || 'Unknown'

          return (
            <g key={point.price.id}>
              {/* Vertical guide line */}
              <line
                x1={point.x}
                y1={point.y}
                x2={point.x}
                y2={padding.top + chartHeight}
                stroke={gridColor}
                strokeWidth="1"
                strokeDasharray="2 3"
                opacity="0.4"
              />

              {/* Dot outer glow for current */}
              {isCurrent && (
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="8"
                  fill={currentDotColor}
                  opacity="0.15"
                />
              )}

              {/* Dot */}
              <circle
                cx={point.x}
                cy={point.y}
                r={isCurrent ? 5 : 4}
                fill="white"
                stroke={isCurrent ? currentDotColor : dotColor}
                strokeWidth={isCurrent ? 2.5 : 2}
              />

              {/* X-axis date label */}
              <text
                x={point.x}
                y={padding.top + chartHeight + 16}
                textAnchor="middle"
                fill={textColor}
                fontSize="10"
                fontFamily="system-ui, sans-serif"
              >
                {formatDate(point.price.created_at)}
              </text>

              {/* Price label on point (show for all if ≤6 points, else first/last/current) */}
              {(sorted.length <= 6 || i === 0 || i === sorted.length - 1 || isCurrent) && (
                <g>
                  <rect
                    x={point.x - 28}
                    y={point.y - 22}
                    width="56"
                    height="16"
                    rx="4"
                    fill={isCurrent ? currentDotColor : '#374151'}
                    opacity="0.9"
                  />
                  <text
                    x={point.x}
                    y={point.y - 11}
                    textAnchor="middle"
                    fill="white"
                    fontSize="10"
                    fontWeight="600"
                    fontFamily="system-ui, sans-serif"
                  >
                    {formatPrice(point.price.unit_price)}
                  </text>
                </g>
              )}

              {/* Supplier label below date (only show if ≤4 points) */}
              {sorted.length <= 4 && (
                <text
                  x={point.x}
                  y={padding.top + chartHeight + 30}
                  textAnchor="middle"
                  fill={textColor}
                  fontSize="9"
                  fontFamily="system-ui, sans-serif"
                  opacity="0.7"
                >
                  {supplierName.length > 12 ? supplierName.slice(0, 12) + '…' : supplierName}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
