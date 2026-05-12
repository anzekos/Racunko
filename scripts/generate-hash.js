// scripts/generate-hash.js
const bcrypt = require('bcryptjs')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

rl.question('Vnesi geslo: ', (password) => {
  if (!password) {
    console.error('Geslo je prazno.')
    process.exit(1)
  }
  const hash = bcrypt.hashSync(password, 10)
  console.log('\nHash:')
  console.log(hash)
  rl.close()
})
