// ==========================================
// Entry point for Passenger/Phusion on cPanel
// This file tells Passenger how to start the app
// ==========================================

const path = require('path');

// Set the application root
process.chdir(__dirname);

// Import and start the server
require('./index.js');
