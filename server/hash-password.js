const bcrypt = require("bcryptjs");

const plainPassword = "Nani@289";

bcrypt.hash(plainPassword, 10).then((hash) => {
  console.log("Hashed password:");
  console.log(hash);
});