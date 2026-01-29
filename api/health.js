// Global variable to cache the database connection
let cachedDb = null;

async function getDatabaseConnection() {
  if (cachedDb) {
    return cachedDb;
  }

  try {
    // Dynamically import the database connection
    const dbModule = await import('../server/config/database.js');
    const sequelize = dbModule.default || dbModule;

    // Cache the connection for subsequent requests
    cachedDb = sequelize;

    return sequelize;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get database connection
    const sequelize = await getDatabaseConnection();

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