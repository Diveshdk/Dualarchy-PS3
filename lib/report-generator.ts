'use server'

import html2pdf from 'html2pdf.js'

export interface ReportData {
  title: string
  eventName: string
  branchName: string
  generatedDate: string
  summary: {
    totalRevenue: number
    guestCount: number
    perHeadCost: number
    profitMargin: number
  }
  metrics: {
    name: string
    value: string | number
    trend?: 'up' | 'down' | 'stable'
  }[]
  analysis: {
    strengths: string[]
    weaknesses: string[]
    opportunities: string[]
  }
  recommendations: string[]
}

export async function generatePDFReport(reportData: ReportData): Promise<string> {
  const html = generateHTMLReport(reportData)

  // Convert to PDF (in real implementation, use a library like puppeteer or html2pdf)
  return html // For now, return HTML
}

export function generateHTMLReport(reportData: ReportData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${reportData.title}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: #f5f5f5;
          color: #333;
          line-height: 1.6;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          padding: 40px;
        }
        .header {
          border-bottom: 3px solid #0066cc;
          margin-bottom: 30px;
          padding-bottom: 20px;
        }
        .header h1 {
          font-size: 32px;
          color: #0066cc;
          margin-bottom: 10px;
        }
        .header p {
          color: #666;
          font-size: 14px;
        }
        .meta {
          display: flex;
          justify-content: space-between;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #eee;
          font-size: 13px;
        }
        .summary-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin: 30px 0;
        }
        .card {
          background: #f9f9f9;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }
        .card-value {
          font-size: 28px;
          font-weight: bold;
          color: #0066cc;
          margin: 10px 0;
        }
        .card-label {
          font-size: 13px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .section {
          margin: 40px 0;
          page-break-inside: avoid;
        }
        .section h2 {
          font-size: 20px;
          color: #0066cc;
          border-bottom: 2px solid #e8e8e8;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        .metric-item {
          background: #f9f9f9;
          padding: 15px;
          border-left: 4px solid #0066cc;
          border-radius: 4px;
        }
        .metric-label {
          font-size: 13px;
          color: #666;
          text-transform: uppercase;
        }
        .metric-value {
          font-size: 24px;
          font-weight: bold;
          color: #333;
          margin-top: 5px;
        }
        .metric-trend {
          font-size: 12px;
          color: #666;
          margin-top: 5px;
        }
        .trend-up { color: #22c55e; }
        .trend-down { color: #ef4444; }
        .trend-stable { color: #f59e0b; }
        .list {
          list-style: none;
          margin: 15px 0;
        }
        .list li {
          padding: 8px 0;
          padding-left: 25px;
          position: relative;
          color: #555;
        }
        .list li:before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #0066cc;
          font-weight: bold;
        }
        .analysis-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin: 20px 0;
        }
        .analysis-box {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #0066cc;
        }
        .analysis-box h4 {
          font-size: 14px;
          color: #0066cc;
          margin-bottom: 10px;
          font-weight: 600;
        }
        .analysis-box ul {
          font-size: 13px;
          color: #666;
        }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          text-align: center;
          font-size: 12px;
          color: #999;
        }
        @media print {
          body { background: white; }
          .container { max-width: 100%; margin: 0; padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${reportData.title}</h1>
          <p>Event: ${reportData.eventName}</p>
          <p>Branch: ${reportData.branchName}</p>
          <div class="meta">
            <span>Generated: ${reportData.generatedDate}</span>
            <span>Report ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
          </div>
        </div>

        <div class="summary-cards">
          <div class="card">
            <div class="card-label">Total Revenue</div>
            <div class="card-value">₹${reportData.summary.totalRevenue.toLocaleString('en-IN')}</div>
          </div>
          <div class="card">
            <div class="card-label">Guest Count</div>
            <div class="card-value">${reportData.summary.guestCount}</div>
          </div>
          <div class="card">
            <div class="card-label">Per Head Cost</div>
            <div class="card-value">₹${Math.round(reportData.summary.perHeadCost).toLocaleString('en-IN')}</div>
          </div>
          <div class="card">
            <div class="card-label">Profit Margin</div>
            <div class="card-value">${reportData.summary.profitMargin}%</div>
          </div>
        </div>

        <div class="section">
          <h2>Performance Metrics</h2>
          <div class="metrics-grid">
            ${reportData.metrics
              .map(
                (metric) => `
              <div class="metric-item">
                <div class="metric-label">${metric.name}</div>
                <div class="metric-value">${metric.value}</div>
                ${
                  metric.trend
                    ? `<div class="metric-trend"><span class="trend-${metric.trend}">● ${metric.trend.toUpperCase()}</span></div>`
                    : ''
                }
              </div>
            `
              )
              .join('')}
          </div>
        </div>

        <div class="section">
          <h2>Analysis</h2>
          <div class="analysis-grid">
            <div class="analysis-box">
              <h4>Strengths</h4>
              <ul class="list">
                ${reportData.analysis.strengths.map((s) => `<li>${s}</li>`).join('')}
              </ul>
            </div>
            <div class="analysis-box">
              <h4>Weaknesses</h4>
              <ul class="list">
                ${reportData.analysis.weaknesses.map((w) => `<li>${w}</li>`).join('')}
              </ul>
            </div>
            <div class="analysis-box">
              <h4>Opportunities</h4>
              <ul class="list">
                ${reportData.analysis.opportunities.map((o) => `<li>${o}</li>`).join('')}
              </ul>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Recommendations</h2>
          <ul class="list">
            ${reportData.recommendations.map((r) => `<li>${r}</li>`).join('')}
          </ul>
        </div>

        <div class="footer">
          <p>This is an automatically generated report. For questions, please contact management.</p>
          <p>© ${new Date().getFullYear()} Banquet Management System - All rights reserved</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function downloadReport(html: string, filename: string = 'banquet-report.html') {
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
