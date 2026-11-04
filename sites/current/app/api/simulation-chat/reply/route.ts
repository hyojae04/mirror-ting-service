import { env } from 'cloudflare:workers';
import { DesignError } from '../../../../lib/design';
import { simulationReply } from '../../../../lib/simulation-reply';

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return Response.json({detail:'허용되지 않은 요청이에요.'},{status:403});
  if (Number(request.headers.get('content-length')) > 60000) return Response.json({detail:'입력 내용이 너무 길어요.'},{status:413});
  try {
    const body = await request.text();
    if (body.length > 60000) return Response.json({detail:'입력 내용이 너무 길어요.'},{status:413});
    const result = await simulationReply(JSON.parse(body), (env as {OPENAI_API_KEY?:string}).OPENAI_API_KEY);
    return Response.json(result,{headers:{'Cache-Control':'no-store'}});
  } catch (error) {
    return Response.json({detail:error instanceof DesignError ? error.message : '입력 내용을 확인해주세요.'},{status:error instanceof DesignError ? error.status : 400,headers:{'Cache-Control':'no-store'}});
  }
}
