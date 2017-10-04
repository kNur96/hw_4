//Khadija Nur
//G01039306
const express = require('express');
const app = express();
const fetch = require('node-fetch');
const nock = require('nock');


var laureate_array = new Array();
var global_country = new Array();
var gender_array = new Array();

class basic_laureate{
    constructor(name, id, birth, death)
    {
        this.name = name;
        this.id = id;
        this.birth = birth;
        this.death = death;
    }
}

class Country{
  constructor(country_name, code)
  {
    this.country_name = country_name;
    this.code = code;
  }
}

class laureate_gender{
    constructor(person, gender)
    {
        this.person = person;
        this.gender = gender;
    }
}

app.set('port', (process.env.PORT || 5000));


//Uses Promise.all() Promise.then() and Promise.catch().
//Displays all of the laureates we will be dealing with.
//Changes to the local cache will not be displayed here.
//This just loads the laureate data from the external api.
app.get('/', (req, res) => {
    var local_laureate = new Array();
    var local_country = new Array();
    Promise.all([fetch('http://api.nobelprize.org/v1/laureate.json'),
        fetch('http://api.nobelprize.org/v1/country.json')])
        .then((res) => {
            return Promise.all([res[0].json(), res[1].json()]);
        })
        .then((json) => {
            //res.send(json[0].laureates[0]);
            for(let i = 0; i < 150; i++)
            {
                var one_laureate = new basic_laureate(json[0].laureates[i].firstname,
                    json[0].laureates[i].id, json[0].laureates[i].born, json[0].laureates[i].died);
                local_laureate.push(one_laureate);
            }

            for(let j = 0; j < 150; j++)
            {
                var a_country = new Country(json[1].countries[j].name, json[1].countries[j].code);
                local_country.push(a_country);
            }
            res.send(local_laureate);
        })
        .catch((err) => {
            res.send(err);
        });
});

//for testing
nock('http://this_is_funny.com')
.get('/fun')
.reply(200, {
  _name: 'Khadija Nur',
  _id: '01039306',
  _username: 'knur',
  _email: 'knur@gmu.edu'
});

//for testing
nock('http://this_is_funny.com')
    .get('/hilarious')
    .reply(200, {
        _name: 'Nafisa Nur',
        _id: '01039306',
        _username: 'knur',
        _email: 'knur@gmu.edu'
    });

//fetch multiple requests with timer.
//Also the fetch requests are sequenced properly (I hope).
//Also handles errors by displaying it to the client.
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
    .then(() => {
        setTimeout(function () {
            fetch('http://api.nobelprize.org/v1/country.json')
                .then((response) => {
                    return response.json();
                })
                .then((json) => {
                    for(let j = 0; j < json.countries.length; j++) {
                        var info = new Country(json.countries[j].name, json.countries[j].code);
                        global_country.push(info);
                    }
                })
                .catch((err) => {
                    res.send("error")
                })
        }, 500)
    })
    .catch((error) => {
        res.send(error);
    })

//helper function
function retry(res) {
    fetch('http://api.nobelprize.org/v1/country.json')
        .then((res) => {
            if(res.status != 200)
            {
                throw new Error("error");
            }
            return res.json();
        })
        .then((json) => {
            res.send(json);
        })
        .catch((err) => {
        res.status(500);
        res.send('Cannot resolve issue.')
        })
}

//fetch the countries data.
//check the status and retry once if it fails;
app.get('/countries', (req, res) => {
    fetch('http://api.nobelprize.org/v1/country.json')
        .then((res) => {
        if(res.status != 200)
        {
            throw new Error("error");
        }
        return res.json();
        })
        .then((json) => {
        res.send(json);
        })
        .catch((err) => {
        console.log("retry......");
        retry(res);
        })
})

//decomposition used here. I Processed the fist half of the json data.
//then proceeded to process the second half of the retrieved json data.
//Also handles potential errors by letting the user know that an error was found
//Gets the countries associated with each of the the codes entered into the url using
//the local cache of the retrieved and processed data.
app.get('/countries/:id', (req, res) => {
    var countries_p1 = new Array();
    var countries_p2 = new Array();
    var associate = new Array();
    var _i = 0;

    fetch('http://api.nobelprize.org/v1/country.json')
        .then((res) => {
            if(res.status != 200){
                throw new Error('error');
            }
            return res.json();
        })
        .then((first_half) => {
            for(_i = 0; _i < first_half.countries.length/2; _i++){
                countries_p1.push(first_half.countries[_i]);
            }
            //console.log(first_half.countries.length/2);
            //res.send(countries_p1)
            return first_half;
        })
        .then((second_half) => {
            for(let j = _i; j < 156; j++) {
               countries_p2.push(second_half.countries[j]);
            }
            return second_half;
        })
        .then((json) => {
        countries_p1.forEach((one) => {
            if(one.code == req.params.id)
            {
                associate.push(" "+one.name);
            }
        })
            countries_p2.forEach((another) => {
                if(another.code == req.params.id){
                    associate.push(" "+ another.name);
                }
            })
            res.send(`<h3>The country code: "${req.params.id}" is associated with these
            countries</h3><br><br>${associate}`)
        })
        .catch((err) => {
        res.send('error found')
    })
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

//Get /laureate/genderData
//retrieves the female to male ratio; does calculations
app.get('/laureate/genderData', (req, res) =>{
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
    res.send(`<h1> Nobel Laureate Statistic!</h1> <br>
  Did you know the female to male ratio among laureates is: ${female}:${male}!`)
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

//get request for average age
//does calculations
app.get('/laureate/Age-info/av_age', (req, res) => {
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

    res.send(`<h1>Fun Fact !</h1><br>The average life-span
    of a Nobel Prize Laureate is ${Math.round(av_age/age_array.length)} years !!\n`);

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

//post request adds user to the api
//I used Query string so the following would add a new User; Khadija.
//POST /laureates/adds?name=Khadija&dob=1996-15-03&dod=0000-00-00
app.post('/laureates/adds', function(req, res){
    var newLaureate  = new basic_laureate(req.query.name, (laureate_array.length + 3),
        req.query.dob, req.query.dod);
    laureate_array.push(newLaureate);
    res.send("Post request accepted")
})


//The Put request below changes (updates) the name of a laureate.
//I also used Query Strings for this. The following would change a laureates' name to Khadija.
//PUT /laureates?name=Wilhelm Conrad&another_name=Khadija
var change = false;
var copy_array = new Array();

app.put('/laureates/', (req, res) => {
    laureate_array.forEach((a_name) => {
        if(a_name.name == req.query.name)
        {
            var updateperson = new basic_laureate(req.query.another_name,
                a_name.id, a_name.birth, a_name.death);
            copy_array.push(updateperson);
            change = true;
        }
        else {
            copy_array.push(a_name);
        }
    })

    if(!change)
    {
        res.send(`${req.query.name} Was Not found`);
    }
    else {
        laureate_array = copy_array;
        res.send(`Succesfull PUT! <br>`)
    }
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




//app.set('port', (process.env.PORT || 5000));

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});








