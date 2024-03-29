const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { ObjectId } = require('mongodb');
const fileUpload = require('express-fileupload');
const http = require('http');
const request = require('request');
const axios = require('axios');
const cheerio = require('cheerio');

var cron = require('node-cron');


require('dotenv').config();

const app = express();
app.use(bodyParser.json())
app.use(cors())
app.use(fileUpload());

const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xsirj.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {

    const adminCollection = client.db("identify").collection("adminPost");
    const studentIdentify = client.db("identify").collection("studentIdentify");
    const student = client.db("identify").collection("student");
    const teachers = client.db("identify").collection("teachers");
    const today = new Date()
    app.post('/user', (req, res) => {
        console.log(req.body)
        const rollNumber = req.body.roll;
        console.log(rollNumber)
        res.send(rollNumber)
        if (rollNumber.length === 6 && today.getHours() <= 23) {
            student.find({ roll: rollNumber })
                .toArray((err, document) => {
                    for (let index = 0; index < document.length; index++) {
                        const element = document[index].data;
                        for (let i = 0; i < element.length; i++) {
                            const elements = element[i].date;
                            if (elements === today.toLocaleDateString()) {
                                console.log(elements)
                                student.updateOne(
                                    { _id: ObjectId(document[index]._id), 'data.date': today.toLocaleDateString() },
                                    {
                                        $set: { 'data.$.present': 'P' }
                                    }
                                )
                            }

                        }
                    }
                })
        }
        else {
            res.send("Sorry! you entered a wrong Roll number. Please try again later...")
        }
    })

    // cron.schedule('* * * * *', () => {
    //     studentIdentify.find({})
    //         .toArray((err, documents) => {
    //             for (let index = 0; index < documents.length; index++) {
    //                 const element = documents[index].attendence;
    //                 const da = documents[index]._id
    //                 // console.log(da)
    //                 for (let i = 0; i < element.length; i++) {
    //                     const el = element[i].date;
    //                     const pr = element[i].present;

    //                     if (el === today.toLocaleDateString()) {
    //                         console.log(true)
    //                         if (el) {
    //                             console.log(el, 'date')
    //                             console.log(da, 'id')
    //                             studentIdentify.updateOne(
    //                                 { _id: ObjectId(da) },
    //                                 {
    //                                     $addToSet: {
    //                                         attendence: { date: today.toLocaleDateString(), present: 'A' }
    //                                     }
    //                                 }
    //                             )
    //                         }

    //                     }
    //                     else {
    //                         // console.log(el)
    //                     }

    //                 }
    //             }
    //         })
    // });
    // const getPostValue = async () => {
    //     try {
    //         const { data } = await axios.get('https://en.wikipedia.org/wiki/List_of_Bengali-language_authors_(chronological)');
    //         const $ = cheerio.load(data);
    //         const postTitles = [];
    //         // $('a > img').each((_idx, el) =>{
    //         //     const postTitle = $(el).attr('src');
    //         //     // const postTitle = $(el).text();
    //         //     postTitles.push(postTitle);
    //         // })

    //         $('ul > li > a').each((_idx, el) => {

    //             if ($(el).text() !== '' && $(el).text().length > 8 && $(el).text().length < 16) {
    //                 const postTitle = $(el).text();
    //                 postTitles.push(postTitle);
    //             }
    //             // const postTitle = $(el).text();
    //             // postTitles.push(postTitle);
    //         })
    //         return postTitles;
    //     }
    //     catch (err) {
    //         throw err
    //     }
    // }
    // getPostValue().then(data => console.log(data))


    
    cron.schedule('10 6 * * *', () => {
        student.find({})
            .toArray((err, documents) => {
                for (let index = 391; index < 400; index++) {
                    console.log(index)
                    student.updateOne(
                        { _id: ObjectId(documents[index]._id) },
                        {
                            $push: {
                                data: {
                                    $each: [{ count: 1, date: today.toLocaleDateString(), present: 'A' }]
                                }
                            }
                            // $set: {'semester' : '8th Semester'}
                        }
                        
                    )
                }
            })
    });

    app.get('/getUser', (req, res) => {
        studentIdentify.find({})
            .toArray((err, document) => {
                res.send(document)
            })

    })

    app.post('/adminPost', (req, res) => {
        const postForm = req.body;
        adminCollection.insertOne(postForm)
            .then(result => res.send(result.insertedCount > 0))
    })

    app.get('/getPost', (req, res) => {
        adminCollection.find({})
            .toArray((err, document) => {
                res.send(document)
            })
    })
    app.get('/singlePost/:id', (req, res) => {
        adminCollection.find({ _id: ObjectId(req.params.id) })
            .toArray((err, document) => {
                res.send(document[0])
            })
    })
    app.delete('/deletePost/:id', (req, res) => {
        adminCollection.deleteOne({ _id: ObjectId(req.params.id) })
            .then((result) => {
                res.send(result.deletedCount > 0)
            })
    })
    app.patch('/editPost', (req, res) => {
        adminCollection.updateOne(
            { _id: ObjectId(req.body.id) },
            {
                $set: { 'description': req.body.description }
            }
        ).then(result => res.send(result.modifiedCount > 0))

    })

    app.post('/studentRegister', (req, res) => {
        const file = req.files.file;
        const first = req.body.first;
        const last = req.body.last;
        const gender = req.body.gender;
        const dob = req.body.dob;
        const fName = req.body.fName;
        const mName = req.body.mName;
        const fOccuption = req.body.fOccuption;
        const religion = req.body.religion;
        const blood = req.body.blood;
        const address = req.body.address;
        const phone = req.body.phone;
        const email = req.body.email;
        const roll = req.body.roll;
        const department = req.body.department;
        const section = req.body.section;
        const admissionId = req.body.admissionId;
        const admissionDate = req.body.admissionDate;
        const description = req.body.description;

        const newImg = file.data;
        const encImg = newImg.toString('base64');

        var image = {
            contentType: req.files.file.mimetype,
            size: req.files.file.size,
            img: Buffer.from(encImg, 'base64')
        };


        student.insertOne({ first, last, gender, dob, fName, mName, fOccuption, address, roll, blood, religion, email, department, section, admissionId, admissionDate, phone, description, image })
            .then(result => {
                res.send(result.insertedCount > 0)
            })

    })

    app.get('/getRegisterStudent', (req, res) => {
        student.find({})
            .toArray((err, document) => {
                res.send(document)
            })
    })

    app.post('/teacherRegister', (req, res) => {
        const file = req.files.file;
        const first = req.body.first;
        const last = req.body.last;
        const gender = req.body.gender;
        const joiningDate = req.body.joiningDate;
        const idNumber = req.body.idnumber;
        const blood = req.body.blood;
        const religion = req.body.religion;
        const email = req.body.email;
        const department = req.body.department;
        const qualification = req.body.qualification;
        const address = req.body.address;
        const phone = req.body.phone;
        const description = req.body.description;

        const newImg = file.data;
        const encImg = newImg.toString('base64');

        var images = {
            contentType: req.files.file.mimetype,
            size: req.files.file.size,
            img: Buffer.from(encImg, 'base64')
        }

        teachers.insertOne({ first, last, gender, joiningDate, idNumber, blood, religion, email, department, qualification, address, phone, description, images })
    })

    app.get('/registerTeacher', (req, res) => {
        teachers.find({})
            .toArray((err, documents) => {
                res.send(documents)
            })
    })

    console.log("Database Connected")

});
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})
const port = 4000;
app.listen(process.env.PORT || port)