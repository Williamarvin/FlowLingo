// Database helper that automatically selects the right driver
// Use standard PostgreSQL for Railway, Neon for Replit

let dbModule: any = null;

export async function getDB() {
  if (dbModule) return dbModule;
  
  // Check if we're on Railway (production without REPL_ID)
  const isRailway = process.env.NODE_ENV === 'production' && !process.env.REPL_ID;
  
  if (isRailway) {
    console.log('Using Railway PostgreSQL driver');
    dbModule = await import('./db.railway');
  } else {
    console.log('Using Neon serverless driver');
    dbModule = await import('./db');
  }
  
  return dbModule;
}