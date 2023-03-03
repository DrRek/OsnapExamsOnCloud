const alfaNumChars = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890".split("")
const allChars = [...alfaNumChars, ...",.;!£$%&/()=?".split("")] //MUST NOT INCLUDE ' TO AVOID ERRORS 
const numChars = "12345678990".split("")

const getSingleRandomChar = (charset) =>
  charset[Math.floor(Math.random()*charset.length)]

const getRandomString = (charset, length) =>
  [...Array(length).keys()].map(_ => getSingleRandomChar(charset)).join("")

const generate_admin_username = () =>
  `admin${getRandomString(alfaNumChars,10)}`

const generate_admin_password = () => //MUST NOT INCLUDE ' TO AVOID ERRORS 
  `${getRandomString(allChars,15)}`

const generate_user_username = (name) =>
`${name}${getRandomString(numChars,4)}`

const generate_user_password = () => //MUST NOT INCLUDE ' TO AVOID ERRORS 
  `${getRandomString(allChars,15)}`

const to_export = {
  generate_admin_username,
  generate_admin_password,
  generate_user_username,
  generate_user_password
}

export default to_export