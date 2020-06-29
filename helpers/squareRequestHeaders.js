require('dotenv').config();

module.exports = {
  'Square-Version': '2020-06-25',
  'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};
