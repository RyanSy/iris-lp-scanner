require('dotenv').config();

module.exports = {
  'Square-Version': '2020-05-28',
  'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
  'Content-Type': 'application/json'
};
