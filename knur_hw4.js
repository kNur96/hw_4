//Khadija Nur
const express = require('express');
const app = express();
const fetch = require('node-fetch');
const nock = require('nock');
const firebase = require("firebase");

const config = {
    apiKey: "AIzaSyALfF7D6TK-WiZlCCaQRs_X6VxrcH8WcGI",
    authDomain: "in-class-exercise-f17.firebaseapp.com",
    databaseURL: "https://in-class-exercise-f17.firebaseio.com",
    projectId: "in-class-exercise-f17",
    storageBucket: "in-class-exercise-f17.appspot.com",
    messagingSenderId: "828427878619"
};
firebase.initializeApp(config);

let database = firebase.database();


var laureate_array = new Array();
var gender_array = new Array();

//class for data processing
//will later include more fields
class basic_laureate{
    constructor(name, id, birth, death)
    {
        this.name = name;
        this.id = id;
        this.birth = birth;
        this.death = death;
    }
}

//class for data processing
class laureate_gender{
    constructor(person, gender)
    {
        this.person = person;
        this.gender = gender;
    }
}

app.set('port', (process.env.PORT || 5000));


//for testing
nock('http://this_is_funny.com')
.get('/fun')
.reply(200, {
  _name: 'Khadija Nur',
  _id: '010678356',
  _username: 'knur',
  _email: 'knur@gmu.edu'
});

//for testing
nock('http://this_is_funny.com')
    .get('/hilarious')
    .reply(200, {
        _name: 'Person2 Nur',
        _id: '04565543',
        _username: 'knur',
        _email: 'knur@email.edu'
    });

//will eventually store the entire json Data from the API in the local variable
fetch('http://api.nobelprize.org/v1/laureate.json')
    .then((res) => {
        return res.json();
    })
    .then((data) => {
        for(let i = 0; i < 150; i++)
        {
            var a_laureate = new basic_laureate(data.laureates[i].firstname,
                data.laureates[i].id, data.laureates[i].born, data.laureates[i].died);
            laureate_array.push(a_laureate);
            var one_laureate_gender = new laureate_gender(data.laureates[i].firstname,
                data.laureates[i].gender);
            gender_array.push(one_laureate_gender);
        }
    })
    .catch((error) => {
        res.send(error);
    })

//Get /laureates
//retrieves the first names of the laureates
app.get('/laureates', (req, res) => {
    let laureate_name = new Array();
    laureate_array.forEach((user) => {
        laureate_name.push(user.name);
    })
    res.send(laureate_name);
})


//get laureate based on id
//doesn't do calculations
app.get('/laureate/:id', (req, res) => {
    var the_id = req.params.id;
    laureate_array.forEach((p) => {
        if(the_id == p.id)
        {
            res.send(`ID: ${p.id} <br>
        Name: ${p.name} <br>
        Born: ${p.birth} <br>
        Death: ${p.death} <br>`);
        }
    })
    res.status(400);
    res.send(`Person not Found`);
})

app.get('/laureates/statistics', (req, res) => {
    let male = 0;
    let female = 0;

    gender_array.forEach((human) => {
        if(human.gender == 'female')
        {
            female++;
        }
        else{
            male++
        }
    })

    var age_array = new Array();

    for(let person of laureate_array)
    {
        var a_person_b = person.birth.substring(0,4);
        var a_person_d = person.death.substring(0,4);
        var a_person_age = () => {
            if(a_person_d != "0000")
            {
                return a_person_d - a_person_b;
            }
            else
                return 2017 - a_person_b;
        }
        age_array.push(a_person_age());

    }

    var av_age = 0;
    for(let an_age of age_array)
    {
        av_age += an_age;
    }

    res.send(`<h1>Nobel Laureate Statistics</h1><br>The average life-span
    of a Nobel Prize Laureate is ${Math.round(av_age/age_array.length)} years !! <br>
    Did you know the female to male ratio among laureates is: ${female}:${male}!\n`);

})

var age_found = false;
//gets age of person; does calculations
app.get('/laureate/find_age/:name', (req, res) =>{
    var name_of_laureate = req.params.name;
    laureate_array.forEach((persons) => {
        if(persons.name == name_of_laureate)
        {
            var an_person_b = persons.birth.substring(0,4);
            var an_person_d = persons.death.substring(0,4);
            if(an_person_d != "0000")
            {
                var result = an_person_d - an_person_b;
            }
            else
            {
                var result =  2017 - an_person_b;
            }
            res.send(`${name_of_laureate} is ${result} years old!`)
        }
    })
    if(!age_found)
    {
        res.send(`${name_of_laureate} was not found!`)
    }
})

//post request adds information to a laureate's page and persists the data on Firebase
//POST /laureates/adds?id=45&comment=he was funny guy&history=He was born sometime in the past
app.post('/laureates/adds', function(req, res){
    database.ref('laureate_id/' + req.query.id).set({
        comment: req.query.comment, history: req.query.history
    });
    res.send("Post request accepted")
})


//Delete request removes a laureate.
//I used a Query String for this request as well.
//To delete some one: DELETE /laureate?delete=<person's name>
//If person's not found status 400 and error message.
var found = false;
var new_array = new Array();
app.delete('/laureates', function(req, res) {
    laureate_array.forEach((user1) => {
        if(user1.name == req.query.delete)
        {
            found = true;
        }
        else{
            new_array.push(user1);
        }
    })
    if(!found)
    {
        res.status(400);
        res.send('No Such Person Found');
    }
    else{
        laureate_array = new_array;
        res.send("Found and Removed")
    }
})


app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});

