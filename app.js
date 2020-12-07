const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const session = require("express-session");
const flash = require("connect-flash");

const pool = require("./config.js");
const sqlhelper = require("./database.js");



const app = express();

// Tours and packages
var userData;
// var source, destination;
var source, destination, agency;
//message;
var message;


//view engine
app.set("view engine","ejs");

//middleware
app.use(bodyParser.urlencoded({extended : true }));
app.use(express.static("public"));
app.use(session({
    secret: 'This is the biggest secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true }
  }));
app.use(flash());



app.get("/", (req, res) => {
    console.log(req.flash('message'));
    res.render("userLogin",{message: message});
    message ="";
})



// Check for user authentication

app.post("/login", (req, res) => {
    const {email, password} = req.body;

    if(sqlhelper.isAdmin(email,password)) {
        console.log("Welcome admin");
        res.render("adminHomePage");
        return;
    }

    // select * from user where email='athish@gmail.com'
    var sql = sqlhelper.selectCommand("user", null, "email='" + email + "'");
    console.log(sql);

    pool.executeQuery(sql, function(err, result) {
        if(result.length>0) {
            if(password===result[0].password) {
                console.log("Login Successful");
                userData = result[0].user_id;
                var username = result[0].name;

                // select * from tours where start_date>'2020-12-31' order by price desc limit 3;
                var today = new Date();
                today = today.getFullYear() + "-" 
                        + String(today.getMonth()+1).padStart(2,'0') + "-" + String(today.getDate()).padStart(2,'0');
                var sql = sqlhelper.selectCommand("tours", null, 
                                "start_date>'" + today + "' order by price desc limit 3");
                pool.executeQuery(sql, function(err, tours) {
                   console.log(tours);
                    res.render("homePage", {userData, username, tours});
                });

            } else {
                message = "Email and password doesnt match";
                req.flash('message',message);
                res.redirect("/");
                console.log("Email and password doesnt match");
                console.log(req.flash('message'));
            }
        } else {
            message = "Email does not exist";
            req.flash('message',message);
            res.redirect("/");
            console.log("Email doesnt exist does");
            console.log(req.flash('message'));
        }
    });
})


// Insert new user to the user table

app.post("/register",(req, res) => {
    const {firstName,lastName,email,password,phoneNumber} = req.body;

    // select * from user where email='athish@gmail.com'
    var sql = sqlhelper.selectCommand("user", null, "email='" + email + "'");
    console.log(sql);
    pool.executeQuery(sql, function(err, result) {
        if(result.length>0) {
            console.log("Email exists");
            var message = "Email already exists. Try login";
            res.redirect("/");
        } else {
            // insert into user values (null, 'Athish Venkatesh', 'athish@gmail.com', '123', '9999999999')
            var sql = sqlhelper.insertCommand("user", [null, firstName + " " + lastName, email, password, phoneNumber]);
            console.log(sql);
            pool.executeQuery(sql, function(err, result) {});
            res.redirect("/");
        }
    });

})




app.get("/bookTickets", (req, res) => {
    var sql;

    if(agency==="-- None --") agency = null;

    if(!source && !destination) {

        // select b.*,a.agency_name from bus b, travel_agency a where b.agency_id=a.agency_id;
        if(!agency) sql = sqlhelper.selectCommand(
            "bus b, travel_agency a", ["b.*", "a.agency_name"], "b.agency_id=a.agency_id");

        // select b.*,a.agency_name from bus b, travel_agency a where b.agency_id=a.agency_id and a.agency_name='agency';
        else sql = sqlhelper.selectCommand(
            "bus b, travel_agency a", ["b.*", "a.agency_name"], 
                "b.agency_id=a.agency_id and a.agency_name='" + agency + "'");
    }


    else if (!source) {

        // select b.*,a.agency_name from bus b, travel_agency a 
            // where b.agency_id=a.agency_id and destination like %'destination'%;
        if(!agency) sql = sqlhelper.selectCommand(
            "bus b, travel_agency a", ["b.*", "a.agency_name"], 
                "b.agency_id=a.agency_id and destination like '%" + destination + "%'");

        // select b.*,a.agency_name from bus b, travel_agency a 
            // where b.agency_id=a.agency_id and destination like %'destination'% and a.agency_name='agency';
        else sql = sqlhelper.selectCommand(
            "bus b, travel_agency a", ["b.*", "a.agency_name"], 
                "b.agency_id=a.agency_id and destination like '%" + destination + "%' and a.agency_name='" + agency + "'");

    }


    else if (!destination) {

        // select b.*,a.agency_name from bus b, travel_agency a 
            // where b.agency_id=a.agency_id and source like %'source'%;
        if(!agency) sql = sqlhelper.selectCommand(
            "bus b, travel_agency a", ["b.*", "a.agency_name"], 
                "b.agency_id=a.agency_id and source like '%" + source + "%'");

        // select b.*,a.agency_name from bus b, travel_agency a 
            // where b.agency_id=a.agency_id and source like %'source'% and a.agency_name='agency';
        else sql = sqlhelper.selectCommand(
            "bus b, travel_agency a", ["b.*", "a.agency_name"], 
                "b.agency_id=a.agency_id and source like '%" + source + "%' and a.agency_name='" + agency + "'");

    }


    else {

        // select b.*,a.agency_name from bus b, travel_agency a 
            // where b.agency_id=a.agency_id and source like %'source'% and destination like %'destination'%;
        if(!agency) sql = sqlhelper.selectCommand(
            "bus b, travel_agency a", ["b.*", "a.agency_name"], 
                "b.agency_id=a.agency_id and source like '%" + source + "%' and destination like '%" + destination + "%'");

        // select b.*,a.agency_name from bus b, travel_agency a 
            // where b.agency_id=a.agency_id and source like %'source'% 
            // and destination like %'destination'% and a.agency_name='agency';
        else sql = sqlhelper.selectCommand(
            "bus b, travel_agency a", ["b.*", "a.agency_name"], 
                "b.agency_id=a.agency_id and source like '%" + source + "%' and destination like '%" + 
                    destination + "%' and a.agency_name='" + agency + "'");

    }


    console.log(sql);
    pool.executeQuery(sql, function(err, data) {
        source = null;
        destination=null;
        agency = null;
        // select agency_name from travel_agency;
        var sql = sqlhelper.selectCommand("travel_agency", ["agency_name"], null);
        console.log(sql);
        pool.executeQuery(sql, function(e, agencies) {
            res.render("exploreTickets",{agencies,userData,data,source,destination});
        })
    });
})




app.get("/bookTours", (req, res) => {
    //  select * from tours where start_date>'2020-12-31'
    var today = new Date();
    today = today.getFullYear() + "-" 
                + String(today.getMonth()+1).padStart(2,'0') + "-" + String(today.getDate()).padStart(2,'0');
    var sql = sqlhelper.selectCommand("tours", null, "start_date>'" + today + "'");
    console.log(sql);
    pool.executeQuery(sql, function(err, result) {
            tours = result;
            tours = sqlhelper.getDateHelper(tours,["start_date"]);
            res.render("toursPackagePage",{userData,tours});
    });
})



// View all the tickets (bus as well as tour) booked by the user

app.get("/viewTickets/:userData", (req, res) => {
    // select t.*, b.source, b.destination, a.agency_name from tickets t, bus b, travel_agency a 
        // where user_id=id and t.bus_number=b.bus_number and b.agency_id=a.agency_id
    var sql = sqlhelper.selectCommand("tickets t, bus b, travel_agency a", 
                    ["t.*", "b.source", "b.destination", "a.agency_name"], 
                        "user_id=" + userData + " and t.bus_number=b.bus_number and b.agency_id=a.agency_id" +
                        " order by date_of_booking");
    console.log(sql);
    pool.executeQuery(sql, function(err, bus_result) {
        if(bus_result.length<=0) console.log("No bus tickets booked");

        // select b.*, t.source, t.no_of_days, t.no_of_nights from tickets b, tours t 
                // where user_id=id and t.tour_id=b.tour_id
        var sql = sqlhelper.selectCommand("tickets b, tours t", 
                                    ["b.*", "t.source", "t.no_of_days", "t.no_of_nights", "t.start_date"], 
                                    "user_id=" + userData + " and t.tour_id=b.tour_id order by date_of_booking");
        console.log(sql);
        pool.executeQuery(sql, function(err, tour_result) {
            if(tour_result.length<=0) console.log("No tour tickets booked");
            bus_result = sqlhelper.getDateHelper(bus_result, ["date_of_booking"]);
            tour_result = sqlhelper.getDateHelper(tour_result, ["date_of_booking", "start_date"]);
            res.render("viewBookedTicketes", {userData, bus_result, tour_result});
        });
        
    });
    
})



// Opens add bus form

app.get("/addBus", (req, res) => {
    // select b.*,a.agency_name from bus b, travel_agency a where b.agency_id=a.agency_id;
    var sql = sqlhelper.selectCommand("bus b, travel_agency a", ["b.*", "a.agency_name"], "b.agency_id=a.agency_id");
    console.log(sql);
    pool.executeQuery(sql, function(err, data) {
        // select agency_id, agency_name from travel_agency
        var sql = sqlhelper.selectCommand("travel_agency", ["agency_id", "agency_name"]);
        pool.executeQuery(sql, function(err, agency) {
           // console.log(agency);
            res.render("addBusForm", {data, agency});
        });
    });
})




// Opens add tours form

app.get("/addTours", (req, res) => {
    // select t.*, group_concat(l.locations separator ' ') as places 
            // from tours t,tour_locations l where t.tour_id=l.tour_id group by l.tour_id
    var sql = sqlhelper.selectCommand("tours t,tour_locations l", 
                                ["t.*", "t.start_date as extra", "group_concat(l.locations separator '\n') as places"], 
                                "t.tour_id=l.tour_id group by l.tour_id");
    console.log(sql);
    pool.executeQuery(sql, function(err, data) {
       console.log(data);
       data = sqlhelper.getShortenedDate(data, ["extra"]);
       data = sqlhelper.getDateHelper(data, ["start_date"]);
        res.render("addToursForm", {data});
    });
   
})



// Opens add agency form

app.get("/addAgency", (req, res) => {
    // select * from travel_agency
    var sql = sqlhelper.selectCommand("travel_agency", null, null);
    console.log(sql);
    pool.executeQuery(sql, function(err, data) {
        res.render("addTravelAgencyForm", {data});
    });
})




// ADMIN
// Add new bus to the bus table

app.post("/addBus", (req, res) => {
    const  {agencyId, source, destination, departureTime, arraivalTime, price, seats_available} = req.body;
    console.log(agencyId);
    
    var busNo = agencyId.slice(0,3).toUpperCase() + Number(Math.floor(Math.random() * 899) + 101);
    // insert into bus values ('busNo', 'source', 'departureTime', 'destination', 'arraivalTime', 12, 'agencyId', 34)
    var sql = sqlhelper.insertCommand("bus", [busNo, source, departureTime, destination, 
                                arraivalTime, parseInt(price), agencyId.substring(0,5), parseInt(seats_available)]);
    console.log(sql);
    pool.executeQuery(sql, function(err, result) {
        res.redirect("/addBus");
    });

})




// ADMIN
// Add new tour to the tour table

app.post("/addTours", (req, res) => {
    const {from, placeIncluded, description, image, noOfDays, noOfNights, price, seatsAvailable, startsOn} = req.body;

    var tourId = from.slice(0,3).toUpperCase() + noOfDays + Number(Math.floor(Math.random() * 89) + 11);
    if(tourId.length>6) 
        tourId = tourId.slice(0,6);

    // insert into tours values ('tourId', 'from', 'description', 'image', 2, 3, 4, 20)
    var sql = sqlhelper.insertCommand("tours", [tourId, from, description, image,
                    parseInt(noOfDays), parseInt(noOfNights), parseInt(price), parseInt(seatsAvailable), startsOn]);
    console.log(sql);
    pool.executeQuery(sql, function(err, result) {
        var a = [];
        if(String(placeIncluded).includes(","))
            a = String(placeIncluded).split(",");
        else a = [placeIncluded];
        for(let i=0; i<a.length; i++) {
            if(!a[i]) continue;
            // insert into tour_locations values ('tourId', 'a[i]')
            sql = sqlhelper.insertCommand("tour_locations", [tourId, a[i]]);
            console.log(sql);
            pool.executeQuery(sql, function(err, result) {
                if(i==a.length-1) res.redirect("/addTours");
            });
        }
    });
})



// ADMIN
// Add new travel agency to the travel_agency table

app.post("/addAgency", (req, res) => {
    const {agencyName, location, mail, number} = req.body;
    
    var agencyId = location.slice(0,3).toUpperCase() + Number(Math.floor(Math.random() * 89) + 11);
    // insert into travel_agency values ('agencyId', 'agencyName', 'location', 'mail', 'number')
    var sql = sqlhelper.insertCommand("travel_agency", [agencyId, agencyName, location, mail, number]);
    console.log(sql);
    pool.executeQuery(sql, function(err, result) {
        res.redirect("/addAgency");
    });
})



// Search the available buses from the given Source and Destination inputs

app.post("/search", (req, res) => {
    source = req.body.source;
    destination = req.body.destination;
    agency = req.body.agency;

    res.redirect("/bookTickets");
})



// Book bus tickets

app.post("/bus_booking/:busNo", (req, res) => {
    busNo = req.params.busNo;
    people = 1;

    // select * from bus where bus_number='busNo'
    var sql = sqlhelper.selectCommand("bus", null, "bus_number='" + busNo + "'");
    console.log(sql);

    pool.executeQuery(sql, function(err, result) {
        if(result.length>0) {
            total_price = result[0].fare*people;
            var ticketId = result[0].source.slice(0,2).toUpperCase()
                            + result[0].destination.slice(0,2).toUpperCase() 
                            + Number(Math.floor(Math.random() * 8999) + 1001);

            // insert into tickets values ('ticketId', 'userData', NOW(), 'busNo', null, 'people', 'total_price')
            var sql = sqlhelper.insertCommand("tickets", 
                                [ticketId, userData, "NOW()", busNo, null, people, total_price]);
            console.log(sql);
            pool.executeQuery(sql, function(err, result) {
                res.redirect("/viewTickets/userdata="+userData);
            });
        }
    });

})



// Book tours and packages

app.post("/tour_booking/:tourId", (req, res) => {
    tourId = req.params.tourId;
    people = 1;

    // select * from tours where tour_id='tourId'
    var sql = sqlhelper.selectCommand("tours", null, "tour_id='" + tourId + "'");
    console.log(sql);

    pool.executeQuery(sql, function(err, result) {
        if(result.length>0) {
            total_price = result[0].price*people;
            var ticketId = result[0].source.slice(0,4).toUpperCase()
                            + Number(Math.floor(Math.random() * 8999) + 1001);
            // insert into tickets values ('ticketId', 'userData', NOW(), null, 'tourId', 'people', 'total_price')
            var sql = sqlhelper.insertCommand("tickets", 
                                [ticketId, userData, "NOW()", null, tourId, people, total_price]);
            console.log(sql);
            pool.executeQuery(sql, function(err, result) {
                res.redirect("/viewTickets/userdata="+userData);
            });
        }
    });

})




// ADMIN
// Delete bus

app.post("/busdelete/:id", (req, res) => {
    id = req.params.id;
    // delete from bus where bus_number='id'
    var sql = sqlhelper.deleteCommand("bus", "bus_number='" + id + "'");
    console.log(sql);
    pool.executeQuery(sql, function(err, result) {
        res.redirect("/addBus")
    });

})




// ADMIN
// Delete Tours

app.post("/tourdelete/:id", (req, res) => {
    id = req.params.id;
    // delete from tours where tour_id='id'
    var sql = sqlhelper.deleteCommand("tours", "tour_id='" + id + "'");
    console.log(sql);
    pool.executeQuery(sql, function(err, result) {
        res.redirect("/addTours");
    });
})




// ADMIN
// Delete Agency

app.post("/agencydelete/:id", (req, res) => {
    id = req.params.id;
    // delete from travel_agency where agency_id='id'
    var sql = sqlhelper.deleteCommand("travel_agency", "agency_id='" + id + "'");
    console.log(sql);
    pool.executeQuery(sql, function(err, result) {
        res.redirect("/addAgency");
    });
})




// ADMIN
// Update Bus

app.post("/updateBus", (req, res) => {
    const  {busNo, agencyId, source, destination, departureTime, arraivalTime, price, seats_available} = req.body;
    // update bus set source='source', departure_time='departure_time', 
            // destination='destination', arrival_time='arrival_time', fare='fare', 
            // agency_id='agency_id', seats_available='seats_available' 
            // where bus_number='bunNo'
    var sql = sqlhelper.updateCommand("bus", 
        ["source", "departure_time", "destination", "arrival_time", "fare", "agency_id", "seats_available"], 
        [source, departureTime, destination, arraivalTime, parseInt(price), agencyId, parseInt(seats_available)], 
        ["bus_number"], [busNo]);
    console.log(sql);
    pool.executeQuery(sql, function(err, result) {
        res.redirect("/addBus")
    });
})



// ADMIN
// Update Tours

app.post("/updateTours", (req, res) => {
    const {tourId, from, placeIncluded, description, image, noOfDays, noOfNights, 
                    price, seatsAvailable, startsOn} = req.body;
    // update tours set source='source', description='description', images='images', 
            // no_of_days='no_of_days', no_of_nights='no_of_nights', price='price', 
            // seats_available='seats_available' where tour_id='tourId'
    var sql = sqlhelper.updateCommand("tours", 
        ["source", "description", "images", "no_of_days", "no_of_nights", "price", "seats_available", "start_date"], 
        [from, description, image, noOfDays, noOfNights, price, seatsAvailable, startsOn], ["tour_id"], [tourId]);
    console.log(sql);
    pool.executeQuery(sql, function(err, result) {
        // delete from tour_locations where tour_id='tourId'
        var sql = sqlhelper.deleteCommand("tour_locations", "tour_id='"+tourId+"'");
        console.log(sql);
        pool.executeQuery(sql, function(err, resultDelete) {
            var a = [];
            if(String(placeIncluded).includes(","))
                a = String(placeIncluded).split(",");
            else a = [placeIncluded];
            for(let i=0; i<a.length; i++) {
                if(!a[i]) continue;
                // insert into tour_locations values ('tourId', 'a[i]')
                sql = sqlhelper.insertCommand("tour_locations", [tourId, a[i]]);
                console.log(sql);
                pool.executeQuery(sql, function(err, result) {
                    if(i==a.length-1) res.redirect("/addTours");
                });
            }
        })
    });
})




// ADMIN
// Update Agency

app.post("/UpdateAgency", (req, res) => {
    const {agencyId,agencyName, location, mail, number} = req.body;

    // update travel_agency set agency_name='agency_name', location='location', 
            // email='email', contact_number='contact_number' where agency_id='agencyId'
    var sql = sqlhelper.updateCommand("travel_agency", ["agency_name", "location", "email", "contact_number"], 
                                    [agencyName, location, mail, number], ["agency_id"], [agencyId]);
    console.log(sql);
    pool.executeQuery(sql, function(err, result) {
        res.redirect("/addAgency")
    });
})




app.listen(3000,() => {
    console.log("server is running on port 3000");
})