require('dotenv').config();

module.exports = {
  'Square-Version': process.env.SQUARE_API_VERSION,
  'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};
