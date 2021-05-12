const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports.genereazaToken = async (data)=>{
    const token = await jwt.sign(data, process.env.SECRET);
    return token;
};

module.exports.verificaToken = async token => {
    
    let result = await jwt.verify(token, process.env.SECRET);
    return result;
    
};