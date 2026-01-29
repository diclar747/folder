export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  res.json({ 
    message: 'pong', 
    timestamp: new Date().toISOString(), 
    env: process.env.NODE_ENV 
  });
}