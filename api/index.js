// Vercel API Root - This could handle multiple routes or redirect to health check
export default function handler(req, res) {
  res.status(200).json({ message: "API Root - Use specific endpoints like /api/login" });
}
