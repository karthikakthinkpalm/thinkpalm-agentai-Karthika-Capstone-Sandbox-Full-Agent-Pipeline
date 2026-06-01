import { NextRequest, NextResponse } from 'next/server';
import { runAgent1 } from '@/lib/agents/agent1-parser';
import { runAgent2 } from '@/lib/agents/agent2-builder';
import { clearRegistry } from '@/lib/tools/registry';

export async function POST(req: NextRequest) {
  try {
    const { prd } = await req.json();

    if (!prd || prd.trim() === '') {
      return NextResponse.json(
        { error: 'PRD text is required' },
        { status: 400 }
      );
    }

    // Clear registry for fresh run
    clearRegistry();

    // Agent 1 — parse PRD into schema
    console.log('Agent 1 starting...');
    const schema = await runAgent1(prd);
    console.log('Agent 1 done:', schema);

    // Agent 2 — generate components from schema
    console.log('Agent 2 starting...');
    const components = await runAgent2(schema);
    console.log('Agent 2 done. Components:', Object.keys(components));

    return NextResponse.json({
      schema,
      components,
      tree: Object.keys(components),
    });

  } catch (err) {
    console.error('Pipeline error:', err);
    return NextResponse.json(
      { error: 'Pipeline failed', detail: String(err) },
      { status: 500 }
    );
  }
}