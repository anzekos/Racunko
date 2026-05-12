// scripts/generate-hash.js
const bcrypt = require('bcryptjs')

const password = process.argv[2]
if (!password) {
  console.error('Uporaba: node scripts/generate-hash.js "tvoje-geslo"')
  process.exit(1)
}

const hash = bcrypt.hashSync(password, 10)
console.log('Hash:')
console.log(hash)
