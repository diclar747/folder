export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Dynamically import the database connection for each request
    const dbModule = await import('../server/config/database.js');
    const sequelize = dbModule.default || dbModule;

    // Test the database connection
    await sequelize.authenticate();

    res.status(200).json({
      status: 'online',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}