import { NextResponse } from 'next/server';
import { extendForecastWindow } from '@/lib/jobs/forecast-jobs';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<NextResponse> {
  try {
    // Optional: Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const expectedAuth = process.env.CRON_SECRET
      ? `Bearer ${process.env.CRON_SECRET}`
      : null;

    if (expectedAuth && authHeader !== expectedAuth) {
      console.error('❌ Unauthorized cron request to extend-forecasts');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting forecast extension job...');
    await extendForecastWindow();

    return NextResponse.json({
      success: true,
      message: 'Forecast window extended successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Forecast extension job failed:', error);
    return NextResponse.json(
      {
        error: 'Job failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
