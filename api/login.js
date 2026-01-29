import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password } = req.body;

  try {
    // Dynamically import the database and models for each request
    const dbModule = await import('../server/config/database.js');
    const sequelize = dbModule.default || dbModule;

    const modelsModule = await import('../server/models/index.js');
    const models = modelsModule.default || modelsModule;
    const User = models.User;

    // Authenticate with database
    await sequelize.authenticate();

    // Find user by email
    const user = await User.findOne({ where: { email } });

    if (user && user.password === password) {
      if (!user.isActive) {
        return res.status(403).json({ message: 'Cuenta desactivada' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'super-secret-key-change-in-prod',
        { expiresIn: '24h' }
      );

      return res.status(200).json({ token, role: user.role });
    } else {
      console.log(`Login failed for ${email}`);
      return res.status(401).json({
        message: `Credenciales inválidas (Debug: User=${!!user})`
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Error interno: ' + error.message });
  }
}