import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Email recipients - UPDATE THESE WITH FINAL EMAIL ADDRESSES
const RECIPIENTS = [
  'saibalajieye@gmail.com', // Sai Balaji Clinic email
  // 'second-email@gmail.com', // Uncomment and add second email when ready
];

// Resend API Key (set in Vercel environment variables)
const RESEND_API_KEY = process.env.RESEND_API_KEY;

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get today's stats in IST
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    const startOfIstToday = new Date(istNow);
    startOfIstToday.setUTCHours(0, 0, 0, 0);
    const startOfDayUTC = new Date(startOfIstToday.getTime() - istOffset);

    const sales = await (prisma as any).invoice.aggregate({
      _sum: { total_amount: true },
      where: { createdAt: { gte: startOfDayUTC } }
    });

    const patientCount = await (prisma as any).invoice.count({
      where: { createdAt: { gte: startOfDayUTC } }
    });

    const dailyAmount = sales._sum.total_amount || 0;
    const date = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Kolkata'
    });

    // HTML Email Template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
            .container { background-color: white; border-radius: 10px; padding: 30px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
            .stat { background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #667eea; }
            .stat-label { color: #6c757d; font-size: 14px; margin-bottom: 5px; }
            .stat-value { color: #212529; font-size: 24px; font-weight: bold; }
            .footer { text-align: center; color: #6c757d; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🏥 Sai Balaji Clinic</h1>
              <p style="margin: 5px 0 0 0;">Daily Report</p>
            </div>
            
            <div class="stat">
              <div class="stat-label">📅 Date</div>
              <div class="stat-value">${date}</div>
            </div>
            
            <div class="stat">
              <div class="stat-label">👥 Patients Served</div>
              <div class="stat-value">${patientCount}</div>
            </div>
            
            <div class="stat">
              <div class="stat-label">💰 Daily Revenue</div>
              <div class="stat-value">₹${dailyAmount.toLocaleString('en-IN')}</div>
            </div>
            
            <div class="footer">
              <p>This is an automated daily report from your clinic management system.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email to each recipient using Resend
    const results = [];
    for (const recipient of RECIPIENTS) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'onboarding@resend.dev',
            to: [recipient],
            subject: `Daily Report - ${date} | Patients: ${patientCount} | Revenue: ₹${dailyAmount.toLocaleString('en-IN')}`,
            html: htmlContent,
          }),
        });

        const data = await response.json();
        results.push({
          email: recipient,
          success: response.ok,
          data
        });
      } catch (error) {
        results.push({
          email: recipient,
          success: false,
          error: String(error)
        });
      }
    }

    return NextResponse.json({
      success: true,
      date,
      dailyAmount,
      patientCount,
      results,
    });
  } catch (error) {
    console.error('Error sending daily email:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: String(error) },
      { status: 500 }
    );
  }
}
