import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { basePrices, totalTons } = body;

    // Validate inputs
    if (!basePrices || typeof basePrices !== 'object') {
      return NextResponse.json(
        { error: 'Missing or invalid basePrices object' },
        { status: 400 }
      );
    }

    if (!totalTons || totalTons <= 0) {
      return NextResponse.json(
        { error: 'Invalid totalTons (must be > 0)' },
        { status: 400 }
      );
    }

    // Prepare input data
    const inputData = JSON.stringify({
      base_prices: basePrices,
      total_tons: totalTons,
    });

    const scriptPath = path.join(process.cwd(), 'PythonScripts', 'cost-calculator-api.py');

    // Execute Python script
    return new Promise((resolve) => {
      const pythonProcess = spawn('python', [
        scriptPath,
        inputData,
      ]);

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          resolve(
            NextResponse.json(
              { error: `Python script failed: ${stderr}` },
              { status: 500 }
            )
          );
          return;
        }

        try {
          const result = JSON.parse(stdout);
          resolve(NextResponse.json(result));
        } catch (e) {
          resolve(
            NextResponse.json(
              { error: 'Failed to parse Python script output', details: stdout },
              { status: 500 }
            )
          );
        }
      });
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

