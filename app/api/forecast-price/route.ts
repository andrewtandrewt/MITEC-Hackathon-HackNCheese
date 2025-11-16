import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      steelRoute,
      futureYear,
      country,
      bfAssumptions,
      eafAssumptions,
      carbonTax,
      mwCapacity, // Optional, defaults to 100 if not provided
    } = body;

    // Validate inputs
    if (!steelRoute || !futureYear || !country) {
      return NextResponse.json(
        { error: 'Missing required fields: steelRoute, futureYear, country' },
        { status: 400 }
      );
    }

    // Check if scrap file exists (try multiple locations)
    const scrapFilePath = path.join(process.cwd(), 'PythonScripts', 'WPU1012.csv');
    const scrapFilePathAlt = path.join(process.cwd(), 'WPU1012.csv');
    const scrapFile = fs.existsSync(scrapFilePath) ? 'WPU1012.csv' : 
                     (fs.existsSync(scrapFilePathAlt) ? path.join(process.cwd(), 'WPU1012.csv') : null);
    
    if (!scrapFile) {
      return NextResponse.json(
        { error: 'Scrap data file (WPU1012.csv) not found. Please ensure WPU1012.csv is in PythonScripts directory or project root.' },
        { status: 404 }
      );
    }

    // Create a modified Python script that accepts JSON input
    const scriptPath = path.join(process.cwd(), 'PythonScripts', 'price-predictor-api.py');
    
    // Prepare input data as JSON string
    const inputData = JSON.stringify({
      mw_capacity: mwCapacity || 100.0, // Default to 100 MW if not provided
      steel_route: steelRoute,
      future_year: futureYear,
      country: country,
      bf_assumptions: bfAssumptions || {
        iron_ore: 130.0,
        coking_coal: 280.0,
        bf_fluxes: 50.0,
        scrap: 375.0,
        other_costs_bf: 50.0,
      },
      eaf_assumptions: eafAssumptions || {
        electricity: 0.08,
        electrode: 2.5,
        eaf_fluxes: 60.0,
        other_costs_eaf: 40.0,
      },
      carbon_tax: carbonTax || 50.0,
    });

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
          // Parse JSON output from Python script
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

