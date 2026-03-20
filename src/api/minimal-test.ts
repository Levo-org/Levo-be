import express from 'express';

const app = express();

app.get('*', (_req, res) => {
  res.json({ status: 'ok', message: 'Minimal test works' });
});

const handler = async (req: any, res: any) => {
  console.log('Handler called');
  app(req, res);
};

export default handler;
