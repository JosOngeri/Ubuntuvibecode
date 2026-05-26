const bcrypt = require('bcryptjs');
const passwords = [
  'admin123',
  'owner123',
  'manager123',
  'supervisor123',
  'employee123',
  'contractor123',
  'daily_labourer123'
];
passwords.forEach(p => console.log(p + '|' + bcrypt.hashSync(p, 10)));
