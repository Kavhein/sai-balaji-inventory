import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Test email recipient (must match your Resend signup email exactly)
const TEST_EMAIL = 'saibalajieye@gmail.com';

// Resend API Key
const RESEND_API_KEY = process.env.RESEND_API_KEY;

export async function GET() {
  try {
    // Get today's stats
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const sales = await (prisma as any).invoice.aggregate({
      _sum: { total_amount: true },
      where: { createdAt: { gte: startOfDay } }
    });

    const patientCount = await (prisma as any).invoice.count({
      where: { createdAt: { gte: startOfDay } }
    });

    const dailyAmount = sales._sum.total_amount || 0;
    const date = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
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
            .test-badge { background-color: #ffc107; color: #000; padding: 5px 10px; border-radius: 5px; font-size: 12px; font-weight: bold; display: inline-block; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div style="text-align: center;">
              <span class="test-badge">🧪 TEST EMAIL</span>
            </div>
            
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
              <p><strong>This is a test email.</strong></p>
              <p>If you received this, your automated daily reports are working correctly!</p>
              <p>You will receive the actual report daily at 10:45 PM IST.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send test email using Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: [TEST_EMAIL],
        subject: `🧪 TEST - Daily Report - ${date}`,
        html: htmlContent,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${TEST_EMAIL}`,
        date,
        dailyAmount,
        patientCount,
        emailData: data,
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to send email', details: data },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { error: 'Failed to send test email', details: String(error) },
      { status: 500 }
    );
  }
}
