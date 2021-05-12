//Dependencies
const bodyParser = require("body-parser");
const jwtDecode = require("jwt-decode");
const express = require("express");
const helmet = require("helmet");
const bcrypt = require("bcrypt");
const cors = require("cors");

//const pool = require("./baze_de_date/baza_de_date_locala");
const pool = require("./baze_de_date/elephantsql");
const jwt = require("./securitate/jsonwebtoken");
require("dotenv").config();
const nivelCriptare = 12;
const app = express();


//Middlewares
app.use(bodyParser.json());
app.use(helmet());
app.use(cors());

//Routes
app.post("/inregistrare" , async (req,res)=>{
    try{
        const verifica = await pool.query(`SELECT COUNT(id_utilizator) FROM utilizatori WHERE nume_utilizator='${req.body.nume}'`);

        if(verifica.rows[0].count != 0) res.json({
            eroare: "Acest nume de utilizator este deja folosit!"
        })
            else{
                bcrypt.hash(req.body.parola, nivelCriptare, async function(eroare, parola_criptata){
                    await pool.query(`INSERT INTO utilizatori (nume_utilizator, email_utilizator, parola_criptata) 
                    VALUES ('${req.body.nume}', '${req.body.email}', '${parola_criptata}');`);
                    res.json({eroare:false});
                });
            }
    } catch(err){
        res.json({
            eroare:"Eroare a serverului intern"
        })
    }
})

app.post("/autentificare" , async (req,res)=>{
    try {
        const date = await pool.query(`SELECT * FROM utilizatori WHERE nume_utilizator='${req.body.nume}'`);
        if(!date.rows[0]) res.json({eroare:"Nume de utilizator sau parola incorecta!"});
        else{
            const parola_criptata = date.rows[0].parola_criptata;
            const verificaParola = await bcrypt.compare(req.body.parola, parola_criptata);
            if(verificaParola){
                const token = await jwt.genereazaToken({
                    id:date.rows[0].id_utilizator,
                    nume:req.body.nume
                })
                res.json({
                    token:token,
                    eroare:false
                })
            }
            else res.json({eroare:"Nume de utilizator sau parola incorecta!"}); 
        }
    } catch (error) {
        res.json({
            eroare:"Eroare a serverului intern"
        })
    }
})

app.post("/adauga" , async (req,res)=>{
    try {
        if(req.body.text === "") res.json({eroare:"Acest camp este obligatoriu"});
            else {
                const decodare = jwtDecode(req.body.token);
                await pool.query(`INSERT INTO activitati (utilizator, text, tip, data, rezolvat)
                VALUES ('${decodare.nume}','${req.body.text}','${req.body.tip}','${req.body.data}',0)`);
                res.json({
                    eroare:false
                })
            }
        
    } catch (error) {
        res.json({
            eroare:"Eroare a serverului intern"
        })
    }
   
    
})




app.post("/sterge" , async (req,res)=>{
    try {
        const decodare = jwtDecode(req.body.token);
        const dataCurenta = (new Date()).getTime();

        //sterge toate activitatile de tip <zilnic> care au depasit 1 zi de la creare
        const actZilnice = await pool.query(`SELECT id_activitate, data FROM activitati WHERE 
        utilizator ='${decodare.nume}' AND tip = 'zilnic'`);
        for(let i=0; i<actZilnice.rows.length; i++)
            if(parseInt(actZilnice.rows[i].data) + 24*60*60*1000 < dataCurenta)
                await pool.query(`DELETE FROM activitati 
                WHERE id_activitate = ${actZilnice.rows[i].id_activitate}`);

        //sterge o activitate de tip <simplu>
        if(req.body.tip === 'simplu')
        await pool.query(`DELETE FROM activitati WHERE id_activitate = '${req.body.id}' 
        AND utilizator = '${decodare.nume}' AND tip = 'simplu'`);

        //bifeaza ca rezolvata o activitate de tip <important> sau <zilnic>
        if(req.body.tip !== 'simplu')
        await pool.query(`UPDATE activitati SET rezolvat = 1 WHERE id_activitate = '${req.body.id}' 
        AND utilizator = '${decodare.nume}'`);
        res.json({
            eroare:false
        })
    } catch (error) {
        res.json({
            eroare:"Eroare a serverului intern"
        })
    }
    
})





app.post("/afiseaza" , async (req,res)=>{
    try {
        const decodare = jwtDecode(req.body.token);
        const activitati = await pool.query(`SELECT * FROM activitati WHERE utilizator = '${decodare.nume}'
        ORDER BY rezolvat DESC`);
        const numar = await pool.query(`SELECT * FROM activitati WHERE utilizator = '${decodare.nume}'`);
        res.json({
            eroare:false,
            activitati:activitati.rows,
            numarDeRezolvat:activitati.rows.length,
            numarTotal:numar.rows.length,
            nume:decodare.nume
        })
    } catch (error) {
        res.json({
            eroare:"Eroare a serverului intern"
        })
    }
    
})




app.listen(process.env.PORT || 5000 , ()=>{
    console.log(`Aplicatia ruleaza pe portul ${process.env.PORT || 5000}`); 
})