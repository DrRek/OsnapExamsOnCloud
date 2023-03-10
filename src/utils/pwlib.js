const alfaNumChars = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890".split("")
const numChars = "1234567890".split("")

const getSingleRandomChar = (charset) =>
  charset[Math.floor(Math.random()*charset.length)]

const getRandomString = (charset, length) =>
  [...Array(length).keys()].map(_ => getSingleRandomChar(charset)).join("")

const generate_admin_username = () =>
  `admin${getRandomString(alfaNumChars,10)}`

const generate_admin_password = () => //MUST NOT INCLUDE SPECIAL CHAR BECAUSE net user HAS PROBLEMS WITH ESCAPING
  `${getRandomString(alfaNumChars,40)}`

const generate_user_username = (name) =>
  `${name}${getRandomString(numChars,4)}`

const generate_user_password = () => //MUST NOT INCLUDE SPECIAL CHAR BECAUSE net user HAS PROBLEMS WITH ESCAPING
  `${getRandomString(alfaNumChars,40)}`

const to_export = {
  generate_admin_username,
  generate_admin_password,
  generate_user_username,
  generate_user_password
}

export default to_export