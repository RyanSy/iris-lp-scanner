require('dotenv').config();

module.exports = {
  'Square-Version': '2020-08-12',
  'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};
