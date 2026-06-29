// Backend mínimo de contato: recebe o POST do formulário e dispara o e-mail via Resend.
// Credenciais NUNCA no código — vêm de variáveis de ambiente (.env).
// Rodar (Node 20+):  node --env-file=.env server.js
const http = require('http');

const {
  RESEND_API_KEY, MAIL_TO,
  MAIL_FROM = 'onboarding@resend.dev', // troca pra contato@seudominio.com quando o domínio estiver verificado
  PORT = 3000, ALLOW_ORIGIN = '*',
} = process.env;

function readBody(req){
  return new Promise((resolve, reject)=>{
    let data = '';
    req.on('data', c => { data += c; if (data.length > 1e6) req.destroy(); }); // ponytail: corta payload gigante
    req.on('end', ()=> resolve(data));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res)=>{
  res.setHeader('Access-Control-Allow-Origin', ALLOW_ORIGIN);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS'){ res.writeHead(204).end(); return; }
  if (req.method !== 'POST' || req.url !== '/api/contato'){ res.writeHead(404).end(); return; }

  try{
    const { nome, email, assunto, mensagem } = JSON.parse(await readBody(req) || '{}');
    if (!nome || !email || !mensagem){
      res.writeHead(400, { 'Content-Type':'application/json' }).end(JSON.stringify({ erro:'campos obrigatórios faltando' }));
      return;
    }

    const r = await fetch('https://api.resend.com/emails', {
      method:'POST',
      headers:{ Authorization:`Bearer ${RESEND_API_KEY}`, 'Content-Type':'application/json' },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: MAIL_TO,
        reply_to: email,
        subject: `Novo contato pelo site — ${nome}`,
        text: [
          `Nome: ${nome}`,
          `E-mail: ${email}`,
          assunto ? `Procura: ${assunto}` : '',
          '',
          mensagem,
        ].filter(Boolean).join('\n'),
      }),
    });

    if (!r.ok){ console.error('Resend:', r.status, await r.text()); throw new Error('falha no envio'); }
    res.writeHead(200, { 'Content-Type':'application/json' }).end(JSON.stringify({ ok:true }));
  }catch(err){
    console.error(err);
    res.writeHead(500, { 'Content-Type':'application/json' }).end(JSON.stringify({ erro:'falha ao enviar' }));
  }
});

server.listen(Number(PORT), ()=> console.log(`Contato em http://localhost:${PORT}/api/contato`));
