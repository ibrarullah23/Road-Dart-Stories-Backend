import jwt from "jsonwebtoken";

export function cleanFields(fieldsString = '') {
  return fieldsString.replace(/\s+/g, '').replace(/,/g, ' ');
}


export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id, // id is the user id
      username: user.username, // username is the user username
      role: user.role, // role is the user role
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      // ACCESS_TOKEN_SECRET is the secret key
      expiresIn: "1d", // expires in 15 minutes
    }
  );
};

// export const generateRefreshToken = (user) => {
//   return jwt.sign(
//     {
//       id: user.id,
//       username: user.username,
//       role: user.role,
//     },
//     process.env.REFRESH_TOKEN_SECRET,
//     {
//       // REFRESH_TOKEN_SECRET is the secret key
//       expiresIn: "7d", // expires in 12 hours
//     }
//   );
// };
